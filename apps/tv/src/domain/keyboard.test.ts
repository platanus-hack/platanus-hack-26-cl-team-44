// Mismos casos que tests/test_os_delete.cjs y reglas del teclado por iniciales.
import { describe, expect, it } from 'vitest';
import { atSentenceStart, curWord, deleteStep, initialsOf, prevWord, typeLetter } from './keyboard';

describe('borrar que acelera', () => {
  it('borra letra, resto de la palabra y palabra a palabra', () => {
    expect(deleteStep('Me duele la cabezz', 1)).toBe('Me duele la cabez');
    expect(deleteStep('Me duele la cabez', 2)).toBe('Me duele la ');
    expect(deleteStep('Me duele ', 1)).toBe('Me duele');
    expect(deleteStep('Me duele', 2)).toBe('Me ');
    expect(deleteStep('Me duele la ', 3)).toBe('Me duele ');
    expect(deleteStep('Me ', 3)).toBe('');
    expect(deleteStep('', 3)).toBe('');
    expect(deleteStep('Hola, ¿cómo estás?', 2)).toBe('Hola, ¿cómo ');
  });
});

describe('texto del teclado', () => {
  it('calcula iniciales sin tildes', () => {
    expect(initialsOf('Sí, me parece bien.')).toBe('smpb');
    expect(initialsOf('¿Mañana?')).toBe('m');
  });

  it('separa la palabra en curso y la anterior', () => {
    expect(curWord('hola com')).toBe('com');
    expect(prevWord('hola com')).toBe('hola');
    expect(prevWord('Hola. ')).toBe('');
    expect(atSentenceStart('Hola. ')).toBe(true);
    expect(atSentenceStart('Hola ')).toBe(false);
  });

  it('pone mayúscula al inicio de frase', () => {
    expect(typeLetter('', 'H')).toBe('H');
    expect(typeLetter('H', 'O')).toBe('Ho');
    expect(typeLetter('Hola. ', 'V')).toBe('Hola. V');
  });
});
