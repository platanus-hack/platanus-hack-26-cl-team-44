// ElevenLabs en la TV, siempre a través del puente: la llave nunca llega al navegador.
// Port de software/toki-os/woki-voz.js. Mismos endpoints y mismos textos.
import { type Api, createApi } from '../net/api';

export interface VoiceOption {
  id: string;
  name: string;
  kind?: string;
  preview?: string;
}

export interface EmergencyHooks {
  /** ¿Sigue activa esta alarma y sin respuesta? */
  alive(): boolean;
  setSub(text: string): void;
  markReal(): void;
  confirmed(who: string, answer: string): void;
  island(icon: string, text: string): void;
  log(text: string): void;
}

export interface Voz {
  readonly on: boolean;
  readonly callReady: boolean;
  readonly options: VoiceOption[];
  name(): string;
  init(): Promise<void>;
  prefetch(items: [string, string][]): void;
  stop(): void;
  speak(text: string, emo?: string): Promise<void>;
  next(): Promise<boolean>;
  emergency(alarmId: string, hooks: EmergencyHooks): Promise<void>;
  dispose(): void;
}

export function createVoz(base: string, token: string, fetchImpl: typeof fetch = (...a) => fetch(...a)): Voz {
  const api: Api = createApi(base, token, fetchImpl);
  const V = {
    on: false,
    callReady: false,
    actual: null as string | null,
    options: [] as VoiceOption[],
    audio: null as HTMLAudioElement | null,
    cache: new Map<string, Promise<string>>(),
    seeded: false,
  };
  const hdr = (h: Record<string, string>) => (token ? { ...h, 'X-Myo-Token': token } : h);

  async function init() {
    if (!base) {
      V.on = false;
      return;
    }
    try {
      let j = await api<{ tts?: boolean; opciones?: VoiceOption[]; actual?: string; llamada?: boolean }>(
        '/api/voz/estado',
      );
      // Nadie eligió voces todavía: se ofrecen las prediseñadas aptas para español, primero las de mujer.
      if (j.tts && !(j.opciones || []).length && !V.seeded) {
        V.seeded = true;
        const all = await api<{
          voces: { id: string; name: string; es: boolean; category: string; gender: string; preview: string }[];
        }>('/api/voz/voces');
        const vs = all.voces
          .filter((v) => v.es && v.category === 'premade')
          .sort((a, b) => Number(b.gender === 'female') - Number(a.gender === 'female'))
          .slice(0, 6)
          .map((v) => ({ id: v.id, name: v.name.split(' - ')[0].trim(), kind: 'biblioteca', preview: v.preview }));
        if (vs.length) {
          const r = await api<{ actual: string; opciones: VoiceOption[] }>('/api/voz/opciones', {
            body: { opciones: vs, actual: vs[0].id },
          });
          j = { ...j, actual: r.actual, opciones: r.opciones };
        }
      }
      V.actual = j.actual ?? null;
      V.options = j.opciones || [];
      V.callReady = !!j.llamada;
      V.on = !!(j.tts && j.actual);
    } catch {
      V.on = false;
    }
  }

  const key = (t: string, e: string) => `${V.actual}|${e}|${t}`;
  function fetchAudio(text: string, emo: string): Promise<string> {
    const k = key(text, emo);
    const hit = V.cache.get(k);
    if (hit) return hit;
    const p = fetchImpl(`${base}/api/voz/tts`, {
      method: 'POST',
      headers: hdr({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ text, emo }),
    }).then(async (r) => {
      if (!r.ok) throw new Error(`tts HTTP ${r.status}`);
      return URL.createObjectURL(await r.blob());
    });
    p.catch(() => V.cache.delete(k));
    V.cache.set(k, p);
    if (V.cache.size > 60) {
      const [old] = V.cache.keys();
      V.cache.get(old)?.then(
        (u) => URL.revokeObjectURL(u),
        () => {},
      );
      V.cache.delete(old);
    }
    return p;
  }

  function stop() {
    if (V.audio) {
      V.audio.pause();
      V.audio = null;
    }
  }

  let poll: ReturnType<typeof setInterval> | null = null;

  return {
    get on() {
      return V.on;
    },
    get callReady() {
      return V.callReady;
    },
    get options() {
      return V.options;
    },
    name: () => V.options.find((o) => o.id === V.actual)?.name || '',
    init,
    prefetch(items) {
      if (!V.on) return;
      for (const [t, e] of items) if (t) fetchAudio(t, e).catch(() => {});
    },
    stop,
    async speak(text, emo = 'seria') {
      const clean = String(text)
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
        .trim();
      if (!clean) return;
      const url = await fetchAudio(clean, emo);
      stop();
      const a = new Audio(url);
      V.audio = a;
      await new Promise<void>((ok, ko) => {
        a.onended = () => ok();
        a.onerror = () => ko(new Error('audio'));
        a.play().catch(ko);
      });
      if (V.audio === a) V.audio = null;
    },
    async next() {
      if (!V.options.length) return false;
      const i = V.options.findIndex((o) => o.id === V.actual);
      const nextVoice = V.options[(i + 1) % V.options.length];
      try {
        await api('/api/voz/elegir', { body: { id: nextVoice.id } });
        V.actual = nextVoice.id;
        V.on = true;
      } catch {
        // la TV actual avisa en la isla; aquí el que llama decide
      }
      return true;
    },
    async emergency(alarmId, h) {
      if (!V.callReady) return; // sin llamada configurada: la alarma sigue siendo una simulación
      h.markReal();
      h.setSub('📞 Llamando al contacto de emergencia…');
      try {
        const j = await api<{ conversationId?: string }>('/api/emergencia/llamar', {
          body: { alarmId, motivo: 'activó la alarma de emergencia' },
        });
        h.log(`llamada de emergencia: ${j.conversationId || 'ok'}`);
        let waits = 0;
        poll = setInterval(async () => {
          if (!h.alive()) {
            if (poll) clearInterval(poll);
            return;
          }
          try {
            const e = await api<{
              estado: string;
              contacto?: string;
              varios?: boolean;
              viene?: boolean;
              respuesta?: string;
            }>('/api/emergencia/estado');
            const who = e.contacto || 'Tu contacto';
            const pl = !!e.varios;
            const stopPoll = () => poll && clearInterval(poll);
            if (e.estado === 'failed') {
              h.setSub(
                pl ? `⚠️ ${who} no contestaron · las llamadas fallaron` : `⚠️ ${who} no contestó · la llamada falló`,
              );
              stopPoll();
              return;
            }
            if (e.estado === 'done' && e.viene === true) {
              stopPoll();
              h.confirmed(who, e.respuesta || '');
              return;
            }
            if (e.estado === 'done' && e.viene === false) {
              stopPoll();
              h.setSub(`⚠️ ${who} no ${pl ? 'pueden' : 'puede'} ir${e.respuesta ? `: ${e.respuesta}` : ''}`);
              h.island('⚠️', `${who} no ${pl ? 'pueden' : 'puede'} ir. La alarma sigue activa.`);
              return;
            }
            const texts: Record<string, string> = {
              initiated: `📤 Llamada enviada a ${who} · sonando…`,
              'in-progress': pl
                ? `📞 ${who} contestaron · están escuchando el aviso`
                : `📞 ${who} contestó · está escuchando el aviso`,
              processing: '📞 Llamada terminada · confirmando la respuesta…',
              done: '📞 Llamada terminada · confirmando la respuesta…',
            };
            h.setSub(texts[e.estado] || '');
            if (e.estado === 'done' && ++waits > 8) {
              h.setSub(`📞 ${who} ${pl ? 'recibieron' : 'recibió'} el aviso · falta confirmar con el llavero`);
              stopPoll();
            }
          } catch {
            // se reintenta en el próximo ciclo
          }
        }, 4000);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        h.setSub(`⚠️ No se pudo llamar: ${msg}`);
        h.island('⚠️', `Llamada de emergencia falló: ${msg}`);
      }
    },
    dispose() {
      stop();
      if (poll) clearInterval(poll);
    },
  };
}
