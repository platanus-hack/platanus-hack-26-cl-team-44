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
  const reach = 24;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const hit = (x, y) => document.elementFromPoint(x, y)?.closest(selector);
  let previous;
  function reset() { previous = null; }
  function aim(p, now, eligible, assisted = true) {
    const direct = hit(p.x, p.y);
    let target = eligible(direct) ? direct : null;
    if (!assisted) { reset(); return {...p,target,inside:Boolean(target)}; }
    let edge;
    if (!direct) {
      let best = reach;
      for (const el of document.querySelectorAll(selector)) {
        if (!eligible(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        const x = clamp(p.x, r.left, r.right), y = clamp(p.y, r.top, r.bottom);
        const distance = Math.hypot(x - p.x, y - p.y);
        const score = distance - (el === previous ? 4 : 0);
        if (distance >= reach || score >= best) continue;
        if (hit(clamp(x,r.left+1,r.right-1), clamp(y,r.top+1,r.bottom-1)) !== el) continue;
        best = score;
        target = el;
        edge = {x, y, distance};
      }
    }
    previous = target;
    if (!target) return {...p, target:null, inside:false};
    if (edge) {
      const pull = .85 * (1 - edge.distance / reach);
      return {x:p.x+(edge.x-p.x)*pull, y:p.y+(edge.y-p.y)*pull, target, inside:false};
    }
    const r = target.getBoundingClientRect();
    const dx = r.left + r.width / 2 - p.x, dy = r.top + r.height / 2 - p.y;
    const strength = Math.min(.48, 58 / (Math.hypot(dx, dy) || 1));
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
  function resolve(point, now, layer, cursor, sensor, gaze, assisted = true) {
    if (document.hidden || (sensor?.on && (!sensor.raw || now-sensor.lastFace>240 ||
        (sensor.mode === 'gaze' && (!gaze?.cur || gaze.cur.blink))))) {
      reset();
      return {target:null};
    }
    const aim = magnet.aim(point, now, el => el?.isConnected && layer?.contains(el) && !el.disabled && !el.closest('[hidden],[inert],[aria-disabled="true"]'), assisted);
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
