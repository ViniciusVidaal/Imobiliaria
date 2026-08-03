"use client";

import { FormEvent, useEffect, useState } from "react";
import { getApps, initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signOut, updateProfile } from "firebase/auth";
import { KeyRound, LockKeyhole, Mail, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import { auth, firebaseConfig } from "@/lib/firebase";
import { addAudit, AdminRole, AdminUserProfile, changeRegistrationCode, recoverUserAreaAccess, removeAgent, saveUserProfile, subscribeCurrentProfile, subscribeUsers, verifyRegistrationCode } from "@/lib/admin";

export default function UsersPage() {
  const [authorized, setAuthorized] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [isCEO, setIsCEO] = useState(false);
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => auth.currentUser ? subscribeCurrentProfile(auth.currentUser.uid, (profile) => setIsCEO(profile?.role === "ceo" && profile.active)) : undefined, []);
  useEffect(() => authorized && isCEO ? subscribeUsers(setUsers) : undefined, [authorized, isCEO]);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    try { const code = String(new FormData(event.currentTarget).get("code")); if (isCEO && await verifyRegistrationCode(code)) setAuthorized(true); else setNotice("Senha administrativa incorreta ou perfil sem permissão."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível validar a senha."); }
    finally { setBusy(false); }
  }

  async function recover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const email = String(new FormData(event.currentTarget).get("email"));
      if (await recoverUserAreaAccess(email)) { setAuthorized(true); setRecovery(false); setNotice("Identidade CEO confirmada. Agora você pode cadastrar usuários ou criar uma nova senha para esta área."); }
      else setNotice("Este e-mail não pertence ao CEO conectado.");
    } catch { setNotice("Não foi possível confirmar o perfil CEO."); }
    finally { setBusy(false); }
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    const form = event.currentTarget; const data = new FormData(form);
    try {
      const secondaryApp = getApps().find((app)=>app.name==="user-creator") || initializeApp(firebaseConfig, "user-creator");
      const secondaryAuth = getAuth(secondaryApp);
      const email = String(data.get("email")).trim().toLowerCase();
      const credential = await createUserWithEmailAndPassword(secondaryAuth, email, String(data.get("password")));
      const name = String(data.get("name")).trim();
      const role = String(data.get("role")) as AdminRole;
      await updateProfile(credential.user, { displayName: name });
      await saveUserProfile(credential.user.uid, name, email, role);
      await signOut(secondaryAuth);
      await addAudit("Usuário cadastrado", `${name} · ${email} · ${role === "ceo" ? "CEO" : "Agente"}`);
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

  async function deleteAgent(user: AdminUserProfile) {
    if (!window.confirm(`Excluir o acesso de ${user.name}? O agente será desconectado e não poderá mais entrar no painel.`)) return;
    setBusy(true); setNotice("");
    try { await removeAgent(user); await addAudit("Agente excluído", `${user.name} · ${user.email}`); setNotice(`Acesso de ${user.name} excluído com sucesso.`); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível excluir o agente."); }
    finally { setBusy(false); }
  }

  if (!authorized) return <section className="admin-panel admin-gate"><div className="gate-icon"><KeyRound/></div><span>Acesso exclusivo do CEO</span><h1>Cadastrar usuário</h1><p>{recovery ? "Digite o mesmo e-mail CEO usado para entrar no painel." : "Informe a senha administrativa para continuar."}</p>{recovery ? <form onSubmit={recover}><label>E-mail do CEO<input name="email" type="email" required autoFocus/></label><button className="admin-btn" disabled={busy}>{busy?"Confirmando...":"Recuperar acesso"}</button></form> : <form onSubmit={unlock}><label>Senha administrativa<input name="code" type="password" required autoFocus/></label><button className="admin-btn" disabled={busy}>{busy?"Verificando...":"Liberar acesso"}</button></form>}<button className="forgot-area-password" type="button" onClick={() => { setRecovery(!recovery); setNotice(""); }}>{recovery ? "Voltar para a senha" : "Esqueci minha senha"}</button>{notice&&<p className="notice">{notice}</p>}</section>;

  return <div className="users-admin-page">
    <section className="admin-panel user-register"><div className="admin-page-head"><div className="admin-head-icon"><UserPlus/></div><div><span>Equipe</span><h1>Cadastrar usuário</h1><p>Crie um acesso com o nível correto de permissão.</p></div></div><div className="security-note"><ShieldCheck/><p>CEO gerencia usuários e agentes. Agente gerencia imóveis, mas não acessa esta área.</p></div><form className="fields" onSubmit={register}><label className="wide">Nome completo<input name="name" required autoComplete="name"/></label><label>E-mail<input name="email" type="email" required autoComplete="email"/></label><label>Senha inicial<input name="password" type="password" minLength={6} required autoComplete="new-password"/></label><label className="wide">Tipo de perfil<select name="role" defaultValue="agent" required><option value="agent">Agente</option><option value="ceo">CEO</option></select></label><div className="form-actions wide"><button className="admin-btn" disabled={busy}>{busy?"Cadastrando...":"Cadastrar usuário"}</button></div></form></section>

    <section className="admin-panel access-password"><div className="admin-page-head"><div className="admin-head-icon"><LockKeyhole/></div><div><span>Segurança</span><h1>Senha da área de usuários</h1><p>Altere a senha exigida para abrir esta seção.</p></div></div><form className="fields" onSubmit={changeCode}><label className="wide">Senha atual<input name="currentCode" type="password" required/></label><label>Nova senha<input name="newCode" type="password" minLength={6} required/></label><label>Confirmar nova senha<input name="confirmCode" type="password" minLength={6} required/></label><div className="form-actions wide"><button className="admin-btn" disabled={busy}>Alterar senha</button></div></form></section>

    <section className="admin-panel users-list"><div className="admin-page-head"><div className="admin-head-icon"><Users/></div><div><span>Acessos</span><h1>Usuários cadastrados</h1><p>{users.length} usuário(s) registrado(s) no painel.</p></div></div><div>{users.map((user)=><article key={user.id}><div className="user-avatar">{user.name?.charAt(0).toUpperCase()||"A"}</div><div><b>{user.name} <i className={`role-badge ${user.role}`}>{user.role === "ceo" ? "CEO" : "Agente"}</i></b><span>{user.email}</span><small>Senha: ••••••••</small></div><div className="user-actions"><button onClick={()=>resetPassword(user)}><Mail/> Redefinir senha</button>{user.role !== "ceo" && <button className="danger" disabled={busy} onClick={()=>deleteAgent(user)}><Trash2/> Excluir agente</button>}</div></article>)}</div>{!users.length&&<p className="admin-empty">Nenhum usuário cadastrado ainda.</p>}</section>
    {notice&&<p className="notice users-notice">{notice}</p>}
  </div>;
}
