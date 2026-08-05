import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

function localEnvironment() {
  return Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((line) => line && !line.startsWith("#") && line.includes("=")).map((line) => {
    const separator = line.indexOf("=");
    return [line.slice(0, separator), line.slice(separator + 1)];
  }));
}

const protectedRoutes = ["/admin", "/admin/imoveis", "/admin/usuarios", "/admin/historico", "/admin/imoveis/documento-inexistente/editar"];

for (const route of protectedRoutes) {
  test(`rota protegida exige login: ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole("heading", { name: "Painel administrativo" })).toBeVisible();
    await expect(page.locator(".admin-content")).toHaveCount(0);
  });
}

test("login inválido não libera o painel", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel("E-mail").fill("invasor@example.com");
  await page.getByLabel("Senha").fill("senha-incorreta-qa");
  await page.getByRole("button", { name: "Entrar no painel" }).click();
  await expect(page.getByText("E-mail ou senha inválidos.")).toBeVisible();
  await expect(page.locator(".admin-content")).toHaveCount(0);
});

test("APIs administrativas recusam usuário sem token", async ({ request }) => {
  const sign = await request.post("/api/cloudinary/sign", { data: {} });
  const cleanup = await request.post("/api/cloudinary/cleanup", { data: { urls: [] } });
  expect(sign.status()).toBe(401);
  expect(cleanup.status()).toBe(401);
});

test("conta Firebase sem perfil autorizado continua bloqueada no painel e no banco", async ({ page, request }) => {
  const environment = localEnvironment();
  const apiKey = environment.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = environment.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const email = `qa-sem-permissao-${Date.now()}@example.com`;
  const password = `Qa!${crypto.randomUUID()}9`;
  const signup = await request.post(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
    data: { email, password, returnSecureToken: true },
  });
  expect(signup.ok()).toBe(true);
  const account = await signup.json() as { idToken: string };

  try {
    const directWrite = await request.post(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/imoveis?documentId=qa-invasao-${Date.now()}`, {
      headers: { Authorization: `Bearer ${account.idToken}` },
      data: { fields: { title: { stringValue: "Tentativa QA sem autorização" } } },
    });
    expect(directWrite.status()).toBe(403);

    await page.goto("/admin");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar no painel" }).click();
    await expect(page.getByRole("heading", { name: "Usuário sem permissão" })).toBeVisible();
    await expect(page.locator(".admin-content")).toHaveCount(0);
  } finally {
    const removal = await request.post(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${apiKey}`, {
      data: { idToken: account.idToken },
    });
    expect(removal.ok()).toBe(true);
  }
});
