# Resultados de las calibraciones

Esta carpeta guarda el resumen anónimo de las calibraciones reales del eye-tracking, que [`tools/resumen.mjs`](../tools/resumen.mjs) genera a partir de los logs de sesión.

- `calibraciones.json`: una fila por calibración y el agregado (media, mediana, p90 y peor caso).
- `calibraciones.md`: las mismas cifras en tablas.

Si la carpeta solo tiene este README, falta generar el resumen con los logs, que están fuera de git en el computador de quien grabó las sesiones.

## Generar (quien tiene los logs)

```bash
node software/eye-tracking/tools/resumen.mjs
```

## Verificar (sin los logs)

```bash
node software/eye-tracking/tools/resumen.mjs --verificar
```

El comando recalcula el agregado con las filas del JSON, lo compara con el agregado guardado y con cada línea de `calibraciones.md`, rechaza cualquier campo que no esté en la lista permitida y sale con código 1 si algo no coincide. Corre en segundos.

Cada fila guarda id opaco de la sesión, día, fuente, tipo de calibración, escala, número de puntos, modelo elegido y error en grados, quieto y con movimiento. Nada más.
