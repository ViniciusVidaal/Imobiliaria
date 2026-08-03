import type { Metadata } from "next"; import { Inter, Playfair_Display } from "next/font/google"; import "./globals.css";
const inter=Inter({subsets:["latin"],variable:"--font-sans"}); const playfair=Playfair_Display({subsets:["latin"],variable:"--font-display"});
export const metadata:Metadata={title:"AL7 Imóveis | Brasília e região",description:"Imóveis selecionados e assessoria imobiliária com mais de 30 anos de experiência."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body className={`${inter.variable} ${playfair.variable}`}><div className="scroll-progress"/>{children}</body></html>}
