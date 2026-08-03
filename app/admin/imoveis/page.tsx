"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Edit3, Eye, Home, Trash2 } from "lucide-react";
import { money } from "@/lib/constants";
import { removeProperty, setSold, subscribeProperties } from "@/lib/properties";
import { addAudit } from "@/lib/admin";
import type { Property } from "@/lib/types";

export default function RegisteredPropertiesPage() {
  const [items, setItems] = useState<Property[]>([]);
  useEffect(() => subscribeProperties(setItems), []);

  async function toggleSold(property: Property) {
    await setSold(property.id, !property.sold);
    await addAudit(property.sold ? "Imóvel reativado" : "Imóvel marcado como vendido", `${property.title} · Código ${property.id.slice(0,8).toUpperCase()}`);
  }
  async function remove(property: Property) {
    if (!confirm(`Excluir “${property.title}” permanentemente?`)) return;
    await removeProperty(property.id);
    await addAudit("Imóvel excluído", `${property.title} · Código ${property.id.slice(0,8).toUpperCase()}`);
  }

  return <section className="admin-properties-page">
    <div className="admin-page-head"><div className="admin-head-icon"><Home/></div><div><span>Catálogo</span><h1>Imóveis cadastrados</h1><p>{items.length} imóvel(is) no banco de dados.</p></div><Link href="/admin" className="admin-btn">Cadastrar novo</Link></div>
    <div className="admin-property-grid">{items.map((property)=><article className="admin-property-card" key={property.id}>
      <div className="admin-property-image"><Image src={property.images?.[0]||"/images/imgi_46_IMG_1143-1-scaled.jpg"} alt={property.title} fill sizes="(max-width: 700px) 50vw, 33vw"/><span>{property.sold?"Vendido":property.transaction}</span></div>
      <div className="admin-property-copy"><small>{property.type} · {property.location.split(",")[0]}</small><h2>{property.title}</h2><strong>{money(property.price)}</strong><p>Código {property.id.slice(0,8).toUpperCase()}</p></div>
      <div className="admin-card-actions"><Link href={`/imovel/${property.slug||property.id}`} target="_blank" title="Ver no site"><Eye/></Link><Link href={`/admin/imoveis/${property.id}/editar`} title="Editar"><Edit3/></Link><button onClick={()=>toggleSold(property)} title={property.sold?"Reativar":"Marcar como vendido"}><CheckCircle2/></button><button className="danger" onClick={()=>remove(property)} title="Excluir"><Trash2/></button></div>
    </article>)}</div>
    {!items.length&&<div className="admin-empty"><Home/><h2>Nenhum imóvel cadastrado</h2><Link href="/admin" className="admin-btn">Cadastrar primeiro imóvel</Link></div>}
  </section>;
}
