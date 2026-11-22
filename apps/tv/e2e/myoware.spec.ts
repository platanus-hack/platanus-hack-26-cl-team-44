// MyoWare con un monitor simulado en /emg/gestures: calibración guiada, activación, mandíbula como atajo
// y ceja como clic. Las señales son sintéticas (A0 mandíbula, A3 ceja), como en tests/test_myoware_click.cjs.
import { expect, type Page, test } from '@playwright/test';
import { aim, expectScreen, openTv, TVS } from './tv';

const ORIGIN = `http://localhost:${process.env.TV_E2E_PORT || 8123}`;
const REST: [number, number] = [100, 512];

/** Monitor simulado. Calibración: lotes de 500 ms. En vivo: un cuadro cada 10 ms de reloj real. */
async function fakeMonitor(page: Page) {
  const frames: [number, number, number][] = [];
  let t = 0;
  let seq = 0;
  let requests = 0;
  let lastWall = 0;
  let pulse: { kind: 'brow' | 'jaw'; until: number } | null = null;
  // Calibración: empieza en el 2.º paquete (t = 500). Reposo 5 s, luego 10 intentos de 3,5 s con aviso a los 1,5 s.
  const calib = (time: number): [number, number] => {
    const k = Math.floor((time - 5500) / 3500);
    const cue = 7000 + k * 3500;
    if (time < 5500 || k > 9 || time < cue || time >= cue + 600) return REST;
    return k < 5 ? [100, 504] : [140, 512];
  };
  const live = (time: number): [number, number] => {
    if (!pulse || time >= pulse.until) return REST;
    return pulse.kind === 'brow' ? [100, 504] : [140, 512];
  };
  const state = { live: false };
  await page.route(`${ORIGIN}/emg/gestures`, async (route) => {
    const now = Date.now();
    requests++;
    let n = 50;
    if (state.live) n = Math.max(1, Math.min(20, Math.round((now - lastWall) / 10)));
    lastWall = now;
    for (let i = 0; i < n; i++) {
      const [a0, a3] = state.live ? live(t) : requests === 1 ? REST : calib(t);
      frames.push([t, a0, a3]);
      t += 10;
      seq++;
    }
    if (frames.length > 120) frames.splice(0, frames.length - 120);
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ source: 'uno', sequence: seq, age: 0, frames }),
    });
  });
  return {
    goLive() {
      state.live = true;
      lastWall = Date.now();
    },
    pulse(kind: 'brow' | 'jaw') {
      pulse = { kind, until: t + 60 + 600 };
    },
  };
}

for (const tv of TVS) {
  test.describe(tv.name, () => {
    test('M1 M4 M5 M6 M8 G3 · calibrar, activar, la mandíbula abre y cierra Cuidados y la ceja elige', async ({
      page,
    }) => {
      test.setTimeout(90_000);
      const monitor = await fakeMonitor(page);
      await openTv(page, tv);
      await page.locator('#myoware-controls summary').click();
      await expect(page.locator('#myoware-status')).toHaveText(
        'Gestos desactivados. Confirma que ambos sensores estén en modo ENV.',
      );
      await expect(page.locator('#myoware-toggle')).toBeHidden();
      await page.locator('#myoware-calibrate').click();
      await expect(page.locator('#myoware-calibrate')).toHaveText('Cancelar calibración');
      await expect(page.locator('#myoware-status')).toHaveText('Calibración lista. Ceja: 5/5. Mandíbula: 5/5.', {
        timeout: 45_000,
      });
      monitor.goLive();
      await page.locator('#myoware-toggle').click();
      await expect(page.locator('#myoware-toggle')).toHaveText('Desactivar gestos');
      await expect(page.locator('body')).toHaveClass(/\bmyoware-confirm\b/);
      await expect(page.locator('#myoware-status')).toHaveText(
        'Gestos activos: levanta la ceja para elegir. Suéltala antes del siguiente clic.',
      );
      // Relajar la cara antes del primer gesto: el detector se arma tras 120 ms de reposo.
      await page.waitForTimeout(800);
      // Mandíbula en Inicio: abre la rueda de cuidados. Otra mandíbula: la cierra.
      monitor.pulse('jaw');
      await expect(page.locator('#care-wheel')).toHaveJSProperty('open', true);
      await page.waitForTimeout(1600);
      monitor.pulse('jaw');
      await expect(page.locator('#care-wheel')).toHaveJSProperty('open', false);
      await expect(page.locator('#myoware-result')).toContainText('Mandíbula: 2');
      // La ceja hace clic sobre la tarjeta enfocada, sin permanencia.
      await page.waitForTimeout(1600);
      await aim(page, '#tiles [data-act="go:settings"]');
      await expect(page.locator('#tiles [data-act="go:settings"]')).toHaveClass(/\bfocus\b/);
      monitor.pulse('brow');
      await expectScreen(page, 'settings');
      await expect(page.locator('#sets [data-act="set:mode"] .val')).toHaveText('Ceja (MyoWare)');
    });

    test('M7 · con calibración guardada, «Usar mouse + gestos MyoWare» entra con los gestos activos', async ({
      page,
    }) => {
      await page.addInitScript(() => {
        localStorage.setItem(
          'toki.myoware.gestures.v3',
          JSON.stringify({
            source: 'uno',
            profile: {
              brow: { direction: -1, trigger: 508, release: 511 },
              jaw: { direction: 1, trigger: 120, release: 105 },
            },
          }),
        );
      });
      const monitor = await fakeMonitor(page);
      monitor.goLive();
      await openTv(page, tv, {}, { mouse: false });
      const use = page.locator('#myoware-use-woki');
      await expect(use).toBeVisible();
      await use.click();
      await expect(page.locator('#calib')).not.toHaveClass(/\bon\b/);
      await expect(page.locator('body')).toHaveClass(/\bmyoware-confirm\b/);
      await page.locator('#myoware-controls summary').click();
      await expect(page.locator('#myoware-toggle')).toHaveText('Desactivar gestos');
    });
  });
}
