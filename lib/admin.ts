import { addDoc, collection, doc, getDoc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface AuditEntry {
  id: string;
  action: string;
  details: string;
  userName: string;
  userEmail: string;
  createdAt?: { toDate?: () => Date };
}

export async function addAudit(action: string, details: string) {
  const user = auth.currentUser;
  await addDoc(collection(db, "historico"), {
    action,
    details,
    userId: user?.uid || "unknown",
    userName: user?.displayName || user?.email?.split("@")[0] || "Administrador",
    userEmail: user?.email || "",
    createdAt: serverTimestamp(),
  });
}

export function subscribeAudit(callback: (entries: AuditEntry[]) => void) {
  return onSnapshot(query(collection(db, "historico"), orderBy("createdAt", "desc"), limit(100)), (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as AuditEntry))));
}

export async function verifyRegistrationCode(code: string) {
  const snapshot = await getDoc(doc(db, "configuracoes", "admin"));
  const configured = String(snapshot.data()?.codigoCadastro || process.env.NEXT_PUBLIC_ADMIN_REGISTRATION_CODE || "");
  if (!configured) throw new Error("Cadastre o campo codigoCadastro em configuracoes/admin no Firestore.");
  return code === configured;
}

export async function saveUserProfile(uid: string, name: string, email: string) {
  await setDoc(doc(db, "usuarios", uid), { name, email, role: "agent", active: true, createdAt: serverTimestamp() });
}
