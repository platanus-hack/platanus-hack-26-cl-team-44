// Pruebas del kiosco que no necesitan Electron ni red (corren en CI con node --test).
// La parte de Electron se prueba con `npm run prueba` (MediaPipe real con internet cortado).
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { MANIFIESTO, entrada, rutaLocal, sha256, sincronizar } from '../../toki-os/tools/vendor-assets.mjs';
import { createWebEyeTrackAssetHandler } from '../../toki-os/tools/webeyetrack-assets.mjs';
import { esLocal, iniciarServidorLocal, patrones, redireccion } from '../servidor-local.mjs';

const BUENO = Buffer.from('export const hola = 1;\n');
const ARCHIVOS = [
  { url: 'https://cdn.example.test/npm/lib@1.0.0/bueno.mjs', tipo: 'text/javascript', sha256: sha256(BUENO) },
  { url: 'https://cdn.example.test/npm/lib@1.0.0/corrupto.wasm', tipo: 'application/wasm', sha256: sha256(Buffer.from('lo que se fijó')) },
  { url: 'https://cdn.example.test/npm/lib@1.0.0/falta.js', tipo: 'text/javascript', sha256: sha256(Buffer.from('x')) },
];

async function carpetaCon(archivos) {
  const dir = await mkdtemp(join(tmpdir(), 'kiosco-'));
  for (const [url, body] of archivos) {
    const ruta = rutaLocal(url, dir);
    await mkdir(dirname(ruta), { recursive: true });
    await writeFile(ruta, body);
  }
  return dir;
}

test('el manifiesto cubre lo que woki-os.html y WebEyeTrack piden a internet', () => {
  const urls = MANIFIESTO.map(a => a.url);
  for (const u of [
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs',
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm/vision_wasm_internal.wasm',
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm/vision_wasm_internal.wasm',
    'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
  ]) assert.ok(urls.includes(u), u);
  for (const a of MANIFIESTO) assert.match(a.sha256, /^[0-9a-f]{64}$/, a.url);
  assert.ok(entrada(`${urls[0]}?v=2#x`), 'la query y el hash no impiden encontrar la entrada');
  assert.deepEqual(patrones().sort(), ['https://cdn.jsdelivr.net/*', 'https://raw.githubusercontent.com/*', 'https://storage.googleapis.com/*']);
});

test('rutaLocal no sale de la carpeta aunque la URL traiga ../ codificado', () => {
  // %2e%2e ya lo normaliza el parser de URL; el ataque real es esconder / como %2F
  assert.throws(() => rutaLocal('https://cdn.example.test/a%2F..%2F..%2F..%2Fetc%2Fpasswd', '/tmp/v'), /fuera/);
  assert.equal(rutaLocal('https://cdn.example.test/%2e%2e/%2e%2e/etc/passwd', '/tmp/v'), '/tmp/v/cdn.example.test/etc/passwd');
  assert.equal(rutaLocal('https://cdn.example.test/npm/a@1/b.js', '/tmp/v'), '/tmp/v/cdn.example.test/npm/a@1/b.js');
});

test('solo se redirige lo verificado, y solo por https', () => {
  const v = new Set([ARCHIVOS[0].url]);
  assert.equal(redireccion(ARCHIVOS[0].url, 'http://127.0.0.1:5000', v), 'http://127.0.0.1:5000/v/cdn.example.test/npm/lib@1.0.0/bueno.mjs');
  assert.equal(redireccion(`${ARCHIVOS[0].url}?x=1`, 'http://127.0.0.1:5000', v), 'http://127.0.0.1:5000/v/cdn.example.test/npm/lib@1.0.0/bueno.mjs');
  assert.equal(redireccion(ARCHIVOS[1].url, 'http://127.0.0.1:5000', v), null, 'sin verificar: va a internet');
  assert.equal(redireccion('https://cdn.example.test/otra.js', 'http://127.0.0.1:5000', v), null);
  assert.equal(redireccion(ARCHIVOS[0].url.replace('https:', 'http:'), 'http://127.0.0.1:5000', v), null);
  assert.equal(redireccion('no es url', 'http://127.0.0.1:5000', v), null);
});

test('el servidor local entrega solo copias que coinciden con el sha256 fijado', async () => {
  const dir = await carpetaCon([[ARCHIVOS[0].url, BUENO], [ARCHIVOS[1].url, Buffer.from('alguien lo cambió')]]);
  const s = await iniciarServidorLocal({ dir, archivos: ARCHIVOS });
  try {
    assert.deepEqual([...s.verificadas], [ARCHIVOS[0].url]);
    assert.deepEqual(s.faltan, [ARCHIVOS[1].url, ARCHIVOS[2].url]);
    const ok = await fetch(`${s.base}/v/cdn.example.test/npm/lib@1.0.0/bueno.mjs`);
    assert.equal(ok.status, 200);
    assert.equal(ok.headers.get('content-type'), 'text/javascript');
    assert.equal(ok.headers.get('access-control-allow-origin'), '*', 'la TV está en otro origen: import() pide CORS');
    assert.deepEqual(Buffer.from(await ok.arrayBuffer()), BUENO);
    assert.equal((await fetch(`${s.base}/v/cdn.example.test/npm/lib@1.0.0/corrupto.wasm`)).status, 404, 'alterado: no se sirve');
    assert.equal((await fetch(`${s.base}/v/../../etc/passwd`)).status, 404);
    assert.equal((await fetch(`${s.base}/v/cdn.example.test/npm/lib@1.0.0/bueno.mjs`, { method: 'POST' })).status, 405);
    const otroHost = await new Promise(ok => {
      import('node:http').then(({ request }) => {
        const u = new URL(s.base);
        request({ host: '127.0.0.1', port: u.port, path: '/v/cdn.example.test/npm/lib@1.0.0/bueno.mjs', headers: { Host: 'malo.example:80' } },
          r => ok(r.statusCode)).end();
      });
    });
    assert.equal(otroHost, 421, 'Host distinto (DNS rebinding): rechazado');
  } finally { await s.cerrar(); }
});

test('sincronizar guarda lo que coincide y rechaza lo alterado sin dejar archivos a medias', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'kiosco-sync-'));
  const pedidos = [];
  const fetcher = async (url) => {
    pedidos.push(url);
    if (url === ARCHIVOS[0].url) return new Response(BUENO);
    if (url === ARCHIVOS[1].url) return new Response('la CDN cambió el archivo');
    return new Response('no', { status: 404 });
  };
  const r = await sincronizar({ dir, fetcher, archivos: ARCHIVOS });
  assert.equal(r.ok, false);
  assert.equal(r.bajados, 1);
  assert.deepEqual(r.fallas.map(f => f.error), ['el sha256 no coincide con el fijado', 'HTTP 404']);
  const quedan = await readdir(join(dir, 'cdn.example.test/npm/lib@1.0.0'));
  assert.deepEqual(quedan, ['bueno.mjs']);
  // segunda vez: lo que ya está verificado no se vuelve a pedir
  pedidos.length = 0;
  await sincronizar({ dir, fetcher, archivos: ARCHIVOS });
  assert.deepEqual(pedidos, [ARCHIVOS[1].url, ARCHIVOS[2].url]);
});

test('WebEyeTrack: sin copia local sigue bajando de internet como antes', async () => {
  const vacio = await mkdtemp(join(tmpdir(), 'kiosco-wet-'));
  let pedido = '';
  const handler = createWebEyeTrackAssetHandler(async (url) => { pedido = url; return new Response('x', { status: 503 }); }, { vendorDir: vacio });
  const res = { writeHead(c) { this.code = c; }, end() {} };
  assert.equal(await handler({ method: 'GET' }, res, '/web/model.json'), true);
  assert.match(pedido, /raw\.githubusercontent\.com.*model\.json$/);
  assert.equal(res.code, 502);
});

test('esLocal: solo http en 127.0.0.1 o localhost', () => {
  for (const u of ['http://127.0.0.1:8766/woki-os.html', 'http://localhost:8790/']) assert.ok(esLocal(u), u);
  for (const u of ['https://127.0.0.1/', 'http://127.0.0.1.evil.com/', 'http://192.168.1.5:8766/', 'data:text/html,x', 'file:///etc/passwd', 'nada'])
    assert.ok(!esLocal(u), u);
});
