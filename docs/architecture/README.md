# Arquitectura y organización

Separar código ejecutable, electrónica, fabricación y evidencia. Cada carpeta contiene un README aunque aún no tenga implementación; así Git conserva la estructura sin archivos vacíos ambiguos.

- Firmware: adquisición A0 en UNO.
- Software: monitor local Python/HTML y catálogo del SO.
- Hardware: lista de materiales y cableado.
- Mechanical: CAD fuente → exportación STL/3MF → registro de impresión.
- Docs: decisiones, requisitos y evidencia.
- Tests: pruebas automatizadas, sin hacerlas pasar por validación humana.
- Data: capturas locales excluidas de Git.

El SO y el puente WhatsApp de Emmy permanecen en `prototipo/` y `woki-bridge/`. No se duplican ni se trasladan, para evitar romper documentación, rutas y trabajo concurrente. `software/toki-os/README.md` apunta al código existente. Los planes históricos que dicen WOKI se mantienen como antecedentes; el nombre de presentación actual es Toki.

## Integración pendiente

```
MyoWare → UNO → serial → monitor local
                              │
                      [pendiente: calibración]
                              │
                      [pendiente: eventos]
                              ▼
                         MVP del SO
```

El panel HTTP actual no implementa el WebSocket de sensores que espera el MVP. No afirmar que contraer el bíceps ya controla el SO.
