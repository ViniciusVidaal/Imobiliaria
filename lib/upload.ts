import imageCompression from "browser-image-compression";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";

type UploadProgress = (message: string) => void;

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
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} não é uma imagem válida.`);
  }

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

export async function uploadPropertyImages(
  files: File[],
  onProgress?: UploadProgress,
) {
  const urls: string[] = [];

  // Processamento sequencial evita travamentos de memória com várias fotos grandes.
  for (const [index, file] of files.entries()) {
    onProgress?.(`Comprimindo foto ${index + 1} de ${files.length}...`);
    const webp = await compressToWebP(file);
    onProgress?.(`Enviando foto ${index + 1} de ${files.length}...`);
    const target = ref(storage, `properties/${Date.now()}-${webp.name}`);
    await withTimeout(
      uploadBytes(target, webp, { contentType: "image/webp" }),
      45_000,
      `O envio de ${file.name} demorou demais. Verifique se o Firebase Storage está ativado.`,
    );
    urls.push(
      await withTimeout(
        getDownloadURL(target),
        15_000,
        "Não foi possível obter o endereço da imagem.",
      ),
    );
  }

  return urls;
}
