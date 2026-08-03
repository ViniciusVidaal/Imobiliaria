"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { subscribeProperties } from "@/lib/properties";
import type { Property } from "@/lib/types";

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null | undefined>();
  useEffect(() => subscribeProperties((items)=>setProperty(items.find((item)=>item.id===id)||null)), [id]);
  if (property === undefined) return <div className="admin-empty">Carregando imóvel...</div>;
  if (!property) return <div className="admin-empty"><h1>Imóvel não encontrado</h1></div>;
  return <PropertyForm property={property}/>;
}
