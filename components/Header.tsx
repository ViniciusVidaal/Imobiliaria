"use client";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/Logo";

export function Header() {
  const [open, setOpen] = useState(false);
  return <header className="site-header">
    <Link href="/" aria-label="AL7 Imóveis"><Logo /></Link>
    <nav className={open ? "open" : ""}>
      <Link href="/#imoveis" onClick={() => setOpen(false)}>Imóveis</Link>
      <Link href="/#servicos" onClick={() => setOpen(false)}>Serviços</Link>
      <Link href="/#agentes" onClick={() => setOpen(false)}>Corretores</Link>
      <Link href="/#sobre" onClick={() => setOpen(false)}>Sobre</Link>
      <Link href="/#contato" onClick={() => setOpen(false)}>Contato</Link>
      <Link href="/admin" className="nav-admin">Área do corretor</Link>
    </nav>
    <button className="menu" onClick={() => setOpen(!open)} aria-label="Abrir menu">{open ? <X /> : <Menu />}</button>
  </header>;
}
