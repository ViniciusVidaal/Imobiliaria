"use client";

import { FormEvent, useState } from "react";
import { getApps, initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signOut, updateProfile } from "firebase/auth";
import { KeyRound, ShieldCheck, UserPlus } from "lucide-react";
import { firebaseConfig } from "@/lib/firebase";
import { addAudit, saveUserProfile, verifyRegistrationCode } from "@/lib/admin";

export default function UsersPage() {
  const [authorized, setAuthorized] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    try { const code = String(new FormData(event.currentTarget).get("code")); if (await verifyRegistrationCode(code)) setAuthorized(true); else setNotice("Senha administrativa incorreta."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível validar a senha."); }
    finally { setBusy(false); }
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    const form = event.currentTarget; const data = new FormData(form);
    try {
      const secondaryApp = getApps().find((app)=>app.name==="user-creator") || initializeApp(firebaseConfig, "user-creator");
      const secondaryAuth = getAuth(secondaryApp);
      const credential = await createUserWithEmailAndPassword(secondaryAuth, String(data.get("email")), String(data.get("password")));
      const name = String(data.get("name"));
      await updateProfile(credential.user, { displayName: name });
      await saveUserProfile(credential.user.uid, name, String(data.get("email")));
      await signOut(secondaryAuth);
      await addAudit("Usuário cadastrado", `${name} · ${data.get("email")}`);
      form.reset(); setNotice("Usuário cadastrado com sucesso.");
    } catch (error) { setNotice(`Não foi possível cadastrar: ${error instanceof Error ? error.message : "erro inesperado"}`); }
    finally { setBusy(false); }
  }

  if (!authorized) return <section className="admin-panel admin-gate"><div className="gate-icon"><KeyRound/></div><span>Acesso protegido</span><h1>Cadastrar usuário</h1><p>Informe a senha administrativa configurada no Firestore para continuar.</p><form onSubmit={unlock}><label>Senha administrativa<input name="code" type="password" required autoFocus/></label><button className="admin-btn" disabled={busy}>{busy?"Verificando...":"Liberar acesso"}</button></form>{notice&&<p className="notice">{notice}</p>}</section>;

  return <section className="admin-panel user-register"><div className="admin-page-head"><div className="admin-head-icon"><UserPlus/></div><div><span>Equipe</span><h1>Cadastrar usuário</h1><p>Crie o acesso de um novo agente ao painel.</p></div></div><div className="security-note"><ShieldCheck/><p>O novo usuário poderá entrar com e-mail e senha, mas não verá a senha administrativa usada para liberar esta tela.</p></div><form className="fields" onSubmit={register}><label className="wide">Nome completo<input name="name" required autoComplete="name"/></label><label>E-mail<input name="email" type="email" required autoComplete="email"/></label><label>Senha de acesso<input name="password" type="password" minLength={6} required autoComplete="new-password"/></label><div className="form-actions wide"><button className="admin-btn" disabled={busy}>{busy?"Cadastrando...":"Cadastrar usuário"}</button></div></form>{notice&&<p className="notice">{notice}</p>}</section>;
}
