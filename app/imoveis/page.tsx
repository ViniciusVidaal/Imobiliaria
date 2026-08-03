"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { PropertyCard } from "@/components/PropertyCard";
import { SearchBox } from "@/components/SearchBox";
import { Fabs } from "@/components/Fabs";
import { subscribeProperties } from "@/lib/properties";
import type { Property } from "@/lib/types";

function PropertiesContent() {
  const params = useSearchParams();
  const [items, setItems] = useState<Property[]>([]);
  useEffect(() => subscribeProperties(setItems), []);
  const filtered = useMemo(() => items.filter((property) => {
    const keyword = params.get("keyword")?.toLowerCase();
    const min = Number(params.get("min") || 0);
    const max = Number(params.get("max") || Infinity);
    return !property.sold &&
      (!params.get("transaction") || property.transaction === params.get("transaction")) &&
      (!params.get("type") || property.type === params.get("type")) &&
      (!params.get("location") || property.location === params.get("location")) &&
      (!keyword || `${property.title} ${property.description}`.toLowerCase().includes(keyword)) &&
      property.price >= min && property.price <= max;
  }), [items, params]);
  return <><Header/><main className="listing-page"><div className="listing-hero"><span className="eyebrow">Curadoria AL7</span><h1>Encontre o imóvel <em>ideal para você.</em></h1></div><div className="listing-search"><SearchBox/></div><section className="section"><div className="listing-title"><h2>{filtered.length} imóveis encontrados</h2></div><div className="property-grid">{filtered.map((property) => <PropertyCard key={property.id} property={property}/>)}</div>{!filtered.length && <p className="empty-state">Nenhum imóvel corresponde aos filtros. Tente ampliar sua busca.</p>}</section></main><Fabs/></>;
}

export default function PropertiesPage() {
  return <Suspense fallback={<div className="detail-loading">Carregando imóveis...</div>}><PropertiesContent/></Suspense>;
}
