"use client";
import { useEffect, useState } from "react";
export function Preloader() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 1400);
    return () => clearTimeout(t);
  }, []);
  return show ? (
    <div className="preloader">
      <div className="brand big">
        <span>AL</span>
        <b>7</b>
        <small>IMÓVEIS</small>
      </div>
      <p>Seja bem-vindo</p>
      <i>
        <em />
      </i>
    </div>
  ) : null;
}
