// Panel dev del agente (Shift+D o ?dev=1): opciones del agente por SSE en las tarjetas de Hablar, con su traza.
// El agente está simulado: no hay modelo ni memoria real.
import { expect, test } from '@playwright/test';
import { expectScreen, openTv, type Stubs, sse, TVS, target } from './tv';

const OPCIONES = {
  tipo: 'opciones',
  etiqueta: 'Pedro dice',
  inicial: 'P',
  texto: '¿Vamos al cumple?',
  resumen: 'Amigo de la familia',
  origen: 'agente',
  meta: { ms_total: 900, duration_ms: 700 },
  opciones: [
    {
      text: '¡Sí, vamos!',
      tone: 'alegre',
      emo: 'alegre',
      traza: { origen: 'agente', fuentes: [{ id: 'm1', tipo: 'recuerdo' }] },
    },
    { text: 'Mejor otro día.', tone: 'honesta', emo: 'seria', traza: { origen: 'regla' } },
    {
      text: '¿A qué hora?',
      tone: 'pregunta',
      emo: 'seria',
      traza: { origen: 'tarjeta', de: 'catalogo', tema: 'salidas' },
    },
    { text: 'Te aviso mañana.', tone: 'pausa', emo: 'seria', origen: 'respaldo' },
  ],
};

function agentStubs(state: { armed: boolean; sent: boolean }): Stubs {
  return {
    agent: {
      '/api/salud': { usuaria: 'Usuaria', personas: 2, modelo: 'stub' },
      '/api/personas': [{ id: 'p1', nombre: 'Pedro', relacion: 'amigo', tipo_interlocutor: 'cercano' }],
      '/api/disparadores': [{ id: 'd1', grupo_nombre: 'Familia', grupo_jid: '000@g.us', estado: 'activo' }],
      '/api/simular': { id: 's1', en_bandeja: 1, tvs: 1 },
    },
    agentEvents: () => {
      if (!state.armed || state.sent) return '';
      state.sent = true;
      return sse(OPCIONES);
    },
  };
}

for (const tv of TVS) {
  test.describe(tv.name, () => {
    test('H11 H12 H10 · Shift+D abre el panel y las opciones del agente llegan a Hablar con su traza', async ({
      page,
    }) => {
      const state = { armed: false, sent: false };
      const { agentCalls } = await openTv(page, tv, agentStubs(state));
      await target(page, '#tiles', 'go:talk').click();
      await expectScreen(page, 'talk');
      await page.keyboard.press('Shift+D');
      const panel = page.locator('#tokiDev');
      await expect(panel).toBeVisible();
      await expect(panel).toContainText('Modo dev · agente');
      await expect(page.locator('#devEstado')).toHaveText('Usuaria · 2 personas · stub');
      await expect(page.locator('#devDisp')).toContainText('Familia · mención');
      await expect(page.locator('#devPersona option')).toHaveCount(2);
      // La tarjeta local ya muestra su traza en modo dev.
      await expect(page.locator('#cards [data-act="say:0"] .traza')).toHaveText(
        '💻 local de la TV (reglas y plantillas, sin modelo ni memoria)',
      );
      state.armed = true;
      await expect(page.locator('#cards [data-act="say:0"] .ph')).toHaveText('¡Sí, vamos!', { timeout: 8000 });
      await expect(page.locator('#cards [data-act="say:1"] .ph')).toHaveText('Mejor otro día.');
      await expect(page.locator('#cards [data-act="say:0"] .traza')).toHaveText('🧠 m1 recuerdo');
      await expect(page.locator('#cards [data-act="say:1"] .traza')).toHaveText(
        '📏 regla fija de respaldo (el modelo no respondió o faltaban opciones)',
      );
      await expect(page.locator('#cards [data-act="say:2"] .traza')).toHaveText(
        '🗂 tarjeta del catálogo · tema salidas',
      );
      await expect(page.locator('#s-talk .ctx label')).toHaveText('Pedro dice');
      await expect(page.locator('#ctxIn')).toHaveValue('¿Vamos al cumple?');
      await expect(page.locator('#devMeta')).toHaveText('Amigo de la familia');
      await expect(page.locator('#devTraza')).toContainText('✓ agente · 900 ms total');
      expect(agentCalls.some((c) => c.path === '/api/eventos')).toBe(true);
      await page.keyboard.press('Shift+D');
      await expect(panel).toBeHidden();
      await expect(page.locator('#cards .traza')).toHaveCount(0);
    });

    test('H13 H11 · ?dev=1 abre el panel al cargar y Simular manda la voz al agente', async ({ page }) => {
      const state = { armed: false, sent: false };
      const { agentCalls } = await openTv(page, tv, agentStubs(state), { query: '?dev=1' });
      await expect(page.locator('#tokiDev')).toBeVisible();
      await expect(page.locator('#devEstado')).toHaveText('Usuaria · 2 personas · stub');
      await page.locator('#devCanal').selectOption('voz');
      await page.locator('#devTexto').fill('Hola, ¿cómo estás?');
      await page.locator('#devTexto').press('Enter');
      await expect(page.locator('#devTraza')).toContainText('→ enviado s1 · en bandeja 1 · TVs 1');
      const call = agentCalls.find((c) => c.path === '/api/simular');
      expect(call?.body).toEqual({ texto: 'Hola, ¿cómo estás?', persona: null, canal: 'voz' });
    });
  });
}
