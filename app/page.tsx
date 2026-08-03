import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, Handshake, Instagram, KeyRound, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { Header } from "@/components/Header";
import { SearchBox } from "@/components/SearchBox";
import { LiveProperties } from "@/components/LiveProperties";
import { Preloader } from "@/components/Preloader";
import { Fabs } from "@/components/Fabs";
import { Animations } from "@/components/Animations";
import { Logo } from "@/components/Logo";
import { Testimonials } from "@/components/Testimonials";

const agents = [
  { name: "Alex Alane", creci: "6713 DF", specialty: "Avaliador de imóveis", cnai: "36877", img: "/images/imgi_21_imgi_1_409025321_316751504512405_2749448995655283148_n-300x300.png" },
  { name: "Matheus Medeiros", creci: "26776 DF", specialty: "Avaliador e perito de imóveis", cnai: "36725", img: "/images/imgi_4_matheus-scaled-rcvgp49zk48m0dcp6uhnqgucv5g9zxsw8uauufvw0w.jpg" },
  { name: "Bruno Gonçalves", creci: "31301 DF", specialty: "Consultor imobiliário", img: "/images/imgi_5_bruno-rcvgo4k7zz90l79s85ncfydxeiz7upi93b9x24sioo.jpg" },
  { name: "Lucas Moraes", creci: "31864 DF", specialty: "Consultor imobiliário", img: "/images/imgi_6_imgi_1_409025321_316751504512405_2749448995655283148_n.png" },
  { name: "Andrey Martins", creci: "32903 DF", specialty: "Consultor imobiliário", img: "/images/imgi_7_IMG-20251008-WA00181.jpg" },
  { name: "Patriciana Lins", creci: "31301 DF", specialty: "Consultora imobiliária", img: "/images/imgi_8_Imagem-do-WhatsApp-de-2025-10-08-as-13.11.20_f93afaa6-rcycpotu8puqssh1cs8al72kond2j4x1uc1s7iqab4.jpg" },
  { name: "Lindomar Santana", creci: "27349 DF", specialty: "Consultor imobiliário", img: "/images/imgi_25_imgi_1_278640689_378898594127778_5358439042944636508_n-1024x1024.png" },
  { name: "Hingrid Caixeta", creci: "31301 DF", specialty: "Consultora imobiliária", img: "/images/imgi_10_IMG-20251028-WA00891-rdvfik1jh0c4pahstw4rc3zg9ffjhs3ju8wu7jyiys.jpg" },
];

export default function Home() {
  return <><Preloader/><Animations/><Header/><main>
    <section className="hero">
      <div className="hero-bg"><Image src="/images/imgi_46_IMG_1143-1-scaled.jpg" alt="Equipe AL7 Imóveis em atendimento" fill priority sizes="100vw"/></div>
      <div className="hero-copy"><span className="eyebrow">AL7 Imóveis · Brasília e região</span><h1>O imóvel certo.<br/><em>A decisão segura.</em></h1><p>Compra, venda e locação com análise, transparência e acompanhamento do primeiro contato à entrega das chaves.</p><div className="hero-actions"><a href="#imoveis" className="btn light">Ver imóveis <ArrowRight/></a><a href="#contato" className="btn ghost">Falar com um especialista</a></div></div>
      <div className="hero-seal"><b>30+</b><span>anos conhecendo<br/>o mercado de Brasília.</span></div><SearchBox/>
    </section>

    <section className="metrics"><article className="metric"><strong>30+</strong><span>anos de experiência</span></article><article className="metric"><strong>700+</strong><span>clientes atendidos</span></article><article className="metric"><strong>411+</strong><span>negócios realizados</span></article><article className="metric"><strong>100%</strong><span>compromisso AL7</span></article></section>

    <section id="imoveis" className="section properties"><div className="section-head"><span className="eyebrow dark">Oportunidades selecionadas</span><h2>Imóveis em <em>destaque.</em></h2><p>Casas, apartamentos e terrenos em Brasília e região.</p></div><LiveProperties limit={6}/><div className="center"><Link href="/imoveis" className="btn outline">Ver todos os imóveis <ArrowRight/></Link></div></section>

    <section id="servicos" className="section dark-section"><div className="section-head"><span className="eyebrow">Soluções AL7</span><h2>Do anúncio <em>às chaves.</em></h2><p>Uma equipe para conduzir cada etapa com clareza.</p></div><div className="services"><article className="service-card"><Building2/><b>Venda e divulgação</b><p>Seu imóvel bem apresentado e conectado ao comprador certo.</p></article><article className="service-card"><KeyRound/><b>Compra e locação</b><p>Uma busca precisa, alinhada ao seu perfil e orçamento.</p></article><article className="service-card"><ShieldCheck/><b>Segurança documental</b><p>Análise cuidadosa para você negociar sem surpresas.</p></article><article className="service-card"><Handshake/><b>Avaliação imobiliária</b><p>Avaliações judiciais e extrajudiciais por especialistas.</p></article></div></section>

    <section id="sobre" className="section split"><div className="split-media"><Image src="/images/imgi_59_IMG_11061-scaled.jpg" alt="Escritório AL7 Imóveis" fill sizes="(max-width: 768px) 100vw, 50vw"/></div><div className="split-copy"><span className="eyebrow dark">Desde 1994</span><h2>Brasília é o nosso <em>endereço.</em></h2><p>Há mais de 30 anos, a AL7 ajuda famílias, investidores e proprietários a tomar decisões imobiliárias melhores. Sem pressão. Sem letra miúda. Com gente de verdade acompanhando tudo.</p><ul><li><BadgeCheck/> Corretores certificados</li><li><BadgeCheck/> Negociação transparente</li><li><BadgeCheck/> Suporte jurídico e documental</li></ul><a href="#contato" className="btn primary">Conhecer a AL7</a></div></section>

    <section id="agentes" className="section agents"><div className="section-head"><span className="eyebrow dark">Agentes em destaque</span><h2>Nosso <em>time.</em></h2><p>Profissionais preparados para orientar cada etapa da sua negociação.</p></div><div className="agent-grid">{agents.map((agent)=><article className="agent-card" key={agent.name}><div className="agent-photo"><Image src={agent.img} alt={agent.name} fill sizes="(max-width: 768px) 46vw, 25vw"/></div><div className="agent-info"><h3>{agent.name}</h3><span>CRECI: {agent.creci}</span><p>{agent.specialty}</p>{agent.cnai&&<small>CNAI: {agent.cnai}</small>}</div><div className="agent-social"><button aria-label={`Instagram de ${agent.name}`}><Instagram/></button><button aria-label={`WhatsApp de ${agent.name}`}><MessageCircle/></button></div><div className="agent-actions"><button><MessageCircle/> Falar</button><button><Phone/> Ligar</button></div></article>)}</div></section>

    <Testimonials />

    <section id="contato" className="contact"><div><span className="eyebrow">Atendimento AL7</span><h2>Qual imóvel você <em>procura?</em></h2></div><button className="btn light">Falar com a AL7 <ArrowRight/></button></section>
  </main><footer><Logo/><div><MapPin/> Brasília, Distrito Federal</div><small>© 2026 AL7 Imóveis</small></footer><Fabs/></>;
}
