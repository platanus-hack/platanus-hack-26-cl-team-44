// Reglas del teclado de la TV. Port de software/toki-os/woki-os.html:961-962 y 1437-1458.

/** "Borrar" que acelera: la 1.ª vez borra una letra; seguido, el resto de la palabra y luego palabra a palabra. */
export const DEL_STREAK_MS = 2600;

export function deleteStep(text: string, streak: number): string {
  if (streak <= 1) return text.slice(0, -1);
  return text.replace(/\s+$/, '').replace(/[^\s]+$/, '');
}

export const fold = (s: string) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Iniciales de cada palabra: "Sí, me parece bien" → "smpb". */
export const initialsOf = (t: string) => (fold(t).match(/[a-zñ0-9]+/g) || []).map((w) => w[0]).join('');

export function curWord(text: string): string {
  const m = text.match(/([^\s]*)$/);
  return m ? m[1] : '';
}

export function prevWord(text: string): string {
  const m = text.replace(/[^\s]*$/, '').match(/([^\s.!?]+)[\s]*$/);
  return m ? m[1] : '';
}

export function atSentenceStart(text: string): boolean {
  const before = text.replace(/[^\s]*$/, '');
  return /^\s*$/.test(before) || /[.!?]\s*$/.test(before);
}

/** Letra nueva: mayúscula al inicio de frase. woki-os.html:1680 */
export function typeLetter(text: string, letter: string): string {
  return text + (text === '' || /[.!?]\s$/.test(text) ? letter : letter.toLowerCase());
}

export const showWord = (w: string) => w.charAt(0).toLocaleUpperCase('es') + w.slice(1);
