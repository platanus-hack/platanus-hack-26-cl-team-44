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

No hay integración aún entre el monitor HTTP y el WebSocket de sensores esperado por el SO. La calibración de EMG y emisión de eventos siguen pendientes.

Los marcadores sin implementación y las copias de README anteriores se retiraron. Los originales están disponibles en el historial de Git; no se eliminó investigación ni funcionalidad.
