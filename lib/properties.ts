import {
  QueryDocumentSnapshot,
  DocumentSnapshot,
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
  deleteField,
  where,
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

const mapProperty = (snapshot: QueryDocumentSnapshot | DocumentSnapshot) => {
  const data = snapshot.data() || {};
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
    price: parsePrice(data.price ?? data.preco),
    bedrooms: Number(data.bedrooms ?? data.quartos ?? 0),
    bathrooms: Number(data.bathrooms ?? data.banheiros ?? 0),
    suites: Number(data.suites ?? data.suite ?? 0),
    parking: Number(data.parking ?? data.vagas ?? data.garagens ?? 0),
    area: Number(data.area ?? data.areaUtil ?? data.metragem ?? 0),
    images: data.images || data.fotos || [],
    featured: Boolean(data.featured ?? data.destaque ?? false),
    sold: Boolean(data.sold ?? data.vendido ?? data.ativo === false),
    agentId: String(data.agentId || ""),
    agentName: String(data.agentName || ""),
    agentWhatsapp: String(data.agentWhatsapp || ""),
    agentCreci: String(data.agentCreci || ""),
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

export interface PropertyFilters {
  transaction?: string;
  type?: string;
  location?: string;
  bedrooms?: string;
  maxPrice?: number;
}

function matchesFilters(property: Property, filters: PropertyFilters) {
  const bedroomMatch = !filters.bedrooms ||
    (filters.bedrooms === "4+"
      ? property.bedrooms >= 4
      : property.bedrooms === Number(filters.bedrooms));
  return !property.sold &&
    (!filters.transaction || property.transaction === filters.transaction) &&
    (!filters.type || property.type === filters.type) &&
    (!filters.location || property.location === filters.location) &&
    bedroomMatch &&
    (!filters.maxPrice || property.price <= filters.maxPrice);
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

// A consulta usa o filtro mais seletivo no Firestore e percorre apenas os lotes
// necessarios ate completar a pagina. Assim o resultado nunca fica limitado aos
// primeiros 12 itens do catalogo.
export async function getFilteredPropertiesPage(
  filters: PropertyFilters,
  pageSize = 12,
  cursor?: QueryDocumentSnapshot | null,
): Promise<PropertiesPage> {
  const scanSize = Math.max(pageSize * 2, 24);
  const primary: [string, string | number] | null = filters.location
    ? ["location", filters.location]
    : filters.type
      ? ["type", filters.type]
      : filters.bedrooms && filters.bedrooms !== "4+"
        ? ["bedrooms", Number(filters.bedrooms)]
        : filters.transaction
          ? ["transaction", filters.transaction]
          : null;
  const found: Property[] = [];
  let nextCursor = cursor ?? null;
  let hasMore = true;

  while (found.length < pageSize && hasMore) {
    const constraints = [
      ...(primary ? [where(primary[0], "==", primary[1])] : []),
      orderBy("dataCadastro", "desc"),
      ...(nextCursor ? [startAfter(nextCursor)] : []),
      limit(scanSize),
    ];
    const snapshot = await getDocs(query(propertiesCollection, ...constraints));
    const docs = snapshot.docs;
    hasMore = docs.length === scanSize;
    for (const item of docs) {
      nextCursor = item;
      const property = mapProperty(item);
      if (matchesFilters(property, filters)) found.push(property);
      if (found.length === pageSize) {
        hasMore = true;
        break;
      }
    }
  }

  return { items: found.slice(0, pageSize), cursor: nextCursor, hasMore };
}

export function subscribeProperty(
  slugOrId: string,
  callback: (property: Property | null) => void,
) {
  const looksLikeId = /^\d+$/.test(slugOrId) || /^[A-Za-z0-9]{20}$/.test(slugOrId);
  if (looksLikeId) {
    return onSnapshot(doc(db, "imoveis", slugOrId), (snapshot) =>
      callback(snapshot.exists() ? mapProperty(snapshot) : null),
    );
  }
  return onSnapshot(
    query(propertiesCollection, where("slug", "==", slugOrId), limit(1)),
    (snapshot) => callback(snapshot.empty ? null : mapProperty(snapshot.docs[0])),
  );
}

export const saveProperty = async (data: Omit<Property, "id">, id?: string) => {
  const reference = id ? doc(db, "imoveis", id) : doc(propertiesCollection);
  const slug = id
    ? data.slug || reference.id
    : `${data.slug || reference.id}-${reference.id.slice(0, 6).toLowerCase()}`;
  await setDoc(
    reference,
    {
      ...data,
      slug,
      updatedAt: serverTimestamp(),
      dataAtualizacao: serverTimestamp(),
      titulo: data.title,
      tipoTransacao: data.transaction === "Compra" ? "Venda" : "Aluguel",
      tipoImovel: data.type,
      bairro: data.location,
      address: deleteField(),
      endereco: deleteField(),
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
