import { addDoc, collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from "firebase/firestore";
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
export interface AdminUserProfile { id:string; name:string; email:string; contactEmail?:string; whatsapp?:string; creci?:string; role:AdminRole; active:boolean; createdAt?:unknown }

export async function addAudit(action: string, details: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Sua sessão expirou.");
  const profile = await getDoc(doc(db, "usuarios", user.uid));
  if (!profile.exists() || profile.data().active !== true) throw new Error("Usuário sem permissão.");
  await addDoc(collection(db, "historico"), {
    action,
    details,
    userId: user.uid,
    userName: profile.data().name,
    userEmail: profile.data().email,
    createdAt: serverTimestamp(),
  });
}

export function subscribeAudit(callback: (entries: AuditEntry[]) => void) {
  return onSnapshot(query(collection(db, "historico"), orderBy("createdAt", "desc"), limit(100)), (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as AuditEntry))));
}

export async function saveUserProfile(uid: string, name: string, email: string, role: AdminRole, whatsapp = "", creci = "") {
  await setDoc(doc(db, "usuarios", uid), { name, email: email.toLowerCase(), contactEmail: email.toLowerCase(), whatsapp: whatsapp.replace(/\D/g, ""), creci: creci.trim(), role, active: true, createdAt: serverTimestamp() });
}

export async function findUserByEmail(email: string) {
  const snapshot = await getDocs(query(collection(db, "usuarios"), where("email", "==", email.toLowerCase()), limit(1)));
  return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as AdminUserProfile;
}

export async function reactivateUser(user: AdminUserProfile, name: string, role: AdminRole, whatsapp = "", creci = "") {
  await updateDoc(doc(db, "usuarios", user.id), { name, whatsapp: whatsapp.replace(/\D/g, ""), creci: creci.trim(), role, active: true, updatedAt: serverTimestamp() });
}

export async function updateUserProfile(user: AdminUserProfile, data: Pick<AdminUserProfile, "name"|"contactEmail"|"whatsapp"|"creci"|"role">) {
  const normalized = { name:data.name.trim(), contactEmail:(data.contactEmail || user.email).trim().toLowerCase(), whatsapp:(data.whatsapp || "").replace(/\D/g, ""), creci:(data.creci || "").trim(), role:data.role, updatedAt:serverTimestamp() };
  await updateDoc(doc(db, "usuarios", user.id), normalized);
  const assigned = await getDocs(query(collection(db, "imoveis"), where("agentId", "==", user.id)));
  for (let start = 0; start < assigned.docs.length; start += 450) {
    const batch = writeBatch(db);
    assigned.docs.slice(start, start + 450).forEach((item) => batch.update(item.ref, { agentName:normalized.name, agentWhatsapp:normalized.whatsapp, agentCreci:normalized.creci }));
    await batch.commit();
  }
}

export function subscribeUsers(callback: (users: AdminUserProfile[]) => void) {
  return onSnapshot(collection(db, "usuarios"), (snapshot) => callback(snapshot.docs.map((item) => ({ id:item.id, ...item.data() } as AdminUserProfile))));
}

export function subscribeCurrentProfile(uid: string, callback: (profile: AdminUserProfile | null) => void) {
  return onSnapshot(doc(db, "usuarios", uid), (snapshot) => callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as AdminUserProfile : null));
}

export async function removeAgent(user: AdminUserProfile) {
  if (user.role === "ceo") throw new Error("Contas CEO não podem ser excluídas por esta tela.");
  await updateDoc(doc(db, "usuarios", user.id), { active: false, disabledAt: serverTimestamp() });
}
