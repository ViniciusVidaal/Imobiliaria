import type { Metadata } from "next";
import { Inter_Tight, Manrope } from "next/font/google";
import "./globals.css";
import "./brand.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "AL7 Imóveis | Brasília e região",
  description: "Compra, venda e locação de imóveis com mais de 30 anos de experiência em Brasília.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body className={`${manrope.variable} ${interTight.variable}`}><div className="scroll-progress" />{children}</body></html>;
}
