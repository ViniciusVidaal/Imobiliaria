import { addDoc, collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
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

export async function verifyRegistrationCode(code: string) {
  const snapshot = await getDoc(doc(db, "configuracoes", "admin"));
  const configured = String(snapshot.data()?.codigoCadastro || process.env.NEXT_PUBLIC_ADMIN_REGISTRATION_CODE || "");
  if (!configured) throw new Error("Cadastre o campo codigoCadastro em configuracoes/admin no Firestore.");
  return code === configured;
}

export async function saveUserProfile(uid: string, name: string, email: string, role: AdminRole) {
  await setDoc(doc(db, "usuarios", uid), { name, email: email.toLowerCase(), role, active: true, createdAt: serverTimestamp() });
}

export async function findUserByEmail(email: string) {
  const snapshot = await getDocs(query(collection(db, "usuarios"), where("email", "==", email.toLowerCase()), limit(1)));
  return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as AdminUserProfile;
}

export async function reactivateUser(user: AdminUserProfile, name: string, role: AdminRole) {
  await updateDoc(doc(db, "usuarios", user.id), { name, role, active: true, updatedAt: serverTimestamp() });
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
  await updateDoc(doc(db, "usuarios", user.id), { active: false, disabledAt: serverTimestamp() });
}
