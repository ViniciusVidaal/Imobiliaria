import { PROPERTY_TYPES } from "@/lib/constants";

const TYPES_WITH_OPTIONAL_ROOMS = new Set(["terreno", "lote", "loja comercial", "fazenda", "sitio", "chacara"]);

export function normalizePropertyType(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

export function propertyTypeRequiresRooms(value: string) {
  return !TYPES_WITH_OPTIONAL_ROOMS.has(normalizePropertyType(value));
}

export function normalizeStoredPropertyType(value: string) {
  const normalized = normalizePropertyType(value || "");
  if (["lote", "terreno"].includes(normalized)) return "Terreno";
  if (["loja", "loja comercial", "loja/ponto comercial", "sala comercial", "conjunto comercial/sala"].includes(normalized)) return "Loja comercial";
  if (["fazenda", "sitio", "fazenda/sitio"].includes(normalized)) return "Fazenda";
  if (normalized === "chacara") return "Chácara";
  return PROPERTY_TYPES.find((type) => normalizePropertyType(type) === normalized) || PROPERTY_TYPES[0];
}
