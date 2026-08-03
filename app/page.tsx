import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, Handshake, KeyRound, MapPin, MessageCircle, ShieldCheck, Star } from "lucide-react";
import { Header } from "@/components/Header";
import { SearchBox } from "@/components/SearchBox";
import { LiveProperties } from "@/components/LiveProperties";
import { Preloader } from "@/components/Preloader";
import { Fabs } from "@/components/Fabs";
import { Animations } from "@/components/Animations";

const agents = [
  { name: "Alex Alane", role: "Avaliador de imóveis · CRECI 6713 DF", img: "/images/imgi_21_imgi_1_409025321_316751504512405_2749448995655283148_n-300x300.png" },
  { name: "Matheus Medeiros", role: "Avaliador e perito · CRECI 26776 DF", img: "/images/imgi_4_matheus-scaled-rcvgp49zk48m0dcp6uhnqgucv5g9zxsw8uauufvw0w.jpg" },
  { name: "Bruno Gonçalves", role: "Consultor imobiliário · CRECI 31301 DF", img: "/images/imgi_5_bruno-rcvgo4k7zz90l79s85ncfydxeiz7upi93b9x24sioo.jpg" },
  { name: "Lucas Moraes", role: "Consultor imobiliário · CRECI 31864 DF", img: "/images/imgi_6_imgi_1_409025321_316751504512405_2749448995655283148_n.png" },
  { name: "Andrey Martins", role: "Consultor imobiliário · CRECI 32903 DF", img: "/images/imgi_7_IMG-20251008-WA00181.jpg" },
  { name: "Patriciana Lins", role: "Consultora imobiliária · CRECI 31301 DF", img: "/images/imgi_8_Imagem-do-WhatsApp-de-2025-10-08-as-13.11.20_f93afaa6-rcycpotu8puqssh1cs8al72kond2j4x1uc1s7iqab4.jpg" },
  { name: "Hingrid Caixeta", role: "Consultora imobiliária · CRECI 31301 DF", img: "/images/imgi_10_IMG-20251028-WA00891-rdvfik1jh0c4pahstw4rc3zg9ffjhs3ju8wu7jyiys.jpg" },
];

export default function Home() {
  return <><Preloader/><Animations/><Header/><main>
    <section className="hero">
      <div className="hero-bg"><Image src="/images/imgi_46_IMG_1143-1-scaled.jpg" alt="Equipe AL7 Imóveis em atendimento" fill priority sizes="100vw"/></div>
      <div className="hero-copy"><span className="eyebrow">Há mais de 30 anos em Brasília</span><h1>Experiência que transforma <em>sonhos em conquistas.</em></h1><p>Compra, venda, locação e avaliações com uma equipe íntegra, certificada e comprometida com cada decisão.</p><a href="#imoveis" className="btn light">Encontrar meu imóvel <ArrowRight/></a></div>
      <div className="hero-seal"><b>AL7</b><span>Confiança para<br/>decidir bem.</span></div><SearchBox/>
    </section>

    <section className="metrics"><article className="metric"><strong>30+</strong><span>anos de experiência</span></article><article className="metric"><strong>700+</strong><span>clientes atendidos</span></article><article className="metric"><strong>411+</strong><span>negócios realizados</span></article><article className="metric"><strong>100%</strong><span>compromisso AL7</span></article></section>

    <section id="imoveis" className="section properties"><div className="section-head"><span className="eyebrow dark">Seleção exclusiva</span><h2>Imóveis para viver <em>novas histórias.</em></h2><p>Oportunidades selecionadas em Brasília e região, apresentadas com clareza e acompanhamento especializado.</p></div><LiveProperties limit={6}/><div className="center"><Link href="/imoveis" className="btn outline">Explorar todos os imóveis <ArrowRight/></Link></div></section>

    <section id="servicos" className="section dark-section"><div className="section-head"><span className="eyebrow">Nossa atuação</span><h2>Estratégia e segurança em <em>cada negociação.</em></h2></div><div className="services"><article className="service-card"><Building2/><b>Divulgação de alto nível</b><p>Apresentação profissional para posicionar seu imóvel diante do público certo.</p></article><article className="service-card"><KeyRound/><b>Busca personalizada</b><p>Curadoria alinhada ao seu momento, objetivos e estilo de vida.</p></article><article className="service-card"><ShieldCheck/><b>Seleção exclusiva</b><p>Documentação analisada e oportunidades qualificadas para uma decisão segura.</p></article><article className="service-card"><Handshake/><b>Avaliações especializadas</b><p>Avaliações judiciais e extrajudiciais conduzidas por profissionais certificados.</p></article></div></section>

    <section id="sobre" className="section split"><div className="split-media"><Image src="/images/imgi_59_IMG_11061-scaled.jpg" alt="Escritório AL7 Imóveis" fill sizes="(max-width: 768px) 100vw, 50vw"/></div><div className="split-copy"><span className="eyebrow dark">Sobre a AL7</span><h2>Conhecimento local. <em>Atendimento humano.</em></h2><p>Na AL7 Imóveis, cada negociação começa pela escuta. Reunimos experiência, leitura de mercado e acompanhamento próximo para conectar pessoas a imóveis que realmente fazem sentido.</p><ul><li><BadgeCheck/> Equipe certificada e qualificada</li><li><BadgeCheck/> Transparência em todas as etapas</li><li><BadgeCheck/> Suporte jurídico e documental</li></ul><a href="#contato" className="btn primary">Falar com um especialista</a></div></section>

    <section id="agentes" className="section agents"><div className="section-head"><span className="eyebrow dark">Especialistas AL7</span><h2>Uma equipe preparada para <em>cuidar da sua decisão.</em></h2></div><div className="agent-grid">{agents.map((agent)=><article className="agent-card" key={agent.name}><div><Image src={agent.img} alt={agent.name} fill sizes="(max-width: 768px) 100vw, 25vw"/></div><span>{agent.role}</span><h3>{agent.name}</h3><button><MessageCircle/> Falar com o corretor</button></article>)}</div></section>

    <section className="section testimonials"><div className="section-head"><span className="eyebrow dark">Quem escolheu a AL7</span><h2>Confiança construída em <em>resultados reais.</em></h2></div><div className="testimonial"><div>{[1,2,3,4,5].map((item)=><Star key={item} fill="currentColor"/>)}</div><blockquote>“Atendimento transparente, rápido e muito cuidadoso. Encontramos o imóvel certo e tivemos segurança do início ao fim.”</blockquote><b>Cliente AL7 Imóveis</b><span>Brasília · Distrito Federal</span></div><div className="dots"><i className="active"/><i/><i/></div></section>

    <section id="contato" className="contact"><div><span className="eyebrow">Seu próximo imóvel começa aqui</span><h2>Vamos conversar sobre o que <em>você procura?</em></h2></div><button className="btn light">Falar com a AL7 <ArrowRight/></button></section>
  </main><footer><div className="footer-logo"><Image src="/images/imgi_12_IMG_0169.png" alt="AL7 Imóveis" width={150} height={150}/></div><p>Conectando pessoas a imóveis que transformam vidas.</p><div><MapPin/> Brasília, Distrito Federal</div><small>© 2026 AL7 Imóveis. Todos os direitos reservados.</small></footer><Fabs/></>;
}
