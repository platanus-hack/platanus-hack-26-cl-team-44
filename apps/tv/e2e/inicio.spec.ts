// Inicio, elección de control, puntero (permanencia y ceja con Espacio) y navegación.
import { expect, test } from '@playwright/test';
import { aim, expectScreen, island, openTv, TVS, target } from './tv';

const TILE_NAMES = ['Hablar', 'Escribir', 'Mensajes', 'SOS', 'Apps', 'Juegos', 'Descansar', 'Ajustes'];

for (const tv of TVS) {
  test.describe(tv.name, () => {
    test('L1 L2 · elección de control inicial y modo mouse', async ({ page }) => {
      await openTv(page, tv, {}, { mouse: false });
      await expect(page.locator('#calTitle')).toHaveText('Elige tu control');
      const options = page.locator('#calBtns .control-option strong');
      await expect(options).toHaveText(['Nariz', 'Mirada con webcam', 'Mirada con iPhone', 'Mouse']);
      await page.locator('#calBtns [data-c="mouse"]').click();
      await expect(page.locator('#calib')).not.toHaveClass(/\bon\b/);
      await expect(island(page)).toHaveText('Modo demo: el mouse es la mirada');
    });

    test('L3 · Esc cierra la elección de control', async ({ page }) => {
      await openTv(page, tv, {}, { mouse: false });
      await page.keyboard.press('Escape');
      await expect(page.locator('#calib')).not.toHaveClass(/\bon\b/);
      await expectScreen(page, 'home');
    });

    test('I1 I4 I5 · Inicio muestra ocho tarjetas, la pista y el reloj', async ({ page }) => {
      await openTv(page, tv);
      await expectScreen(page, 'home');
      await expect(page.locator('#tiles .tile .lb')).toHaveText(TILE_NAMES);
      await expect(page.locator('#s-home .hint')).toContainText('Ceja elegir');
      await expect(page.locator('#s-home .hint')).toContainText('Mandíbula cuidados');
      await expect(page.locator('#s-home .status .screen-name')).toHaveText('Inicio');
      await expect(page.locator('#s-home .status .clock')).toHaveText(/^\d\d:\d\d$/);
    });

    test('C7 I5 P10 · clic directo navega y «‹ Inicio» y «‹ Volver» regresan', async ({ page }) => {
      await openTv(page, tv);
      await target(page, '#tiles', 'go:talk').click();
      await expectScreen(page, 'talk');
      await expect(page).toHaveURL(/#talk$/);
      await expect(page.locator('#s-talk .status .screen-name')).toHaveText('Hablar');
      await target(page, '#s-talk .status', 'go:home').click();
      await expectScreen(page, 'home');
      await target(page, '#tiles', 'go:settings').click();
      await expectScreen(page, 'settings');
      await target(page, '#s-settings .status', 'back').click();
      await expectScreen(page, 'home');
    });

    test('P1 P7 P9 G1 G2 · mirar una tarjeta la arma y Espacio (ceja) la elige', async ({ page }) => {
      await openTv(page, tv);
      await aim(page, '#tiles [data-act="go:settings"]');
      const tile = page.locator('#tiles [data-act="go:settings"]');
      await expect(tile).toHaveClass(/\bfocus\b/);
      await expect(tile).toHaveClass(/\barmed\b/);
      await page.keyboard.press('Space');
      await expectScreen(page, 'settings');
    });

    test('P8 S3 · en «Solo mirada» basta mantener el puntero', async ({ page }) => {
      await openTv(page, tv);
      await target(page, '#tiles', 'go:settings').click();
      await expectScreen(page, 'settings');
      const mode = target(page, '#sets', 'set:mode');
      await expect(mode.locator('.val')).toHaveText('Ceja');
      await mode.click();
      await expect(mode.locator('.val')).toHaveText('Solo mirada');
      await target(page, '#sets', 'go:home').click();
      await expectScreen(page, 'home');
      await page.mouse.move(5, 5);
      await aim(page, '#tiles [data-act="go:keyboard"]');
      await expectScreen(page, 'keyboard');
    });

    test('I2 · SOS se activa solo tras 2 s de mirada', async ({ page }) => {
      await openTv(page, tv);
      await aim(page, '#tiles [data-act="sos"]');
      await page.waitForTimeout(1200);
      await expect(page.locator('#alarm')).not.toHaveClass(/\bon\b/);
      await expect(page.locator('#alarm')).toHaveClass(/\bon\b/, { timeout: 4000 });
    });
  });
}
