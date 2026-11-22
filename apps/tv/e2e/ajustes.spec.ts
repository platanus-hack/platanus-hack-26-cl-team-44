// Ajustes, tema y color, atajos de teclado y barra del acompañante.
import { expect, test } from '@playwright/test';
import { chooseMouse, expectScreen, island, openTv, TVS, target } from './tv';

const LABELS = [
  'Tiempo de mirada',
  'Confirmar con',
  'Voz',
  'Puntero',
  'Sensibilidad',
  'Calibrar',
  'Clic con cara',
  'Teclado',
  'Tema y color',
  'Volver',
];

for (const tv of TVS) {
  test.describe(tv.name, () => {
    test('S1 · Ajustes tiene diez tarjetas en el mismo orden', async ({ page }) => {
      await openTv(page, tv);
      await target(page, '#tiles', 'go:settings').click();
      await expectScreen(page, 'settings');
      const labels = await page
        .locator('#sets .set')
        .evaluateAll((els) => els.map((e) => e.querySelector('.lb')?.textContent));
      expect(labels).toEqual(LABELS);
    });

    test('S2 · el tiempo de mirada rota entre 800, 1000, 1200 y 1500 ms y se recuerda', async ({ page }) => {
      await openTv(page, tv);
      await target(page, '#tiles', 'go:settings').click();
      const dwell = target(page, '#sets', 'set:dwell');
      await expect(dwell.locator('.val')).toHaveText('1200 ms');
      await dwell.click();
      await expect(dwell.locator('.val')).toHaveText('1500 ms');
      await dwell.click();
      await expect(dwell.locator('.val')).toHaveText('800 ms');
      await page.reload();
      await chooseMouse(page);
      // La recarga conserva #settings: las dos TVs vuelven a Ajustes.
      await expectScreen(page, 'settings');
      await expect(target(page, '#sets', 'set:dwell').locator('.val')).toHaveText('800 ms');
    });

    test('S4 C4 · Tema y color cambia a claro y al fondo Bosque, y se recuerda', async ({ page }) => {
      await openTv(page, tv);
      await target(page, '#tiles', 'go:settings').click();
      await target(page, '#sets', 'set:theme').click();
      await expect(page.locator('#sets .set .val')).toHaveText([
        'Oscuro',
        'Claro',
        '← Volver',
        'Noche',
        'Bosque',
        'Océano',
        'Atardecer',
        'Lavanda',
      ]);
      await target(page, '#sets', 'look:claro').click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await target(page, '#sets', 'look:bosque').click();
      await expect(page.locator('html')).toHaveAttribute('data-palette', 'bosque');
      await expect(target(page, '#sets', 'look:bosque')).toHaveClass(/\bchosen\b/);
      await target(page, '#sets', 'look:volver').click();
      await expect(target(page, '#sets', 'set:theme').locator('.val')).toHaveText('Claro · Bosque');
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await expect(page.locator('html')).toHaveAttribute('data-palette', 'bosque');
    });

    test('S1 · Sensibilidad, Clic con cara y Calibrar', async ({ page }) => {
      await openTv(page, tv);
      await target(page, '#tiles', 'go:settings').click();
      await target(page, '#sets', 'set:sens').click();
      await expect(island(page)).toHaveText('Sensibilidad alta');
      await expect(target(page, '#sets', 'set:sens').locator('.val')).toHaveText('Alta');
      await target(page, '#sets', 'set:faceclick').click();
      await expect(island(page)).toHaveText('Clic con cara: levanta la ceja para elegir');
      await expect(target(page, '#sets', 'set:faceclick').locator('.val')).toHaveText('Cejas + boca');
      await target(page, '#sets', 'set:calib').click();
      await expect(page.locator('#calib')).toHaveClass(/\bon\b/);
      await expect(page.locator('#calTitle')).toHaveText('Elige tu control');
    });

    test('B1 · tema con T y con el interruptor; Controles se oculta y se recuerda', async ({ page }) => {
      await openTv(page, tv);
      const html = page.locator('html');
      await expect(html).not.toHaveAttribute('data-theme', 'light');
      await page.keyboard.press('t');
      await expect(html).toHaveAttribute('data-theme', 'light');
      await expect(page.locator('#themeToggle')).toHaveAttribute('aria-checked', 'true');
      await page.locator('#themeToggle').click();
      await expect(html).not.toHaveAttribute('data-theme', 'light');
      const legend = page.locator('#legendToggle');
      await expect(legend).toHaveAttribute('aria-expanded', 'true');
      await expect(page.locator('#legend')).toBeVisible();
      await legend.click();
      await expect(legend).toHaveAttribute('aria-expanded', 'false');
      await expect(page.locator('#legend')).toBeHidden();
      await page.reload();
      await expect(page.locator('#legend')).toBeHidden();
    });

    test('P13 · G simula la pérdida del rostro, I el imán y W el temblor', async ({ page }) => {
      await openTv(page, tv);
      await page.keyboard.press('g');
      await expect(island(page)).toHaveText('No te veo · sigue con la ceja');
      await expect(page.locator('body')).toHaveClass(/\bscan\b/);
      await expect(page.locator('#s-home .t.focus.armed')).toHaveCount(1, { timeout: 4000 });
      await page.keyboard.press('g');
      await expect(island(page)).toHaveText('Te veo de nuevo');
      await page.keyboard.press('i');
      await expect(island(page)).toHaveText('Imán desactivado');
      await page.keyboard.press('i');
      await expect(island(page)).toHaveText('Imán activado: el foco va al objetivo más cercano');
      await page.keyboard.press('w');
      await expect(island(page)).toHaveText('Simulando error de webcam');
    });

    test('F · F pide pantalla completa o avisa cómo hacerlo', async ({ page }) => {
      await openTv(page, tv);
      await page.keyboard.press('f');
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              !!document.fullscreenElement ||
              !!document.getElementById('isTx')?.textContent?.includes('pantalla completa'),
          ),
        )
        .toBe(true);
    });

    test('B2 B3 A9 · Controles muestra atajos y el diagnóstico con la pantalla junto a la cama', async ({ page }) => {
      await openTv(page, tv);
      await page.locator('#legend summary', { hasText: 'Atajos de teclado' }).click();
      await expect(page.locator('#legend')).toContainText('simular el llavero RFID');
      await page.locator('#legend summary', { hasText: 'Diagnóstico' }).click();
      await expect(page.locator('#lcd')).toContainText('SENSORES OK');
      await expect(page.locator('#ledG')).toHaveClass(/\bon\b/);
      await expect(page.locator('#diagnosticReadings')).toContainText('SOS');
      await expect(page.locator('#diagnosticReadings')).toContainText('De prueba');
      await expect(page.locator('#diagnosticReadings')).toContainText('WhatsApp');
    });
  });
}
