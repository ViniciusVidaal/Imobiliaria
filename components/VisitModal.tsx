"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Send, X } from "lucide-react";
import { whatsappUrl } from "@/lib/contact";

interface VisitModalProps {
  open: boolean;
  propertyTitle: string;
  propertyCode: string;
  onClose: () => void;
}

function today() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function VisitModal({ open, propertyTitle, propertyCode, onClose }: VisitModalProps) {
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSent(false);
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const rawDate = String(data.get("date"));
    const formattedDate = rawDate.split("-").reverse().join("/");
    const message = [
      "Olá! Gostaria de solicitar uma visita.",
      "",
      `Imóvel: ${propertyTitle}`,
      `Código: ${propertyCode}`,
      `Nome: ${data.get("name")}`,
      `Telefone: ${data.get("phone")}`,
      `Data desejada: ${formattedDate}`,
      `Horário desejado: ${data.get("time")}`,
      data.get("message") ? `Mensagem: ${data.get("message")}` : "",
    ].filter(Boolean).join("\n");

    window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
    setSent(true);
  }

  return <div className="visit-overlay" onMouseDown={onClose} role="presentation">
    <div className="visit-modal" role="dialog" aria-modal="true" aria-labelledby="visit-title" onMouseDown={(event) => event.stopPropagation()}>
      <button className="visit-close" type="button" onClick={onClose} aria-label="Fechar formulário"><X /></button>
      {sent ? <div className="visit-success">
        <CheckCircle2 />
        <span>Solicitação enviada</span>
        <h2>Obrigado por agendar sua visita!</h2>
        <p>O WhatsApp foi aberto com os dados preenchidos. Envie a mensagem para que a equipe AL7 confirme o horário.</p>
        <button className="btn primary" type="button" onClick={onClose}>Voltar ao imóvel</button>
      </div> : <>
        <p className="visit-intro" id="visit-title">Escolha o melhor dia e horário. Nossa equipe confirmará a disponibilidade pelo WhatsApp.</p>
        <form onSubmit={submit}>
          <label>Nome<input name="name" type="text" placeholder="Seu nome completo" autoComplete="name" required /></label>
          <label>Telefone<input name="phone" type="tel" placeholder="(61) 99999-9999" autoComplete="tel" required /></label>
          <div className="visit-row">
            <label>Data<input name="date" type="date" min={today()} required /></label>
            <label>Hora<input name="time" type="text" inputMode="numeric" maxLength={5} placeholder="00:00" pattern="([01][0-9]|2[0-3]):[0-5][0-9]" title="Informe um horário válido no formato HH:MM" onInput={(event) => { const input = event.currentTarget; const digits = input.value.replace(/\D/g, "").slice(0, 4); input.value = digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits; }} required /></label>
          </div>
          <label>Mensagem <small>opcional</small><textarea name="message" rows={3} placeholder="Conte algo que nossa equipe deva saber" /></label>
          <button className="visit-submit" type="submit"><Send /> Enviar pelo WhatsApp</button>
        </form>
      </>}
    </div>
  </div>;
}
