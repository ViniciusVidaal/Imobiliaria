import { whatsappUrl } from "@/lib/contact";
import { brand } from "@/config/brand";

function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12.04 2a9.84 9.84 0 0 0-8.5 14.78L2 22l5.35-1.5A9.92 9.92 0 1 0 12.04 2Zm0 17.98a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.18.89.85-3.1-.2-.32a8.08 8.08 0 1 1 6.96 3.84Zm4.44-6.06c-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.55.12-.16.25-.63.79-.77.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2a7.24 7.24 0 0 1-1.34-1.67c-.14-.24-.02-.37.1-.49.11-.11.24-.28.37-.42.12-.14.16-.24.24-.4.08-.17.04-.31-.02-.43-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.65.3-.22.25-.85.84-.85 2.04s.87 2.36 1 2.52c.12.16 1.72 2.63 4.17 3.69.58.25 1.04.4 1.39.51.58.19 1.12.16 1.54.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z"/></svg>;
}

export function Fabs() {
  return <div className="fabs"><a className="fab whatsapp" href={whatsappUrl(`Olá! Gostaria de falar com a equipe ${brand.name}.`)} target="_blank" rel="noreferrer" aria-label="Falar pelo WhatsApp"><WhatsAppIcon /></a></div>;
}
