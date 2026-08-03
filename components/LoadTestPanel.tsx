"use client";
import { CloudUpload, Database, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Property } from "@/lib/types";
import {
  createLoadTestProperties,
  deleteLoadTestProperties,
} from "@/lib/load-test";
import {
  cleanupCloudinaryLoadTest,
  runCloudinaryLoadTest,
} from "@/lib/cloudinary-load-test";

export function LoadTestPanel({ properties }: { properties: Property[] }) {
  const [busy, setBusy] = useState<"catalog" | "cloudinary" | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const images = Array.from(
    new Set(properties.flatMap((property) => property.images || [])),
  );
  const start = (mode: "catalog" | "cloudinary", initialMessage: string) => {
    setBusy(mode);
    setProgress(0);
    setMessage(initialMessage);
  };
  const finishError = (error: unknown, fallback: string) => {
    setMessage(error instanceof Error ? error.message : fallback);
    setBusy(null);
  };

  async function generateCatalog() {
    if (
      !confirm(
        "Gerar 200 imóveis de teste com 30 referências de fotos em cada um?",
      )
    )
      return;
    start("catalog", "Preparando catálogo de teste...");
    try {
      const total = await createLoadTestProperties(images, setProgress);
      setMessage(
        `${total} imóveis de teste criados. Abra a vitrine e teste filtros e paginação.`,
      );
      setBusy(null);
    } catch (error) {
      finishError(error, "Falha ao gerar o teste.");
    }
  }

  async function cleanupCatalog() {
    if (!confirm("Apagar somente os imóveis gerados pelo teste de catálogo?"))
      return;
    start("catalog", "Removendo dados de teste...");
    try {
      const total = await deleteLoadTestProperties(setProgress);
      setMessage(
        total
          ? `${total} imóveis de teste removidos.`
          : "Não existem imóveis desse teste.",
      );
      setBusy(null);
    } catch (error) {
      finishError(error, "Falha ao limpar o teste.");
    }
  }

  async function generateCloudinary() {
    if (
      !confirm(
        "Enviar 300 imagens reais ao Cloudinary? O processo pode levar vários minutos. Mantenha esta aba aberta.",
      )
    )
      return;
    start("cloudinary", "Iniciando teste de 300 uploads...");
    try {
      await runCloudinaryLoadTest((percent, text) => {
        setProgress(percent);
        setMessage(text);
      });
      setBusy(null);
    } catch (error) {
      finishError(error, "Falha no teste de upload.");
    }
  }

  async function cleanupCloudinary() {
    if (
      !confirm(
        "Remover do Cloudinary todas as 300 imagens e os 10 imóveis desse teste?",
      )
    )
      return;
    start("cloudinary", "Iniciando limpeza...");
    try {
      await cleanupCloudinaryLoadTest((percent, text) => {
        setProgress(percent);
        setMessage(text);
      });
      setBusy(null);
    } catch (error) {
      finishError(error, "Falha ao limpar o teste do Cloudinary.");
    }
  }

  const progressBlock = (mode: "catalog" | "cloudinary") =>
    busy === mode && (
      <>
        <div className="test-progress">
          <i style={{ width: `${progress}%` }} />
          <span>{progress}%</span>
        </div>
        <p className="notice">{message}</p>
      </>
    );

  return (
    <div className="load-test-stack">
      <section className="load-test-panel">
        <div>
          <span>TESTE DO BANCO E INTERFACE</span>
          <h2>Catálogo com 200 imóveis</h2>
          <p>
            Cria 200 anúncios com 30 referências reutilizadas, sem gastar
            armazenamento.
          </p>
        </div>
        <div className="load-test-actions">
          <button
            className="admin-btn"
            disabled={!!busy}
            onClick={generateCatalog}
          >
            <Database /> Gerar 200
          </button>
          <button
            className="test-delete"
            disabled={!!busy}
            onClick={cleanupCatalog}
          >
            <Trash2 /> Apagar teste
          </button>
        </div>
        {progressBlock("catalog")}
      </section>
      <section className="load-test-panel cloudinary-test">
        <div>
          <span>TESTE REAL DE ARMAZENAMENTO</span>
          <h2>300 uploads no Cloudinary</h2>
          <p>
            Gera 300 WebPs únicos, envia ao Cloudinary e cria 10 imóveis com 30
            fotos. Mantenha a aba aberta.
          </p>
        </div>
        <div className="load-test-actions">
          <button
            className="admin-btn"
            disabled={!!busy}
            onClick={generateCloudinary}
          >
            <CloudUpload /> Enviar 300
          </button>
          <button
            className="test-delete"
            disabled={!!busy}
            onClick={cleanupCloudinary}
          >
            <Trash2 /> Limpar tudo
          </button>
        </div>
        {progressBlock("cloudinary")}
      </section>
      {!busy && message && (
        <p className="global-test-notice notice">{message}</p>
      )}
    </div>
  );
}
