# Separación de voces: resultados medidos

Medición del oído completo, igual que en la demo: archivo en tiempo real → oído → Scribe v3 Live (VAD 0,6 s, diarización) → turnos con hablante.

- **Medición:** 22-nov-2026, 6 escenarios × 3 repeticiones.
- **Datos crudos:** [`resultados/medicion-20261122-0409.json`](resultados/medicion-20261122-0409.json), con cada turno, su etiqueta y la hora de llegada.
- **Recalcular las métricas:** `medir.evaluar()`, que tiene sus propias pruebas en `tests/test_oido.py`.

```bash
ELEVENLABS_API_KEY=… software/oido/.venv/bin/python software/oido/medir.py --repeticiones 3   # ~2 min, < 3 centavos
```

## Resultados

| Escenario | Turnos ok (3 corridas) | Base: misma etiqueta para todos | Latencia mediana | Latencia máxima | Turnos extra por corrida |
|---|---|---|---|---|---|
| Hombre y mujer | **15/15** | 9/15 | 0,76–0,85 s | 0,87 s | 0 |
| Dos mujeres | **15/15** | 9/15 | 0,66–0,80 s | 0,94 s | 0 |
| Tres voces | **18/18** | 6/18 | 0,68–0,72 s | 0,82 s | 0 |
| **Sin ruido, total** | **48/48** | 24/48 (50 %) | **~0,75 s** | **0,94 s** | 0 |
| TV de fondo, baja | 12/12 | 6/12 | 0,76–0,85 s | 3,45 s | 2–3 |
| TV de fondo, media | 12/12 * | 6/12 | **9,0–9,2 s** | **15,1 s** | 3 |
| TV de fondo, alta | 9/12 * | 6/12 | **9,0–9,1 s** | **15,1 s** | 1 |

La latencia se mide desde que termina la frase en el audio hasta que la TV recibe el turno con hablante.

\* **Con la TV media o alta, el número de aciertos engaña.** La TV nunca deja un silencio, así que el VAD de Scribe no corta las frases. Toda la conversación llega junta cuando termina el audio, con 9 a 15 s de atraso. Además llega partida en fragmentos y aparece una voz que no existe (S2). La etiqueta mayoritaria de cada frase sale bien, pero así no se puede usar en vivo.

## Qué se puede decir y qué no

- ✅ «Con audio sintético sin ruido, el oído atribuyó bien 48 de 48 turnos en 3 repeticiones (la base de una sola etiqueta acierta 24), con ~0,75 s de latencia.»
- ✅ «Con la TV baja sigue atribuyendo bien, pero transcribe frases de la TV como turnos (2–3 por conversación).»
- ✅ «Con la TV media o alta, los turnos se atrasan 9–15 s. Hay que bajar la TV o usar un micrófono direccional cerca de la persona que habla.»
- ❌ No decir «100 %» sin aclarar que es con voces sintéticas (ElevenLabs) y medido con Scribe, del mismo proveedor.
- ❌ No decir que funciona con voces reales ni con habla solapada: ninguno de los dos casos está en estos escenarios.
- ❌ No presentar la separación de voces como desarrollo propio: la hace Scribe. Lo propio es el oído:
  - el servicio supervisado y la reconexión sin perder audio;
  - las etiquetas que una sesión nueva no hereda, con la privacidad según quién habla;
  - las huellas de voz y la integración con la TV.

## Límites de esta medición

- **Muestra chica:** son 20 frases distintas, y las 3 repeticiones usan el mismo audio, así que no son muestras independientes.
- **Voces sintéticas:** las voces son TTS de ElevenLabs, con turnos alternados, sin solaparse y con ~0,9 s de pausa entre turnos.
- **Lo siguiente que más aporta:** grabar 3–5 conversaciones reales (`--dir mis_grabaciones`, mismo formato `audio.wav` + `guion.json`).
