# Puente WhatsApp

Código trasladado desde `woki-bridge/` sin cambios de lógica, imports, variables de entorno ni protecciones de acceso local.

Desde la raíz:

```bash
cd software/whatsapp-bridge
npm ci
cp profile.example.json profile.json
# Crear .env siguiendo la guía; no subir credenciales ni contactos.
npm run dev
```

[Guía de configuración](../../docs/product/GUIA-WAPI-PASO-A-PASO.md) · [Self-host](../../docs/product/GUIA-WAPI-SELF-HOST.md)

La configuración `.env` y los perfiles locales deben vivir en esta carpeta. Si tenías una instalación anterior, mueve también esos archivos locales ignorados. El nombre del paquete y las variables `WOKI_*` se conservan por compatibilidad. No se enviaron mensajes durante la reorganización.

## Voz y sugerencias (nuevo)

| Archivo | Qué hace | Variables en `.env` |
|---|---|---|
| `voz.ts` | Voz de la persona con ElevenLabs (TTS con emoción), clonar o elegir voz, llamada de emergencia. Rutas `/api/voz/*`, detrás de la misma protección local que el resto de `/api/*` | `ELEVENLABS_API_KEY` (obligatoria para voz), `ELEVENLABS_TTS_MODEL`, `ELEVENLABS_AGENT_ID`, `ELEVENLABS_PHONE_NUMBER_ID`, `EMERGENCY_NUMBER`, `WOKI_NOMBRE`, `WOKI_DIRECCION` |
| `setup-emergencia.ts` | Crea una vez el agente telefónico de emergencia en ElevenLabs | `ELEVENLABS_API_KEY`, y opcionalmente `TWILIO_*` |
| `sugerir.ts` | Respuestas sugeridas a un chat y frase completa desde iniciales, con el CLI `claude` (usa la suscripción, sin API key) | `SUGGEST=off` para apagar, `SUGGEST_MODEL` (por defecto `haiku`) |

La TV usa `software/toki-os/woki-voz.js` para hablar por el puente y, si falla o no hay red, vuelve a la voz del sistema. `software/toki-os/voz.html` es el onboarding de voz para la familia. Guía completa: [GUIA-ELEVENLABS.md](../../docs/product/GUIA-ELEVENLABS.md).

`voz.json` (voz elegida), `history.json` y `qr.html` son estado local y están en `.gitignore`.
