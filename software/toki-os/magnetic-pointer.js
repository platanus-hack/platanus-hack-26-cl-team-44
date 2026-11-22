// Count time on a target, including movement anywhere within its face.
window.createPointerDwell = function () {
  const graceMs = 160;
  let target, lastSample, lastInside, wasInside, elapsed;
  function reset() { target = null; }
  function sample(el, now, inside) {
    if (!el) { reset(); return -1; }
    if (el !== target || now - lastSample > graceMs || now - lastInside > graceMs) {
      if (!inside) { reset(); return -1; }
      target = el;
      elapsed = 0;
    } else if (inside && wasInside) {
      elapsed += now - lastSample;
    }
    if (inside) lastInside = now;
    lastSample = now;
    wasInside = inside;
    return elapsed;
  }
  return {sample, reset};
};

// Pull towards the near edge on approach, then towards the center after entry.
// Sensor coordinates remain authoritative for dwell and switching to a neighbor.
window.createMagneticPointer = function (selector) {
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const hit = (x, y) => document.elementFromPoint(x, y)?.closest(selector);
  function extendEdge(value, start, size) {
    const fraction = (value - start) / size;
    if (fraction < 0 || fraction > 1) return value;
    const shift = Math.abs(.5 - fraction);
    const outer = Math.max(0, (shift - .26) / .24);
    return start + clamp(fraction + Math.sign(fraction - .5) * .10 * outer ** 1.35, 0, 1) * size;
  }
  function nearest(point, rect) {
    const x = clamp(point.x, rect.left, rect.right), y = clamp(point.y, rect.top, rect.bottom);
    return {x, y, distance: Math.hypot(x-point.x, y-point.y), from: point};
  }
  let previous;
  function reset() { previous = null; }
  function aim(raw, now, eligible, { magnetic = true, gazeBounds } = {}) {
    let p = raw, direct = hit(raw.x, raw.y);
    if (!magnetic) {
      reset();
      const target = eligible(direct) ? direct : null;
      return { ...raw, target, inside: !!target };
    }
    const gaze = gazeBounds?.width > 0 && gazeBounds?.height > 0;
    const reach = gaze ? clamp(.08 * Math.min(gazeBounds.width, gazeBounds.height), 32, 68) : 24;
    // Never steal a direct hit. A webcam point stopped short of the frame
    // edge gets a little more travel; the center of the screen is unchanged.
    if (gaze && !direct && raw.x >= gazeBounds.left && raw.x < gazeBounds.left + gazeBounds.width &&
        raw.y >= gazeBounds.top && raw.y < gazeBounds.top + gazeBounds.height) {
      p = {
        x: Math.min(gazeBounds.left + gazeBounds.width - 1, extendEdge(raw.x, gazeBounds.left, gazeBounds.width)),
        y: Math.min(gazeBounds.top + gazeBounds.height - 1, extendEdge(raw.y, gazeBounds.top, gazeBounds.height)),
      };
      direct = hit(p.x, p.y);
    }
    let target = eligible(direct) ? direct : null;
    let edge;
    if (!direct) {
      let best = reach;
      for (const el of document.querySelectorAll(selector)) {
        if (!eligible(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        let approach = nearest(p, r);
        if (p !== raw) {
          const original = nearest(raw, r);
          if (original.distance < approach.distance) approach = original;
        }
        const {x, y, distance} = approach;
        const score = distance - (el === previous ? 4 : 0);
        if (distance >= reach || score >= best) continue;
        if (hit(clamp(x,r.left+1,r.right-1), clamp(y,r.top+1,r.bottom-1)) !== el) continue;
        best = score;
        target = el;
        edge = approach;
      }
    }
    previous = target;
    if (!target) return {...p, target:null, inside:false};
    if (edge) {
      const pull = .85 * (1 - edge.distance / reach);
      const from = edge.from;
      return {x:from.x+(edge.x-from.x)*pull, y:from.y+(edge.y-from.y)*pull, target, inside:false};
    }
    const r = target.getBoundingClientRect();
    const dx = r.left + r.width / 2 - p.x, dy = r.top + r.height / 2 - p.y;
    const strength = Math.min(gaze ? .72 : .48, (gaze ? 100 : 58) / (Math.hypot(dx, dy) || 1));
    return {x:p.x+dx*strength, y:p.y+dy*strength, target, inside:true};
  }
  return {aim, reset};
};

// One decorative outline follows the selected control, inheriting its size and corners.
window.createDwellOutline = function () {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class','dwell-outline');
  svg.setAttribute('aria-hidden','true');
  svg.setAttribute('focusable','false');
  const track = document.createElementNS(ns, 'rect');
  const fill = document.createElementNS(ns, 'rect');
  fill.setAttribute('pathLength','1');
  svg.append(track, fill);
  let target;
  function clear() {
    if (!target) return;
    svg.remove();
    target.classList.remove('dwell-outline-anchor','has-dwell-outline');
    target = null;
  }
  function paint(el, progress) {
    if (!el) { clear(); return; }
    if (target !== el || svg.parentNode !== el) {
      clear();
      const style = getComputedStyle(el);
      svg.style.setProperty('--corner',style.borderTopLeftRadius);
      el.classList.toggle('dwell-outline-anchor',style.position === 'static');
      el.classList.add('has-dwell-outline');
      el.append(svg);
      target = el;
    }
    fill.setAttribute('stroke-dashoffset', String(1 - progress));
  }
  return {paint, clear};
};

// The keyboard and game menus draw inside a scaled stage. Their sensor coordinates
// stay untouched for calibration and for continuous controls inside a game.
window.createMenuPointer = function () {
  const magnet = window.createMagneticPointer('[data-t]');
  let lastActivation;
  function reset() { magnet.reset(); lastActivation = null; }
  function resolve(point, now, layer, cursor, sensor, gaze, options) {
    const gazeReady = gaze?.hasPoint ? gaze.hasPoint(now) : !!gaze?.cur && !gaze.cur.blink;
    if (document.hidden || (sensor?.on && (!sensor.raw || now-sensor.lastFace>240 ||
        (sensor.mode === 'gaze' && !gazeReady)))) {
      reset();
      return {target:null};
    }
    const aim = magnet.aim(point, now, el => el?.isConnected && layer?.contains(el) && !el.disabled && !el.closest('[hidden],[inert],[aria-disabled="true"]'), options);
    cursor.style.transform = 'translate('+aim.x+'px,'+aim.y+'px)';
    if (lastActivation) {
      if (aim.target === lastActivation.target || Math.hypot(point.x-lastActivation.x, point.y-lastActivation.y)<24) {
        return {...aim, target:null, inside:false};
      }
      lastActivation = null;
    }
    return aim;
  }
  return {resolve,reset,confirm(point, target){ lastActivation={x:point.x,y:point.y,target}; magnet.reset(); }};
};
