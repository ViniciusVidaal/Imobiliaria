"use client";
import { useEffect, useState } from "react";
import { subscribeLatestProperties } from "@/lib/properties";
import type { Property } from "@/lib/types";
import { PropertyCard } from "./PropertyCard";

const fallback: Property[] = [
  { id:"demo-1", slug:"villela-carvalho-noroeste", title:"Villela e Carvalho — Noroeste", description:"Apartamento nascente e vazado, com acabamento excepcional.", transaction:"Compra", type:"Apartamento", location:"Sudoeste, distrito federa, brasilia", price:2890000, bedrooms:4, bathrooms:5, parking:3, area:242, images:["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1400&q=80"], featured:true, sold:false },
  { id:"demo-2", slug:"edificio-supremo-aguas-claras", title:"Edifício Supremo — Águas Claras", description:"Vista livre para o parque e planta ampla.", transaction:"Compra", type:"Apartamento", location:"Águas Claras, distrito federa, brasilia", price:1450000, bedrooms:4, bathrooms:4, parking:2, area:178, images:["https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1400&q=80"], featured:true, sold:false },
  { id:"demo-3", slug:"casa-contemporanea-lago-sul", title:"Casa contemporânea — Lago Sul", description:"Arquitetura autoral, jardim e piscina aquecida.", transaction:"Compra", type:"Casa", location:"Lago Sul, distrito federa, brasilia", price:5200000, bedrooms:5, bathrooms:7, parking:4, area:610, images:["https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1400&q=80"], featured:true, sold:false },
];

export function LiveProperties({ limit = 3 }: { limit?: number }) {
  const [items, setItems] = useState<Property[]>(fallback);
  useEffect(() => subscribeLatestProperties(limit, (properties) => {
    if (properties.length) setItems(properties);
  }), [limit]);
  return <div className="property-grid">{items.filter((property) => !property.sold).slice(0, limit).map((property) => <PropertyCard key={property.id} property={property}/>)}</div>;
}
