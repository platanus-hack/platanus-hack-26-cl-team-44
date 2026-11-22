// Un solo contorno decorativo sigue al control elegido, con su tamaño y sus esquinas.
// Port de software/toki-os/magnetic-pointer.js:98-129.

export interface DwellOutline {
  paint(el: HTMLElement | null, progress: number): void;
  clear(): void;
}

export function createDwellOutline(): DwellOutline {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'dwell-outline');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const track = document.createElementNS(ns, 'rect');
  const fill = document.createElementNS(ns, 'rect');
  fill.setAttribute('pathLength', '1');
  svg.append(track, fill);
  let target: HTMLElement | null = null;
  function clear() {
    if (!target) return;
    svg.remove();
    target.classList.remove('dwell-outline-anchor', 'has-dwell-outline');
    target = null;
  }
  function paint(el: HTMLElement | null, progress: number) {
    if (!el) {
      clear();
      return;
    }
    if (target !== el || svg.parentNode !== el) {
      clear();
      const style = getComputedStyle(el);
      svg.style.setProperty('--corner', style.borderTopLeftRadius);
      el.classList.toggle('dwell-outline-anchor', style.position === 'static');
      el.classList.add('has-dwell-outline');
      el.append(svg);
      target = el;
    }
    fill.setAttribute('stroke-dashoffset', String(1 - progress));
  }
  return { paint, clear };
}
