// Screen-normalized positions. The slow response steadies fixations; two
// agreeing samples unlock the fast response without chasing a single spike.
export function createGazeStabilizer() {
  let previous, filtered, moving = false;

  function reset() { previous = filtered = null; moving = false; }

  function sample(point) {
    if (!previous || point.capturedAt - previous.capturedAt > 240) {
      moving = false;
      previous = point;
      return filtered = { x: point.x, y: point.y };
    }
    const dt = point.capturedAt - previous.capturedAt;
    if (dt <= 0) return filtered;

    const dx = point.x - filtered.x, dy = point.y - filtered.y;
    const distance = Math.hypot(dx, dy);
    const px = previous.x - filtered.x, py = previous.y - filtered.y;
    const previousDistance = Math.hypot(px, py);
    const wasMoving = moving;
    moving = dt <= 120 && distance > (wasMoving ? .014 : .045) && previousDistance > (wasMoving ? .014 : .035) &&
      dx * px + dy * py > .8 * distance * previousDistance;
    previous = point;
    if (distance <= .006) return filtered;

    const speed = moving ? Math.max(wasMoving ? .9 : 0, Math.min(1, (distance - .045) / .075)) : 0;
    const responseMs = 190 + (24 - 190) * speed;
    const weight = (1 - Math.exp(-Math.min(dt, 70) / responseMs)) * (1 - .006 / distance);
    const gain = moving ? weight : Math.min(weight, .015 / distance);
    return filtered = { x: filtered.x + gain * dx, y: filtered.y + gain * dy };
  }

  return { sample, reset };
}
