// Servidor local de la demo (sin dependencias). Solo escucha en 127.0.0.1.
//   GET  /…               archivos estáticos de web/
//   POST /api/log         guarda un log de sesión (JSON) en software/eye-tracking/logs/
//   POST /api/snapshot    guarda una foto de diagnóstico (JPEG en data URL) en software/eye-tracking/logs/
//   GET  /api/display     tamaño físico (mm) de cada pantalla activa → errores en grados reales
// Uso: node software/eye-tracking/web/serve.mjs   →  http://localhost:5173
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)));
const LOGS = resolve(ROOT, "..", "logs");
const PORT = Number(process.env.PORT) || 5173;
const MAX_LOG_BYTES = 25 * 1024 * 1024;
const MAX_IMG_BYTES = 4 * 1024 * 1024;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png" };
const SAFE_ID = /^[a-z0-9-]{8,64}$/;

/** Tamaño físico de TODAS las pantallas activas vía CoreGraphics (macOS). [] si no se puede. */
let displayCache = { at: 0, value: null };
function getDisplays() {
  // Se recalcula cada 30 s: cambiar la resolución o conectar un monitor cambia los puntos.
  if (displayCache.value && Date.now() - displayCache.at < 30_000) return displayCache.value;
  displayCache = { at: Date.now(), value: queryDisplays() };
  return displayCache.value;
}
const queryDisplays = () => new Promise((resolveInfo) => {
  const code = [
    "import CoreGraphics",
    "var ids = [CGDirectDisplayID](repeating: 0, count: 16); var n: UInt32 = 0",
    "CGGetActiveDisplayList(16, &ids, &n)",
    "for d in ids.prefix(Int(n)) { let s = CGDisplayScreenSize(d); let b = CGDisplayBounds(d); print(s.width, s.height, Int(b.width), Int(b.height), CGDisplayIsMain(d) != 0 ? 1 : 0) }",
  ].join("\n");
  try {
    const proc = spawn("swift", ["-"], { stdio: ["pipe", "pipe", "ignore"] });
    let outText = "";
    const timer = setTimeout(() => { proc.kill(); resolveInfo([]); }, 20_000);
    proc.stdout.on("data", (c) => { outText += c; });
    proc.on("error", () => { clearTimeout(timer); resolveInfo([]); });
    proc.on("close", () => {
      clearTimeout(timer);
      const displays = outText.trim().split("\n").map((line) => {
        const [wMm, hMm, wPt, hPt, main] = line.trim().split(/\s+/).map(Number);
        return { widthMm: wMm, heightMm: hMm, widthPt: wPt, heightPt: hPt, main: main === 1 };
      }).filter((d) => d.widthMm > 0 && d.widthPt > 0);
      resolveInfo(displays);
    });
    proc.stdin.end(code);
  } catch {
    resolveInfo([]);
  }
});

function readBody(req, limit) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error("Cuerpo demasiado grande"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolveBody(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/** El id de sesión lo genera el navegador; aquí solo se acepta [a-z0-9-] para evitar rutas arbitrarias. */
function sessionFile(id, suffix) {
  if (!SAFE_ID.test(id)) throw new Error("id de sesión inválido");
  return join(LOGS, `${id}${suffix}`);
}

async function handleApi(req, res, path) {
  if (path === "/api/display" && req.method === "GET") return send(res, 200, { ok: true, displays: await getDisplays() });
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Usa POST" });
  // Solo aceptamos llamadas de la propia página (evita que otra web escriba en tu disco).
  const origin = req.headers.origin ?? "";
  if (origin && !/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return send(res, 403, { ok: false, error: "Origen no permitido" });
  await mkdir(LOGS, { recursive: true });

  if (path === "/api/log") {
    const body = JSON.parse((await readBody(req, MAX_LOG_BYTES)).toString("utf8"));
    const file = sessionFile(String(body.sessionId ?? ""), ".json");
    await writeFile(file, JSON.stringify(body));
    return send(res, 200, { ok: true, file });
  }
  if (path === "/api/snapshot") {
    const body = JSON.parse((await readBody(req, MAX_IMG_BYTES * 1.4)).toString("utf8"));
    const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.dataUrl ?? ""));
    if (!match) return send(res, 400, { ok: false, error: "Se esperaba un JPEG" });
    const file = sessionFile(String(body.sessionId ?? ""), `-foto-${Date.now()}.jpg`);
    await writeFile(file, Buffer.from(match[1], "base64"));
    return send(res, 200, { ok: true, file });
  }
  return send(res, 404, { ok: false, error: "Ruta desconocida" });
}

function send(res, status, json) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(json));
}

createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (path.startsWith("/api/")) return await handleApi(req, res, path);
    const file = normalize(join(ROOT, path === "/" ? "index.html" : path));
    if (!file.startsWith(ROOT)) return send(res, 403, { ok: false, error: "Prohibido" });
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" });
    res.end(body);
  } catch (err) {
    const notFound = err && err.code === "ENOENT";
    send(res, notFound ? 404 : 500, { ok: false, error: notFound ? "No encontrado" : String(err.message ?? err) });
  }
}).listen(PORT, "127.0.0.1", () => {
  process.stdout.write(`Demo de eye-tracking con iPhone en http://localhost:${PORT}  ·  logs en ${LOGS}\n`);
});
