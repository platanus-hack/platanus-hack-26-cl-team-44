# Kiosco de Myo

La TV como app propia de pantalla completa (Electron) en vez de una pestaña de Chrome. `deploy/escena.sh` (lo que corre `Myo.command`) la abre sola; si no puede instalarla o no arranca, abre Chrome como antes.

## Qué cambia frente a Chrome

| En Chrome | En el kiosco |
|---|---|
| MediaPipe, su modelo y el wasm de WebEyeTrack se bajan de la CDN al activar la cámara. Sin internet, no hay nariz ni mirada | Salen de la copia local en `software/toki-os/vendor`, verificada con sha256. Sin internet, la cámara sigue funcionando |
| `--use-fake-ui-for-media-stream` acepta cámara y micrófono para **cualquier** página de ese perfil | Cámara y micrófono solo para `127.0.0.1` y `localhost`. Cualquier otro permiso u origen, no |
| Un enlace puede sacar la TV a otro sitio o abrir pestañas | No navega fuera de `127.0.0.1` y `localhost` ni abre ventanas |
| Si la pestaña se cuelga o se cae, queda la página de error de Chrome | La recarga sola. Si se cae más de 5 veces en un minuto, lo muestra en pantalla |
| Si el monitor no está, aparece la página de error | Muestra «Esperando al monitor de Myo…» y abre la TV cuando responde |
| La pantalla se puede apagar | No se apaga mientras el kiosco está abierto |

El HTML no cambia. El kiosco redirige solo las URLs exactas del manifiesto (`software/toki-os/tools/vendor-manifest.json`) a un servidor propio en `127.0.0.1`. Todo lo demás, como la VPS, el SSE y el oído, va igual que en Chrome.

**Teclas del operador:**
- `Ctrl+Shift+Q` cierra el kiosco.
- `Ctrl+Shift+R` recarga la TV.
- `Ctrl+Shift+I` abre las herramientas de desarrollo, solo con `KIOSCO_DEVTOOLS=1`.

## Probarlo

```bash
node software/toki-os/tools/vendor-assets.mjs          # copia local (~41 MB la primera vez; después solo verifica)
npm ci --prefix software/kiosco                        # Electron 44 (~100 MB)

cd software/kiosco
npm test                     # 7 pruebas sin Electron ni red (también corren en CI)
npm run prueba               # autoprueba: MediaPipe real en Chromium con internet cortado. Sale con 0 si carga
npx electron . --ventana     # en ventana, sin tapar la pantalla
npx electron . --sin-red     # ensayo de la demo sin internet: solo 127.0.0.1 y la copia local
```

`npm run prueba -- --vendor /carpeta/vacía` es el control negativo: sin copia local y sin red, MediaPipe no carga y sale con 1.

## Límites

- **Calibración:** el kiosco guarda la calibración en su propia carpeta de datos, no en el perfil `~/.toki-chrome`. La primera vez hay que calibrar de nuevo.
- **Permisos de macOS:** el sistema pide cámara y micrófono para «Electron» la primera vez. Conviene aceptarlos antes de la demo.
- **Sin firma ni paquete `.app`:** corre con `npx electron`. Empaquetarlo (electron-builder) queda pendiente.
- **Lo que no cubre la copia local:**
  - la VPS (WhatsApp, agente, voces);
  - ElevenLabs (oído y voz de Myo);
  - la fuente Manrope del prototipo de tablet.
