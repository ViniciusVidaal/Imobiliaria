import {
  QueryDocumentSnapshot,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Property } from "@/lib/types";

const propertiesCollection = collection(db, "imoveis");

function parsePrice(value: unknown) {
  if (typeof value === "number") return value;
  const firstPrice = String(value || "").match(/[\d.]+(?:,\d{1,2})?/);
  return firstPrice
    ? Number(firstPrice[0].replace(/\./g, "").replace(",", "."))
    : 0;
}

const mapProperty = (snapshot: QueryDocumentSnapshot) => {
  const data = snapshot.data();
  const transaction = data.transaction || data.tipoTransacao;
  const location =
    data.location ||
    data.localizacao ||
    data.bairro ||
    data.cidade ||
    "Brasília";
  return {
    id: snapshot.id,
    title: data.title || data.titulo || "Imóvel em Brasília",
    slug: data.slug || snapshot.id,
    description:
      data.description ||
      data.descricao ||
      data.bairro ||
      "Entre em contato para conhecer todos os detalhes deste imóvel.",
    transaction:
      transaction === "Locação" ||
      transaction === "Aluguel" ||
      transaction === "Alugar"
        ? "Locação"
        : "Compra",
    type: data.type || data.tipoImovel || "Imóvel",
    location,
    address: data.address || data.endereco || location,
    price: parsePrice(data.price ?? data.preco),
    bedrooms: Number(data.bedrooms ?? data.quartos ?? 0),
    bathrooms: Number(data.bathrooms ?? data.banheiros ?? 0),
    suites: Number(data.suites ?? data.suite ?? 0),
    parking: Number(data.parking ?? data.vagas ?? data.garagens ?? 0),
    area: Number(data.area ?? data.areaUtil ?? data.metragem ?? 0),
    images: data.images || data.fotos || [],
    featured: Boolean(data.featured ?? data.destaque ?? false),
    sold: Boolean(data.sold ?? data.vendido ?? data.ativo === false),
    createdAt: data.createdAt || data.dataCadastro,
    updatedAt: data.updatedAt || data.dataAtualizacao,
  } as Property;
};

// Uso restrito ao painel administrativo, que precisa gerenciar todo o catálogo.
export const subscribeProperties = (callback: (items: Property[]) => void) =>
  onSnapshot(
    query(propertiesCollection, orderBy("dataCadastro", "desc")),
    (snapshot) => callback(snapshot.docs.map(mapProperty)),
  );

// A Home escuta somente o pequeno lote exibido, sem ler o catálogo inteiro.
export const subscribeLatestProperties = (
  pageSize: number,
  callback: (items: Property[]) => void,
) =>
  onSnapshot(
    query(
      propertiesCollection,
      orderBy("dataCadastro", "desc"),
      limit(pageSize),
    ),
    (snapshot) => callback(snapshot.docs.map(mapProperty)),
  );

export interface PropertiesPage {
  items: Property[];
  cursor: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

export async function getPropertiesPage(
  pageSize = 12,
  cursor?: QueryDocumentSnapshot | null,
): Promise<PropertiesPage> {
  const constraints = [orderBy("dataCadastro", "desc"), limit(pageSize + 1)];
  const pageQuery = cursor
    ? query(
        propertiesCollection,
        orderBy("dataCadastro", "desc"),
        startAfter(cursor),
        limit(pageSize + 1),
      )
    : query(propertiesCollection, ...constraints);
  const snapshot = await getDocs(pageQuery);
  const hasMore = snapshot.docs.length > pageSize;
  const visibleDocs = snapshot.docs.slice(0, pageSize);
  return {
    items: visibleDocs.map(mapProperty),
    cursor: visibleDocs.at(-1) ?? null,
    hasMore,
  };
}

export const saveProperty = async (data: Omit<Property, "id">, id?: string) => {
  const reference = id ? doc(db, "imoveis", id) : doc(propertiesCollection);
  await setDoc(
    reference,
    {
      ...data,
      slug: data.slug || reference.id,
      updatedAt: serverTimestamp(),
      dataAtualizacao: serverTimestamp(),
      titulo: data.title,
      tipoTransacao: data.transaction === "Compra" ? "Venda" : "Aluguel",
      tipoImovel: data.type,
      bairro: data.location,
      preco: data.price,
      fotos: data.images,
      ativo: !data.sold,
      ...(id
        ? {}
        : { createdAt: serverTimestamp(), dataCadastro: serverTimestamp() }),
    },
    { merge: true },
  );
  return reference.id;
};

export const removeProperty = (id: string) => deleteDoc(doc(db, "imoveis", id));
export const setSold = (id: string, sold: boolean) =>
  updateDoc(doc(db, "imoveis", id), {
    sold,
    vendido: sold,
    ativo: !sold,
    updatedAt: serverTimestamp(),
  });
