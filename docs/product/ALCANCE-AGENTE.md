# Alcance del agente y la memoria para el demo

Fecha: 21-nov-2026. Estado: propuesta para revisar con Emmy y jhomar.

Este documento fija qué hace el agente en el demo, cómo corre su loop y cómo guarda la memoria. Lo que no está aquí queda fuera del demo.

## 0. Prioridad para el demo

Criterio: hacer primero lo que se ve en escena. Con 20 a 50 recuerdos en la memoria del demo, no hace falta ranking ni pesos. El código filtra (privacidad y límites por persona) y manda todo lo visible al modelo. Para la mención en el grupo, el agente responde en 1 turno con salida estructurada y sin herramientas. Las herramientas quedan para Rappi.

**P0 · Sin esto no hay demo**

| # | Pieza | Responsable | Horas |
|---|---|---|---|
| 1 | EMG → clic en la TV | jhomar | Las estima jhomar |
| 2 | Mención en el grupo: el puente acepta 1 grupo de la lista blanca, detecta la mención y guarda los últimos 30 mensajes | Juan | 2 |
| 3 | Agente para la mención: 1 turno, resumen y 4 opciones con emoción y fuente | Juan | 2 |
| 4 | Memoria mínima: SQLite con los 5 tipos, semilla del demo, filtro de privacidad, `deny` por persona y etiqueta de fuente | Juan | 2 |
| 5 | TV: recibe el evento, muestra resumen y opciones, envía con doble confirmación | Emmy | 2 a 3 |
| 6 | Voz: ElevenLabs `eleven_v3` con etiqueta de emoción y respaldo en `speechSynthesis` | Emmy o Juan | 1 a 2 |

**P1 · Después del P0**

| # | Pieza | Horas | Nota |
|---|---|---|---|
| 7 | Rappi flores: `rappi_agent.py` como herramienta, real con respaldo en modo ensayo | 2 a 3 | El Chrome de Rappi corre en un Mac con IP residencial y sesión iniciada |
| 8 | Alarma de noche: el puente manda el WhatsApp a Juan | 1 | La alarma ya existe en la TV |

**P2 · Solo como imagen o en el pitch**

- Disparadores: una sola tarjeta en la TV, "¿Activar: avisarme si me etiquetan en Familia?", que Emmy aprueba con la ceja. Sin pantalla para el cuidador.
- Onboarding: la memoria del demo sale de un archivo de semilla. Las pantallas de Emmy entran si ya están listas.
- Estándares (CALL Scotland y FHIR Consent): una frase en el pitch.

**Fuera hasta después del hackathon:** pesos y puntaje (etapa 2 de la sección 5.1), contadores y aprendizaje, exportación a FHIR, motor de política proactiva (etapa 3), `ClaudeSDKClient` abierto y hooks extra, audios y fotos de WhatsApp, el juego y el Raspberry Pi.

**Riesgos que se prueban antes de escribir código:**

1. La sesión de wapi conectada y una mención real capturada con `DEBUG_WEBHOOK=1`.
2. Claude Code con sesión en la VPS (`claude setup-token`) y una llamada de prueba del Agent SDK.
3. `test_rappi_agent.py --live` lee rappi.cl desde la máquina del demo.

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

### 5.1 Capa determinista de reglas y pesos

El modelo nunca decide qué memoria ve ni qué tema puede tocar. Una capa de código corre antes y después de cada llamada al modelo. Tiene 4 etapas, en este orden.

**Etapa 1 · Filtros duros (sin pesos).** Una memoria que no pasa un filtro no llega al modelo.

| Filtro | Regla | Ya existe en `memoria.py` |
|---|---|---|
| Estado | Solo memorias `aprobada` | Sí |
| Vigencia | `valido_hasta` vacío o futuro | Sí |
| Privacidad por interlocutor | Matriz `VISIBLE`: familia ve `publico`, `familia` y `salud`; médico ve `publico` y `salud`; desconocido ve `publico` | Sí |
| Límites por persona | Regla `deny` de persona × tema, como `FHIR Consent`. Saca del contexto toda memoria con ese tema | No. Hoy las memorias `evitar` van al prompt como instrucción. La regla 5 de `PLAN-ONBOARDING-MEMORIA.md` pide filtrarlas en código |
| Modo íntimo y "no aprendas esto" | Sin sugerencias visibles y sin guardar nada | No |

Precedencia: un `deny` gana sobre cualquier puntaje, igual que en `FHIR Consent`.

**Etapa 2 · Puntaje (después del hackathon).** Ordena las memorias que pasaron los filtros. Los pesos viven en un archivo, `pesos.yaml`, y cada frase guarda el detalle de su puntaje para la traza.

| Señal | Fórmula | Base | Ya existe |
|---|---|---|---|
| Relevancia | `bm25` de FTS5 sobre los últimos 3 turnos | SQLite FTS5 | Sí |
| Persona mencionada | × 2 si la memoria nombra a alguien del mensaje | Propia | Sí |
| Recencia de episodios | `exp(-días / 90)` | "Generative Agents" (Park y otros, 2023) usa decaimiento exponencial por recencia | Sí, con `DECAY_DIAS = 90` |
| Aceptaciones | `1 + log(1 + aceptaciones)` | Frecuencia de uso, como la predicción de palabras en CAA | Sí |
| Mostrada y no aceptada | Penaliza según `usos - aceptaciones` | Cambio 4 de "Buenas prácticas CAA para ELA" | No. Hoy `usos` no penaliza |
| Rutina por hora | Impulso si la rutina cae a ± 1 h de la hora actual | Bucket "daily routines" de SPICA | No |
| Frecuencia y recencia juntas (opcional) | Activación de ACT-R: `ln(Σ t^-0,5)` sobre cada uso | Modelo de memoria ACT-R (Anderson) | No |

Topes por tipo: `K_HECHOS`, `K_EPISODIOS` y un mínimo de 3 episodios. Ya existen.

**Etapa 3 · Política proactiva (después del hackathon).** Decide si el agente corre y si interrumpe a Emmy.

- Cada disparador es una regla `cuándo → condición → acción`. La crea el cuidador y queda inactiva hasta que Emmy la aprueba.
- Tope de propuestas por hora, horas de silencio y una espera mínima por chat.
- Prioridad fija: alarma > salud > mensajes > iniciativa social.
- El orden de las ideas proactivas usa el puntaje de `diseno.md`: (Valor − Riesgo) × Factibilidad.

**Etapa 4 · Filtro de salida.** Revisa las 4 opciones del modelo antes de mostrarlas.

- Descarta una opción que toque un tema con `deny` para ese interlocutor.
- Máximo 15 palabras por opción.
- Siempre hay una opción neutral, por ejemplo "Después te respondo".
- Si queda menos de 4 opciones válidas, completa con las reglas locales de la TV.

### 5.2 Estándares de referencia

No existe un estándar de memoria personal para CAA. El comunicador toma los nombres de campo de 2 plantillas de cuidado y exporta la privacidad como `FHIR Consent`. Detalle y fuentes: `~/reports/Estandares memoria personal CAA.md` en la máquina de Juan.

| Memoria | Campo sugerido | Pasaporte de comunicación (CALL Scotland) | "This is me" (Alzheimer's Society) | FHIR / PACIO | SPICA / SocializeChat |
|---|---|---|---|---|---|
| Perfil · identidad | `name`, `preferred_name`, `place`, `languages` | "My name is", "I like to be called" | "Name I like to be called", "Where I live" | `Patient.name`, `Patient.communication.language` | "personal background" |
| Perfil · personas | `person{name, relationship, closeness}` | "Special People", "My Family" | "The people who know me best" | `RelatedPerson.relationship` | "closeness level" |
| Perfil · personalidad | `traits`, `values`, `interests` | `I like / I don't like` | "My hobbies and interests" | PACIO "Personal Priorities Organizer" | "personal background" |
| Perfil · límites | `limit{topic, person_id, reason}` | `I mustn't`, `Please DON'T` | "Things that may worry or upset me" | `Consent.provision` con `deny`, `actor` = `RelatedPerson`, `code` = tema | "topics to avoid" |
| Léxico | `entry{term, meaning, usage}` | "How I communicate" | "How we can communicate" | Extensión propia | "communication mode" |
| Estilo | `phrase{text, chosen, edited_from}`, `length`, `tone` | "How you can help me with communication" | Sin equivalente | Sin equivalente | "preferred response length and tone" |
| Episodios | `episode{date, summary, people, sensitivity}` | "My Past", "Special moments and events in my life" | "Other notes about me" | `Observation` con fecha | "autobiographical narratives" |
| Rutinas | `routine{time, activity, help_needed}` | "I need help with" | "The following routines are important to me" | PACIO "Care Experience Preference" | "daily routines" |

Para la sensibilidad de cada memoria sirven las etiquetas de confidencialidad de HL7 (`N`, `R`, `V`). Para registrar cada aprobación de Emmy sirve ISO/IEC TS 27560:2023.

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
