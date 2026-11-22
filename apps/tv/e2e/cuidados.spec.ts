// Rueda de cuidados desde la barra del acompañante.
import { expect, test } from '@playwright/test';
import { island, openTv, TVS } from './tv';

for (const tv of TVS) {
  test.describe(tv.name, () => {
    test('Q1 Q2 Q3 · «Cuidados» abre la rueda con cinco opciones y Esc la cierra', async ({ page }) => {
      await openTv(page, tv);
      await page.locator('#care-open').click();
      const dialog = page.locator('#care-wheel');
      await expect(dialog).toHaveAttribute('open', '');
      await expect(page.locator('#care-title')).toHaveText('Rueda de cuidados');
      await expect(page.locator('#care-choices button')).toHaveText([
        'Ayuda urgente',
        'Avisar a mi cuidador',
        'Frases rápidas',
        'Volver',
        'Cerrar',
      ]);
      await expect(page.locator('#care-current')).toHaveText('Cerrar');
      await page.locator('#care-pause').click();
      await expect(page.locator('#care-pause')).toHaveText('Reanudar escaneo');
      await page.keyboard.press('Escape');
      await expect(dialog).not.toHaveAttribute('open', '');
    });

    test('Q1 A7 · Avisar a mi cuidador da un aviso de prueba', async ({ page }) => {
      await openTv(page, tv);
      await page.locator('#care-open').click();
      await page.locator('#care-choices button', { hasText: 'Avisar a mi cuidador' }).click();
      await expect(page.locator('#care-wheel')).not.toHaveAttribute('open', '');
      await expect(island(page)).toHaveText('Aviso no urgente simulado · no se contactó a nadie');
    });

    test('Q1 · Frases rápidas cambia de vista y vuelve a la rueda', async ({ page }) => {
      await openTv(page, tv);
      await page.locator('#care-open').click();
      await page.locator('#care-choices button', { hasText: 'Frases rápidas' }).click();
      await expect(page.locator('#care-title')).toHaveText('Frases rápidas');
      await expect(page.locator('#care-choices button')).toHaveText([
        'Necesito cambiar de postura',
        'Me duele',
        'Necesito ir al baño',
        'Dame un momento',
        'Volver a la rueda',
      ]);
      await page.locator('#care-choices button', { hasText: 'Volver a la rueda' }).click();
      await expect(page.locator('#care-title')).toHaveText('Rueda de cuidados');
    });

    test('Q4 · SOS de prueba desde la rueda pide confirmación y se cierra', async ({ page }) => {
      await openTv(page, tv);
      await page.locator('#care-open').click();
      await page.locator('#care-choices button', { hasText: 'Ayuda urgente' }).click();
      await expect(page.locator('#care-hint')).toHaveText(
        'Es una simulación. No se llamará ni se enviará ningún mensaje.',
      );
      await page.locator('#care-choices button', { hasText: 'Iniciar SOS de prueba' }).click();
      await expect(page.locator('#alarm')).toHaveClass(/\bon\b/);
      await expect(page.locator('#alBig')).toHaveText('SOS de prueba');
      await page.locator('#alDismiss').click();
      await expect(page.locator('#alarm')).not.toHaveClass(/\bon\b/);
      await expect(island(page)).toHaveText('Simulación cerrada');
      await expect(page.locator('#care-open')).toBeFocused();
    });
  });
}
