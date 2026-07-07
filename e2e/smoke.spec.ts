import { test, expect } from '@playwright/test';

/**
 * Smoke test del flujo crítico.
 * Requiere credenciales de prueba en variables de entorno:
 *   E2E_USER_EMAIL, E2E_USER_PASSWORD
 */
test.describe('flujo crítico parroquial', () => {
  test.skip(
    !process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD,
    'Defina E2E_USER_EMAIL y E2E_USER_PASSWORD'
  );

  test('login y acceso al dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.E2E_USER_EMAIL!);
    await page.fill('input[type="password"]', process.env.E2E_USER_PASSWORD!);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 });
  });

  test('navegación a módulos principales', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.E2E_USER_EMAIL!);
    await page.fill('input[type="password"]', process.env.E2E_USER_PASSWORD!);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 });

    await page.goto('/personas');
    await expect(page.getByRole('heading', { name: /personas/i })).toBeVisible({
      timeout: 10_000,
    });

    await page.goto('/bautismos');
    await expect(page.getByRole('heading', { name: /bautismos/i })).toBeVisible({
      timeout: 10_000,
    });

    await page.goto('/constancias');
    await expect(page.getByRole('heading', { name: /constancias/i })).toBeVisible({
      timeout: 10_000,
    });
  });
});

test('página de login carga', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible();
});
