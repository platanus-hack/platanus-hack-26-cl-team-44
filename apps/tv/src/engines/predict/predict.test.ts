// Mismos casos que tests/test_predict.mjs, sobre el port en TypeScript.
import { describe, expect, it } from 'vitest';
import { createPredictor, normalize, type PredictorOptions } from './predict';

const memStorage = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => m.set(k, String(v)) };
};
const BASE: Array<[string, number]> = [
  ['año', 50],
  ['que', 900],
  ['de', 880],
  ['no', 800],
  ['cómo', 300],
  ['como', 280],
  ['casa', 120],
  ['cansada', 40],
  ['agua', 90],
  ['ahora', 150],
  ['hola', 200],
  ['gracias', 180],
  ['quiero', 160],
  ['mañana', 110],
  ['cena', 30],
];
const make = (opts: PredictorOptions = {}) =>
  createPredictor({
    base: BASE,
    corpus: ['quiero agua por favor', 'quiero ir a casa', 'hola cómo estás'],
    storage: memStorage(),
    ...opts,
  });
const words = (list: { word: string }[]) => list.map((x) => x.word);

describe('predicción de palabras', () => {
  it('ignora tildes, conserva la ñ y tolera un error', () => {
    expect(normalize('Cómo')).toBe('como');
    expect(normalize('Año pingüino')).toBe('año pinguino');
    const p = make();
    const s = words(p.suggest('', 'com'));
    expect(s).toContain('cómo');
    expect(s).toContain('como');
    expect(words(p.suggest('', 'manana'))).toEqual(['mañana']);
    expect(p.suggest('', 'an').some((x) => x.word === 'año')).toBe(false);
  });

  it('oculta una variante sin tilde poco frecuente y muestra dos formas frecuentes', () => {
    const p = createPredictor({
      base: [...BASE, ['único', 100], ['unico', 9]],
      storage: memStorage(),
    });
    const s = words(p.suggest('', 'uni'));
    expect(s).toContain('único');
    expect(s).not.toContain('unico');
    expect(words(p.suggest('', 'com'))).toContain('como');
  });

  it('completa por prefijo y ordena por frecuencia', () => {
    expect(words(make().suggest('', 'ca')).slice(0, 2)).toEqual(['casa', 'cansada']);
  });

  it('predice la siguiente palabra por contexto', () => {
    expect(make().suggest('quiero', '')[0].word).toBe('agua');
  });

  it('aprende del uso', () => {
    const p = make();
    expect(p.suggest('', 'ca')[0].word).toBe('casa');
    for (let i = 0; i < 3; i++) p.learn('Estoy cansada hoy');
    expect(p.suggest('', 'ca')[0].word).toBe('cansada');
    expect(p.suggest('estoy', '')[0].word).toBe('cansada');
  });

  it('recuerda nombres propios con mayúscula', () => {
    const p = make();
    p.learn('Llama a Camila por favor');
    const s = p.suggest('a', 'cam');
    expect(s[0].word).toBe('Camila');
    expect(s[0].name).toBe(true);
    const q = createPredictor({ base: [...BASE, ['camila', 20]], storage: memStorage() });
    q.learn('Mañana viene Camila');
    expect(q.suggest('', 'cam')[0].word).toBe('Camila');
    q.learn('una camila de flores');
    q.learn('otra camila más');
    expect(q.suggest('', 'cam')[0].word).toBe('camila');
  });

  it('no se rompe con propiedades internas de JavaScript', () => {
    const p = createPredictor({
      base: [...BASE, ['constructor', 30], ['valueof', 1], ['tostring', 1]],
      storage: memStorage(),
    });
    expect(p.suggest('', 'cons').some((x) => x.word === 'constructor')).toBe(true);
    p.learn('el constructor llegó');
    p.learn('__proto__ constructor');
    expect(() => p.suggest('el', '')).not.toThrow();
  });

  it('persiste entre sesiones y tolera datos corruptos', () => {
    const storage = memStorage();
    createPredictor({ base: BASE, storage }).learn('quiero mi chaleco');
    expect(createPredictor({ base: BASE, storage }).suggest('mi', '')[0].word).toBe('chaleco');
    storage.setItem('woki.pred.v1', '{basura');
    expect(() => createPredictor({ base: BASE, storage }).suggest('', 'a')).not.toThrow();
  });

  it('encuentra la palabra con una letra cambiada, no repite lo escrito y respeta el límite', () => {
    const p = make();
    expect(words(p.suggest('', 'graxi'))).toContain('gracias');
    expect(p.suggest('', 'hola').some((x) => x.word === 'hola')).toBe(false);
    expect(p.suggest('', '', 3).length).toBeLessThanOrEqual(3);
  });

  it('formatea mayúsculas al insertar', () => {
    const p = make();
    expect(p.format('casa', { sentenceStart: true })).toBe('Casa');
    expect(p.format('casa', { sentenceStart: false })).toBe('casa');
    expect(p.format('Camila', { sentenceStart: false, name: true })).toBe('Camila');
  });
});
