"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { AuditEntry, subscribeAudit } from "@/lib/admin";

export default function HistoryPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  useEffect(() => subscribeAudit(setEntries), []);
  return <section className="admin-panel history-page"><div className="admin-page-head"><div className="admin-head-icon"><History/></div><div><span>Auditoria</span><h1>Histórico de alterações</h1><p>Últimas 100 ações realizadas no painel.</p></div></div><div className="history-list">{entries.map((entry)=><article key={entry.id}><div className="history-dot"/><div><b>{entry.action}</b><p>{entry.details}</p><small>{entry.userName} · {entry.userEmail}</small></div><time>{entry.createdAt?.toDate?.().toLocaleString("pt-BR") || "Agora"}</time></article>)}</div>{!entries.length&&<div className="admin-empty"><History/><p>Nenhuma alteração registrada ainda.</p></div>}</section>;
}
