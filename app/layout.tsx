import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Inter_Tight, Manrope } from "next/font/google";
import { brand } from "@/config/brand";
import "./globals.css";
import "./brand.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: brand.seo.title,
  description: brand.seo.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const brandStyle = { "--ink": brand.colors.dark, "--cream": brand.colors.background, "--red": brand.colors.primary, "--gold": brand.colors.primary, "--sage": brand.colors.muted } as CSSProperties;
  return <html lang="pt-BR"><body className={`${manrope.variable} ${interTight.variable}`} style={brandStyle}><div className="scroll-progress" />{children}</body></html>;
}
