# Agente y memoria de Toki

Pasos 1 y 2 de `docs/product/ALCANCE-AGENTE.md`. Este paso trae 2 piezas:

- **Memoria mínima.** SQLite con los 5 tipos del plan de Emmy, filtro de privacidad por interlocutor, límites duros por persona y revisión de las opciones del modelo.
- **Agente de 1 turno.** Recibe un mensaje y devuelve un resumen y 4 opciones con emoción y fuente. Usa `claude-agent-sdk` con la sesión de Claude Code de la máquina.

Todavía no trae servidor, SSE, puente de WhatsApp, voz ni escucha.

## Probar en 3 comandos

Desde la raíz del repo, con Python 3.11 o mayor:

```bash
python3 software/agent/scripts/semilla.py --ejemplo
python3 software/agent/scripts/contexto.py --texto "Hola Anita, soy Pedrito. ¿Vamos al cumple de Tomi el sábado?"
python3 -m unittest discover software/agent/tests
```

El segundo comando muestra qué ve el agente, sin llamar a ningún modelo. Prueba también `--persona tomas` o `--persona dra_perez`, y `--opciones "Tengo ELA|Sí"` para ver el filtro de salida.

## Probar el agente

Necesita Claude Code con sesión iniciada en la máquina. En un servidor sin navegador, `claude setup-token` da el valor de `CLAUDE_CODE_OAUTH_TOKEN`.

```bash
python3 -m venv software/agent/.venv
software/agent/.venv/bin/pip install -r software/agent/requirements.txt
software/agent/.venv/bin/python software/agent/scripts/probar_agente.py \
  --texto "Hola Anita, soy Pedrito. ¿Vamos al cumple de Tomi el sábado?"
```

Si `ANTHROPIC_API_KEY` está definida, el SDK usa esa key y no la suscripción.

Variables opcionales:

| Variable | Valor por defecto | Para qué |
|---|---|---|
| `TOKI_MODELO` | `claude-sonnet-5-5` | Modelo del agente |
| `TOKI_AGENTE_TOPE_S` | `20` | Segundos antes de usar las opciones de reglas |

## Cómo funciona

1. `memoria/filtros.py` saca las memorias que el interlocutor no puede ver: no aprobadas, privacidad fuera de su nivel o con un tema bloqueado para esa persona.
2. `memoria/contexto.py` arma el contexto con todo lo visible y los últimos 3 encuentros con esa persona. Cada línea lleva su id (`[m9]`) como fuente.
3. `agente.py` corre 1 turno sin herramientas (`tools=[]`, `setting_sources=[]`, `strict_mcp_config=True`) y con salida estructurada.
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

La diferencia es el arranque del proceso de Claude Code en cada llamada.
