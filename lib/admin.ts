import { addDoc, collection, deleteDoc, doc, getDoc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface AuditEntry {
  id: string;
  action: string;
  details: string;
  userName: string;
  userEmail: string;
  createdAt?: { toDate?: () => Date };
}

export type AdminRole = "ceo" | "agent";
export interface AdminUserProfile { id:string; name:string; email:string; role:AdminRole; active:boolean; createdAt?:unknown }

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

export async function saveUserProfile(uid: string, name: string, email: string, role: AdminRole) {
  await setDoc(doc(db, "usuarios", uid), { name, email: email.toLowerCase(), role, active: true, createdAt: serverTimestamp() });
}

export function subscribeUsers(callback: (users: AdminUserProfile[]) => void) {
  return onSnapshot(collection(db, "usuarios"), (snapshot) => callback(snapshot.docs.map((item) => ({ id:item.id, ...item.data() } as AdminUserProfile))));
}

export async function changeRegistrationCode(currentCode: string, newCode: string) {
  if (!(await verifyRegistrationCode(currentCode))) throw new Error("Senha administrativa atual incorreta.");
  await updateDoc(doc(db, "configuracoes", "admin"), { codigoCadastro: newCode, updatedAt: serverTimestamp() });
}

export function subscribeCurrentProfile(uid: string, callback: (profile: AdminUserProfile | null) => void) {
  return onSnapshot(doc(db, "usuarios", uid), (snapshot) => callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as AdminUserProfile : null));
}

export async function recoverUserAreaAccess(email: string) {
  const current = auth.currentUser;
  if (!current || current.email?.toLowerCase() !== email.trim().toLowerCase()) return false;
  const snapshot = await getDoc(doc(db, "usuarios", current.uid));
  return snapshot.exists() && snapshot.data().active === true && snapshot.data().role === "ceo";
}

export async function removeAgent(user: AdminUserProfile) {
  if (user.role === "ceo") throw new Error("Contas CEO não podem ser excluídas por esta tela.");
  await deleteDoc(doc(db, "usuarios", user.id));
}
