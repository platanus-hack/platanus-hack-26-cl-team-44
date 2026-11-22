// Datos de la TV: tarjetas de Inicio, emociones, frases locales y reacciones.
// Copia fiel de software/toki-os/woki-os.html:734-802. Mismos textos.

export type EmoId = 'ironica' | 'alegre' | 'carinosa' | 'susurro' | 'seria' | 'entusiasta';

export interface Emotion {
  id: EmoId;
  e: string;
  n: string;
  rate: number;
  pitch: number;
  vol: number;
}

/** [acción, degradado, ícono, título, subtítulo, permanencia forzada en ms] */
export type Tile = [string, string, string, string, string, number?];

export const TILES: Tile[] = [
  ['go:talk', 'g-blue', 'i-chat', 'Hablar', 'Respuestas sugeridas'],
  ['go:keyboard', 'g-indigo', 'i-keys', 'Escribir', 'Teclado por grupos'],
  ['go:contacts', 'g-green', 'i-send', 'Mensajes', 'WhatsApp a los tuyos'],
  ['sos', 'g-red', 'i-alert', 'SOS', 'Pedir ayuda ya', 2000], // mirada 2 s: que no se active sin querer
  ['go:apps', 'g-white', 'i-apps', 'Apps', 'Música, compras y noticias'],
  ['go:games', 'g-white', 'i-gamepad', 'Juegos', 'Eye Gaze Games'],
  ['rest', 'g-purple', 'i-moon', 'Descansar', 'Pausa la mirada'],
  ['go:settings', 'g-gray', 'i-gear', 'Ajustes', 'Tiempo, voz, modo'],
];

export const EMOS: Emotion[] = [
  { id: 'ironica', e: '😏', n: 'irónica', rate: 0.95, pitch: 1.05, vol: 1 },
  { id: 'alegre', e: '😄', n: 'alegre', rate: 1.08, pitch: 1.2, vol: 1 },
  { id: 'carinosa', e: '🥰', n: 'cariñosa', rate: 0.9, pitch: 1.12, vol: 0.95 },
  { id: 'susurro', e: '🤫', n: 'susurro', rate: 0.88, pitch: 1, vol: 0.45 },
  { id: 'seria', e: '😐', n: 'seria', rate: 0.95, pitch: 0.9, vol: 1 },
  { id: 'entusiasta', e: '🤩', n: 'entusiasta', rate: 1.18, pitch: 1.3, vol: 1 },
];

export const EMO: Record<EmoId, Emotion> = Object.fromEntries(EMOS.map((e) => [e.id, e])) as Record<EmoId, Emotion>;

export function isEmo(id: unknown): id is EmoId {
  return typeof id === 'string' && id in EMO;
}

/** [texto, tono, emoción] */
export type Phrase = [string, string, string];

export interface Rule {
  k: RegExp;
  s: Phrase[][];
}

// Cada tema tiene 4 posiciones con una intención fija y varias formas de decirla.
export const RULES: Rule[] = [
  {
    k: /cena|comer|almuerz|domingo|once/i,
    s: [
      [
        ['¡Obvio! Guárdame del postre de la abuela.', 'cariñosa', 'carinosa'],
        ['¡Claro que voy! Me encanta cenar con ustedes.', 'cariñosa', 'carinosa'],
        ['¡Sí! Ya me estaba haciendo falta verlos.', 'cariñosa', 'alegre'],
      ],
      [
        ['Sí, llego a las 8.', 'breve', 'seria'],
        ['Dale, ahí estaré.', 'breve', 'alegre'],
        ['Cuenta conmigo.', 'breve', 'seria'],
      ],
      [
        ['Si cocina tu papá, lo pienso.', 'con humor', 'ironica'],
        ['Voy, pero yo no lavo los platos.', 'con humor', 'ironica'],
        ['¿Hay postre? Entonces sí.', 'con humor', 'alegre'],
      ],
      [
        ['Este domingo no puedo, ¿el próximo?', 'neutra', 'seria'],
        ['Hoy estoy cansada, ¿lo dejamos para otro día?', 'honesta', 'seria'],
        ['Mejor vengan ustedes a la casa.', 'propuesta', 'carinosa'],
      ],
    ],
  },
  {
    k: /c[oó]mo est[aá]s|c[oó]mo te sientes|qu[eé] tal/i,
    s: [
      [
        ['Bien, con ganas de verte.', 'cariñosa', 'carinosa'],
        ['Feliz de que estés aquí.', 'cariñosa', 'carinosa'],
        ['Mejor ahora que llegaste.', 'cariñosa', 'carinosa'],
      ],
      [
        ['Cansada, pero contenta de que vinieras.', 'honesta', 'seria'],
        ['Más o menos, hoy fue un día largo.', 'honesta', 'seria'],
        ['Tranquila, sin novedad.', 'breve', 'seria'],
      ],
      [
        ['Mejor que tu equipo de fútbol.', 'con humor', 'ironica'],
        ['Divina, como siempre.', 'con humor', 'ironica'],
        ['Lista para una maratón… de series.', 'con humor', 'alegre'],
      ],
      [
        ['Un poco adolorida hoy.', 'breve', 'seria'],
        ['Me duele la espalda, pero bien.', 'honesta', 'seria'],
        ['Con sueño, dormí mal.', 'breve', 'seria'],
      ],
    ],
  },
  {
    k: /duele|dolor|molest/i,
    s: [
      [
        ['Sí, me duele la espalda.', 'directa', 'seria'],
        ['Sí, me duelen las piernas.', 'directa', 'seria'],
        ['Sí, me duele el cuello.', 'directa', 'seria'],
      ],
      [
        ['Un poco, ¿me cambias de posición?', 'pedido', 'seria'],
        ['¿Me acomodas la almohada?', 'pedido', 'seria'],
        ['¿Me subes un poco la cama?', 'pedido', 'seria'],
      ],
      [
        ['No, estoy bien, tranquila.', 'calma', 'carinosa'],
        ['Ya se me pasó, gracias.', 'calma', 'carinosa'],
        ['Nada grave, no te preocupes.', 'calma', 'carinosa'],
      ],
      [
        ['Me duele la cabeza, ¿me das algo?', 'pedido', 'seria'],
        ['¿Me toca el remedio?', 'pedido', 'seria'],
        ['Llama a la enfermera, porfa.', 'pedido', 'seria'],
      ],
    ],
  },
  {
    k: /fr[ií]o|calor|tapo|ventana/i,
    s: [
      [
        ['Tengo frío, ¿me tapas?', 'pedido', 'carinosa'],
        ['¿Me pasas la manta?', 'pedido', 'carinosa'],
        ['Tengo los pies helados.', 'pedido', 'seria'],
      ],
      [
        ['Abre la ventana, porfa.', 'pedido', 'seria'],
        ['¿Me prendes el ventilador?', 'pedido', 'seria'],
        ['Sácame una frazada, porfa.', 'pedido', 'seria'],
      ],
      [
        ['Estoy perfecta así.', 'breve', 'alegre'],
        ['Así está bien, gracias.', 'breve', 'seria'],
        ['No cambies nada, estoy cómoda.', 'breve', 'alegre'],
      ],
      [
        ['Hace un calor de infierno.', 'con humor', 'ironica'],
        ['Parece que vivo en el Polo Norte.', 'con humor', 'ironica'],
        ['¿Quién apagó el sol?', 'con humor', 'ironica'],
      ],
    ],
  },
  {
    k: /agua|sed|tomar|caf[eé]/i,
    s: [
      [
        ['Sí, agua por favor.', 'breve', 'seria'],
        ['Agua fresca, porfa.', 'breve', 'seria'],
        ['Un vaso de agua, gracias.', 'breve', 'seria'],
      ],
      [
        ['Un café, si hay.', 'pedido', 'alegre'],
        ['Un té con limón.', 'pedido', 'alegre'],
        ['Un jugo, porfa.', 'pedido', 'alegre'],
      ],
      [
        ['No, gracias.', 'breve', 'seria'],
        ['Ahora no, después.', 'breve', 'seria'],
        ['Estoy bien así.', 'breve', 'seria'],
      ],
      [
        ['Una cerveza, pero no le digas al doctor.', 'con humor', 'ironica'],
        ['Un pisco sour, por si cuela.', 'con humor', 'ironica'],
        ['Champaña, que hoy celebramos.', 'con humor', 'alegre'],
      ],
    ],
  },
];

export const DEFAULT: Phrase[][] = [
  [
    ['Sí, claro.', 'breve', 'seria'],
    ['Obvio.', 'breve', 'alegre'],
    ['Me parece bien.', 'breve', 'seria'],
  ],
  [
    ['Cuéntame más.', 'interés', 'alegre'],
    ['¿Y qué pasó después?', 'interés', 'alegre'],
    ['No te creo, ¿en serio?', 'interés', 'entusiasta'],
  ],
  [
    ['Dame un segundo, lo estoy pensando.', 'pausa', 'seria'],
    ['Espera, que estoy escribiendo.', 'pausa', 'seria'],
    ['Déjame pensarlo.', 'pausa', 'seria'],
  ],
  [
    ['Jajaja, no puedo contigo.', 'con humor', 'alegre'],
    ['Te pasaste, jajaja.', 'con humor', 'alegre'],
    ['Eres un caso perdido.', 'con humor', 'ironica'],
  ],
];

/** Frases genéricas del chat de WhatsApp. woki-os.html:884 */
export const GENERIC: Phrase[] = [
  ['Sí, me parece bien.', 'de acuerdo', 'seria'],
  ['No estoy segura.', 'duda', 'seria'],
];

/** [emoji, texto, emoción] */
export const REACTS: Phrase[] = [
  ['😂', 'jajaja', 'alegre'],
  ['😱', '¡no!', 'entusiasta'],
  ['🤔', 'mmm…', 'seria'],
  ['❤️', 'te quiero', 'carinosa'],
  ['🙄', '¿en serio?', 'ironica'],
  ['✋', 'espera', 'seria'],
  ['😋', '¡qué rico!', 'alegre'],
  ['👍', 'dale', 'alegre'],
];

export const GROUPS = ['ABCDE', 'FGHIJ', 'KLMNÑ', 'OPQRS', 'TUVWXYZ'];
export const REACT_PAGE = 4;

export const WORDS = (
  'que de no a la el es y en lo un por me una te los se con para mi está si pero las bien sí más ya muy hola gracias ' +
  'quiero puedo hoy mañana domingo cena casa ahora después tengo frío calor agua dolor espalda cabeza posición ayuda ' +
  'cansada contenta mamá hija hijo nieto sofía camila amor también nunca siempre llámame ven espera favor porfa listo ' +
  'bueno vale dale claro obvio todo nada algo mucho poco feliz triste rico tele música película dormir comer baño luz ventana'
).split(' ');

export interface Card {
  text: string;
  tone: string;
  emo: EmoId;
  plain?: boolean;
  ai?: boolean;
  traza?: Trace | null;
}

export interface Trace {
  origen?: string;
  fuentes?: { id: string; tipo?: string; texto?: string }[];
  inventadas?: string[];
  iniciales?: string;
  de?: string;
  tema?: string;
  fuente?: string;
  motivo?: string;
  nota?: string;
}

export const toCard = ([text, tone, emo]: Phrase): Card => ({ text, tone, emo: isEmo(emo) ? emo : 'seria' });

/**
 * Elige una forma por posición. Nunca repite la de la vez anterior y prefiere un poco las que
 * la persona ya usa. woki-os.html:787-796
 */
export function createVariantPicker(usesOf: (text: string) => number, random: () => number = Math.random) {
  const lastPick: Record<string, string> = {};
  return function pickVariants(key: string, slots: Phrase[][]): Phrase[] {
    return slots.map((vars, i) => {
      const k = `${key}:${i}`;
      const pool = vars.length > 1 ? vars.filter((v) => v[0] !== lastPick[k]) : vars;
      const weights = pool.map((v) => 1 + Math.min(2, usesOf(v[0])));
      let r = random() * weights.reduce((a, b) => a + b, 0);
      let chosen = pool[0];
      for (let n = 0; n < pool.length; n++) {
        r -= weights[n];
        if (r <= 0) {
          chosen = pool[n];
          break;
        }
      }
      lastPick[k] = chosen[0];
      return chosen;
    });
  };
}

/** Frases locales para un contexto: regla del tema o frases por defecto. woki-os.html:1371 */
export function localSuggestions(ctx: string, pick: ReturnType<typeof createVariantPicker>) {
  const rule = RULES.find((r) => r.k.test(ctx));
  return { phrases: pick(rule ? String(rule.k) : 'default', rule ? rule.s : DEFAULT), generic: !rule };
}
