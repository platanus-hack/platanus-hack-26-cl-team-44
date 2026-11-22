# Oído de Myo

Servicio local que escucha la sala. Abre el micrófono, separa las voces con ElevenLabs Scribe v3 Live y le entrega a la TV turnos con hablante: `{texto, hablante: "S2", persona: "juan"}`.

Corre en el computador que tiene el micrófono, no en la VPS.

**Con la TV.** Al abrirse, la TV (`toki-os/myo-escucha.js`) consulta `http://127.0.0.1:8792`:

- **Si el oído responde,** no abre el micrófono. Recibe los turnos por SSE, avisa cuándo habla Myo y manda las asignaciones de voz.
- **Si no responde,** la escucha sigue en el navegador como antes.
- **Si el oído se cae con la TV abierta,** el indicador dice «El oído no responde» y la TV se reconecta cuando launchd o systemd lo vuelve a levantar.

## Qué cambia frente a la escucha en el navegador

| Antes, en la pestaña | Ahora, en el servicio |
|---|---|
| La TV pedía un token de Scribe al puente, y cualquier página abierta podía pedir uno | La llave y el token no salen de este proceso |
| Recargar la TV borraba la sesión. Quién es cada voz quedaba en `sessionStorage`, y una voz nueva podía heredar la persona de otra | El estado vive en el servicio. Cada sesión de Scribe recibe etiquetas nuevas (S1, S2, S3…) y nunca reutiliza una anterior |
| Si Scribe se cortaba, reintentaba cada 600 ms sin límite ni aviso | Espera creciente (0,5 → 10 s). Los estados `reconectando` y `sin_conexion` llegan a la TV |
| Si el micrófono fallaba, la TV no se enteraba | Estado `sin_microfono` con el motivo |
| Proceso: la pestaña | Proceso supervisado (launchd en macOS, systemd en Linux) que vuelve a arrancar solo |

Se mantienen igual: los tres modos (`siempre`, `voz`, `manual`), el audio previo de 1,5 s en modo voz, el reconocimiento por huella con `software/voces` (tope de 1,5 s), el silencio mientras Myo habla y los parámetros medidos (VAD de 0,6 s).

## Probarlo

```bash
cd software/oido
uv venv --python 3.13 .venv && uv pip install --python .venv/bin/python -r requirements.txt
.venv/bin/python -m unittest discover -s tests -v          # 39 pruebas, sin micrófono y sin red

# Ensayo de la TV sin micrófono ni ElevenLabs (Scribe falso con guion): abrir http://127.0.0.1:18000/woki-os.html
.venv/bin/python tests/ensayo_tv.py

# Ensayo sin micrófono: un WAV de 16 kHz mono hace de micrófono
OIDO_FUENTE=archivo:/ruta/audio.wav ELEVENLABS_API_KEY=… .venv/bin/python server.py
curl -N -H 'Host: 127.0.0.1:8792' http://127.0.0.1:8792/api/oido/eventos   # los turnos llegan aquí

# Con el micrófono (OIDO_MICROFONO = nombre o número; vacío = el predeterminado)
ELEVENLABS_API_KEY=… .venv/bin/python server.py
```

En macOS, la primera vez el sistema pide permiso de micrófono para la terminal o para el proceso que lo lance.

## Rutas

| Ruta | Qué hace |
|---|---|
| `GET /api/oido/estado` | Estado, modo, micrófono, sesiones, hablantes y últimos 8 turnos |
| `GET /api/oido/eventos` | SSE con eventos `estado`, `parcial`, `turno`, `hablantes`, `fusion` y `error` |
| `POST /api/oido/encender`, `/apagar` | Enciende o apaga la escucha |
| `POST /api/oido/modo` | `{modo: "siempre" \| "voz" \| "manual"}` |
| `POST /api/oido/asignar` | `{hablante: "S2", persona: "juan"}`. Con `persona: ""` se quita |
| `POST /api/oido/habla` | `{hablando: true \| false, max_s?}`. Mientras Myo habla, al micrófono le llega silencio |

Seguridad, igual que el puente de WhatsApp:
- solo escucha en 127.0.0.1;
- exige el Host exacto, contra DNS rebinding;
- los POST solo aceptan JSON y un Origin de `TOKI_ORIGENES`, contra CSRF;
- con `OIDO_TOKEN` se exige además `X-Myo-Token`;
- los logs nunca guardan texto de la sala.

## Eco

En el navegador, `getUserMedia` cancelaba el eco solo. Aquí no hay cancelación por software, así que hay dos defensas:

1. **La TV avisa cuando Myo habla** (`/api/oido/habla`) y el servicio manda silencio hasta 0,4 s después.
2. **Micrófono de conferencia con cancelación de eco por hardware.** Así no se transcribe la TV ni la voz de Myo que sale por los parlantes.

## Que arranque solo

- **macOS:** copiar `servicio/cl.myo.oido.plist` a `~/Library/LaunchAgents/`, ajustar las rutas y correr `launchctl load ~/Library/LaunchAgents/cl.myo.oido.plist`. La llave va en `software/oido/.env` (fuera de git; plantilla en `.env.example`).
- **Linux (Raspberry Pi):** `servicio/myo-oido.service` (systemd de usuario).

## Límites conocidos

- Sin internet no hay transcripción: el estado pasa a `sin_conexion` y se reintenta. El respaldo local con whisper.cpp está pendiente.
- ElevenLabs registra el audio en el plan actual (no Enterprise). Hay que avisarlo a quien esté en la sala.
- La separación de voces es de Scribe. Medida con este oído (voces sintéticas, 3 repeticiones): 48/48 turnos sin ruido, con ~0,75 s de latencia. Con la TV media o alta los turnos se atrasan 9–15 s. Detalle y cómo repetirlo en [`pruebas/RESULTADOS.md`](pruebas/RESULTADOS.md) (`medir.py`).
