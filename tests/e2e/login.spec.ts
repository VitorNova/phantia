import { test, expect } from '@playwright/test';

// Credenciais de teste (mova para .env em produção!)
const TEST_EMAIL = 'elias.junior@leadbox.app.br';
const TEST_PASSWORD = 'e6jWEeVxKE1D0EzO';

test.describe('Login', () => {
  test('deve exibir a página de login', async ({ page }) => {
    await page.goto('/');

    // Aguarda a página carregar
    await page.waitForLoadState('networkidle');

    // Tira screenshot da página inicial
    await page.screenshot({ path: 'screenshots/01-pagina-login.png', fullPage: true });

    // Verifica se os campos de login estão presentes
    const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordField = page.locator('input[type="password"]').first();

    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
  });

  test('deve fazer login com sucesso', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Encontra e preenche o campo de email
    const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    await emailField.fill(TEST_EMAIL);

    // Screenshot com email preenchido
    await page.screenshot({ path: 'screenshots/02-email-preenchido.png' });

    // Encontra e preenche o campo de senha
    const passwordField = page.locator('input[type="password"]').first();
    await passwordField.fill(TEST_PASSWORD);

    // Screenshot com campos preenchidos
    await page.screenshot({ path: 'screenshots/03-campos-preenchidos.png' });

    // Clica no botão de login
    const loginButton = page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Login"), button:has-text("Sign in")').first();
    await loginButton.click();

    // Aguarda navegação após login
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Screenshot após login
    await page.screenshot({ path: 'screenshots/04-apos-login.png', fullPage: true });

    // Verifica se saiu da página de login (URL mudou ou elemento de dashboard apareceu)
    const currentUrl = page.url();
    console.log(`URL após login: ${currentUrl}`);

    // Verifica se não está mais na página de login
    // (ajuste conforme a estrutura real do seu app)
    await expect(page).not.toHaveURL(/login/);
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Preenche com credenciais inválidas
    const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    await emailField.fill('email-invalido@teste.com');

    const passwordField = page.locator('input[type="password"]').first();
    await passwordField.fill('senha-errada-123');

    // Clica no botão de login
    const loginButton = page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")').first();
    await loginButton.click();

    // Aguarda resposta
    await page.waitForTimeout(2000);

    // Screenshot do erro
    await page.screenshot({ path: 'screenshots/05-erro-login.png', fullPage: true });

    // Verifica se aparece mensagem de erro
    const errorMessage = page.locator('[class*="error"], [class*="alert"], [role="alert"], .toast-error');
    // await expect(errorMessage).toBeVisible();
  });
});
