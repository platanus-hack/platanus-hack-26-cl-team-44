// Escribir: grupos de letras, predicción con el mismo diccionario, Borrar que acelera y Decir.
import { expect, type Page, test } from '@playwright/test';
import lexicon from '../src/data/lexicon-es.json' with { type: 'json' };
import { showWord } from '../src/domain/keyboard';
import { DEFAULT, REACTS, RULES } from '../src/domain/phrases';
import { createPredictor } from '../src/engines/predict/predict';
import { expectScreen, openTv, TVS, target } from './tv';

// El mismo predictor que usan las dos TVs, sin aprendizaje previo: la fila debe coincidir palabra por palabra.
const predictor = createPredictor({
  base: lexicon as unknown as Array<[string, number]>,
  corpus: [
    ...RULES.flatMap((r) => r.s.flat().map((x) => x[0])),
    ...DEFAULT.flat().map((x) => x[0]),
    ...REACTS.map((r) => r[1]),
  ],
});
const expected = (prev: string, prefix: string) => predictor.suggest(prev, prefix, 10).map((s) => showWord(s.word));
// Texto visible de una tecla: la palabra seguida de la insignia «Listo · ceja o clic».
const keyText = (words: string[]) => words.map((w) => new RegExp(`^${w}(?:Listo|$)`));

async function type(page: Page, letter: string, group: number) {
  await target(page, '#keys', `grp:${group}`).click();
  await target(page, '#keys', `chr:${letter}`).click();
}

for (const tv of TVS) {
  test.describe(tv.name, () => {
    test('K1 K2 K4 · grupos, letras y la fila fija de sugerencias del predictor', async ({ page }) => {
      await openTv(page, tv);
      await target(page, '#tiles', 'go:keyboard').click();
      await expectScreen(page, 'keyboard');
      await expect(page.locator('#keys .row-grp')).toHaveText(keyText(['ABCDE', 'FGHIJ', 'KLMNÑ', 'OPQRS', 'TUVWXYZ']));
      const start = expected('', '').slice(0, 3);
      await expect(page.locator('#keys .row-sug[data-act^="sug:"]')).toHaveText(keyText(start));
      await target(page, '#keys', 'grp:1').click();
      await expect(page.locator('#keys [data-act^="chr:"]')).toHaveText(keyText(['F', 'G', 'H', 'I', 'J']));
      await target(page, '#keys', 'chr:H').click();
      await expect(page.locator('#kbTxt')).toContainText('H');
      await expect(page.locator('#keys .row-sug[data-act^="sug:"]')).toHaveText(keyText(expected('', 'H').slice(0, 3)));
    });

    test('K7 · aceptar una sugerencia completa la palabra con mayúscula al inicio', async ({ page }) => {
      await openTv(page, tv);
      await target(page, '#tiles', 'go:keyboard').click();
      await type(page, 'H', 1);
      const first = expected('', 'H')[0];
      await target(page, '#keys', 'sug:0').click();
      await expect(page.locator('#kbTxt')).toHaveText(new RegExp(`^${first}\\s`));
    });

    test('K2 · «Más ▸» muestra 7 sugerencias más y Volver regresa', async ({ page }) => {
      await openTv(page, tv);
      await target(page, '#tiles', 'go:keyboard').click();
      await target(page, '#keys', 'kb:sug').click();
      await expect(page.locator('#keys [data-act^="sug:"]')).toHaveText(keyText(expected('', '').slice(3, 10)));
      await expect(page.locator('#kbPred')).toHaveText('Elige una palabra');
      await target(page, '#keys', 'kb:back').click();
      await expect(page.locator('#keys .row-grp')).toHaveCount(5);
    });

    test('K5 K6 · Borrar acelera y Decir habla lo escrito', async ({ page }) => {
      await openTv(page, tv);
      await target(page, '#tiles', 'go:keyboard').click();
      await type(page, 'H', 1);
      await type(page, 'O', 3);
      await type(page, 'L', 2);
      await type(page, 'A', 0);
      await expect(page.locator('#kbTxt')).toContainText('Hola');
      await target(page, '#keys', 'kb:del').click();
      await expect(page.locator('#kbTxt')).toContainText('Hol');
      await expect(target(page, '#keys', 'kb:del')).toContainText('Borrar palabra');
      await target(page, '#keys', 'kb:del').click();
      await expect(page.locator('#kbTxt')).toHaveText('');
      await type(page, 'S', 3);
      await type(page, 'I', 1);
      await target(page, '#keys', 'kb:say').click();
      await expect(page.locator('#speaking')).toHaveClass(/\bon\b/);
      await expect(page.locator('#spTxt')).toHaveText('Si');
      await expect(page.locator('#kbTxt')).toHaveText('');
    });

    test('K3 S1 · Ajustes › Teclado cambia a la lista de sugerencias', async ({ page }) => {
      await openTv(page, tv);
      await target(page, '#tiles', 'go:settings').click();
      const kb = target(page, '#sets', 'set:sugmode');
      await expect(kb.locator('.val')).toHaveText('Sugerencias fijas');
      await kb.click();
      await expect(kb.locator('.val')).toHaveText('Sugerencias en lista');
      await target(page, '#sets', 'go:home').click();
      await target(page, '#tiles', 'go:keyboard').click();
      await expect(page.locator('#keys')).toHaveClass('grid5x2');
      await expect(target(page, '#keys', 'kb:sug')).toContainText(expected('', '').slice(0, 2).join(' · '));
    });
  });
}
