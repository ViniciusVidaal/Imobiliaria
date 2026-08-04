"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Edit3, Eye, Home, MapPin, Search, Trash2, X } from "lucide-react";
import { LOCATIONS, money } from "@/lib/constants";
import { removeProperty, setSold, subscribeProperties } from "@/lib/properties";
import { addAudit } from "@/lib/admin";
import type { Property } from "@/lib/types";
import { deleteCloudinaryImages } from "@/lib/upload";

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const propertyCode = (property: Property) => property.id.slice(0, 8).toUpperCase();
const neighborhood = (property: Property) => property.location.split(",")[0].trim();

export default function RegisteredPropertiesPage() {
  const [items, setItems] = useState<Property[]>([]);
  const [search, setSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  useEffect(() => subscribeProperties(setItems), []);

  const filteredItems = useMemo(() => {
    const term = normalize(search);
    return items.filter((property) => {
      const matchesText = !term || normalize(`${property.title} ${propertyCode(property)} ${property.id}`).includes(term);
      const matchesLocation = !selectedLocation || property.location === selectedLocation;
      return matchesText && matchesLocation;
    });
  }, [items, search, selectedLocation]);

  async function toggleSold(property: Property) {
    await setSold(property.id, !property.sold);
    await addAudit(property.sold ? "Imóvel reativado" : "Imóvel marcado como vendido", `${property.title} · Código ${propertyCode(property)}`).catch(() => undefined);
  }
  async function remove(property: Property) {
    if (!confirm(`Excluir “${property.title}” permanentemente?`)) return;
    try {
      await removeProperty(property.id);
      let cleanupError: unknown = null;
      try {
        await deleteCloudinaryImages(property.images || []);
      } catch (error) {
        cleanupError = error;
      }
      const auditAction = cleanupError ? "Imóvel excluído com alerta de imagens" : "Imóvel excluído";
      const auditDetails = `${property.title} · Código ${propertyCode(property)} · ${cleanupError instanceof Error ? cleanupError.message : "imagens removidas do Cloudinary"}`;
      await addAudit(auditAction, auditDetails).catch(() => undefined);
      if (cleanupError) {
        alert("O imóvel foi excluído do site, mas algumas imagens podem ter ficado no Cloudinary. Tente a limpeza novamente pelo suporte.");
      }
    } catch (error) {
      alert(`Não foi possível concluir a exclusão: ${error instanceof Error ? error.message : "erro inesperado"}`);
    }
  }
  return <section className="admin-properties-page">
    <div className="admin-page-head"><div className="admin-head-icon"><Home/></div><div><span>Catálogo</span><h1>Imóveis cadastrados</h1><p>{filteredItems.length} de {items.length} imóvel(is) encontrado(s).</p></div><Link href="/admin" className="admin-btn">Cadastrar novo</Link></div>

    <div className="property-admin-filters">
      <div className="property-search-wrap">
        <label htmlFor="property-search">Buscar por título ou código</label>
        <div className="property-search-input"><Search/><input id="property-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Digite o título ou código do imóvel" autoComplete="off"/>{search && <button type="button" onClick={() => setSearch("")} aria-label="Limpar busca"><X/></button>}</div>
      </div>
      <label className="property-neighborhood-filter"><span>Filtrar por localização</span><div><MapPin/><select value={selectedLocation} onChange={(event) => setSelectedLocation(event.target.value)}><option value="">Todas as localizações</option>{LOCATIONS.map((item) => <option key={item} value={item}>{item}</option>)}</select></div></label>
    </div>

    <div className="admin-property-grid">{filteredItems.map((property)=><article className="admin-property-card" key={property.id}>
      <div className="admin-property-image"><Image src={property.images?.[0]||"/images/imgi_46_IMG_1143-1-scaled.jpg"} alt={property.title} fill sizes="(max-width: 700px) 50vw, 33vw"/><span>{property.sold?"Vendido":property.transaction}</span></div>
      <div className="admin-property-copy"><small>{property.type} · {neighborhood(property)}</small><h2>{property.title}</h2><strong>{money(property.price)}</strong><p>Código {propertyCode(property)}</p></div>
      <div className="admin-card-actions"><Link href={`/imovel/${property.slug||property.id}`} target="_blank" title="Ver no site"><Eye/></Link><Link href={`/admin/imoveis/${property.id}/editar`} title="Editar"><Edit3/></Link><button onClick={()=>toggleSold(property)} title={property.sold?"Reativar":"Marcar como vendido"}><CheckCircle2/></button><button className="danger" onClick={()=>remove(property)} title="Excluir"><Trash2/></button></div>
    </article>)}</div>
    {!filteredItems.length&&<div className="admin-empty"><Search/><h2>{items.length ? "Nenhum imóvel encontrado" : "Nenhum imóvel cadastrado"}</h2><p>{items.length ? "Tente outro título, código ou localização." : "Cadastre o primeiro imóvel para começar."}</p>{!items.length&&<Link href="/admin" className="admin-btn">Cadastrar primeiro imóvel</Link>}</div>}
  </section>;
}
