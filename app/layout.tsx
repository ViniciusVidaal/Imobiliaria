import type { Metadata } from "next"; import { Manrope, Cormorant_Garamond } from "next/font/google"; import "./globals.css"; import "./brand.css";
const inter=Manrope({subsets:["latin"],variable:"--font-sans"}); const playfair=Cormorant_Garamond({subsets:["latin"],variable:"--font-display",weight:["500","600","700"]});
export const metadata:Metadata={title:"AL7 Imóveis | Brasília e região",description:"Imóveis selecionados e assessoria imobiliária com mais de 30 anos de experiência."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body className={`${inter.variable} ${playfair.variable}`}><div className="scroll-progress"/>{children}</body></html>}
