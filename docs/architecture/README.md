# Organización

Cinco áreas en la raíz: `software`, `firmware`, `hardware`, `docs` y `tests`. Los archivos del concurso permanecen en raíz.

| Antes | Ahora |
|---|---|
| `prototipo/` | `software/toki-os/` |
| `woki-bridge/` | `software/whatsapp-bridge/` |
| `raspberry/` | `hardware/raspberry/` |
| `mechanical/` | `hardware/3d/` |
| Planes, guías, informe y mockups en raíz | `docs/product/` |
| `hallazgos/` | `docs/product/hallazgos/` |
| `reports/`, `research_notes/` | `docs/research/reports/`, `docs/research/notes/` |

Se preservan los archivos ejecutables del SO, puente, firmware y monitor. Cambian las carpetas de lanzamiento; la URL `http://localhost:8000/woki-os.html`, los puertos y protocolos se mantienen.

El monitor ([`software/myoware-monitor/server.py`](../../software/myoware-monitor/server.py)) sirve Myo OS en el puerto 8766 y le entrega los gestos calibrados por HTTP (`/emg/gestures`). El WebSocket `EMG_WS` (puerto 8765) queda como puente opcional.

Los marcadores sin implementación y las copias de README anteriores se retiraron. Los originales están disponibles en el historial de Git; no se eliminó investigación ni funcionalidad.
