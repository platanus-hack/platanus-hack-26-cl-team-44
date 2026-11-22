# Puente de WhatsApp + agente: cómo corre

Estado: integrado en la rama `feat/agente-whatsapp`, probado en modo `dry` con webhooks firmados y con la TV en el navegador.

## Qué hace cada pieza

| Pieza | Archivo | Qué hace |
|---|---|---|
| Cliente del agente | `software/whatsapp-bridge/agente.ts` | Llama al agente en `http://127.0.0.1:8790`. Si el agente no está, falla o tarda, devuelve vacío y todo sigue como antes |
| Chat 1 a 1 | `suggestFor()` en `server.ts` | Primero el agente (`/api/sugerir`, modo `chat`, 6 respuestas). Si no hay respuesta del modelo, `suggestReplies()` de `sugerir.ts`. Con contexto del acompañante, directo a `sugerir.ts` |
| Mensajes de grupo | `handleGroup()` en `server.ts` | Todo mensaje de texto de grupo va a `/api/grupo`. El agente solo procesa grupos con un disparador activo y guarda el contexto en su memoria, nunca en disco. Con mención, el evento `mention` lleva `resumen`, `opciones`, `groupJid` y `mentionJid` |
| Responder en el grupo | `sendGroup()` en `server.ts` | `/api/wa/send` con `groupJid` solo si el agente tiene un disparador activo para ese grupo. Mismos límites que un chat: idempotencia, 30 por día y 5 s entre envíos. Etiqueta a quien preguntó |
| TV | `waMention()` y `waSend()` en `woki-os.html` | Con opciones, el grupo se abre como un chat más ("Pedro te mencionó en Familia"). Se responde con la confirmación de siempre (doble ceja). Sin opciones, queda el aviso de antes |

## Encender todo (Mac del demo)

```bash
# 1. wapi y el puente, como dice docs/product/GUIA-WAPI-SELF-HOST.md
# 2. Agente (necesita Claude Code con sesión iniciada)
software/agent/.venv/bin/python software/agent/server.py          # :8790
# 3. TV
python3 -m http.server 8000 --bind 127.0.0.1 --directory software/toki-os
```

Variables del puente: `AGENT_URL` (por defecto `http://127.0.0.1:8790`) y `AGENT=off` para volver al comportamiento anterior.

## Datos locales del demo (fuera de git)

| Archivo | Contenido |
|---|---|
| `software/agent/data/semilla.json` | Emmy, sus contactos con los **mismos teléfonos** de `profile.json`, temas, límites y memorias. Se carga con `python3 software/agent/scripts/semilla.py` |
| `software/agent/data/disparadores.json` | El disparador del grupo de prueba con su `grupo_jid` real, `audiencia` y `miembros` con límites. Nace en `pendiente` |

El teléfono es la llave entre `profile.json` del puente y la memoria del agente.

## Probar sin WhatsApp

Puente en modo `dry`, con un número propio de prueba para detectar la mención:

```bash
cd software/whatsapp-bridge
WA_MODE=dry PORT=8788 PROFILE=profile.json WAPI_WEBHOOK_SECRET=prueba WOKI_ME_IDS=<tu número sin +> npx tsx server.ts
```

Después se manda un webhook firmado (HMAC-SHA256 del cuerpo con `WAPI_WEBHOOK_SECRET`, en el header `x-webhook-signature`), como explica `docs/product/GUIA-WAPI-PASO-A-PASO.md`. La mención lleva `contextInfo.mentionedJid` con `<tu número>@s.whatsapp.net`.

## Medido el 21-nov-2026 (modo dry, ejemplo ficticio)

| Caso | Resultado |
|---|---|
| Chat 1 a 1 | 6 respuestas del agente en 4,7 a 5,2 s, 0 descartadas |
| Mención con disparador activo | Resumen y 3 respuestas de 6 a 8 palabras en 4,4 a 5,5 s. Usaron el contexto que otra persona había escrito antes en el grupo |
| Grupo con disparador pendiente | Ignorado, sin guardar nada |
| Enviar a un grupo sin disparador | `403 Ese grupo no tiene un disparador activo` |
| TV | Mención → tarjetas → "Responder a Familia" → "✓ Enviado a Familia (prueba)" |

## Sin verificar

- Que wapi acepte un JID de grupo en `to` y `mentions` en un envío real. Hay que probarlo con el grupo de prueba antes del demo.
