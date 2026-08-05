import { expect, test } from "@playwright/test";
import { normalizeStoredPropertyType, propertyTypeRequiresRooms } from "../../lib/property-form-rules";
import { normalizeWhatsappNumber, whatsappUrl } from "../../lib/contact";

for (const type of ["Terreno", "Lote", "Loja comercial", "Fazenda", "Sítio", "Chácara", "chacara"]) {
  test(`cômodos são opcionais para ${type}`, () => {
    expect(propertyTypeRequiresRooms(type)).toBe(false);
  });
}

for (const type of ["Casa", "Apartamento", "Apartamento duplex"]) {
  test(`cômodos são obrigatórios para ${type}`, () => {
    expect(propertyTypeRequiresRooms(type)).toBe(true);
  });
}

test("tipos antigos importados são convertidos para o padrão atual", () => {
  expect(normalizeStoredPropertyType("Lote")).toBe("Terreno");
  expect(normalizeStoredPropertyType("Sala comercial")).toBe("Loja comercial");
  expect(normalizeStoredPropertyType("Fazenda/Sítio")).toBe("Fazenda");
  expect(normalizeStoredPropertyType("chacara")).toBe("Chácara");
});

test("WhatsApp brasileiro recebe o código do país e preserva a mensagem", () => {
  expect(normalizeWhatsappNumber("(61) 99999-9999")).toBe("5561999999999");
  expect(whatsappUrl("Olá, gostaria de ajuda", "(61) 99999-9999")).toContain("https://wa.me/5561999999999?text=");
});
