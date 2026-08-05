"use client";

import { CheckCircle2 } from "lucide-react";

interface AdminSuccessModalProps {
  title: string;
  message: string;
  onClose: () => void;
}

export function AdminSuccessModal({ title, message, onClose }: AdminSuccessModalProps) {
  return <div className="unsaved-backdrop save-success-backdrop" role="presentation">
    <section className="unsaved-dialog save-success-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-success-title">
      <div className="save-success-icon"><CheckCircle2 /></div>
      <span>Operação concluída</span>
      <h2 id="admin-success-title">{title}</h2>
      <p>{message}</p>
      <div><button type="button" className="admin-btn" onClick={onClose}>Continuar</button></div>
    </section>
  </div>;
}
