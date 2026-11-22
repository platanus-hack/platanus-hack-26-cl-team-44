// WhatsApp con el puente simulado: contactos, chat con respuestas de Claude, envío con doble ceja,
// mensaje entrante, mención en un grupo y panel del acompañante (K). Datos ficticios.
import { expect, test } from '@playwright/test';
import { type Call, expectScreen, island, openTv, type Stubs, sse, TVS, target } from './tv';

const ANA = { id: 'c1', name: 'Ana Prueba', relation: 'hija', phone: '+00 000 0001' };
const BETO = { id: 'c2', name: 'Beto Prueba', relation: 'cuidador', phone: '+00 000 0002' };
const CARLA = { id: 'c3', name: 'Carla Prueba', relation: '', phone: '+00 000 0003' };
const SUGGEST = {
  ok: true,
  key: 'h1',
  suggestions: [
    { text: 'Claro, nos vemos.', tone: 'cálida', emo: 'alegre' },
    { text: 'Hoy no puedo.', tone: 'honesta', emo: 'seria' },
  ],
};

function stubs(extra: Partial<Stubs> = {}): Stubs {
  return {
    wa: {
      '/api/wa/favorites': (c: Call) =>
        c.method === 'POST'
          ? { ok: true, contacts: (c.body as { contacts: unknown[] }).contacts }
          : { ok: true, contacts: [ANA, BETO] },
      '/api/wa/history': {
        ok: true,
        messages: [{ id: 'h1', dir: 'in', text: '¿Vienes hoy?', at: Date.UTC(2026, 10, 22, 15, 0) }],
      },
      '/api/wa/suggest': SUGGEST,
      '/api/wa/send': { ok: true, msgId: 'm1', dry: true },
      '/api/wa/contacts': { ok: true, contacts: [ANA, BETO, CARLA] },
      ...extra.wa,
    },
    waEvents: extra.waEvents,
  };
}

for (const tv of TVS) {
  test.describe(tv.name, () => {
    test('W1 · Mensajes muestra los contactos principales, Ajustar y Volver', async ({ page }) => {
      await openTv(page, tv, stubs());
      await target(page, '#tiles', 'go:contacts').click();
      await expectScreen(page, 'contacts');
      await expect(page.locator('#people .person .lb')).toHaveText(['Ana Prueba', 'Beto Prueba', 'Ajustar', 'Volver']);
      await expect(page.locator('#people .person .sb').first()).toHaveText('hija');
    });

    test('W2 W3 W4 W5 W6 · chat con respuestas de Claude y envío con doble ceja', async ({ page }) => {
      const { waCalls } = await openTv(page, tv, stubs());
      await target(page, '#tiles', 'go:contacts').click();
      await target(page, '#people', 'waTo:0').click();
      await expectScreen(page, 'talk');
      await expect(page.locator('#s-talk')).toHaveClass(/\bchatmode\b/);
      await expect(page.locator('#chatH')).toHaveText('Chat con Ana Prueba');
      await expect(page.locator('#chatList .msg.in')).toContainText('¿Vienes hoy?');
      await expect(page.locator('#cards [data-act="say:0"] .ph')).toHaveText('Claro, nos vemos.');
      await expect(page.locator('#cards [data-act="say:0"] .tone')).toContainText('✨');
      await expect(page.locator('#cards [data-act="say:1"] .ph')).toHaveText('Hoy no puedo.');
      await expect(page.locator('#cards [data-act="say:2"] .ph')).toHaveText('Pregúntele a Beto.');
      await expect(page.locator('#cards [data-act="waMore"] .ph')).toHaveText('Otro');
      await expect(page.locator('#cards [data-act="waKb"]')).toContainText('con iniciales');
      await page.locator('#cards [data-act="say:0"] .ph').click();
      await expectScreen(page, 'agent');
      await expect(page.locator('#agTitle')).toHaveText('Escribir a Ana Prueba');
      await expect(page.locator('#agTo')).toHaveText('Ana Prueba (hija)');
      await expect(page.locator('#agentMsg')).toHaveText('Claro, nos vemos. 😄');
      await page.locator('#btnSend').click();
      await expect(page.locator('#btnSend')).toContainText('Otra ceja');
      expect(waCalls.some((c) => c.path === '/api/wa/send')).toBe(false);
      await page.locator('#btnSend').click();
      await expect(island(page)).toHaveText('Enviado a Ana Prueba (prueba)');
      await expectScreen(page, 'home');
      const send = waCalls.find((c) => c.path === '/api/wa/send');
      expect(send?.body).toMatchObject({ contactId: 'c1', text: 'Claro, nos vemos. 😄' });
      expect(String((send?.body as { idemKey?: string }).idemKey)).toMatch(/^[0-9a-f-]{36}$/);
    });

    test('W5 · sin la segunda ceja en 3 s no se envía', async ({ page }) => {
      const { waCalls } = await openTv(page, tv, stubs());
      await target(page, '#tiles', 'go:contacts').click();
      await target(page, '#people', 'waTo:0').click();
      await expect(page.locator('#cards [data-act="say:0"] .ph')).toHaveText('Claro, nos vemos.');
      await page.locator('#cards [data-act="say:0"] .ph').click();
      await page.locator('#btnSend').click();
      await expect(island(page)).toHaveText('No se envió: faltó la segunda ceja', { timeout: 5000 });
      expect(waCalls.some((c) => c.path === '/api/wa/send')).toBe(false);
    });

    test('W7 · un mensaje entrante avisa y abre el chat', async ({ page }) => {
      let armed = false;
      let sent = false;
      const incoming = { type: 'incoming', contactId: 'c1', name: 'Ana Prueba', text: '¿Me llamas?', key: 'h2' };
      await openTv(
        page,
        tv,
        stubs({
          waEvents: () => {
            if (!armed || sent) return '';
            sent = true;
            return sse(incoming);
          },
        }),
      );
      armed = true;
      await expect(island(page)).toHaveText('Ana Prueba: ¿Me llamas?', { timeout: 8000 });
      await expectScreen(page, 'talk');
      await expect(page.locator('#s-talk .ctx label')).toHaveText('Ana Prueba dice');
      await expect(page.locator('#ctxIn')).toHaveValue('¿Me llamas?');
    });

    test('W8 · una mención en un grupo abre el chat con las opciones del agente', async ({ page }) => {
      let armed = false;
      let sent = false;
      const mention = {
        type: 'mention',
        id: 'mn1',
        from: 'Pedro',
        group: 'Familia',
        groupJid: '000@g.us',
        mentionJid: 'yo',
        text: '¿Vamos el sábado?',
        resumen: 'Pregunta por el sábado',
        estado: 'pendiente',
        opciones: [
          { text: '¡Vamos!', tone: 'alegre', emo: 'alegre' },
          { text: 'Esta vez no.', tone: 'honesta', emo: 'seria' },
        ],
      };
      const { waCalls } = await openTv(
        page,
        tv,
        stubs({
          waEvents: () => {
            if (!armed || sent) return '';
            sent = true;
            return sse(mention);
          },
        }),
      );
      armed = true;
      await expect(island(page)).toHaveText('Pedro te mencionó en «Familia»: Pregunta por el sábado', {
        timeout: 8000,
      });
      await expectScreen(page, 'talk');
      await expect(page.locator('#chatH')).toHaveText('Chat con Familia');
      await expect(page.locator('#s-talk .ctx label')).toHaveText('Pedro te mencionó en Familia');
      await expect(page.locator('#cards [data-act="say:0"] .ph')).toHaveText('¡Vamos!');
      await page.locator('#cards [data-act="say:0"] .ph').click();
      await page.locator('#btnSend').click();
      await page.locator('#btnSend').click();
      await expect(island(page)).toHaveText('Enviado a Familia (prueba)');
      const send = waCalls.find((c) => c.path === '/api/wa/send');
      expect(send?.body).toMatchObject({ groupJid: '000@g.us', mention: 'yo', mentionId: 'mn1', text: '¡Vamos! 😄' });
    });

    test('W9 · K abre el panel del acompañante, elige contactos y guarda', async ({ page }) => {
      const { waCalls } = await openTv(page, tv, stubs());
      await page.keyboard.press('k');
      const panel = page.locator('#waPanel');
      await expect(panel).toHaveClass(/\bon\b/);
      await expect(page.locator('#wapTitle')).toHaveText('Contactos principales');
      await expect(page.locator('#wapList .wap-row')).toHaveCount(3);
      await expect(page.locator('#wapCount')).toHaveText('2/6');
      await page.locator('#wapList .wap-row', { hasText: 'Carla Prueba' }).click();
      await expect(page.locator('#wapCount')).toHaveText('3/6');
      await page.getByLabel('Relación con Carla Prueba').fill('amiga');
      await page.locator('#wapQ').fill('beto');
      await expect(page.locator('#wapList .wap-row')).toHaveCount(1);
      await page.locator('#wapSave').click();
      await expect(panel).not.toHaveClass(/\bon\b/);
      await expect(island(page)).toHaveText('3 contactos principales guardados');
      const save = waCalls.find((c) => c.path === '/api/wa/favorites' && c.method === 'POST');
      expect((save?.body as { contacts: { name: string; relation: string }[] }).contacts).toEqual([
        { phone: ANA.phone, name: 'Ana Prueba', relation: 'hija' },
        { phone: BETO.phone, name: 'Beto Prueba', relation: 'cuidador' },
        { phone: CARLA.phone, name: 'Carla Prueba', relation: 'amiga' },
      ]);
      await page.keyboard.press('k');
      await expect(panel).toHaveClass(/\bon\b/);
      await page.keyboard.press('Escape');
      await expect(panel).not.toHaveClass(/\bon\b/);
    });
  });
}
