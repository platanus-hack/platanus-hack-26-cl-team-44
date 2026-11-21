/**
 * Guía de ubicación: evalúa en vivo si la persona y el iPhone están bien puestos.
 * evaluateSetup es pura (testeable); renderSetup solo pinta.
 */

const deg = (rad) => (rad * 180) / Math.PI;
const len = (v) => Math.hypot(v[0], v[1], v[2]);
const angleBetween = (a, b) => {
  const la = len(a), lb = len(b);
  if (la < 1e-9 || lb < 1e-9) return 180;
  const c = (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (la * lb);
  return deg(Math.acos(Math.max(-1, Math.min(1, c))));
};

// Umbrales compartidos por los checks y el esquema: si el dibujo dice "dentro", el check está en verde.
export const ZONE = Object.freeze({ offHDeg: 7, offVDeg: 12, nearM: 0.3, farM: 0.65 });

/** Ángulos (°) de la cara respecto del eje de la cámara: + = a tu derecha / arriba. */
export function faceOffsets(headPos) {
  const z = Math.max(1e-6, -headPos[2]);
  return { h: deg(Math.atan2(headPos[0], z)), v: deg(Math.atan2(headPos[1], z)), distM: len(headPos) };
}

/**
 * Qué tiene que hacer quien ubica el iPhone, en una frase. Las instrucciones son para MOVER EL
 * iPHONE (no a la persona): quien usa la app puede no poder mover la cabeza.
 * @returns {{state:"searching"|"adjust"|"ok", inZone:boolean, message:string, off:{h:number,v:number,distM:number}|null}}
 */
export function placementHint(frame) {
  if (!frame || !frame.tracked) {
    return { state: "searching", inZone: false, off: null, message: "Buscando tu cara… Mira la pantalla y gira el iPhone hasta que su cámara frontal (la muesca) apunte a tus ojos." };
  }
  const off = faceOffsets(frame.headPos);
  const hOk = Math.abs(off.h) < ZONE.offHDeg, vOk = Math.abs(off.v) < ZONE.offVDeg;
  const inZone = hOk && vOk;
  let message;
  if (off.distM < ZONE.nearM) message = `Muy cerca (${Math.round(off.distM * 100)} cm): aleja el iPhone hasta 35–60 cm.`;
  else if (off.distM > ZONE.farM) message = `Muy lejos (${Math.round(off.distM * 100)} cm): acerca el iPhone hasta 35–60 cm.`;
  else if (!hOk) message = `Mueve el iPhone un poco hacia tu ${off.h > 0 ? "derecha" : "izquierda"}, hasta que quede frente a tu nariz.`;
  else if (!vOk) message = off.v > 0 ? "Inclina el iPhone para que su cámara mire más hacia arriba, a tus ojos." : "Inclina el iPhone para que su cámara mire un poco más hacia abajo, a tus ojos.";
  else message = "Bien ubicado. Ya puedes medir la estabilidad o calibrar.";
  const distOk = off.distM >= ZONE.nearM && off.distM <= ZONE.farM;
  return { state: inZone && distOk ? "ok" : "adjust", inZone, message, off };
}

/** Máxima desviación (°) de la gravedad respecto de la primera muestra. */
export function gravityWobble(history) {
  if (history.length < 2) return 0;
  return history.reduce((m, g) => Math.max(m, angleBetween(history[0], g)), 0);
}

/**
 * @param {object|null} frame último cuadro
 * @param {{fps:number}} stats estadísticas de conexión
 * @param {number[][]} gravityHistory últimas gravedades
 * @returns {{id:string, label:string, status:"ok"|"warn"|"bad", value:string, help:string, essential:boolean}[]}
 */
export function evaluateSetup(frame, stats, gravityHistory, placement = null) {
  const checks = [];
  const add = (id, label, status, value, help, essential = false) => checks.push({ id, label, status, value, help, essential });

  const fps = stats?.fps ?? 0;
  add("signal", "Señal del iPhone", fps >= 45 ? "ok" : fps >= 25 ? "warn" : "bad", `${fps} cuadros/s`,
    "Wi-Fi lento o saturado: acerca el Mac al router, o conecta por cable.", true);

  if (!frame || !frame.tracked) {
    add("face", "Tu cara", "bad", "No te veo", "Mira hacia el iPhone. Que nada tape tus cejas ni tus ojos.", true);
    return checks;
  }
  add("face", "Tu cara", "ok", "Detectada", "", true);

  // Los ejes de ARKit (x = lado largo del iPhone) solo coinciden con izquierda/derecha con el iPhone
  // horizontal: así se usó en todas las sesiones registradas. Vertical, el esquema y el centrado mienten.
  const g = frame.gravity ?? [0, 0, 0];
  if (Math.hypot(g[0], g[1]) > 0.2) {
    const landscape = Math.abs(g[0]) >= Math.abs(g[1]);
    add("orientation", "iPhone horizontal", landscape ? "ok" : "warn", landscape ? "Horizontal" : "Vertical",
      "Pon el iPhone acostado (horizontal), con la cámara frontal a un lado: así se interpretan bien izquierda y derecha.");
  }

  const d = len(frame.headPos);
  const dStatus = d >= ZONE.nearM && d <= ZONE.farM ? "ok" : d >= 0.22 && d <= 0.8 ? "warn" : "bad";
  add("distance", "Distancia al iPhone", dStatus, `${Math.round(d * 100)} cm`,
    d < 0.3 ? "Estás muy cerca: aléjate un poco (ideal 35–60 cm)." : "Estás lejos: acércate o acerca el iPhone (ideal 35–60 cm).", true);

  // ARKit pierde resolución (comprime la mirada) si la cara está desplazada del eje de la cámara.
  const offH = Math.abs(faceOffsets(frame.headPos).h);
  add("centered", "iPhone frente a tu cara", offH < ZONE.offHDeg ? "ok" : offH < 12 ? "warn" : "bad", `${Math.round(offH)}° al lado`,
    "Mueve el iPhone (o tu silla) para que quede justo frente a tu nariz: a un lado, ARKit comprime la mirada y cuesta llegar a ese borde.");

  if (placement) {
    const good = placement === "abajo" || placement === "al frente";
    add("placement", "Ubicación", good ? "ok" : "warn", placement,
      placement === "arriba"
        ? "Arriba funciona peor: al mirar hacia abajo los párpados tapan los ojos y al mirar el teclado se pierde la cara. Prueba abajo, centrado."
        : "A un lado la mirada hacia el lado opuesto se comprime. Prueba abajo, centrado.");
  }

  const toCamera = [-frame.headPos[0], -frame.headPos[1], -frame.headPos[2]];
  const a = angleBetween(frame.headFwd, toCamera);
  add("angle", "iPhone apuntando a tu cara", a < 30 ? "ok" : a < 45 ? "warn" : "bad", `${Math.round(a)}°`,
    "Gira o inclina el iPhone para que su cámara frontal mire tu cara.");

  const lux = frame.ambient;
  const luxStatus = lux <= 0 ? "warn" : lux >= 500 ? "ok" : lux >= 250 ? "warn" : "bad";
  add("light", "Luz en tu cara", luxStatus, lux <= 0 ? "sin dato" : `${Math.round(lux)}`,
    "Poca luz: enciende una lámpara frente o al lado tuyo (no detrás).");

  const open = frame.blinkL < 0.45 && frame.blinkR < 0.45;
  add("eyes", "Ojos visibles", open && frame.squint < 0.6 ? "ok" : "warn",
    `${Math.round((1 - frame.blinkL) * 100)}% · ${Math.round((1 - frame.blinkR) * 100)}%`,
    "Detecto ojos cerrados o entrecerrados. Si tienes lentes con reflejo, inclínalos un poco.");

  const wobble = gravityWobble(gravityHistory);
  add("steady", "iPhone firme", wobble < 1 ? "ok" : wobble < 3 ? "warn" : "bad", `${wobble.toFixed(1)}°`,
    "El iPhone se está moviendo: apóyalo contra algo firme. Si se mueve después, hay que recalibrar.");

  const th = frame.thermal;
  add("thermal", "Temperatura del iPhone", th <= 1 ? "ok" : th === 2 ? "warn" : "bad",
    ["Normal", "Tibio", "Caliente", "Muy caliente"][Math.max(0, Math.min(3, Math.round(th)))],
    "Quita la funda y aleja el iPhone del sol o del cargador inalámbrico.");

  return checks;
}

/** ¿Se puede calibrar? (todos los esenciales sin "bad") */
export function readyToCalibrate(checks) {
  return checks.filter((c) => c.essential).every((c) => c.status !== "bad");
}

/* ------------------------------ render ------------------------------ */

export function renderChecks(container, checks) {
  const html = checks
    .map((c) => `<div class="check" data-s="${c.status}"><i></i><b>${c.label}</b><span>${c.value}</span>${c.help ? `<small>${c.help}</small>` : ""}</div>`)
    .join("");
  if (container.dataset.last !== html) {
    container.innerHTML = html; // contenido 100% generado por nosotros (sin datos externos de texto)
    container.dataset.last = html;
  }
}

/**
 * Esquema "lo que ve el iPhone": la zona buena (mismos umbrales que los checks), tu cara, una flecha
 * en el iPhone hacia donde moverlo y un medidor de distancia. Debajo, UNA instrucción concreta.
 */
const VIZ = Object.freeze({ W: 400, H: 250, cx: 190, cy: 108, kPerDeg: 7 });
export function renderViz(svg, frame, msgEl = null) {
  const { W, H, cx, cy, kPerDeg: k } = VIZ;
  const hint = placementHint(frame);
  const zoneOk = hint.state === "ok";
  const zone = `<ellipse cx="${cx}" cy="${cy}" rx="${ZONE.offHDeg * k}" ry="${ZONE.offVDeg * k}" fill="${zoneOk ? "#dff3e7" : "none"}" stroke="${zoneOk ? "#1f9d5a" : "#a29e95"}" stroke-width="2.5" stroke-dasharray="${zoneOk ? "0" : "6 7"}"/>`;
  const phoneX = cx, phoneY = H - 26;
  let arrow = "";
  if (hint.off && Math.abs(hint.off.h) >= ZONE.offHDeg) {
    const dir = hint.off.h > 0 ? 1 : -1; // mover el iPhone hacia el lado donde está tu cara
    const x0 = phoneX + dir * 36, x1 = phoneX + dir * 76;
    arrow = `<path d="M${x0} ${phoneY} L${x1} ${phoneY} M${x1 - dir * 10} ${phoneY - 8} L${x1} ${phoneY} L${x1 - dir * 10} ${phoneY + 8}" stroke="#d98f0b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  }
  const phone = `<rect x="${phoneX - 28}" y="${phoneY - 11}" width="56" height="22" rx="7" fill="#15171c"/><circle cx="${phoneX - 18}" cy="${phoneY}" r="3.5" fill="#7c93ff"/>`;
  let face;
  if (hint.state === "searching") {
    face = `<g class="viz-search"><ellipse cx="${cx}" cy="${cy}" rx="34" ry="42" fill="none" stroke="#3256f5" stroke-width="3" stroke-dasharray="5 6"/>
      <text x="${cx}" y="${cy + 6}" text-anchor="middle" font-size="22" font-weight="800" fill="#3256f5">?</text></g>`;
  } else {
    const fx = Math.max(24, Math.min(W - 70, cx + hint.off.h * k));
    const fy = Math.max(24, Math.min(H - 60, cy - hint.off.v * k));
    const r = Math.max(16, Math.min(48, 30 * (0.47 / Math.max(hint.off.distM, 0.15))));
    const fill = zoneOk ? "#1f9d5a" : "#d98f0b";
    face = `<circle cx="${fx}" cy="${fy}" r="${r}" fill="${fill}" fill-opacity=".18" stroke="${fill}" stroke-width="3"/>
      <circle cx="${fx - r * 0.35}" cy="${fy - r * 0.12}" r="${3 + 3 * (1 - frame.blinkL)}" fill="#15171c"/>
      <circle cx="${fx + r * 0.35}" cy="${fy - r * 0.12}" r="${3 + 3 * (1 - frame.blinkR)}" fill="#15171c"/>`;
  }
  // medidor de distancia: 20–90 cm, banda verde = zona buena
  const gx = W - 26, gTop = 20, gBot = H - 40;
  const yOf = (m) => gBot - ((Math.max(0.2, Math.min(0.9, m)) - 0.2) / 0.7) * (gBot - gTop);
  const marker = hint.off ? `<circle cx="${gx}" cy="${yOf(hint.off.distM)}" r="7" fill="${hint.off.distM >= ZONE.nearM && hint.off.distM <= ZONE.farM ? "#1f9d5a" : "#d98f0b"}" stroke="#fff" stroke-width="2"/>` : "";
  const gauge = `<rect x="${gx - 4}" y="${gTop}" width="8" height="${gBot - gTop}" rx="4" fill="#e6e3dc"/>
    <rect x="${gx - 4}" y="${yOf(ZONE.farM)}" width="8" height="${yOf(ZONE.nearM) - yOf(ZONE.farM)}" rx="4" fill="#9fd8b5"/>
    ${marker}<text x="${gx}" y="${gBot + 18}" text-anchor="middle" font-size="12" font-weight="700" fill="#6c6860">${hint.off ? Math.round(hint.off.distM * 100) + " cm" : "cm"}</text>`;
  svg.innerHTML = `${zone}${face}${arrow}${phone}${gauge}`; // contenido 100% generado aquí (sin texto externo)
  if (msgEl && msgEl.textContent !== hint.message) {
    msgEl.textContent = hint.message;
    msgEl.dataset.s = hint.state;
  }
}
