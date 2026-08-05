import { expect, test, type Page } from "@playwright/test";

const types = ["Terreno", "Casa", "Loja comercial", "Apartamento", "Apartamento duplex", "Fazenda", "Chácara"];

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test("home abre sem erros graves e sem rolagem lateral", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /O imóvel certo/i })).toBeVisible();
  await expect(page.locator(".search-box")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test("busca vazia mostra orientação e não navega", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Buscar imóveis/i }).click();
  await expect(page.locator(".search-notice")).toContainText("Selecione quartos");
  await expect(page).toHaveURL(/\/$/);
});

for (const bedrooms of ["1", "2", "3", "4+"]) {
  test(`busca por quartos: ${bedrooms}`, async ({ page }) => {
    await page.goto("/");
    await page.locator('select[name="bedrooms"]').selectOption(bedrooms);
    await page.getByRole("button", { name: /Buscar imóveis/i }).click();
    await expect(page).toHaveURL(/\/imoveis\?/);
    expect(new URL(page.url()).searchParams.get("bedrooms")).toBe(bedrooms);
    await expect(page.locator(".listing-page")).toBeVisible();
  });
}

for (const type of types) {
  test(`busca pelo tipo: ${type}`, async ({ page }) => {
    await page.goto("/");
    await page.locator('select[name="type"]').selectOption({ label: type });
    await page.getByRole("button", { name: /Buscar imóveis/i }).click();
    await expect(page).toHaveURL(/\/imoveis\?/);
    expect(new URL(page.url()).searchParams.get("type")).toBe(type);
  });
}

test("localizações oficiais estão disponíveis sem duplicação", async ({ page }) => {
  await page.goto("/");
  const values = await page.locator('select[name="location"] option').evaluateAll((options) => options.slice(1).map((option) => (option as HTMLOptionElement).value));
  expect(values.length).toBeGreaterThanOrEqual(38);
  expect(new Set(values).size).toBe(values.length);
  expect(values).toContain("Grande Colorado, Distrito Federal, Brasília");
  expect(values).toContain("Setor de Mansões, Distrito Federal, Brasília");
  expect(values).toContain("Águas Lindas de Goiás, Goiás");
});

test("preço é enviado como número utilizável", async ({ page }) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Preço até" });
  await input.fill("1000000");
  await expect(input).toHaveValue("R$ 1.000.000");
  await page.getByRole("button", { name: /Buscar imóveis/i }).click();
  await expect(page).toHaveURL(/\/imoveis\?/);
  expect(new URL(page.url()).searchParams.get("max")).toBe("1000000");
});

test("combinação de filtros mantém todos os critérios", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel(/Alugar/i).check();
  await page.locator('select[name="bedrooms"]').selectOption("2");
  await page.locator('select[name="type"]').selectOption("Apartamento");
  await page.locator('select[name="location"]').selectOption("Águas Claras, Distrito Federal, Brasília");
  await page.getByRole("button", { name: /Buscar imóveis/i }).click();
  await expect(page).toHaveURL(/\/imoveis\?/);
  const params = new URL(page.url()).searchParams;
  expect(params.get("transaction")).toBe("Locação");
  expect(params.get("bedrooms")).toBe("2");
  expect(params.get("type")).toBe("Apartamento");
  expect(params.get("location")).toBe("Águas Claras, Distrito Federal, Brasília");
});

test("cartão abre detalhe e modal de visita valida campos", async ({ page }) => {
  await page.goto("/");
  const card = page.locator(".property-card").first();
  await expect(card).toBeVisible();
  await card.getByRole("link", { name: /Ver detalhes/i }).click();
  await expect(page.locator(".detail-page")).toBeVisible();
  await expect(page.locator(".detail-code")).toContainText("Código do imóvel");
  await page.getByRole("button", { name: /Solicitar visita/i }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: /Enviar pelo WhatsApp/i }).click();
  expect(await page.locator('.visit-modal input:invalid').count()).toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("imóvel inexistente mostra estado amigável", async ({ page }) => {
  await page.goto("/imovel/este-imovel-nao-existe-qa");
  await expect(page.getByRole("heading", { name: "Imóvel não encontrado" })).toBeVisible();
});

test("catálogo usa duas colunas no mobile", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Teste exclusivo do mobile");
  await page.goto("/imoveis?type=Casa");
  const columns = await page.locator(".property-grid").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
  expect(columns).toBe(2);
  await expectNoHorizontalOverflow(page);
});
