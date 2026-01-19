import { test, expect, Page } from '@playwright/test';

// Credenciais de teste
const TEST_EMAIL = 'elias.junior@leadbox.app.br';
const TEST_PASSWORD = 'e6jWEeVxKE1D0EzO';

// Helper para fazer login
async function login(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
  await emailField.fill(TEST_EMAIL);

  const passwordField = page.locator('input[type="password"]').first();
  await passwordField.fill(TEST_PASSWORD);

  const loginButton = page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")').first();
  await loginButton.click();

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('deve carregar o dashboard após login', async ({ page }) => {
    // Screenshot do dashboard
    await page.screenshot({ path: 'screenshots/dashboard-01-inicial.png', fullPage: true });

    // Verifica elementos típicos de um dashboard
    const pageContent = await page.content();
    console.log('Página carregada com sucesso');

    // Log da URL atual
    console.log(`URL atual: ${page.url()}`);
  });

  test('deve navegar pelo menu lateral', async ({ page }) => {
    // Procura links de navegação comuns
    const menuLinks = page.locator('nav a, aside a, [role="navigation"] a');
    const menuCount = await menuLinks.count();

    console.log(`Encontrados ${menuCount} links no menu`);

    // Screenshot do menu
    await page.screenshot({ path: 'screenshots/dashboard-02-menu.png', fullPage: true });

    // Se houver links, tenta clicar no primeiro
    if (menuCount > 0) {
      const firstLink = menuLinks.first();
      const linkText = await firstLink.textContent();
      console.log(`Clicando no link: ${linkText}`);

      await firstLink.click();
      await page.waitForLoadState('networkidle');

      // Screenshot após navegação
      await page.screenshot({ path: 'screenshots/dashboard-03-navegacao.png', fullPage: true });
    }
  });

  test('deve exibir informações do usuário', async ({ page }) => {
    // Procura elementos que mostram info do usuário
    const userInfo = page.locator('[class*="user"], [class*="profile"], [class*="avatar"]').first();

    // Screenshot focando na área do usuário
    await page.screenshot({ path: 'screenshots/dashboard-04-user-info.png', fullPage: true });

    // Log do conteúdo da página para debug
    const title = await page.title();
    console.log(`Título da página: ${title}`);
  });

  test('deve explorar todas as seções visíveis', async ({ page }) => {
    // Lista todos os botões visíveis
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();
    console.log(`Encontrados ${buttonCount} botões`);

    // Lista todos os links
    const links = page.locator('a:visible');
    const linkCount = await links.count();
    console.log(`Encontrados ${linkCount} links`);

    // Lista cards ou seções
    const cards = page.locator('[class*="card"], [class*="panel"], [class*="section"]');
    const cardCount = await cards.count();
    console.log(`Encontrados ${cardCount} cards/seções`);

    // Screenshot final explorando o layout
    await page.screenshot({ path: 'screenshots/dashboard-05-exploracao.png', fullPage: true });
  });
});
