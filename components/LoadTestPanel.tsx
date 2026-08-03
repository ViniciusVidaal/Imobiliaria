"use client";
import { Database, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Property } from "@/lib/types";
import {
  createLoadTestProperties,
  deleteLoadTestProperties,
} from "@/lib/load-test";

export function LoadTestPanel({ properties }: { properties: Property[] }) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const images = Array.from(
    new Set(properties.flatMap((property) => property.images || [])),
  );

  async function generate() {
    if (
      !confirm(
        "Gerar 200 imóveis de teste com 30 referências de fotos em cada um?",
      )
    )
      return;
    setBusy(true);
    setProgress(0);
    setMessage("Preparando catálogo de teste...");
    try {
      const total = await createLoadTestProperties(images, setProgress);
      setMessage(
        `${total} imóveis de teste criados. Abra a vitrine e teste os filtros e o botão Ver mais.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Falha ao gerar o teste.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function cleanup() {
    if (!confirm("Apagar somente os imóveis gerados pelo teste de carga?"))
      return;
    setBusy(true);
    setProgress(0);
    setMessage("Removendo dados de teste...");
    try {
      const total = await deleteLoadTestProperties(setProgress);
      setMessage(
        total
          ? `${total} imóveis de teste removidos.`
          : "Não existem imóveis de teste para remover.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Falha ao limpar o teste.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="load-test-panel">
      <div>
        <span>FERRAMENTA DE DIAGNÓSTICO</span>
        <h2>Teste de catálogo com 200 imóveis</h2>
        <p>
          Cria 200 anúncios marcados como teste, cada um com 30 fotos
          reutilizadas. Nenhum anúncio real é alterado.
        </p>
      </div>
      <div className="load-test-actions">
        <button className="admin-btn" disabled={busy} onClick={generate}>
          <Database /> Gerar teste
        </button>
        <button className="test-delete" disabled={busy} onClick={cleanup}>
          <Trash2 /> Apagar teste
        </button>
      </div>
      {(busy || progress > 0) && (
        <div className="test-progress">
          <i style={{ width: `${progress}%` }} />
          <span>{progress}%</span>
        </div>
      )}
      {message && <p className="notice">{message}</p>}
    </section>
  );
}
