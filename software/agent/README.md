# Agente y memoria de Myo

Pasos 1 y 2 de `docs/product/ALCANCE-AGENTE.md`. Este paso trae 3 piezas:

- **Memoria mínima.** SQLite con los 5 tipos del plan de Emmy, filtro de privacidad por interlocutor, límites duros por persona y revisión de las opciones del modelo.
- **Agente de 1 turno.** Recibe un mensaje y devuelve un resumen y 4 opciones con emoción y fuente. Llama al modelo con `llm.py`: la suscripción de Claude Code o una API key de Anthropic (ver «Suscripción o API key»).
- **Servidor con SSE y modo dev en la TV.** Simula un mensaje del grupo o de la sala y muestra las opciones en la pantalla Hablar.

- **Endpoints para el puente de WhatsApp.** `/api/sugerir` (modos `chat`, `mencion`, `voz`) y `/api/grupo` con disparadores que la usuaria aprueba. Ver `INTEGRACION-PUENTE.md`.

- **Escucha con voces separadas y tarjetas por tema.** La TV escucha la sala con ElevenLabs Scribe v3 Live (`toki-os/myo-escucha.js`). Ver «Escuchar la sala» abajo.

## Escuchar la sala

El acompañante aprieta «🎙 Escuchar» en Hablar. El puente entrega un token de un solo uso (`POST /api/voz/escucha`); la llave de ElevenLabs no sale de la VPS.

- Scribe separa las voces: cada turno llega como «Voz 1», «Voz 2». El acompañante elige de quién es cada voz una vez por sesión.
- Por cada turno, la TV pide **tarjetas por tema** (`POST /api/tarjetas`, sin modelo, en milisegundos) y luego las **opciones del agente** (`/api/sugerir`, modo `voz`). Quedan 3 del agente y la mejor tarjeta del tema.
- **Privacidad:** la TV manda `hablantes` (ids o `null`). Gana el tipo que ve menos; una voz sin identificar cuenta como desconocido. Con `hablantes`, el agente no adivina la persona por nombres en el texto (`hablantes.py`).
- **Tarjetas:** `catalogo/temas.json` (14 temas genéricos, en git) y `data/tarjetas.json` (propias de la usuaria, fuera de git, `make tarjetas`). Formato: `{"tarjetas": [{"id", "tema", "texto", "personas"?: [id], "privacidad"?: "publico" | "salud" | "familia"}]}`. Una tarjeta con `personas` solo sale si esa persona está hablando.
- **Aprende el orden:** cada tarjeta dicha se anota en `data/tarjetas_uso.jsonl` (id, tema y persona; sin texto).
- **Medido** con voces sintéticas: sin ruido de fondo, 100 % de turnos con el hablante correcto y ~0,65 s de latencia. Con la TV del cuarto a volumen medio o alto, los turnos se atrasan 8-14 s: en la demo, TV apagada o baja.
- **Privacidad del audio:** en el plan actual de ElevenLabs (no Enterprise) el audio de la sesión queda registrado en sus servidores.

## Probar en la TV (modo dev)

En 2 terminales, desde la raíz del repo:

```bash
# 1. Agente (necesita Claude Code con sesión, o ANTHROPIC_API_KEY con TOKI_LLM=api)
software/agent/.venv/bin/python software/agent/server.py
# 2. TV
python3 -m http.server 8000 --bind 127.0.0.1 --directory software/toki-os
```

Abre http://localhost:8000/woki-os.html?dev=1 y aprieta "Usar mouse (demo)". También puedes abrir el panel con Shift+D.

En el panel eliges quién habla, el canal (grupo de WhatsApp o voz en la sala) y el mensaje, o tocas un ejemplo. Al apretar Simular, la TV pasa a Hablar con el resumen, el último encuentro y las 4 opciones. La traza del panel muestra el tiempo, las fuentes y las opciones descartadas.

El panel no tiene `data-t`, así que la mirada y la ceja no lo seleccionan. Su teclado no llega a la TV.

## Probar en 3 comandos

Desde la raíz del repo, con Python 3.11 o mayor:

```bash
python3 software/agent/scripts/semilla.py --ejemplo
python3 software/agent/scripts/contexto.py --texto "Hola Anita, soy Pedrito. ¿Vamos al cumple de Tomi el sábado?"
python3 -m unittest discover software/agent/tests
```

El segundo comando muestra qué ve el agente, sin llamar a ningún modelo. Prueba también `--persona tomas` o `--persona dra_perez`, y `--opciones "Tengo ELA|Sí"` para ver el filtro de salida.

## Probar el agente

Necesita Claude Code con sesión iniciada en la máquina. En un servidor sin navegador, `claude setup-token` da el valor de `CLAUDE_CODE_OAUTH_TOKEN`. Con una API key, ver «Suscripción o API key».

```bash
python3 -m venv software/agent/.venv
software/agent/.venv/bin/pip install -r software/agent/requirements.txt
software/agent/.venv/bin/python software/agent/scripts/probar_agente.py \
  --texto "Hola Anita, soy Pedrito. ¿Vamos al cumple de Tomi el sábado?"
```

En modo `suscripcion`, si `ANTHROPIC_API_KEY` también está definida, Claude Code usa esa key y no la suscripción.

Variables opcionales:

| Variable | Valor por defecto | Para qué |
|---|---|---|
| `TOKI_MODELO` | `claude-sonnet-5-5` | Modelo del agente |
| `TOKI_AGENTE_TOPE_S` | `20` | Segundos antes de usar las opciones de reglas |
| `TOKI_AGENTE_PORT` | `8790` | Puerto del servidor |
| `TOKI_DATA` | `software/agent/data` | Carpeta de la memoria y sus archivos (otra instancia usa otra carpeta) |
| `TOKI_DEMO` | vacío | Con `1`, modo demo: 403 en las rutas que escriben, las de voces y `/api/grupo`; exige un `TOKI_DATA` propio |
| `TOKI_LLM` | según las credenciales | `suscripcion` o `api` (ver abajo) |

Instancia demo local, con la memoria ficticia de la TV pública:

```bash
TOKI_DATA=/tmp/myo-demo python3 software/agent/scripts/semilla.py --semilla software/agent/ejemplos/semilla.demo.json
TOKI_DEMO=1 TOKI_DATA=/tmp/myo-demo TOKI_AGENTE_PORT=8792 python3 software/agent/server.py
```

## Suscripción o API key

`llm.py` hace todas las llamadas al modelo. `TOKI_LLM` elige el modo:

| `TOKI_LLM` | Cómo llama | Credencial | Para quién |
|---|---|---|---|
| `suscripcion` | `claude-agent-sdk` (Claude Code) | `CLAUDE_CODE_OAUTH_TOKEN` o la sesión de Claude Code de la máquina | Una persona que corre Myo para sí misma |
| `api` | SDK `anthropic` (Messages API) | `ANTHROPIC_API_KEY` | Un servicio que atiende a otras personas |

- El modo `suscripcion` usa la suscripción de Claude de una persona. Es para uso personal: esa persona corre Myo para sí misma.
- Si Myo atiende a otras personas o corre como servicio, usa el modo `api` con una API key de Anthropic (`ANTHROPIC_API_KEY`). Ese uso queda bajo los Términos Comerciales de Anthropic.
- Sin `TOKI_LLM`, el agente elige así: `suscripcion` si existe `CLAUDE_CODE_OAUTH_TOKEN`; si no, `api` si existe `ANTHROPIC_API_KEY`; si no, `suscripcion` con la sesión de Claude Code de la máquina.
- Los 2 modos mandan el mismo prompt de sistema, el mismo mensaje, el mismo esquema JSON y el mismo modelo (`TOKI_MODELO`), con `effort` bajo. El tope `TOKI_AGENTE_TOPE_S` es el mismo. Si la llamada falla, las opciones salen de reglas.
- En modo `api`, el prompt de sistema lleva `cache_control`. La API lo guarda 5 minutos si tiene 512 tokens o más (Sonnet 5.5). `meta.uso.cache_read_input_tokens` muestra los tokens que salieron de la caché.
- El servidor escribe el modo al arrancar: `toki-agent · ... · llm api · ...`.

Para pasar la VPS al modo `api`:

1. Instala el paquete `anthropic` en el venv. `deploy/instalar.sh` lo hace, porque está en `requirements.txt`.
2. Pon la key en `/opt/toki/agente.env`. Es un archivo solo para root y fuera de git. El comando lo reemplaza entero:

```bash
read -s K && ssh toki-vps "umask 077 && printf 'TOKI_LLM=api\nANTHROPIC_API_KEY=%s\n' '$K' > /opt/toki/agente.env && systemctl restart toki-agente" && unset K
ssh toki-vps "journalctl -u toki-agente -n 50 --no-pager | grep 'llm ' | tail -1"   # debe decir: llm api
```

Para volver a la suscripción, deja en el mismo archivo solo `CLAUDE_CODE_OAUTH_TOKEN` (ver `deploy/README.md`), o pon `TOKI_LLM=suscripcion`.

## Cómo funciona

1. `memoria/filtros.py` saca las memorias que el interlocutor no puede ver: no aprobadas, privacidad fuera de su nivel o con un tema bloqueado para esa persona.
2. `memoria/contexto.py` arma el contexto con todo lo visible y los últimos 3 encuentros con esa persona. Cada línea lleva su id (`[m9]`) como fuente.
3. `agente.py` corre 1 turno por `llm.py`, sin herramientas y con salida estructurada. En modo `suscripcion` va con `tools=[]`, `setting_sources=[]` y `strict_mcp_config=True`.
4. `memoria/salida.py` quita las opciones que tocan un tema bloqueado, las de más de 15 palabras y las repetidas. Completa a 4 y deja "Después te respondo" al final.
5. Si el modelo falla o pasa el tope de tiempo, las 4 opciones salen de reglas.

## Datos

- `ejemplos/semilla.example.json`: persona ficticia (Ana) para probar.
- `data/semilla.json`: la semilla real del demo, que `semilla.py` usa sin `--ejemplo` cuando el archivo existe.
- `data/`: carpeta ignorada por git, con la semilla real y `memoria.db`, porque el repo es público.

## Medido el 21-nov-2026 en un MacBook

| Caso | Tiempo total | Tiempo del modelo |
|---|---|---|
| Pedro pregunta por el cumpleaños | 9,0 s | 3,5 s |
| El nieto pregunta si está enferma (tema `diagnostico` bloqueado) | 7,2 s | 5,9 s |

La diferencia es el arranque del proceso de Claude Code en cada llamada (modo `suscripcion`).

## Importar la memoria desde un chat de WhatsApp

`scripts/importar_whatsapp.py` lee un chat exportado (`.zip` o `_chat.txt`, formato iOS o Android) y propone memorias de la usuaria. El texto del chat no entra al repo: la salida va a `data/`, que git ignora.

```bash
A=software/agent; PY=$A/.venv/bin/python
$PY $A/scripts/importar_whatsapp.py chat.zip --autores                     # nombres y conteo, sin mensajes
$PY $A/scripts/importar_whatsapp.py chat.zip --yo "Emms" --nombre Emmy --persona juan --otra Juan --resumir 120
```

| Parte | Cómo | Sale como |
|---|---|---|
| Léxico | Palabras que ella usa más que la otra persona, en 5 días distintos o más; su risa y sus emojis | `lexico`, `publico` |
| Estilo | Frases reales de 3 a 10 palabras, sin números, links, correos ni código | `estilo`, `familia` |
| Perfil, episodios, rutinas, personas | `--resumir N`: los últimos N días van a Claude por `llm.py` en trozos de 60.000 caracteres | `perfil` / `episodio` / `rutina` |

Todo queda en `propuesta`: el agente no lo usa hasta que la usuaria o su cuidadora lo aprueba (`"estado": "aprobada"`). `--aprobar` las deja aprobadas, solo para pruebas. Para cargar un archivo importado, ponlo en la semilla (`"importar": ["importado-juan.json"]`) y corre `scripts/semilla.py`.

Revisa a mano lo de salud, pareja y terceros antes de aprobarlo: en la demo, lo aprobado puede salir en pantalla.
