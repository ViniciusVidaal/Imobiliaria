/**
 * Identidade central do site. Este arquivo pode ficar no Git porque contém
 * somente dados públicos. Credenciais continuam no .env.local e na Vercel.
 */
export const brand = {
  name: "AL7 Imóveis",
  shortName: "AL7",
  managementName: "AL7 Gestão",
  tagline: "O imóvel certo. A decisão segura.",
  region: "Brasília e região",
  location: "Brasília, Distrito Federal",
  foundedYear: 1994,
  logo: {
    light: "/images/logo-al7-branca-transparente.png",
    dark: "/images/logo-al7-transparente.png",
  },
  colors: {
    primary: "#d7192d",
    dark: "#071f2b",
    background: "#f5f5f2",
    muted: "#526671",
  },
  contact: {
    whatsapp: "5561992866415",
    phone: "",
    email: "",
    instagram: "",
  },
  seo: {
    title: "AL7 Imóveis | Brasília e região",
    description: "Compra, venda e locação de imóveis em Brasília e região.",
  },
} as const;

export type Brand = typeof brand;
