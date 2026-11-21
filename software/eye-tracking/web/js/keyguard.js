/**
 * Protección contra teclas "fantasma".
 *
 * Con el iPhone apoyado sobre el teclado del MacBook, cualquier movimiento del computador
 * hace que el iPhone apriete o mantenga apretada una tecla. Evidencia (log 21-11 13:42):
 * 149 pruebas de estabilidad lanzadas cada ~80 ms (= autorrepetición de una tecla sostenida),
 * superpuestas, con su cuenta "3, 2, 1" reiniciándose una y otra vez.
 *
 * Reglas:
 * 1. Una tecla sostenida (evento con `repeat`) nunca dispara un atajo: una persona aprieta y suelta.
 * 2. Los atajos que borran trabajo (recalibrar) piden dos pulsaciones seguidas.
 */

const TEXT_INPUT = /^(INPUT|TEXTAREA|SELECT)$/;

/** ¿Este evento viene de escribir en un campo de texto? (ahí la autorrepetición es normal) */
export function isTyping(e) {
  const t = e?.target;
  return Boolean(t && (TEXT_INPUT.test(t.tagName ?? "") || t.isContentEditable));
}

/** true si el evento debe ignorarse como atajo: tecla sostenida fuera de un campo de texto. */
export function isStuckKey(e) {
  return Boolean(e?.repeat) && !isTyping(e);
}

/**
 * Confirmación por doble pulsación. `press()` devuelve true solo si es la segunda pulsación
 * dentro de `windowMs`; la primera devuelve false (y el llamador muestra "pulsa otra vez").
 */
export function createDoublePress(windowMs = 1500, now = () => performance.now()) {
  let first = -Infinity;
  return {
    press() {
      const t = now();
      if (t - first <= windowMs) {
        first = -Infinity;
        return true;
      }
      first = t;
      return false;
    },
    reset() { first = -Infinity; },
  };
}

/**
 * Instala la protección global (fase de captura: corre antes que cualquier atajo).
 * @param {{onStuck:(key:string)=>void}} opts aviso a la persona (se llama como máx. 1 vez cada 3 s)
 * @returns {() => void} desinstala
 */
export function installKeyGuard({ onStuck, now = () => performance.now() }) {
  let lastWarn = -Infinity;
  const handler = (e) => {
    if (!isStuckKey(e)) return;
    // preventDefault también evita que un botón con foco se "clickee" en cada repetición de Enter/Espacio.
    e.preventDefault();
    e.stopImmediatePropagation();
    const t = now();
    if (t - lastWarn > 3000) {
      lastWarn = t;
      onStuck?.(e.key);
    }
  };
  addEventListener("keydown", handler, { capture: true });
  return () => removeEventListener("keydown", handler, { capture: true });
}
