import imageCompression from "browser-image-compression";
import { auth } from "@/lib/firebase";

type UploadProgress = (message: string) => void;
type CloudinarySignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  transformation: string;
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
  if (file.size > 25 * 1024 * 1024)
    throw new Error(`${file.name} ultrapassa o limite de 25 MB.`);
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
  if (compressed.size > 160 * 1024)
    throw new Error(`${file.name} não atingiu o limite de 160 KB. Tente uma imagem menor.`);
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
  body.append("transformation", credentials.transformation);
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
  try {
    for (const [index, file] of files.entries()) {
      onProgress?.(`Comprimindo foto ${index + 1} de ${files.length}...`);
      const webp = await compressToWebP(file);
      onProgress?.(`Enviando foto ${index + 1} de ${files.length}...`);
      urls.push(await uploadToCloudinary(webp, testRunId));
    }
  } catch (error) {
    if (urls.length && !testRunId) await deleteCloudinaryImages(urls).catch(() => undefined);
    throw error;
  }
  return urls;
}

export async function deleteCloudinaryImages(urls: string[]) {
  if (!urls.length) return;
  const user = auth.currentUser;
  if (!user) throw new Error("Sua sessão expirou. Entre novamente no painel.");
  const idToken = await user.getIdToken();
  let lastError = "Não foi possível apagar as imagens do Cloudinary.";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch("/api/cloudinary/cleanup", {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ urls }),
    });
    const result = await response.json();
    if (response.ok) return;
    lastError = result.error || lastError;
  }
  throw new Error(lastError);
}
