# Monitor MyoWare

Python 3.10+ en macOS/Linux, sin dependencias de pip. Usa `termios`; Windows no está soportado en esta versión. El puerto serie es obligatorio para no asumir el identificador de otra máquina. Escucha HTTP únicamente en 127.0.0.1; no desplegar ni exponer por túnel.

## Preparar el UNO R3

Desde la raíz, con Arduino CLI instalado:

```bash
arduino-cli core install arduino:avr
arduino-cli board list
arduino-cli compile --fqbn arduino:avr:uno firmware/myoware_a0
# Cambia el puerto por el que aparece en TU equipo:
arduino-cli upload --fqbn arduino:avr:uno --port /dev/cu.usbserial-1130 firmware/myoware_a0
python3 software/myoware-monitor/server.py --serial-port /dev/cu.usbserial-1130
```

Confirmar ATmega328P/UNO R3 antes de cargar; no usar este destino para UNO R4. Cerrar el monitor/Serial Plotter antes de cargar porque ambos necesitan el mismo puerto. Abrir http://127.0.0.1:8766. Puerto HTTP alternativo: `--http-port 8767`. Ctrl+C detiene el servidor y libera el puerto serie.

## Qué muestra

- Últimos 10 segundos y lectura actual en cuentas ADC 0–1023.
- Estado de conexión y ausencia de datos recientes (más de 1,5 segundos).
- Umbral manual de exploración; no detecta por sí mismo intención ni contracción.
- Exportación CSV de las últimas 1500 muestras de memoria. No sube datos a ningún servidor externo.

Acepta `ENV:512` o `512` por línea a 115200 baudios. El firmware etiqueta ENV aunque el selector físico esté en RAW: confirmar manualmente la posición. El servidor no configura ni reconoce el modo del sensor. No incluye simulación de señal.

## Diagnóstico

- Sin puerto: comprobar cable USB de datos, adaptador y `arduino-cli board list`.
- USB abierto sin muestras: comprobar firmware y velocidad serial.
- Señal alrededor de 512: comprobar ENV/RAW y contacto; ese número solo no identifica la causa.
- No abrir dos procesos sobre el mismo puerto.

La prueba del parser/HTTP usa una pseudoterminal sintética: `python3 -m unittest discover -s tests -v`. Eso no valida al sensor físico.
