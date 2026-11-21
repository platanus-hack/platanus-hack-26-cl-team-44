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

- Últimos 10 segundos y lectura actual de A0 y A3 en cuentas ADC 0–1023.
- Estado de conexión y ausencia de datos recientes (más de 1,5 segundos).
- Un umbral manual por canal; no detecta por sí mismo intención ni contracción.
- Exportación CSV de los últimos 1500 registros en memoria: `unix_seconds,a0_env_adc,a3_env_adc`. No sube datos a ningún servidor externo.
- Para diagnóstico, `/data?seconds=60` conserva hasta 60 segundos en memoria (máximo 6000 pares). No se guardan al cerrar el monitor.

Acepta `A0:512,A3:380` por línea a 115200 baudios. Las líneas anteriores `ENV:512` y `512` se siguen aceptando como solo A0; A3 queda sin lectura y su celda CSV queda vacía. `/data` devuelve `samples` como filas `[unix_seconds, a0, a3]` (`null` si la línea no incluye A3).

Confirma que ambos selectores físicos estén en ENV. El servidor no configura ni reconoce el modo del sensor, y una lectura del pin no confirma que haya un sensor conectado. No incluye simulación de señal.

Para distinguir gestos, usa **Prueba de gestos** con A0 en la mandíbula y A3 en la frente. Calibra ambos y observa el último gesto y los contadores: A3 solo cuenta como ceja; A0, aun cuando A3 también se active, cuenta como mandíbula. Esto no activa ni envía acciones.

Para usar la ceja como clic, selecciona **Abrir Woki OS con esta calibración** en el monitor y, en la pantalla de bienvenida, **Usar mouse + clic con la ceja**. La calibración se guarda en el navegador para esa dirección (`localhost` y `127.0.0.1` guardan perfiles por separado). Con otro puntero, actívalo primero y pulsa **Activar clic** en la barra inferior. No se necesita otro proceso para leer el puerto serie. Los umbrales manuales del gráfico no se usan para clasificar gestos.

## Diagnóstico

- Sin puerto: comprobar cable USB de datos, adaptador y `arduino-cli board list`.
- USB abierto sin muestras: comprobar firmware y velocidad serial.
- Señal alrededor de 512: comprobar ENV/RAW y contacto; ese número solo no identifica la causa.
- No abrir dos procesos sobre el mismo puerto.

La prueba del parser/HTTP usa una pseudoterminal sintética: `python3 -m unittest discover -s tests -v`. Eso no valida al sensor físico.
