"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { PropertyCard } from "@/components/PropertyCard";
import { SearchBox } from "@/components/SearchBox";
import { Fabs } from "@/components/Fabs";
import { getPropertiesPage } from "@/lib/properties";
import type { Property } from "@/lib/types";

const PAGE_SIZE = 12;

function PropertiesContent() {
  const params = useSearchParams();
  const [items, setItems] = useState<Property[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPage = useCallback(async (nextCursor?: QueryDocumentSnapshot | null) => {
    setLoading(true);
    setError("");
    try {
      const page = await getPropertiesPage(PAGE_SIZE, nextCursor);
      setItems((current) => nextCursor ? [...current, ...page.items] : page.items);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch {
      setError("Não foi possível carregar os imóveis. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPage(null); }, [loadPage]);

  const filtered = useMemo(() => items.filter((property) => {
    const bedrooms = params.get("bedrooms");
    const max = Number(params.get("max") || Infinity);
    const matchesBedrooms = !bedrooms || (bedrooms === "4+" ? property.bedrooms >= 4 : property.bedrooms === Number(bedrooms));
    return !property.sold &&
      (!params.get("transaction") || property.transaction === params.get("transaction")) &&
      (!params.get("type") || property.type === params.get("type")) &&
      (!params.get("location") || property.location === params.get("location")) &&
      matchesBedrooms && property.price <= max;
  }), [items, params]);

  return <><Header/><main className="listing-page"><div className="listing-hero"><span className="eyebrow">Curadoria AL7</span><h1>Encontre o imóvel <em>ideal para você.</em></h1></div><div className="listing-search"><SearchBox/></div><section className="section"><div className="listing-title"><h2>{filtered.length} imóveis carregados</h2></div><div className="property-grid">{filtered.map((property) => <PropertyCard key={property.id} property={property}/>)}</div>{error && <p className="empty-state">{error}</p>}{!loading && !filtered.length && !error && <p className="empty-state">Nenhum imóvel corresponde aos filtros neste lote.</p>}{hasMore && <div className="center"><button className="btn primary" disabled={loading} onClick={() => void loadPage(cursor)}>{loading ? "Carregando..." : "Ver mais imóveis"}</button></div>}</section></main><Fabs/></>;
}

export default function PropertiesPage() {
  return <Suspense fallback={<div className="detail-loading">Carregando imóveis...</div>}><PropertiesContent/></Suspense>;
}
