"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { Building2, History, LogOut, Menu, PlusCircle, UserPlus, X } from "lucide-react";
import { auth } from "@/lib/firebase";
import { Logo } from "@/components/Logo";
import "./admin.css";

const links = [
  { href: "/admin", label: "Cadastrar imóvel", icon: PlusCircle },
  { href: "/admin/imoveis", label: "Imóveis cadastrados", icon: Building2 },
  { href: "/admin/usuarios", label: "Cadastrar usuário", icon: UserPlus },
  { href: "/admin/historico", label: "Histórico", icon: History },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null | undefined>();
  const [notice, setNotice] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => onAuthStateChanged(auth, setUser), []);

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

  if (user === undefined) return <main className="admin-loading">Carregando painel...</main>;
  if (!user) return <main className="login-page"><form className="login-card" onSubmit={login}><Logo large/><span>Área restrita</span><h1>Painel administrativo</h1><p>Entre para gerenciar os imóveis da AL7.</p><label>E-mail<input name="email" type="email" autoComplete="email" required /></label><label>Senha<input name="password" type="password" autoComplete="current-password" required /></label>{notice && <p className="notice">{notice}</p>}<button className="admin-btn">Entrar no painel</button></form></main>;

  return <div className="admin-app">
    <aside className={`admin-sidebar ${menuOpen ? "open" : ""}`}>
      <div className="admin-brand"><Logo/><div><b>AL7 Gestão</b><small>{user.displayName || user.email}</small></div></div>
      <nav>{links.map(({ href, label, icon: Icon }) => <Link href={href} key={href} className={pathname === href || (href !== "/admin" && pathname.startsWith(href)) ? "active" : ""} onClick={() => setMenuOpen(false)}><Icon />{label}</Link>)}</nav>
      <button className="admin-logout" onClick={() => signOut(auth)}><LogOut /> Sair do painel</button>
    </aside>
    <button className="admin-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir navegação">{menuOpen ? <X/> : <Menu/>}</button>
    {menuOpen && <button className="admin-menu-backdrop" onClick={() => setMenuOpen(false)} aria-label="Fechar navegação"/>}
    <main className="admin-content">{children}</main>
  </div>;
}
