import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await getActiveAdmin(request))) {
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
  const transformation = "c_limit,f_webp,q_auto:good,w_1600";
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}&transformation=${transformation}${apiSecret}`)
    .digest("hex");

  return NextResponse.json({ cloudName, apiKey, timestamp, folder, transformation, signature });
}
