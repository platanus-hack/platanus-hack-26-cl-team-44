# WOKI · ElevenLabs (voz, elegir voz, llamada de emergencia)

Todo pasa por el puente (`software/whatsapp-bridge`). La API key solo vive en `software/whatsapp-bridge/.env` y nunca llega al navegador.

## Qué hace

| Momento | Qué pasa | Archivo |
|---|---|---|
| Marta elige una frase, una reacción o escribe | Suena con su voz (clonada o elegida). Modelo `eleven_v3`, elegido al oído frente a flash, multilingual v2 y v4 turbo: es el menos robótico. La emoción de la tarjeta va como etiqueta que el modelo entiende y no pronuncia (`[sarcastically]`, `[whispers]`, `[cheerfully]`, `[warmly]`, `[excited]`). Si ElevenLabs falla, usa la voz del sistema: nunca queda muda | `software/toki-os/woki-voz.js` + `speak()` en `woki-os.html` |
| Aparecen las 4 tarjetas, y al iniciar las reacciones | Se pide el audio por adelantado: v3 tarda ~1,5 s por frase y así suena al instante cuando elige. Consume créditos: 4 frases por turno (`VOZ.PREFETCH=false` lo apaga) | `renderCards()`, `VOZ.init()` |
| Alarma de **emergencia** (ceja ×2 → mandíbula) | Pasada la ventana de 3 s para cancelar, un agente de ElevenLabs llama por teléfono al contacto de emergencia, explica qué pasó y pide que vaya. La de **atención** no llama | `alarmTick()` → `VOZ.emergencia(A)` → `POST /api/emergencia/llamar` |
| La llamada avanza | La pantalla de alarma le muestra a Marta cada etapa: *Llamada enviada a Camila* → *Camila contestó* → **pantalla verde "Camila viene en camino"** con su respuesta, un sonido y un aviso hablado; o *Camila no puede ir: …* (la alarma sigue). Al terminar la llamada, ElevenLabs extrae `viene` y `respuesta` de la conversación (data collection del agente). Si el operador rechaza la llamada, a los 75 s se informa como fallida | `GET /api/emergencia/estado` |
| Onboarding de voz (familia, desde el celular) | `voz.html`: (1) clonar su voz subiendo notas de voz de WhatsApp o grabando 1 minuto; (2) escuchar y elegir voces; (3) dejar hasta 6 candidatas | `software/toki-os/voz.html` |
| Marta elige la que le acomoda | En la TV: **Ajustes → Voz**. Cada ceja pasa a la siguiente candidata y la dice en voz alta | `VOZ.siguiente()` |

## Configuración (`software/whatsapp-bridge/.env`)

```
ELEVENLABS_API_KEY=...
# opcional: ELEVENLABS_TTS_MODEL=eleven_flash_v2_5   (por defecto eleven_v3: más natural; flash es más rápido)

# Llamada de emergencia
ELEVENLABS_AGENT_ID=...            # lo imprime setup-emergencia.ts
ELEVENLABS_PHONE_NUMBER_ID=...     # número de Twilio importado en ElevenLabs
EMERGENCY_NUMBER=+569XXXXXXXX      # celular de la cuidadora o familiar (NO 131/133/911: el bridge lo bloquea)
EMERGENCY_NAME=Camila              # la TV muestra "Camila viene en camino"; sin esto dice "Tu contacto"
WOKI_NOMBRE=Marta
WOKI_DIRECCION=Av. Ejemplo 123, depto 4, Providencia   # con espacios, como se dice en voz alta: el agente la lee tal cual
```

Crear el agente (una vez):

```bash
cd software/whatsapp-bridge
npx tsx --env-file=.env setup-emergencia.ts
# con TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_PHONE_NUMBER en .env también importa el número
```

Después hay que **reiniciar el bridge** (`npm run dev`) y abrir `http://localhost:8000/voz.html`.

## Rutas nuevas del bridge (`software/whatsapp-bridge/voz.ts`)

Tienen las mismas protecciones que `/api/wa/*`: solo local, Origin exacto y JSON.

| Ruta | Para qué |
|---|---|
| `GET /api/voz/estado` | ¿Hay key? ¿qué voz está activa? ¿la llamada está configurada? |
| `POST /api/voz/tts` `{text, emo, voiceId?}` | Devuelve audio/mpeg |
| `GET /api/voz/voces` | Voces de la cuenta (prediseñadas + clonadas) |
| `POST /api/voz/clonar` `{consentimiento:true, audios:[{b64,mime,nombre}]}` | Clonación instantánea. Sin consentimiento no clona |
| `POST /api/voz/opciones` `{opciones, actual}` | Guarda las candidatas (máx. 6) en `voz.json` |
| `POST /api/voz/elegir` `{id}` | Marta cambia de voz (solo entre las candidatas) |
| `POST /api/emergencia/llamar` `{alarmId}` | Una llamada por alarma, máximo una por minuto |
| `GET /api/emergencia/estado` | initiated · in-progress · done · failed |

## Plan de ElevenLabs y voces

- **Plan gratis:** solo voces prediseñadas (en inglés, hablan español con acento). La API responde *"Free users cannot use library voices via the API"* y no deja clonar ni diseñar voces.
- **Plan Creator (o superior):** voces de la *Voice Library* (hay chilenas: Olivia, Emma, Angela, Marcela, Silvana, Camila), clonación instantánea y ~129 mil créditos al mes. Para usar una voz de la biblioteca hay que agregarla a "Mis voces" (`POST /v1/voices/add/{public_owner_id}/{voice_id}`).
- La TV, si nadie eligió voces en `voz.html`, ofrece sola las voces de la cuenta aptas para español (las de mujer primero; nunca las clonadas de otras personas).

## Agente telefónico de emergencia

`setup-emergencia.ts` lo crea ya estable, como quedó tras probarlo con llamadas reales:

- **Voz chilena nativa** ("Camila", biblioteca). Las voces con *live moderation* no se pueden usar en agentes.
- **Nada lo interrumpe:** sin el evento `interruption`, primer mensaje no interrumpible, turno `patient` y detección de voces de fondo. Antes, cada "sí, sí" o el ruido lo cortaban a mitad de frase.
- **Primer mensaje con todo:** qué pasó, hora, dirección y "¿Puedes ir?". Respuestas de una o dos frases. Puede colgar solo (`end_call`).
- **Extrae la respuesta** al terminar (`viene`, `respuesta`) para que la TV se la muestre a Marta.

**Twilio:** usar un número de EE.UU. (los chilenos y colombianos piden registro regulatorio con documentos). Habilitar en *Voice → Settings → Geo permissions* cada país al que se llama.

| Destino probado el 21-nov | Resultado |
|---|---|
| Celular de Chile | ✅ contesta y conversa |
| Celular de Perú (Claro) | ✅ contesta y conversa |
| Celular de Colombia (Movistar) | ❌ el operador rechaza (SIP 484), también llamando directo desde Twilio sin ElevenLabs |

## Decisiones

- **El agente no usa la voz de Marta** al llamar: se presenta como "WOKI, el asistente de Marta", para que nadie crea que ella está hablando.
- **No llama a servicios públicos.** Un robot llamando al SAMU es mala idea, y puede ser ilegal. Llama a una persona, y si esa persona no puede ir, el agente le pide que llame al 131.
- **Clonar con audio antiguo.** Con ELA, muchas veces la voz actual ya cambió. Las notas de voz de WhatsApp de antes sirven para recuperar su voz real.
- Los ajustes de emoción (estabilidad y estilo) son un primer cálculo: hay que afinarlos al oído.

## Pendiente o sin verificar

- **Probado con la key real:** TTS (flash, multilingual, v3, v4 turbo), voces de la biblioteca con Creator, la llamada (Chile y Perú) y la extracción de la respuesta. **Sin probar con audio real:** la clonación desde `voz.html`.
- Que ElevenLabs acepte `.opus` de WhatsApp tal cual. Si lo rechaza, hay que convertirlo a mp3.
- El agente siempre ofrece el SAMU 131 (Chile). En Colombia es el 123 y en Perú el 106: falta una variable por país.
- Llamadas a Colombia: probar otro operador (Claro, Tigo) o un número colombiano de Twilio.
