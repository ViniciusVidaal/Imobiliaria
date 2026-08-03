"use client";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
export function Preloader() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 1400);
    return () => clearTimeout(t);
  }, []);
  return show ? (
    <div className="preloader">
      <Logo light large />
      <p>Seja bem-vindo</p>
      <i>
        <em />
      </i>
    </div>
  ) : null;
}
