import Image from "next/image";

export function Logo({ large = false }: { light?: boolean; large?: boolean }) {
  return <span className={`al7-logo ${large ? "is-large" : ""}`}><Image src="/images/imgi_12_IMG_0169.png" alt="AL7 Imóveis" fill priority sizes={large ? "190px" : "120px"} /></span>;
}
