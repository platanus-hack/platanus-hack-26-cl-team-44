// Memoria local: palabras y frases que la persona ya usó. Misma clave que la TV actual (woki.mem.v1).
// Port de software/toki-os/woki-os.html:1416-1421.

export interface MemoryData {
  words: Record<string, number>;
  phrases: { t: string; at: number }[];
}

export interface Memory {
  readonly m: MemoryData;
  add(text: string): void;
  top(prefix: string): string[];
  uses(text: string): number;
}

const KEY = 'woki.mem.v1';

export function createMemory(storage: Pick<Storage, 'getItem' | 'setItem'> | null = safeStorage()): Memory {
  let m: MemoryData = { words: {}, phrases: [] };
  try {
    const saved = JSON.parse(storage?.getItem(KEY) ?? 'null');
    if (saved?.words && Array.isArray(saved.phrases)) m = saved;
  } catch {
    // datos corruptos: se empieza de cero
  }
  return {
    m,
    add(text: string) {
      for (const w of text.toLowerCase().match(/[a-záéíóúñü]+/g) || [])
        if (w.length > 2) m.words[w] = (m.words[w] || 0) + 1;
      m.phrases.unshift({ t: text, at: Date.now() });
      m.phrases = m.phrases.slice(0, 300);
      try {
        storage?.setItem(KEY, JSON.stringify(m));
      } catch {
        // almacenamiento lleno
      }
    },
    top(prefix: string) {
      return Object.entries(m.words)
        .filter(([w]) => w.startsWith(prefix) && w !== prefix)
        .sort((a, b) => b[1] - a[1])
        .map(([w]) => w);
    },
    uses(text: string) {
      return m.phrases.filter((p) => p.t === text).length;
    },
  };
}

function safeStorage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}
