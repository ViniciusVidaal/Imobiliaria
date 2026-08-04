"use client";

import { useEffect, useState } from "react";
import { Quote, Star } from "lucide-react";
import { brand } from "@/config/brand";

const testimonials = [
  { text: "Fomos atendidos com muita transparência. Encontramos o imóvel certo e tivemos segurança em todas as etapas.", name: "Mariana S.", context: "Compra de apartamento" },
  { text: "A equipe entendeu exatamente o que procurávamos e apresentou opções realmente compatíveis com a nossa família.", name: "Ricardo M.", context: "Compra de imóvel" },
  { text: "Meu imóvel foi bem apresentado, as visitas foram organizadas e a negociação aconteceu com muita clareza.", name: "Ana Paula R.", context: "Venda de imóvel" },
  { text: "O acompanhamento documental fez toda a diferença. Não tivemos surpresas e recebemos suporte até a entrega das chaves.", name: "Carlos E.", context: "Compra de casa" },
  { text: `Atendimento rápido, humano e sem pressão. A ${brand.shortName} tornou uma decisão importante muito mais tranquila.`, name: "Fernanda L.", context: "Locação residencial" },
  { text: "Conhecem Brasília de verdade. As orientações sobre localização e valorização foram essenciais para nossa escolha.", name: "Gustavo N.", context: "Investimento imobiliário" },
  { text: "Conseguimos vender com segurança e dentro do cenário que havia sido apresentado desde o início.", name: "Patrícia A.", context: "Venda de apartamento" },
  { text: "Equipe disponível, educada e muito preparada. Cada dúvida foi respondida com objetividade.", name: "Eduardo C.", context: "Compra de terreno" },
  { text: "A curadoria economizou nosso tempo. Visitamos apenas imóveis que realmente faziam sentido para nós.", name: "Juliana F.", context: "Busca personalizada" },
  { text: "Do primeiro contato ao contrato, sentimos que havia uma equipe cuidando de cada detalhe da negociação.", name: "Marcelo T.", context: "Locação comercial" },
];

export function Testimonials() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % testimonials.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

  const item = testimonials[active];
  return <section className="section testimonials" aria-label="Depoimentos de clientes">
    <div className="testimonials-intro">
      <span className="eyebrow dark">Depoimentos</span>
      <h2>Experiências que falam <em>por nós.</em></h2>
      <p>Histórias de quem contou com a {brand.shortName} para comprar, vender ou alugar com tranquilidade.</p>
    </div>
    <div className="testimonial-stage" aria-live="polite">
      <Quote className="quote-mark" />
      <div className="testimonial-stars">{[1,2,3,4,5].map((star) => <Star key={star} fill="currentColor" />)}</div>
      <blockquote>“{item.text}”</blockquote>
      <div className="testimonial-author"><b>{item.name}</b><span>{item.context} · Brasília</span></div>
      <span className="testimonial-number">{String(active + 1).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}</span>
    </div>
    <div className="testimonial-dots" aria-label="Escolher depoimento">{testimonials.map((_, index) => <button key={index} className={index === active ? "active" : ""} onClick={() => setActive(index)} aria-label={`Ver depoimento ${index + 1}`} aria-current={index === active ? "true" : undefined} />)}</div>
  </section>;
}
