import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

async function isAuthenticated(request: NextRequest) {
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  const apiKey =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyDEZvX8PtJkHK5o--xzVc6BOgyzriaXais";
  if (!token) return false;
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
      cache: "no-store",
    },
  );
  return response.ok;
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request)))
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret)
    return NextResponse.json(
      { error: "Cloudinary não configurado." },
      { status: 503 },
    );
  const body = await request.json().catch(() => ({}));
  const testRunId =
    typeof body.testRunId === "string"
      ? body.testRunId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60)
      : "";
  if (!testRunId)
    return NextResponse.json(
      { error: "Identificador de teste inválido." },
      { status: 400 },
    );
  const prefix = `al7-imoveis/load-tests/${testRunId}/`;
  const endpoint = new URL(
    `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload`,
  );
  endpoint.searchParams.set("prefix", prefix);
  endpoint.searchParams.set("max_results", "500");
  const response = await fetch(endpoint, {
    method: "DELETE",
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
    },
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok)
    return NextResponse.json(
      { error: result.error?.message || "Falha ao limpar o Cloudinary." },
      { status: response.status },
    );
  return NextResponse.json({ deleted: result.deleted || {} });
}
