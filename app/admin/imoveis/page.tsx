"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Edit3, Eye, Home, MapPin, Search, Trash2, X } from "lucide-react";
import { money } from "@/lib/constants";
import { removeProperty, setSold, subscribeProperties } from "@/lib/properties";
import { addAudit } from "@/lib/admin";
import type { Property } from "@/lib/types";

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const propertyCode = (property: Property) => property.id.slice(0, 8).toUpperCase();
const neighborhood = (property: Property) => property.location.split(",")[0].trim();

export default function RegisteredPropertiesPage() {
  const [items, setItems] = useState<Property[]>([]);
  const [search, setSearch] = useState("");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  useEffect(() => subscribeProperties(setItems), []);

  const neighborhoods = useMemo(() => Array.from(new Set(items.map(neighborhood).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR")), [items]);
  const searchMatches = useMemo(() => {
    const term = normalize(search);
    if (!term) return [];
    return items.filter((property) => normalize(`${property.title} ${propertyCode(property)} ${property.id}`).includes(term)).slice(0, 7);
  }, [items, search]);
  const filteredItems = useMemo(() => {
    const term = normalize(search);
    return items.filter((property) => {
      const matchesText = !term || normalize(`${property.title} ${propertyCode(property)} ${property.id}`).includes(term);
      const matchesNeighborhood = !selectedNeighborhood || neighborhood(property) === selectedNeighborhood;
      return matchesText && matchesNeighborhood;
    });
  }, [items, search, selectedNeighborhood]);

  async function toggleSold(property: Property) {
    await setSold(property.id, !property.sold);
    await addAudit(property.sold ? "Imóvel reativado" : "Imóvel marcado como vendido", `${property.title} · Código ${propertyCode(property)}`);
  }
  async function remove(property: Property) {
    if (!confirm(`Excluir “${property.title}” permanentemente?`)) return;
    await removeProperty(property.id);
    await addAudit("Imóvel excluído", `${property.title} · Código ${propertyCode(property)}`);
  }
  function selectSuggestion(property: Property) {
    setSearch(property.title);
    setSearchFocused(false);
  }

  return <section className="admin-properties-page">
    <div className="admin-page-head"><div className="admin-head-icon"><Home/></div><div><span>Catálogo</span><h1>Imóveis cadastrados</h1><p>{filteredItems.length} de {items.length} imóvel(is) encontrado(s).</p></div><Link href="/admin" className="admin-btn">Cadastrar novo</Link></div>

    <div className="property-admin-filters">
      <div className="property-search-wrap">
        <label htmlFor="property-search">Buscar por título ou código</label>
        <div className="property-search-input"><Search/><input id="property-search" value={search} onChange={(event) => setSearch(event.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => window.setTimeout(() => setSearchFocused(false), 150)} placeholder="Digite o título ou código do imóvel" autoComplete="off"/>{search && <button type="button" onClick={() => setSearch("")} aria-label="Limpar busca"><X/></button>}</div>
        {searchFocused && search.trim() && <div className="property-search-suggestions">{searchMatches.map((property) => <button type="button" key={property.id} onMouseDown={() => selectSuggestion(property)}><span className="suggestion-image"><Image src={property.images?.[0] || "/images/imgi_46_IMG_1143-1-scaled.jpg"} alt="" fill sizes="64px"/></span><span><b>{property.title}</b><small>{money(property.price)} · Código {propertyCode(property)}</small></span></button>)}{!searchMatches.length && <p>Nenhum imóvel correspondente.</p>}</div>}
      </div>
      <label className="property-neighborhood-filter"><span>Filtrar por bairro</span><div><MapPin/><select value={selectedNeighborhood} onChange={(event) => setSelectedNeighborhood(event.target.value)}><option value="">Todos os bairros</option>{neighborhoods.map((item) => <option key={item} value={item}>{item}</option>)}</select></div></label>
    </div>

    <div className="admin-property-grid">{filteredItems.map((property)=><article className="admin-property-card" key={property.id}>
      <div className="admin-property-image"><Image src={property.images?.[0]||"/images/imgi_46_IMG_1143-1-scaled.jpg"} alt={property.title} fill sizes="(max-width: 700px) 50vw, 33vw"/><span>{property.sold?"Vendido":property.transaction}</span></div>
      <div className="admin-property-copy"><small>{property.type} · {neighborhood(property)}</small><h2>{property.title}</h2><strong>{money(property.price)}</strong><p>Código {propertyCode(property)}</p></div>
      <div className="admin-card-actions"><Link href={`/imovel/${property.slug||property.id}`} target="_blank" title="Ver no site"><Eye/></Link><Link href={`/admin/imoveis/${property.id}/editar`} title="Editar"><Edit3/></Link><button onClick={()=>toggleSold(property)} title={property.sold?"Reativar":"Marcar como vendido"}><CheckCircle2/></button><button className="danger" onClick={()=>remove(property)} title="Excluir"><Trash2/></button></div>
    </article>)}</div>
    {!filteredItems.length&&<div className="admin-empty"><Search/><h2>{items.length ? "Nenhum imóvel encontrado" : "Nenhum imóvel cadastrado"}</h2><p>{items.length ? "Tente outro título, código ou bairro." : "Cadastre o primeiro imóvel para começar."}</p>{!items.length&&<Link href="/admin" className="admin-btn">Cadastrar primeiro imóvel</Link>}</div>}
  </section>;
}
