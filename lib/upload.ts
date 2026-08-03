import imageCompression from "browser-image-compression";
import { auth } from "@/lib/firebase";

type UploadProgress = (message: string) => void;
type CloudinarySignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

function withTimeout<T>(
  promise: Promise<T>,
  milliseconds: number,
  message: string,
) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), milliseconds);
    }),
  ]);
}

export async function compressToWebP(file: File) {
  if (!file.type.startsWith("image/"))
    throw new Error(`${file.name} não é uma imagem válida.`);
  const compressed = await withTimeout(
    imageCompression(file, {
      maxSizeMB: 0.145,
      maxWidthOrHeight: 1600,
      useWebWorker: false,
      fileType: "image/webp",
      initialQuality: 0.8,
      maxIteration: 8,
    }),
    30_000,
    `A compressão de ${file.name} demorou demais. Tente outra imagem.`,
  );
  return new File([compressed], `${crypto.randomUUID()}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

async function getUploadSignature(testRunId?: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Sua sessão expirou. Entre novamente no painel.");
  const idToken = await user.getIdToken();
  const response = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ testRunId }),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data.error || "Não foi possível autorizar o envio das fotos.",
    );
  return data as CloudinarySignature;
}

async function uploadToCloudinary(file: File, testRunId?: string) {
  const credentials = await getUploadSignature(testRunId);
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", credentials.apiKey);
  body.append("timestamp", String(credentials.timestamp));
  body.append("folder", credentials.folder);
  body.append("signature", credentials.signature);

  const response = await withTimeout(
    fetch(
      `https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/upload`,
      { method: "POST", body },
    ),
    45_000,
    `O envio de ${file.name} demorou demais. Verifique sua conexão.`,
  );
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error?.message || "O Cloudinary recusou a imagem.");
  return result.secure_url as string;
}

export async function uploadPropertyImages(
  files: File[],
  onProgress?: UploadProgress,
  testRunId?: string,
) {
  const urls: string[] = [];
  for (const [index, file] of files.entries()) {
    onProgress?.(`Comprimindo foto ${index + 1} de ${files.length}...`);
    const webp = await compressToWebP(file);
    onProgress?.(`Enviando foto ${index + 1} de ${files.length}...`);
    urls.push(await uploadToCloudinary(webp, testRunId));
  }
  return urls;
}
