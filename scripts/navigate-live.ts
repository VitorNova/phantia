/**
 * Script de Navegação ao Vivo - Phantia Frontend
 *
 * Execute com: npx ts-node scripts/navigate-live.ts
 * Ou: npx playwright test scripts/navigate-live.ts --headed --timeout=0
 *
 * Este script abre o navegador e navega pelo frontend em tempo real,
 * permitindo que você veja cada ação sendo executada.
 */

import { chromium, Page } from 'playwright';
import * as readline from 'readline';

const BASE_URL = 'https://ia.phant.com.br';
const EMAIL = 'elias.junior@leadbox.app.br';
const PASSWORD = 'e6jWEeVxKE1D0EzO';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function log(message: string) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${message}`);
}

async function takeScreenshot(page: Page, name: string) {
  const filename = `screenshots/${name}-${Date.now()}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  log(`📸 Screenshot salvo: ${filename}`);
}

async function main() {
  log('🚀 Iniciando navegação ao vivo no Phantia...');
  log('');

  // Inicia o navegador em modo headed (visível)
  const browser = await chromium.launch({
    headless: false, // IMPORTANTE: false = você vê o navegador!
    slowMo: 500, // Adiciona delay para ver as ações
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    recordVideo: { dir: 'videos/' } // Grava vídeo da sessão
  });

  const page = await context.newPage();

  try {
    // ==========================================
    // ETAPA 1: Acessar a página de login
    // ==========================================
    log('📍 Navegando para ' + BASE_URL);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await sleep(1000);
    await takeScreenshot(page, '01-pagina-inicial');

    // ==========================================
    // ETAPA 2: Preencher email
    // ==========================================
    log('📝 Preenchendo email...');
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();

    if (await emailInput.isVisible()) {
      await emailInput.click();
      await sleep(300);
      await emailInput.fill(EMAIL);
      log(`✅ Email preenchido: ${EMAIL}`);
    } else {
      log('⚠️ Campo de email não encontrado, tentando alternativas...');
      // Tenta encontrar qualquer input de texto
      const inputs = await page.locator('input').all();
      log(`   Encontrados ${inputs.length} inputs na página`);
    }

    await sleep(500);
    await takeScreenshot(page, '02-email-preenchido');

    // ==========================================
    // ETAPA 3: Preencher senha
    // ==========================================
    log('🔑 Preenchendo senha...');
    const passwordInput = page.locator('input[type="password"]').first();

    if (await passwordInput.isVisible()) {
      await passwordInput.click();
      await sleep(300);
      await passwordInput.fill(PASSWORD);
      log('✅ Senha preenchida');
    } else {
      log('❌ Campo de senha não encontrado');
    }

    await sleep(500);
    await takeScreenshot(page, '03-campos-preenchidos');

    // ==========================================
    // ETAPA 4: Clicar no botão de login
    // ==========================================
    log('🔘 Procurando botão de login...');
    const loginButton = page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Login"), button:has-text("Sign")').first();

    if (await loginButton.isVisible()) {
      log('✅ Botão encontrado, clicando...');
      await loginButton.click();

      // Aguarda navegação
      log('⏳ Aguardando resposta do servidor...');
      await page.waitForLoadState('networkidle');
      await sleep(2000);

      log(`📍 URL atual: ${page.url()}`);
      await takeScreenshot(page, '04-apos-login');
    } else {
      log('❌ Botão de login não encontrado');

      // Lista todos os botões para debug
      const buttons = await page.locator('button').all();
      log(`   Encontrados ${buttons.length} botões na página:`);
      for (let i = 0; i < Math.min(buttons.length, 5); i++) {
        const text = await buttons[i].textContent();
        log(`   - Botão ${i + 1}: "${text?.trim()}"`);
      }
    }

    // ==========================================
    // ETAPA 5: Explorar o Dashboard
    // ==========================================
    log('');
    log('🔍 Explorando o dashboard...');
    await sleep(1000);

    // Lista elementos interativos
    const menuItems = await page.locator('nav a, aside a, [role="navigation"] a, .sidebar a').all();
    log(`📋 Encontrados ${menuItems.length} itens de menu`);

    // Tenta clicar em alguns itens do menu
    for (let i = 0; i < Math.min(menuItems.length, 3); i++) {
      const item = menuItems[i];
      const text = await item.textContent();

      if (text && text.trim()) {
        log(`   Clicando em: "${text.trim()}"...`);
        await item.click();
        await page.waitForLoadState('networkidle');
        await sleep(1000);
        await takeScreenshot(page, `05-menu-${i + 1}`);
      }
    }

    // ==========================================
    // ETAPA 6: Screenshot final
    // ==========================================
    log('');
    log('📊 Capturando estado final...');
    await takeScreenshot(page, '06-estado-final');

    // ==========================================
    // MANTER NAVEGADOR ABERTO
    // ==========================================
    log('');
    log('✨ Navegação concluída!');
    log('');
    log('🖥️  O navegador permanecerá aberto para você explorar.');
    log('   Pressione CTRL+C no terminal para fechar.');
    log('');
    log('📂 Screenshots salvos em: ./screenshots/');
    log('🎥 Vídeo salvo em: ./videos/');

    // Mantém o script rodando
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    await new Promise<void>((resolve) => {
      rl.question('Pressione ENTER para fechar o navegador...', () => {
        rl.close();
        resolve();
      });
    });

  } catch (error) {
    log(`❌ Erro: ${error}`);
    await takeScreenshot(page, 'error');
  } finally {
    await context.close();
    await browser.close();
    log('🔒 Navegador fechado');
  }
}

main().catch(console.error);
