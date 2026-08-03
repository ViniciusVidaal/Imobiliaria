"use client";

import { FormEvent, useEffect, useState } from "react";
import { getApps, initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signOut, updateProfile } from "firebase/auth";
import { KeyRound, LockKeyhole, Mail, ShieldCheck, UserPlus, Users } from "lucide-react";
import { auth, firebaseConfig } from "@/lib/firebase";
import { addAudit, AdminUserProfile, changeRegistrationCode, saveUserProfile, subscribeUsers, verifyRegistrationCode } from "@/lib/admin";

export default function UsersPage() {
  const [authorized, setAuthorized] = useState(false);
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => authorized ? subscribeUsers(setUsers) : undefined, [authorized]);

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
      const email = String(data.get("email"));
      const credential = await createUserWithEmailAndPassword(secondaryAuth, email, String(data.get("password")));
      const name = String(data.get("name"));
      await updateProfile(credential.user, { displayName: name });
      await saveUserProfile(credential.user.uid, name, email);
      await signOut(secondaryAuth);
      await addAudit("Usuário cadastrado", `${name} · ${email}`);
      form.reset(); setNotice("Usuário cadastrado com sucesso.");
    } catch (error) { setNotice(`Não foi possível cadastrar: ${error instanceof Error ? error.message : "erro inesperado"}`); }
    finally { setBusy(false); }
  }

  async function changeCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    const form = event.currentTarget; const data = new FormData(form);
    const newCode = String(data.get("newCode"));
    if (newCode !== String(data.get("confirmCode"))) { setBusy(false); return setNotice("A confirmação da nova senha não confere."); }
    try { await changeRegistrationCode(String(data.get("currentCode")), newCode); await addAudit("Senha administrativa alterada", "A senha de acesso à área de usuários foi atualizada."); form.reset(); setNotice("Senha administrativa alterada com sucesso."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível alterar a senha."); }
    finally { setBusy(false); }
  }

  async function resetPassword(user: AdminUserProfile) {
    try { auth.languageCode = "pt-BR"; await sendPasswordResetEmail(auth, user.email); await addAudit("Redefinição de senha solicitada", `${user.name} · ${user.email}`); setNotice(`E-mail de redefinição enviado para ${user.email}.`); }
    catch (error) { setNotice(`Não foi possível enviar: ${error instanceof Error ? error.message : "erro inesperado"}`); }
  }

  if (!authorized) return <section className="admin-panel admin-gate"><div className="gate-icon"><KeyRound/></div><span>Acesso protegido</span><h1>Cadastrar usuário</h1><p>Informe a senha administrativa configurada no Firestore para continuar.</p><form onSubmit={unlock}><label>Senha administrativa<input name="code" type="password" required autoFocus/></label><button className="admin-btn" disabled={busy}>{busy?"Verificando...":"Liberar acesso"}</button></form>{notice&&<p className="notice">{notice}</p>}</section>;

  return <div className="users-admin-page">
    <section className="admin-panel user-register"><div className="admin-page-head"><div className="admin-head-icon"><UserPlus/></div><div><span>Equipe</span><h1>Cadastrar usuário</h1><p>Crie o acesso de um novo agente ao painel.</p></div></div><div className="security-note"><ShieldCheck/><p>As senhas de login são protegidas pelo Firebase e nunca podem ser visualizadas. Quando necessário, envie uma redefinição por e-mail.</p></div><form className="fields" onSubmit={register}><label className="wide">Nome completo<input name="name" required autoComplete="name"/></label><label>E-mail<input name="email" type="email" required autoComplete="email"/></label><label>Senha inicial<input name="password" type="password" minLength={6} required autoComplete="new-password"/></label><div className="form-actions wide"><button className="admin-btn" disabled={busy}>{busy?"Cadastrando...":"Cadastrar usuário"}</button></div></form></section>

    <section className="admin-panel access-password"><div className="admin-page-head"><div className="admin-head-icon"><LockKeyhole/></div><div><span>Segurança</span><h1>Senha da área de usuários</h1><p>Altere a senha exigida para abrir esta seção.</p></div></div><form className="fields" onSubmit={changeCode}><label className="wide">Senha atual<input name="currentCode" type="password" required/></label><label>Nova senha<input name="newCode" type="password" minLength={6} required/></label><label>Confirmar nova senha<input name="confirmCode" type="password" minLength={6} required/></label><div className="form-actions wide"><button className="admin-btn" disabled={busy}>Alterar senha</button></div></form></section>

    <section className="admin-panel users-list"><div className="admin-page-head"><div className="admin-head-icon"><Users/></div><div><span>Acessos</span><h1>Usuários cadastrados</h1><p>{users.length} agente(s) registrado(s) pelo painel.</p></div></div><div>{users.map((user)=><article key={user.id}><div className="user-avatar">{user.name?.charAt(0).toUpperCase()||"A"}</div><div><b>{user.name}</b><span>{user.email}</span><small>Senha: ••••••••</small></div><button onClick={()=>resetPassword(user)}><Mail/> Redefinir senha</button></article>)}</div>{!users.length&&<p className="admin-empty">Nenhum usuário adicional cadastrado ainda.</p>}</section>
    {notice&&<p className="notice users-notice">{notice}</p>}
  </div>;
}
