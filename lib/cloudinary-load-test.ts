import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { uploadPropertyImages } from "@/lib/upload";
import { LOCATIONS } from "@/lib/constants";

export const CLOUDINARY_TEST_RUN_ID = "cloudinary-300";

function canvasToFile(canvas: HTMLCanvasElement, name: string) {
  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(new File([blob], name, { type: "image/webp" }))
          : reject(new Error("Falha ao gerar imagem de teste.")),
      "image/webp",
      0.82,
    );
  });
}

async function createSyntheticImage(index: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 900;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("O navegador não suporta geração de imagens.");
  const hue = (index * 37) % 360;
  const gradient = context.createLinearGradient(
    0,
    0,
    canvas.width,
    canvas.height,
  );
  gradient.addColorStop(0, `hsl(${hue} 35% 22%)`);
  gradient.addColorStop(1, `hsl(${(hue + 55) % 360} 45% 60%)`);
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  // Textura determinística cria arquivos realistas e diferentes sem depender de fontes externas.
  for (let dot = 0; dot < 900; dot += 1) {
    const x = (dot * 97 + index * 31) % canvas.width;
    const y = (dot * 53 + index * 71) % canvas.height;
    const size = 2 + ((dot + index) % 18);
    context.fillStyle = `hsla(${(hue + dot) % 360} 60% 80% / 0.14)`;
    context.fillRect(x, y, size, size);
  }
  context.fillStyle = "rgba(255,255,255,.92)";
  context.font = "700 70px Arial";
  context.fillText("AL7 · TESTE CLOUDINARY", 90, 690);
  context.font = "400 38px Arial";
  context.fillText(
    `Imagem única ${String(index + 1).padStart(3, "0")} de 300`,
    90,
    755,
  );
  return canvasToFile(
    canvas,
    `al7-teste-${String(index + 1).padStart(3, "0")}.webp`,
  );
}

export async function runCloudinaryLoadTest(
  onProgress: (percent: number, message: string) => void,
) {
  const existing = await getDocs(
    query(
      collection(db, "imoveis"),
      where("testRunId", "==", CLOUDINARY_TEST_RUN_ID),
    ),
  );
  if (!existing.empty)
    throw new Error(
      "O teste de 300 uploads já existe. Limpe-o antes de executar novamente.",
    );
  for (let propertyIndex = 0; propertyIndex < 10; propertyIndex += 1) {
    const files: File[] = [];
    for (let photoIndex = 0; photoIndex < 30; photoIndex += 1) {
      const absoluteIndex = propertyIndex * 30 + photoIndex;
      onProgress(
        Math.floor((absoluteIndex / 300) * 100),
        `Gerando imagem ${absoluteIndex + 1} de 300...`,
      );
      files.push(await createSyntheticImage(absoluteIndex));
    }
    const urls = await uploadPropertyImages(
      files,
      (message) => {
        const match = message.match(/(\d+) de 30/);
        const current = match ? Number(match[1]) : 1;
        const completed = propertyIndex * 30 + current;
        onProgress(
          Math.min(99, Math.floor((completed / 300) * 100)),
          `${message} · lote ${propertyIndex + 1} de 10`,
        );
      },
      CLOUDINARY_TEST_RUN_ID,
    );
    const reference = doc(collection(db, "imoveis"));
    await setDoc(reference, {
      title: `[TESTE CLOUDINARY] Imóvel ${propertyIndex + 1}`,
      slug: `teste-cloudinary-${propertyIndex + 1}-${reference.id.slice(0, 6)}`,
      description:
        "Imóvel criado pelo teste de 300 uploads reais no Cloudinary.",
      transaction: "Compra",
      type: "Casa",
      location: LOCATIONS[propertyIndex % LOCATIONS.length],
      price: 500000 + propertyIndex * 100000,
      bedrooms: 3,
      bathrooms: 2,
      parking: 2,
      area: 150 + propertyIndex * 10,
      images: urls,
      featured: false,
      sold: false,
      testRunId: CLOUDINARY_TEST_RUN_ID,
      createdAt: serverTimestamp(),
      dataCadastro: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  onProgress(100, "300 imagens e 10 imóveis criados com sucesso.");
}

export async function cleanupCloudinaryLoadTest(
  onProgress: (percent: number, message: string) => void,
) {
  const user = auth.currentUser;
  if (!user) throw new Error("Sua sessão expirou. Entre novamente.");
  onProgress(20, "Removendo as 300 imagens do Cloudinary...");
  const token = await user.getIdToken();
  const cloudinaryResponse = await fetch("/api/cloudinary/cleanup", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ testRunId: CLOUDINARY_TEST_RUN_ID }),
  });
  const cloudinaryResult = await cloudinaryResponse.json();
  if (!cloudinaryResponse.ok)
    throw new Error(
      cloudinaryResult.error || "Falha ao limpar imagens de teste.",
    );
  onProgress(70, "Removendo imóveis de teste do Firestore...");
  const snapshot = await getDocs(
    query(
      collection(db, "imoveis"),
      where("testRunId", "==", CLOUDINARY_TEST_RUN_ID),
    ),
  );
  const batch = writeBatch(db);
  snapshot.docs.forEach((document) => batch.delete(document.ref));
  if (!snapshot.empty) await batch.commit();
  onProgress(
    100,
    `${snapshot.size} imóveis e as imagens do teste foram removidos.`,
  );
}
