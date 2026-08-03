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

const propertiesCollection = collection(db, "properties");
const mapProperty = (snapshot: QueryDocumentSnapshot) => ({
  id: snapshot.id,
  ...snapshot.data(),
}) as Property;

// Uso restrito ao painel administrativo, que precisa gerenciar todo o catálogo.
export const subscribeProperties = (callback: (items: Property[]) => void) =>
  onSnapshot(
    query(propertiesCollection, orderBy("createdAt", "desc")),
    (snapshot) => callback(snapshot.docs.map(mapProperty)),
  );

// A Home escuta somente o pequeno lote exibido, sem ler o catálogo inteiro.
export const subscribeLatestProperties = (
  pageSize: number,
  callback: (items: Property[]) => void,
) =>
  onSnapshot(
    query(propertiesCollection, orderBy("createdAt", "desc"), limit(pageSize)),
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
  const constraints = [orderBy("createdAt", "desc"), limit(pageSize + 1)];
  const pageQuery = cursor
    ? query(propertiesCollection, orderBy("createdAt", "desc"), startAfter(cursor), limit(pageSize + 1))
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
  const reference = id ? doc(db, "properties", id) : doc(propertiesCollection);
  await setDoc(reference, {
    ...data,
    slug: data.slug || reference.id,
    updatedAt: serverTimestamp(),
    ...(id ? {} : { createdAt: serverTimestamp() }),
  }, { merge: true });
  return reference.id;
};

export const removeProperty = (id: string) => deleteDoc(doc(db, "properties", id));
export const setSold = (id: string, sold: boolean) => updateDoc(doc(db, "properties", id), { sold, updatedAt: serverTimestamp() });
