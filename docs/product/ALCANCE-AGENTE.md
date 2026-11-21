# Alcance del agente y la memoria para el demo

Fecha: 21-nov-2026. Estado: propuesta para revisar con Emmy y jhomar.

Este documento fija qué hace el agente en el demo, cómo corre su loop y cómo guarda la memoria. Lo que no está aquí queda fuera del demo.

## 1. Personas del demo

| Persona | Papel |
|---|---|
| Emmy | Usa el comunicador con mirada y EMG (ceja y mandíbula). |
| Juan | Escribe en el grupo familiar, recibe la alerta de noche y es la pareja del aniversario. |

Los datos reales de Emmy y Juan (teléfonos, perfil, memoria) quedan fuera de git. El repo es público. Al repo solo van archivos de ejemplo, como `profile.example.json`.

## 2. Escenas

| # | Escena | Disparador | Qué hace el agente | Qué confirma Emmy |
|---|---|---|---|---|
| 1 | Mención en el grupo familiar | Mensaje de grupo en wapi con una mención a Emmy | Lee el historial del grupo y la memoria. Prepara un resumen de 2 líneas y 4 respuestas con emoción. | Elige una respuesta y la envía con doble confirmación. |
| 2 | Hablar con la gente alrededor | Emmy elige una frase en la TV | Nada nuevo. Usa la emoción elegida. | La frase sale con ElevenLabs `eleven_v3` y etiquetas de emoción. Si falla o tarda, sale con `speechSynthesis` del navegador. |
| 3 | Rappi para el aniversario | Emmy pide, por ejemplo, "flores, máximo 30.000 CLP" | Navega rappi.cl real, filtra con la memoria (gustos de Juan) y muestra opciones. | Elige una opción. El agente nunca paga: una persona paga en su teléfono. |
| 4 | Alarma de noche | Combo de alarma en la TV | El escalamiento sigue en código. El agente solo redacta el texto con contexto (hora, último uso de la TV). | Nada. La alarma no espera confirmación. |
| 5 | Onboarding | Formulario de la familia, capa A de `PLAN-ONBOARDING-MEMORIA.md` | Carga el perfil inicial en la memoria. | Emmy aprueba lo que la familia carga. |

Fuera del demo: el juego por turnos con un control de PS5 o Xbox.

## 3. Disparadores

- El cuidador crea cada disparador desde su teléfono. Ejemplo: "avísame si me etiquetan en Familia".
- Emmy aprueba cada disparador nuevo en la TV con la ceja.
- Emmy pausa cualquier disparador con un solo gesto.
- El agente empieza callado: tope de propuestas por hora y horas de silencio.

## 4. Loop del agente

Fuente de las reglas: documentación del Claude Agent SDK y el artículo "Building always-on agents" (13-nov-2026).

**Paquete:** `claude-agent-sdk==0.2.187`, versión fija. PyPI lo marca como "Development Status :: 3 - Alpha", así que el resto del código llama a una función propia, `run_agent(evento)`, y no al SDK directo.

**Dónde corre:** una VPS, con la suscripción de Claude Code de Juan (uso personal). En un servidor sin navegador, `claude setup-token` da el token para `CLAUDE_CODE_OAUTH_TOKEN`.

**Reglas:**

1. Una corrida por evento. Todos los eventos entran a una bandeja con un solo trabajador. Los eventos que llegan juntos se agrupan en uno.
2. Se deduplica por id de origen: `key.id` de wapi, o `src` + `seq` de los sensores.
3. `tools=[]` quita todas las herramientas integradas (`Bash`, archivos, web). `allowed_tools` solo aprueba sin preguntar y no restringe nada.
4. `strict_mcp_config=True` y `setting_sources=[]`. Así no carga conectores, `CLAUDE.md` ni hooks de la máquina.
5. `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`. Sin esa variable, la memoria automática de Claude Code se carga aunque `setting_sources=[]`.
6. Un hook `PreToolUse` niega toda herramienta fuera de `mcp__toki__*` y registra cada llamada.
7. `output_format` con JSON schema para las 4 opciones `{text, tone, emo}`.
8. `max_turns`, `max_budget_usd` y `effort="low"`. Un `system_prompt` propio y corto, sin el preset `claude_code`.
9. Un `ClaudeSDKClient` abierto por trabajador, para no lanzar un proceso `claude` nuevo en cada evento.
10. Si el agente falla o tarda demasiado, la TV usa sus reglas locales (`RULES` y `DEFAULT` en `woki-os.html`).

**El agente no envía ni paga.** No tiene herramienta de envío. Solo `whatsapp-bridge` envía, después de la doble confirmación de Emmy. Rappi se detiene antes del pago.

**El texto de WhatsApp no es confiable.** Un mensaje del grupo puede traer instrucciones escondidas. Por eso un mensaje nunca escribe memoria ni dispara acciones sin la confirmación de Emmy.

### Herramientas del agente

| Herramienta | Qué hace | Tipo |
|---|---|---|
| `memoria_buscar` | Busca en la memoria con el tipo de interlocutor del evento | Lectura |
| `historial_chat` | Últimos N mensajes del chat o grupo | Lectura |
| `personas` | Personas conocidas, con relación y trato | Lectura |
| `rappi_buscar` | Envuelve `rappi_agent.py`: busca, filtra y arma opciones | Lectura en la web |
| `publicar_opciones` | Manda el resumen y las 4 opciones a la TV como `agent_step` | Salida |
| `proponer_memoria` | Deja un hecho nuevo en estado pendiente | Escritura pendiente |

Rappi va como herramienta y no como subagente. Un subagente agrega un segundo loop y más espera.

## 5. Memoria

**Almacenamiento:** SQLite con búsqueda FTS5, a partir de `memoria.py` de `woki-speakeasy`. El archivo de la base queda fuera de git.

**Tipos:** los 5 de `PLAN-ONBOARDING-MEMORIA.md`: perfil, léxico, estilo, episodios y rutinas.

**Privacidad:** las 7 reglas de la sección 3 de `PLAN-ONBOARDING-MEMORIA.md`. En el código eso significa 3 cosas:

- La herramienta `memoria_buscar` recibe el tipo de interlocutor del evento (familia, médico o desconocido). El modelo no lo elige.
- Los límites por persona se filtran en código antes de llamar al modelo.
- Cada frase guarda los ids de memoria que usó, así la TV muestra la fuente.

**Pendiente:** qué aprende la memoria durante el demo. Hasta decidirlo, la memoria del demo es la precargada por el onboarding.

## 6. WhatsApp

- Canal: wapi, con `software/whatsapp-bridge`.
- wapi no tiene un endpoint para leer mensajes recibidos. `sessions.messages()` devuelve solo los enviados. Por eso el puente guarda los mensajes de los grupos de la lista blanca.
- Hoy el puente descarta los grupos (`remoteJid.endsWith("@g.us")`). Para la escena 1 hay que cambiarlo por una lista blanca de grupos y detectar la mención por teléfono o por LID.
- Primer paso: capturar un mensaje real de grupo con `DEBUG_WEBHOOK=1` para confirmar los nombres de los campos.

## 7. Reparto

| Persona | Capa |
|---|---|
| Juan | Agente, memoria y Rappi en `software/agent/` |
| Emmy | TV (`software/toki-os`) y onboarding |
| jhomar | EMG → clic |

Contrato común: eventos por SSE y `agent_step {task_id, text, status, sources, ...}`.

## 8. Riesgos

| Riesgo | Plan |
|---|---|
| Rappi real desde una VPS: la IP de datacenter sube la probabilidad de captcha o bloqueo | El agente ya se detiene ante captcha, OTP o `/login` y pasa el control a una persona. Opción: el Chrome de Rappi corre en un Mac con IP residencial y sesión iniciada. Respaldo de escenario: `RAPPI_DRY_RUN=1`. |
| La suscripción en la VPS | La documentación del SDK pide API key para productos. Este uso es personal. Si falla el login, el respaldo es una API key. |
| Datos reales en un repo público | Perfiles, teléfonos y memoria en archivos ignorados por git. |
| El SDK en alpha cambia a diario | Versión fija y una sola función propia que lo llama. |
