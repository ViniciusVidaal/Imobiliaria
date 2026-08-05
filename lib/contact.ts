import { brand } from "@/config/brand";

export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || brand.contact.whatsapp).replace(/\D/g, "");

export function normalizeWhatsappNumber(number: string) {
  const digits = number.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
}

export function whatsappUrl(message: string, number?: string) {
  const destination = normalizeWhatsappNumber(number || WHATSAPP_NUMBER) || WHATSAPP_NUMBER;
  return `https://wa.me/${destination}?text=${encodeURIComponent(message)}`;
}
