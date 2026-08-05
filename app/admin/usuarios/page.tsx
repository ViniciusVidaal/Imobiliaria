"use client";

import { FormEvent, useEffect, useState } from "react";
import { getApps, initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, deleteUser, getAuth, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { KeyRound, Mail, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import { auth, firebaseConfig } from "@/lib/firebase";
import { addAudit, AdminRole, AdminUserProfile, findUserByEmail, reactivateUser, recoverUserAreaAccess, removeAgent, saveUserProfile, subscribeCurrentProfile, subscribeUsers, verifyRegistrationCode } from "@/lib/admin";
import { AdminSuccessModal } from "@/components/admin/AdminSuccessModal";

export default function UsersPage() {
  const [authorized, setAuthorized] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [isCEO, setIsCEO] = useState(false);
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [notice, setNotice] = useState("");
  const [success, setSuccess] = useState<{ title:string; message:string } | null>(null);
  const [busy, setBusy] = useState(false);
  const activeUsers = users.filter((user) => user.active);

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
      if (await recoverUserAreaAccess(email)) { setAuthorized(true); setRecovery(false); setSuccess({ title:"Acesso recuperado!", message:"Sua identidade CEO foi confirmada e a área de usuários está liberada." }); }
      else setNotice("Este e-mail não pertence ao CEO conectado.");
    } catch { setNotice("Não foi possível confirmar o perfil CEO."); }
    finally { setBusy(false); }
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    const form = event.currentTarget; const data = new FormData(form);
    const secondaryApp = getApps().find((app)=>app.name==="user-creator") || initializeApp(firebaseConfig, "user-creator");
    const secondaryAuth = getAuth(secondaryApp);
    let createdUser: Awaited<ReturnType<typeof createUserWithEmailAndPassword>>["user"] | null = null;
    let profileSaved = false;
    try {
      const email = String(data.get("email")).trim().toLowerCase();
      const credential = await createUserWithEmailAndPassword(secondaryAuth, email, String(data.get("password")));
      createdUser = credential.user;
      const name = String(data.get("name")).trim();
      const role = String(data.get("role")) as AdminRole;
      await updateProfile(credential.user, { displayName: name });
      await saveUserProfile(credential.user.uid, name, email, role);
      profileSaved = true;
      await signOut(secondaryAuth).catch(() => undefined);
      const auditSaved = await addAudit("Usuário cadastrado", `${name} · ${email} · ${role === "ceo" ? "CEO" : "Agente"}`).then(()=>true).catch(()=>false);
      form.reset(); setSuccess({ title:"Usuário cadastrado com sucesso!", message:auditSaved ? "O novo acesso já está disponível com o perfil selecionado." : "O acesso foi criado, mas o histórico não pôde ser registrado." });
    } catch (error) {
      const code = (error as { code?: string }).code;
      const email = String(data.get("email")).trim().toLowerCase();
      const name = String(data.get("name")).trim();
      const role = String(data.get("role")) as AdminRole;
      if (createdUser && !profileSaved) await deleteUser(createdUser).catch(() => undefined);
      if (code === "auth/email-already-in-use") {
        const existing = await findUserByEmail(email).catch(() => null);
        if (existing?.active) setNotice("Este e-mail já possui um acesso ativo no painel.");
        else if (existing) {
          await reactivateUser(existing, name, role);
          auth.languageCode = "pt-BR";
          const resetSent = await sendPasswordResetEmail(auth, email).then(()=>true).catch(()=>false);
          await addAudit("Usuário reativado", `${name} · ${email} · redefinição de senha ${resetSent ? "enviada" : "pendente"}`).catch(()=>undefined);
          form.reset();
          setSuccess({ title:"Usuário reativado!", message:resetSent ? "O acesso foi liberado e enviamos um e-mail para o usuário definir a nova senha." : "O acesso foi liberado. Use ‘Redefinir senha’ para reenviar o e-mail." });
        } else {
          try {
            const recovered = await signInWithEmailAndPassword(secondaryAuth, email, String(data.get("password")));
            await updateProfile(recovered.user, { displayName: name });
            await saveUserProfile(recovered.user.uid, name, email, role);
            await signOut(secondaryAuth);
            await addAudit("Conta órfã recuperada", `${name} · ${email} · perfil ${role}`);
            form.reset();
            setSuccess({ title:"Conta recuperada!", message:"A conta existente foi vinculada ao painel e já pode ser utilizada." });
          } catch {
            setNotice("Este e-mail já existe no Authentication com outra senha e ainda não possui perfil. Use a senha original ou exclua essa conta no Firebase uma única vez.");
          }
        }
      } else setNotice(`Não foi possível cadastrar: ${error instanceof Error ? error.message : "erro inesperado"}`);
    }
    finally { setBusy(false); }
  }

  async function resetPassword(user: AdminUserProfile) {
    try { auth.languageCode = "pt-BR"; await sendPasswordResetEmail(auth, user.email); await addAudit("Redefinição de senha solicitada", `${user.name} · ${user.email}`); setSuccess({ title:"Redefinição enviada!", message:`O e-mail para criar uma nova senha foi enviado para ${user.email}.` }); }
    catch (error) { setNotice(`Não foi possível enviar: ${error instanceof Error ? error.message : "erro inesperado"}`); }
  }

  async function deleteAgent(user: AdminUserProfile) {
    if (!window.confirm(`Desativar o acesso de ${user.name}? O agente não poderá mais entrar, mas o e-mail poderá ser reativado depois.`)) return;
    setBusy(true); setNotice("");
    try { await removeAgent(user); await addAudit("Agente desativado", `${user.name} · ${user.email}`); setSuccess({ title:"Agente desativado!", message:`O acesso de ${user.name} foi removido com sucesso.` }); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível excluir o agente."); }
    finally { setBusy(false); }
  }

  if (!authorized) return <section className="admin-panel admin-gate"><div className="gate-icon"><KeyRound/></div><span>Acesso exclusivo do CEO</span><h1>Cadastrar usuário</h1><p>{recovery ? "Digite o mesmo e-mail CEO usado para entrar no painel." : "Informe a senha administrativa para continuar."}</p>{recovery ? <form onSubmit={recover}><label>E-mail do CEO<input name="email" type="email" required autoFocus/></label><button className="admin-btn" disabled={busy}>{busy?"Confirmando...":"Recuperar acesso"}</button></form> : <form onSubmit={unlock}><label>Senha administrativa<input name="code" type="password" required autoFocus/></label><button className="admin-btn" disabled={busy}>{busy?"Verificando...":"Liberar acesso"}</button></form>}<button className="forgot-area-password" type="button" onClick={() => { setRecovery(!recovery); setNotice(""); }}>{recovery ? "Voltar para a senha" : "Esqueci minha senha"}</button>{notice&&<p className="notice">{notice}</p>}</section>;

  return <><div className="users-admin-page">
    <section className="admin-panel user-register"><div className="admin-page-head"><div className="admin-head-icon"><UserPlus/></div><div><span>Equipe</span><h1>Cadastrar usuário</h1><p>Crie um acesso com o nível correto de permissão.</p></div></div><div className="security-note"><ShieldCheck/><p>CEO gerencia usuários e agentes. Agente gerencia imóveis, mas não acessa esta área.</p></div><form className="fields" onSubmit={register}><label className="wide">Nome completo<input name="name" required autoComplete="name"/></label><label>E-mail<input name="email" type="email" required autoComplete="email"/></label><label>Senha inicial<input name="password" type="password" minLength={6} required autoComplete="new-password"/></label><label className="wide">Tipo de perfil<select name="role" defaultValue="agent" required><option value="agent">Agente</option><option value="ceo">CEO</option></select></label><div className="form-actions wide"><button className="admin-btn" disabled={busy}>{busy?"Cadastrando...":"Cadastrar usuário"}</button></div></form></section>

    <section className="admin-panel users-list"><div className="admin-page-head"><div className="admin-head-icon"><Users/></div><div><span>Acessos</span><h1>Usuários cadastrados</h1><p>{activeUsers.length} acesso(s) ativo(s) no painel.</p></div></div><div>{activeUsers.map((user)=><article key={user.id}><div className="user-avatar">{user.name?.charAt(0).toUpperCase()||"A"}</div><div><b>{user.name} <i className={`role-badge ${user.role}`}>{user.role === "ceo" ? "CEO" : "Agente"}</i></b><span>{user.email}</span><small>Senha: ••••••••</small></div><div className="user-actions"><button onClick={()=>resetPassword(user)}><Mail/> Redefinir senha</button>{user.role !== "ceo" && <button className="danger" disabled={busy} onClick={()=>deleteAgent(user)}><Trash2/> Desativar agente</button>}</div></article>)}</div>{!activeUsers.length&&<p className="admin-empty">Nenhum usuário ativo cadastrado.</p>}</section>
    {notice&&<p className="notice users-notice">{notice}</p>}
  </div>{success&&<AdminSuccessModal title={success.title} message={success.message} onClose={()=>setSuccess(null)}/>}</>;
}
