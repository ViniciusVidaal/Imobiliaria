import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/server-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

function publicIdFromUrl(imageUrl: string, cloudName: string) {
  try {
    const url = new URL(imageUrl);
    if (url.hostname !== "res.cloudinary.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] !== cloudName || parts[1] !== "image" || parts[2] !== "upload") return null;
    const uploadParts = parts.slice(3);
    if (/^v\d+$/.test(uploadParts[0] || "")) uploadParts.shift();
    if (!uploadParts.length) return null;
    const path = decodeURIComponent(uploadParts.join("/"));
    const publicId = path.replace(/\.[a-zA-Z0-9]+$/, "");
    return publicId.startsWith("al7-imoveis/properties/") ? publicId : null;
  } catch {
    return null;
  }
}

async function destroyImage(publicId: string, cloudName: string, apiKey: string, apiSecret: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha1").update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  const body = new FormData();
  body.append("public_id", publicId);
  body.append("timestamp", String(timestamp));
  body.append("api_key", apiKey);
  body.append("signature", signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, { method: "POST", body, cache: "no-store" });
  const result = await response.json();
  if (!response.ok || !["ok", "not found"].includes(result.result)) throw new Error(result.error?.message || `Falha ao excluir ${publicId}.`);
  return { publicId, result: result.result };
}

export async function POST(request: NextRequest) {
  if (!(await getActiveAdmin(request))) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return NextResponse.json({ error: "Cloudinary não configurado." }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const testRunId = typeof body.testRunId === "string" ? body.testRunId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60) : "";
  if (testRunId) {
    const endpoint = new URL(`https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload`);
    endpoint.searchParams.set("prefix", `al7-imoveis/load-tests/${testRunId}/`);
    endpoint.searchParams.set("max_results", "500");
    const response = await fetch(endpoint, { method: "DELETE", headers: { Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}` }, cache: "no-store" });
    const result = await response.json();
    if (!response.ok) return NextResponse.json({ error: result.error?.message || "Falha ao limpar o teste do Cloudinary." }, { status: response.status });
    return NextResponse.json({ deleted: result.deleted || {} });
  }
  const urls: string[] = Array.isArray(body.urls) ? body.urls.filter((url: unknown): url is string => typeof url === "string").slice(0, 30) : [];
  if (!urls.length) return NextResponse.json({ deleted: [], skipped: 0 });
  const publicIds = Array.from(new Set(urls.map((url: string) => publicIdFromUrl(url, cloudName)).filter((id: string | null): id is string => Boolean(id))));

  try {
    const deleted = await Promise.all(publicIds.map((publicId) => destroyImage(publicId, cloudName, apiKey, apiSecret)));
    return NextResponse.json({ deleted, skipped: urls.length - publicIds.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao limpar as imagens do Cloudinary." }, { status: 502 });
  }
}
