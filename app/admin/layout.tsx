"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { ArrowLeft, Building2, History, LogOut, Menu, PlusCircle, UserPlus, X } from "lucide-react";
import { auth } from "@/lib/firebase";
import { AdminUserProfile, subscribeCurrentProfile } from "@/lib/admin";
import { Logo } from "@/components/Logo";
import "./admin.css";

const links = [
  { href: "/admin", label: "Cadastrar imóvel", icon: PlusCircle },
  { href: "/admin/imoveis", label: "Imóveis cadastrados", icon: Building2 },
  { href: "/admin/usuarios", label: "Cadastrar usuário", icon: UserPlus, ceoOnly: true },
  { href: "/admin/historico", label: "Histórico", icon: History },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>();
  const [profile, setProfile] = useState<AdminUserProfile | null | undefined>();
  const [notice, setNotice] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => onAuthStateChanged(auth, setUser), []);
  useEffect(() => {
    if (!user) { setProfile(user === null ? null : undefined); return; }
    return subscribeCurrentProfile(user.uid, setProfile);
  }, [user]);
  useEffect(() => {
    if (profile && profile.role !== "ceo" && pathname.startsWith("/admin/usuarios")) router.replace("/admin");
  }, [pathname, profile, router]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      setNotice("");
      await signInWithEmailAndPassword(auth, String(data.get("email")), String(data.get("password")));
    } catch {
      setNotice("E-mail ou senha inválidos.");
    }
  }

  if (user === undefined || (user && profile === undefined)) return <main className="admin-loading">Carregando painel...</main>;
  if (!user) return <main className="login-page"><form className="login-card" onSubmit={login}><Logo large/><span>Área restrita</span><h1>Painel administrativo</h1><p>Entre para gerenciar os imóveis da AL7.</p><label>E-mail<input name="email" type="email" autoComplete="email" required /></label><label>Senha<input name="password" type="password" autoComplete="current-password" required /></label>{notice && <p className="notice">{notice}</p>}<button className="admin-btn">Entrar no painel</button></form></main>;
  if (!profile || !profile.active) return <main className="login-page"><section className="login-card"><Logo large/><span>Acesso bloqueado</span><h1>Usuário sem permissão</h1><p>Seu acesso foi removido ou ainda não foi autorizado pelo CEO.</p><button className="admin-btn" onClick={() => signOut(auth)}>Voltar ao login</button></section></main>;

  return <div className="admin-app">
    <aside className={`admin-sidebar ${menuOpen ? "open" : ""}`}>
      <div className="admin-brand"><Logo/><div><b>AL7 Gestão</b><small>{profile.name || user.email}</small><em>{profile.role === "ceo" ? "CEO" : "Agente"}</em></div></div>
      <nav>{links.filter((link) => !link.ceoOnly || profile.role === "ceo").map(({ href, label, icon: Icon }) => <Link href={href} key={href} className={pathname === href || (href !== "/admin" && pathname.startsWith(href)) ? "active" : ""} onClick={() => setMenuOpen(false)}><Icon />{label}</Link>)}</nav>
      <Link href="/" className="admin-back-site"><ArrowLeft /> Voltar para o site</Link>
      <button className="admin-logout" data-unsaved-action="logout" onClick={() => signOut(auth)}><LogOut /> Sair do painel</button>
    </aside>
    <button className="admin-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir navegação">{menuOpen ? <X/> : <Menu/>}</button>
    <Link href="/" className="admin-site-mobile"><ArrowLeft /> Voltar ao site</Link>
    {menuOpen && <button className="admin-menu-backdrop" onClick={() => setMenuOpen(false)} aria-label="Fechar navegação"/>}
    <main className="admin-content">{children}</main>
  </div>;
}
