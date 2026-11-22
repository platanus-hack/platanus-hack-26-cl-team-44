// Alarma (SOS), llavero RFID con R, cierre con Esc o botón, y descanso.
import { expect, test } from '@playwright/test';
import { aim, expectScreen, island, openTv, TVS, target } from './tv';

for (const tv of TVS) {
  test.describe(tv.name, () => {
    test('A1 A2 X1 · SOS abre la alarma de prueba con el foco en Cerrar', async ({ page }) => {
      await openTv(page, tv);
      await target(page, '#tiles', 'sos').click();
      const alarm = page.locator('#alarm');
      await expect(alarm).toHaveClass(/\bon\b/);
      await expect(page.locator('#alBig')).toHaveText('SOS de prueba');
      await expect(page.locator('#alSub')).toHaveText('No se contactó a nadie.');
      await expect(page.locator('#alCancel')).toHaveText(/^Sin respuesta simulada · \d+ s · R para simular recepción$/);
      await expect(page.locator('#alDismiss')).toBeFocused();
      await expect(page.locator('#alDismiss')).toHaveText('Cerrar simulación');
      await expect(page.locator('#s-home')).toHaveAttribute('inert', /.*/);
    });

    test('A4 · R simula el llavero: primero verde y después cierra', async ({ page }) => {
      await openTv(page, tv);
      await target(page, '#tiles', 'sos').click();
      await expect(page.locator('#alarm')).toHaveClass(/\bon\b/);
      await page.keyboard.press('r');
      await expect(page.locator('#alarm')).toHaveClass(/\back\b/);
      await expect(page.locator('#alBig')).toHaveText('Respuesta simulada');
      await expect(page.locator('#alCancel')).toHaveText('R o Cerrar simulación');
      await page.keyboard.press('r');
      await expect(page.locator('#alarm')).not.toHaveClass(/\bon\b/);
      await expect(island(page)).toHaveText('Resuelto');
    });

    test('A5 · Esc y «Cerrar simulación» cierran la alarma', async ({ page }) => {
      await openTv(page, tv);
      await target(page, '#tiles', 'sos').click();
      await expect(page.locator('#alarm')).toHaveClass(/\bon\b/);
      await page.keyboard.press('Escape');
      await expect(page.locator('#alarm')).not.toHaveClass(/\bon\b/);
      await expect(island(page)).toHaveText('Simulación cerrada');
      await page.mouse.move(5, 5);
      await target(page, '#tiles', 'sos').click();
      await expect(page.locator('#alarm')).toHaveClass(/\bon\b/);
      await page.locator('#alDismiss').click();
      await expect(page.locator('#alarm')).not.toHaveClass(/\bon\b/);
      await expect(island(page)).toHaveText('Simulación cerrada');
    });

    test('A3 · M silencia la alarma fuera de una emergencia y R sin alarma avisa', async ({ page }) => {
      await openTv(page, tv);
      await page.keyboard.press('m');
      await expect(island(page)).toHaveText('Alarma en silencio');
      await page.keyboard.press('m');
      await expect(island(page)).toHaveText('Sonido de alarma activo');
      await page.keyboard.press('r');
      await expect(island(page)).toHaveText('Llavero: no hay alarma activa');
    });

    test('D1 D2 · Descansar muestra el reloj y Volver regresa', async ({ page }) => {
      await openTv(page, tv);
      await target(page, '#tiles', 'rest').click();
      const rest = page.locator('#rest');
      await expect(rest).toHaveClass(/\bon\b/);
      await expect(page.locator('#restTitle')).toHaveText('En descanso');
      await expect(page.locator('#restClock')).toHaveText(/^\d\d:\d\d$/);
      await expect(page.locator('#restWake')).toBeFocused();
      await expect(page.locator('#s-home')).toHaveAttribute('inert', /.*/);
      await page.locator('#restWake').click();
      await expect(rest).not.toHaveClass(/\bon\b/);
      await expectScreen(page, 'home');
    });

    test('D1 · en descanso, 2 s de mirada sobre Volver despiertan y SOS con clic abre la alarma', async ({ page }) => {
      await openTv(page, tv);
      await target(page, '#tiles', 'rest').click();
      await expect(page.locator('#rest')).toHaveClass(/\bon\b/);
      await aim(page, '#restWake');
      await expect(page.locator('#rest')).not.toHaveClass(/\bon\b/, { timeout: 5000 });
      await page.mouse.move(5, 5);
      await target(page, '#tiles', 'rest').click();
      await expect(page.locator('#rest')).toHaveClass(/\bon\b/);
      await page.locator('#rest [data-act="sos"]').click();
      await expect(page.locator('#alarm')).toHaveClass(/\bon\b/);
      await expect(page.locator('#alBig')).toHaveText('SOS de prueba');
    });
  });
}
