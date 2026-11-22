// Utilidades de las pruebas de paridad: abrir cada TV con los backends simulados.
import { expect, type Page, type Route } from '@playwright/test';

export const TVS = [
  { name: 'TV actual', path: '/woki-os.html' },
  { name: 'TV v2', path: '/v2/' },
] as const;
export type TvTarget = (typeof TVS)[number];

/** Puente de WhatsApp y agente locales (modo desarrollo). Las dos TVs usan estas mismas bases en localhost. */
export const WA = 'http://localhost:8788';
export const AGENT = 'http://127.0.0.1:8790';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
};

export interface Call {
  method: string;
  path: string;
  body: unknown;
}

export type Reply = unknown | { status: number; json: unknown };
export type Handler = Reply | ((call: Call) => Reply);

export interface Stubs {
  /** Respuestas del puente de WhatsApp por ruta (sin la base), por ejemplo '/api/wa/favorites'. */
  wa?: Record<string, Handler>;
  /** Respuestas del agente por ruta. */
  agent?: Record<string, Handler>;
  /** Cuerpo SSE de /api/wa/events en cada conexión. '' = sin eventos. */
  waEvents?: () => string;
  /** Cuerpo SSE de /api/eventos del agente en cada conexión. */
  agentEvents?: () => string;
}

export const sse = (...events: unknown[]) => events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join('');

const WA_DEFAULTS: Record<string, Handler> = {
  '/api/wa/health': { ok: true, session: 'dry' },
  '/api/wa/favorites': { ok: true, contacts: [] },
  '/api/wa/mentions': { ok: true, mentions: [] },
  '/api/wa/history': { ok: true, messages: [] },
  '/api/voz/estado': { ok: true },
};

function serve(stubs: Record<string, Handler>, events: (() => string) | undefined, eventsPath: string, calls: Call[]) {
  return async (route: Route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS });
      return;
    }
    const url = new URL(req.url());
    let body: unknown = null;
    try {
      body = req.postData() ? JSON.parse(req.postData() as string) : null;
    } catch {
      body = req.postData();
    }
    const call = { method: req.method(), path: url.pathname, body };
    calls.push(call);
    if (url.pathname === eventsPath) {
      await route.fulfill({
        status: 200,
        headers: { ...CORS, 'content-type': 'text/event-stream' },
        body: events ? events() : '',
      });
      return;
    }
    const handler = stubs[url.pathname];
    if (handler === undefined) {
      await route.fulfill({
        status: 404,
        headers: { ...CORS, 'content-type': 'application/json' },
        body: '{"ok":false,"reason":"sin stub"}',
      });
      return;
    }
    const reply = typeof handler === 'function' ? (handler as (c: Call) => Reply)(call) : handler;
    const shaped =
      reply && typeof reply === 'object' && 'status' in reply && 'json' in reply
        ? (reply as { status: number; json: unknown })
        : { status: 200, json: reply };
    await route.fulfill({
      status: shaped.status,
      headers: { ...CORS, 'content-type': 'application/json' },
      body: JSON.stringify(shaped.json),
    });
  };
}

export interface OpenOptions {
  hash?: string;
  query?: string;
  /** Elegir «Mouse» en la capa inicial (por defecto sí). */
  mouse?: boolean;
}

/** Abre una TV con los backends simulados y sin red real. Devuelve el registro de llamadas. */
export async function openTv(page: Page, tv: TvTarget, stubs: Stubs = {}, opts: OpenOptions = {}) {
  const waCalls: Call[] = [];
  const agentCalls: Call[] = [];
  const origin = `http://localhost:${process.env.TV_E2E_PORT || 8123}`;
  // Todo lo que no sea el servidor de pruebas se corta: ni CDN, ni modelos, ni APIs.
  await page.route(
    (url) => url.origin !== origin,
    (route) => route.abort(),
  );
  await page.route(`${WA}/**`, serve({ ...WA_DEFAULTS, ...stubs.wa }, stubs.waEvents, '/api/wa/events', waCalls));
  await page.route(`${AGENT}/**`, serve(stubs.agent ?? {}, stubs.agentEvents, '/api/eventos', agentCalls));
  await page.goto(`${tv.path}${opts.query ?? ''}${opts.hash ?? ''}`);
  if (opts.mouse !== false) await chooseMouse(page);
  return { waCalls, agentCalls };
}

export async function chooseMouse(page: Page) {
  const calib = page.locator('#calib');
  await expect(calib).toHaveClass(/\bon\b/);
  await page.locator('#calBtns [data-c="mouse"]').click();
  await expect(calib).not.toHaveClass(/\bon\b/);
}

/** Pantalla visible (sección con clase on). */
export const screen = (page: Page, id: string) => page.locator(`#s-${id}`);

export async function expectScreen(page: Page, id: string) {
  await expect(screen(page, id)).toHaveClass(/\bon\b/);
}

/** Objetivo de mirada por acción dentro de la capa visible. */
export const target = (page: Page, scope: string, act: string) => page.locator(`${scope} [data-act="${act}"]`).first();

/** Lleva el puntero (mouse = mirada) al centro de un elemento. */
export async function aim(page: Page, selector: string) {
  const box = await page.locator(selector).first().boundingBox();
  if (!box) throw new Error(`Sin caja para ${selector}`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
}

export const island = (page: Page) => page.locator('#isTx');
