# Conectar el puente de WhatsApp con el agente

Para la versión del puente de Emmy (`woki-bridge` con `sugerir.ts`, historial y menciones).
El agente corre en el mismo Mac, en `http://127.0.0.1:8790`. Las llamadas son de servidor a servidor, sin `Origin`. Todas llevan `Content-Type: application/json`.

## Qué cambia y qué no

- **No cambia:** wapi, el webhook, la lista blanca, el historial, los límites de envío ni la seguridad de `server.ts`.
- **Cambia:** las sugerencias pasan primero por el agente, que usa la memoria, los límites por persona y los últimos encuentros. Si el agente falla o tarda más de 12 s, el puente usa el `claude -p` de hoy.
- **Nuevo:** los mensajes de grupo se le pasan al agente. El agente decide si el grupo tiene un disparador activo, guarda el contexto en memoria y prepara respuestas cuando mencionan a la usuaria.

## Cambio 1 · `sugerir.ts`: sugerencias del chat 1 a 1

Antes de lanzar `claude -p` en `suggestReplies`:

```ts
const r = await fetch("http://127.0.0.1:8790/api/sugerir", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    modo: "chat",
    telefono: contacto.phone,                 // el mismo de profile.json
    texto: ultimoMensajeRecibido,
    historial: ultimos14.map(m => `${m.dir === "in" ? contacto.name : "Yo"}: ${m.text}`),
  }),
  signal: AbortSignal.timeout(12_000),
});
// Respuesta: { origen: "agente" | "reglas", resumen, ultimo_encuentro, opciones: [{text, tone, emo, fuentes}] }
// Si origen === "agente", usar opciones como suggestions (mismas claves text, tone, emo).
// Si falla, tarda o origen === "reglas", seguir con claude -p como hoy.
```

`modo: "chat"` devuelve 6 opciones de hasta 8 palabras, con las emociones de la TV (`ironica`, `alegre`, `carinosa`, `susurro`, `seria`, `entusiasta`).

## Cambio 2 · `server.ts`: mensajes de grupo

En `handleEvent`, para **todo mensaje de texto de grupo** (con o sin mención), en vez de descartarlo:

```ts
const r = await fetch("http://127.0.0.1:8790/api/grupo", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    id: key.id,
    grupo_jid: key.remoteJid,                 // ...@g.us
    grupo_nombre: nombreDelGrupo,             // de la metadata del grupo, si está en caché
    autor_tel: telefonoDelAutor,              // key.participant resuelto de LID a teléfono
    autor_nombre: pushName,
    texto,
    menciona,                                 // el cálculo actual con mentionedJid y loadMe()
  }),
}).then(r => r.json());
// r.accion: "ignorar" (grupo sin disparador activo) | "guardado" | "repetido" | "mencion"
// Con "mencion": emitir el evento SSE "mention" de siempre, agregando
//   r.resumen, r.ultimo_encuentro, r.opciones (4, la última es "Después te respondo") y r.grupo_jid.
```

- El puente sigue sin guardar mensajes de grupo. El agente guarda los últimos 30 de los grupos activos, solo en memoria.
- La llamada puede tardar de 5 a 8 s con mención. El webhook ya responde 200 antes de procesar, así que no bloquea.

## Cambio 3 · enviar al grupo

`/api/wa/send` acepta también `{groupJid, text, idemKey, mencionar?}`:

- Solo si `groupJid` tiene un disparador activo. Se consulta `GET http://127.0.0.1:8790/api/disparadores`.
- Envía con `wapi.messages.send({ to: groupJid, text, mentions: [jidDelAutor] })`, así la respuesta etiqueta a quien preguntó.
- Mantiene la idempotencia, el tope diario y los 5 s entre envíos.
- **Falta verificar** que wapi acepte un JID de grupo en `to`. Hay que probarlo con el grupo de prueba.

## Cambio 4 · TV

- **Aviso de mención:** muestra el resumen, el último encuentro y las 4 opciones. Elegir una abre la confirmación de siempre (`openAgent`), con el grupo como destinatario. Se envía con doble ceja.
- **Aprobar el disparador:** al iniciar, si `GET /api/disparadores` trae uno en `pendiente`, la TV muestra "¿Activar: avisarme si me etiquetan en Familia?". La ceja manda `POST /api/disparadores/estado {id, estado: "activo"}`. Mientras no se apruebe, el agente ignora ese grupo. Para probar sin la TV, el modo dev (`?dev=1`) ya tiene el botón Aprobar.

## Datos locales del demo (fuera de git)

| Archivo | Contenido |
|---|---|
| `software/agent/data/semilla.json` | Emmy, sus contactos con los **mismos teléfonos** de `profile.json`, temas, límites y memorias. Se carga con `python3 software/agent/scripts/semilla.py` |
| `software/agent/data/disparadores.json` | El disparador del grupo de prueba con su `grupo_jid` real, `audiencia` y `miembros` con límites |

El teléfono es la llave entre `profile.json` del puente y la memoria del agente.

## Probar sin WhatsApp

```bash
curl -s -H 'Content-Type: application/json' http://127.0.0.1:8790/api/sugerir \
  -d '{"modo":"chat","telefono":"+56900000001","texto":"¿Te llevo al parque a las 4?"}'
curl -s -H 'Content-Type: application/json' http://127.0.0.1:8790/api/grupo \
  -d '{"id":"x1","grupo_jid":"120363000000000000@g.us","autor_tel":"+56900000001","texto":"@Ana ¿vienes?","menciona":true}'
```
