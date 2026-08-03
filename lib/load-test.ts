import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LOCATIONS, PROPERTY_TYPES } from "@/lib/constants";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1400&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1400&q=80",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1400&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&q=80",
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1400&q=80",
];

export const LOAD_TEST_RUN_ID = "al7-catalogo-200";

function createImageSet(sourceImages: string[], offset: number) {
  const pool = sourceImages.length ? sourceImages : FALLBACK_IMAGES;
  return Array.from(
    { length: 30 },
    (_, index) => pool[(index + offset) % pool.length],
  );
}

export async function createLoadTestProperties(
  sourceImages: string[],
  onProgress: (value: number) => void,
) {
  const existing = await getDocs(
    query(
      collection(db, "imoveis"),
      where("testRunId", "==", LOAD_TEST_RUN_ID),
    ),
  );
  if (!existing.empty)
    throw new Error(
      "O catálogo de teste já existe. Apague-o antes de gerar novamente.",
    );

  const batch = writeBatch(db);
  for (let index = 0; index < 200; index += 1) {
    const reference = doc(collection(db, "imoveis"));
    const number = index + 1;
    const type = PROPERTY_TYPES[index % PROPERTY_TYPES.length];
    const location = LOCATIONS[index % LOCATIONS.length];
    batch.set(reference, {
      title: `[TESTE] ${type} ${String(number).padStart(3, "0")}`,
      slug: `teste-carga-${number}-${reference.id.slice(0, 6)}`,
      description:
        "Imóvel gerado automaticamente para validar paginação, filtros, galeria e desempenho do catálogo AL7.",
      transaction: index % 4 === 0 ? "Locação" : "Compra",
      type,
      location,
      address: `Endereço de teste ${number}, ${location.split(",")[0]}`,
      price: index % 4 === 0 ? 2500 + index * 25 : 280000 + index * 17500,
      bedrooms: (index % 5) + 1,
      bathrooms: (index % 4) + 1,
      parking: index % 4,
      area: 45 + index * 3,
      images: createImageSet(sourceImages, index),
      featured: index < 6,
      sold: index % 17 === 0,
      testRunId: LOAD_TEST_RUN_ID,
      createdAt: serverTimestamp(),
      dataCadastro: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    onProgress(Math.round(((index + 1) / 200) * 90));
  }
  await batch.commit();
  onProgress(100);
  return 200;
}

export async function deleteLoadTestProperties(
  onProgress: (value: number) => void,
) {
  const snapshot = await getDocs(
    query(
      collection(db, "imoveis"),
      where("testRunId", "==", LOAD_TEST_RUN_ID),
    ),
  );
  if (snapshot.empty) return 0;
  const batch = writeBatch(db);
  snapshot.docs.forEach((document, index) => {
    batch.delete(document.ref);
    onProgress(Math.round(((index + 1) / snapshot.size) * 90));
  });
  await batch.commit();
  onProgress(100);
  return snapshot.size;
}
