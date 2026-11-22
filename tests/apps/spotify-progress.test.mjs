// La línea de tiempo de Spotify se quedaba en 0:00: `spogo status` devuelve progress_ms 0 cuando
// macOS usa coma decimal (AppleScript entrega "73,92"). El adaptador pide la posición a Spotify
// en milisegundos enteros y la aplica solo si corresponde a la misma canción.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {applySpotifyMeta} from '../../software/apps-bridge/adapters/spotify.mjs';

const status = () => ({is_playing: true, progress_ms: 0, item: {uri: 'spotify:track:abc', name: 'Speedy', duration_ms: 115000}});
const ART = 'https://i.scdn.co/image/ab67616d0000b273e84955477378ee126eea302f';

test('usa la posición real de Spotify en milisegundos', () => {
  const result = applySpotifyMeta(status(), `spotify:track:abc\n${ART}\n73920`);
  assert.equal(result.progress_ms, 73920);
  assert.equal(result.item.artwork, ART);
});

test('no toca el resultado original (devuelve una copia)', () => {
  const original = status();
  applySpotifyMeta(original, `spotify:track:abc\n${ART}\n73920`);
  assert.equal(original.progress_ms, 0);
  assert.equal(original.item.artwork, undefined);
});

test('si la canción cambió entre las dos consultas, no mezcla datos', () => {
  const result = applySpotifyMeta(status(), `spotify:track:otra\n${ART}\n5000`);
  assert.equal(result.progress_ms, 0);
  assert.equal(result.item.artwork, undefined);
});

test('ignora una posición inválida o fuera de la canción', () => {
  for (const pos of ['', 'abc', '-5', '73,92', '999999999']) {
    assert.equal(applySpotifyMeta(status(), `spotify:track:abc\n${ART}\n${pos}`).progress_ms, 0, pos);
  }
});

test('ignora una carátula que no es de Spotify', () => {
  const result = applySpotifyMeta(status(), 'spotify:track:abc\nhttps://example.com/x.png\n1000');
  assert.equal(result.item.artwork, '');
  assert.equal(result.progress_ms, 1000);
});

test('sin canción o sin respuesta de Spotify, devuelve el estado tal cual', () => {
  assert.deepEqual(applySpotifyMeta({is_playing: false}, 'x\ny\n1'), {is_playing: false});
  assert.equal(applySpotifyMeta(status(), '').progress_ms, 0);
});

// La barra de la pantalla: entre consultas (cada 5 s) avanza sola mientras suena.
const ui = (() => {
  const window = {};
  vm.runInNewContext(readFileSync(new URL('../../software/toki-os/toki-apps.js', import.meta.url), 'utf8'), {window, document: {}, performance, setInterval, clearInterval, setTimeout, clearTimeout});
  return window.TokiApps;
})();
const playing = (progress, on = true) => ({is_playing: on, progress_ms: progress, item: {duration_ms: 115000}});

test('la línea de tiempo avanza entre consultas si está sonando', () => {
  assert.equal(ui.playbackElapsed(playing(73920), 2500), 76420);
});

test('en pausa la línea de tiempo no avanza', () => {
  assert.equal(ui.playbackElapsed(playing(73920, false), 2500), 73920);
});

test('nunca pasa del final de la canción ni baja de cero', () => {
  assert.equal(ui.playbackElapsed(playing(114000), 9000), 115000);
  assert.equal(ui.playbackElapsed(playing(-50), -100), 0);
  assert.equal(ui.playbackElapsed(null, 1000), 0);
});
