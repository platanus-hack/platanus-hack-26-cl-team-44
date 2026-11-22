// Hablar: frases locales por tema, anillo de emociones y voz.
import { expect, test } from '@playwright/test';
import { EMOS, RULES } from '../src/domain/phrases';
import { expectScreen, island, openTv, TVS, target } from './tv';

const variants = (ruleIndex: number) => RULES[ruleIndex].s.map((slot) => slot.map((v) => v[0]));
const CENA = variants(0);
const FRIO = variants(3);

for (const tv of TVS) {
  test.describe(tv.name, () => {
    test('H1 H2 H3 · cuatro frases del tema y la distribución con Escribir y Volver', async ({ page }) => {
      await openTv(page, tv);
      await target(page, '#tiles', 'go:talk').click();
      await expectScreen(page, 'talk');
      await expect(page.locator('#s-talk .ctx label')).toHaveText('Sofía dice');
      await expect(page.locator('#ctxIn')).toHaveValue('¿Vienes a cenar el domingo?');
      const acts = page.locator('#cards > [data-act]');
      await expect(acts).toHaveCount(6);
      expect(await acts.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.act))).toEqual([
        'say:0',
        'say:1',
        'go:keyboard',
        'say:2',
        'say:3',
        'go:home',
      ]);
      for (let i = 0; i < 4; i++) {
        const text = await page.locator(`#cards > [data-act="say:${i}"] .ph`).textContent();
        expect(CENA[i]).toContain(text);
      }
    });

    test('H1 · el acompañante escribe el contexto y Enter trae frases de ese tema', async ({ page }) => {
      await openTv(page, tv);
      await target(page, '#tiles', 'go:talk').click();
      await page.locator('#ctxIn').fill('¿Tienes frío?');
      await page.locator('#ctxIn').press('Enter');
      await expect(page.locator('#ctxIn')).not.toBeFocused();
      await expect(async () => {
        for (let i = 0; i < 4; i++) {
          const text = await page.locator(`#cards > [data-act="say:${i}"] .ph`).textContent();
          expect(FRIO[i]).toContain(text);
        }
      }).toPass({ timeout: 4000 });
    });

    test('H4 H5 · el emoji abre el anillo y elegir una emoción cambia la tarjeta', async ({ page }) => {
      await openTv(page, tv);
      await target(page, '#tiles', 'go:talk').click();
      await expectScreen(page, 'talk');
      await page.locator('#cards [data-act="emo:0"]').click();
      const ring = page.locator('#emoRing');
      await expect(ring).toHaveClass(/\bon\b/);
      await expect(ring.locator('[data-act^="setEmo:"]')).toHaveCount(6);
      await expect(ring.locator('[data-act^="setEmo:"]')).toHaveText(EMOS.map((e) => new RegExp(e.n)));
      await expect(ring.locator('[data-act="emoBack"]')).toContainText('Volver');
      await ring.locator('[data-act="setEmo:entusiasta"]').click();
      await expect(ring).not.toHaveClass(/\bon\b/);
      await expect(island(page)).toHaveText('Emoción: entusiasta');
      await expect(page.locator('#cards [data-act="say:0"] .tone')).toContainText('entusiasta');
      await expect(page.locator('#cards [data-act="emo:0"]')).toContainText('🤩');
    });

    test('H6 · elegir una frase la dice y la muestra en la franja de voz', async ({ page }) => {
      await openTv(page, tv);
      await target(page, '#tiles', 'go:talk').click();
      await expectScreen(page, 'talk');
      const card = page.locator('#cards > [data-act="say:1"]');
      const text = (await card.locator('.ph').textContent()) ?? '';
      await card.locator('.ph').click();
      await expect(page.locator('#speaking')).toHaveClass(/\bon\b/);
      await expect(page.locator('#spTxt')).toHaveText(text);
    });

    test('R1 · Reacciones: 4 por página, Más cambia de página y Volver regresa', async ({ page }) => {
      await openTv(page, tv, {}, { hash: '#reactions' });
      await expectScreen(page, 'reactions');
      const reacts = page.locator('#reacts [data-act^="react:"]');
      await expect(reacts).toHaveCount(4);
      await expect(reacts.first()).toContainText('jajaja');
      await target(page, '#reacts', 'reactMore').click();
      await expect(reacts.first()).toContainText('¿en serio?');
      await target(page, '#reacts', 'go:home').click();
      await expectScreen(page, 'home');
    });
  });
}
