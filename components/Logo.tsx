import Image from "next/image";
import { brand } from "@/config/brand";

export function Logo({ large = false }: { light?: boolean; large?: boolean }) {
  return <span className={`al7-logo ${large ? "is-large" : ""}`}><Image src={brand.logo.light} alt={brand.name} fill priority sizes={large ? "190px" : "120px"} /></span>;
}
