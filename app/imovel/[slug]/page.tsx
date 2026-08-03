"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Bath, Bed, BedDouble, CalendarDays, CarFront, MapPin, Maximize, MessageCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Fabs } from "@/components/Fabs";
import { PropertyGallery } from "@/components/PropertyGallery";
import { subscribeProperties } from "@/lib/properties";
import { money } from "@/lib/constants";
import type { Property } from "@/lib/types";

export default function PropertyPage() {
  const { slug } = useParams<{ slug: string }>();
  const [property, setProperty] = useState<Property | null>();

  useEffect(() => subscribeProperties((items) => setProperty(items.find((item) => item.slug === slug || item.id === slug) || null)), [slug]);

  if (property === undefined) return <div className="detail-loading">Carregando imóvel...</div>;
  if (!property) return <><Header /><div className="detail-loading"><h1>Imóvel não encontrado</h1><p>Este anúncio pode ter sido removido ou vendido.</p></div></>;

  const photos = property.images?.length ? property.images : ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1800&q=85"];

  return <>
    <Header />
    <main className="detail-page">
      <section className="detail-heading">
        <div>
          <span>{property.type} · {property.transaction}</span>
          <h1>{property.title}</h1>
          <p><MapPin /> {property.address || property.location}</p>
        </div>
      </section>

      <PropertyGallery photos={photos} title={property.title} />

      <section className="detail-content">
        <article>
          <div className="features">
            <span><BedDouble /><b>{property.bedrooms}</b> quartos</span>
            <span><Bath /><b>{property.bathrooms}</b> banheiros</span>
            {!!property.suites && property.suites > 0 && <span><Bed /><b>{property.suites}</b> suítes</span>}
            <span><CarFront /><b>{property.parking}</b> vagas</span>
            <span><Maximize /><b>{property.area}</b> m²</span>
          </div>

          <div className="detail-price">
            <small>{property.sold ? "Status do imóvel" : "Valor do imóvel"}</small>
            <strong>{property.sold ? "Imóvel vendido" : money(property.price)}</strong>
          </div>

          <div className="detail-primary-actions">
            <button className="btn primary"><MessageCircle /> Falar com um agente</button>
            <button className="btn visit"><CalendarDays /> Solicitar visita</button>
          </div>

          <h2>Sobre este imóvel</h2>
          <p>{property.description}</p>
        </article>

        <aside>
          <span>Gostou deste imóvel?</span>
          <h2>Agende uma visita.</h2>
          <p>Nossa equipe entra em contato para esclarecer suas dúvidas e encontrar o melhor horário.</p>
          <button className="btn primary"><CalendarDays /> Solicitar uma visita</button>
          <small>Código do imóvel: {property.id.slice(0, 8).toUpperCase()}</small>
        </aside>
      </section>
    </main>
    <Fabs />
  </>;
}
