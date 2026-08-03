import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

async function isAuthenticated(request: NextRequest) {
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  const firebaseApiKey =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyDEZvX8PtJkHK5o--xzVc6BOgyzriaXais";
  if (!token || !firebaseApiKey) return false;

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
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
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Cloudinary ainda não foi configurado na Vercel." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const testRunId =
    typeof body.testRunId === "string"
      ? body.testRunId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60)
      : "";
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = testRunId
    ? `al7-imoveis/load-tests/${testRunId}`
    : "al7-imoveis/properties";
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  return NextResponse.json({ cloudName, apiKey, timestamp, folder, signature });
}
