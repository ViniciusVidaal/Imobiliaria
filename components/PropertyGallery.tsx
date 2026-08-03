"use client";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { useEffect, useState } from "react";

export function PropertyGallery({ photos, title }: { photos: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const previous = () => setActive((current) => (current - 1 + photos.length) % photos.length);
  const next = () => setActive((current) => (current + 1) % photos.length);
  useEffect(() => {
    if (!expanded) return;
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
      if (event.key === "ArrowLeft") previous();
      if (event.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [expanded, photos.length]);
  return <section className="property-gallery"><div className="gallery-main"><Image src={photos[active]} alt={`${title} — foto ${active + 1}`} fill priority={active === 0} sizes="100vw"/>{photos.length > 1 && <><button className="gallery-arrow previous" onClick={previous} aria-label="Foto anterior"><ChevronLeft/></button><button className="gallery-arrow next" onClick={next} aria-label="Próxima foto"><ChevronRight/></button></>}<button className="gallery-expand" onClick={() => setExpanded(true)}><Expand/> Ver em tela cheia</button><span className="gallery-count">{active + 1} / {photos.length}</span></div><div className="gallery-thumbs">{photos.map((photo, index) => <button className={active === index ? "active" : ""} key={`${photo}-${index}`} onClick={() => setActive(index)} aria-label={`Abrir foto ${index + 1}`}><Image src={photo} alt="" fill loading="lazy" sizes="110px"/></button>)}</div>{expanded && <div className="gallery-lightbox" role="dialog" aria-modal="true" onClick={() => setExpanded(false)}><button className="lightbox-close" aria-label="Fechar">×</button><div onClick={(event) => event.stopPropagation()}><Image src={photos[active]} alt={`${title} — foto ${active + 1}`} fill sizes="100vw"/><button className="gallery-arrow previous" onClick={previous}><ChevronLeft/></button><button className="gallery-arrow next" onClick={next}><ChevronRight/></button><span>{active + 1} / {photos.length}</span></div></div>}</section>;
}
