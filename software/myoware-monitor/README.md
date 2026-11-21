# Monitor MyoWare

Python 3.10+ en macOS/Linux. El modo USB usa `termios` y no necesita dependencias de pip; el modo Bluetooth necesita Bleak. Escucha HTTP únicamente en 127.0.0.1; no desplegar ni exponer por túnel.

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

## Usar dos MyoWare BLE

1. Usa dos Wireless Shield con el sketch [`myoware_env_ble`](../../firmware/myoware_env_ble/myoware_env_ble.ino), equivalente a `MyoWareEnvTest.ino`. Asigna un nombre distinto a cada dispositivo (`MyoWareMandibula` y `MyoWareCeja`, por ejemplo), o usa sus identificadores BLE si ya están cargados con el mismo nombre.
2. Con electrodos puestos, usa alimentación autónoma por batería y Bluetooth; no conectes los sensores por USB a un cargador, Mac o Raspberry. Si nRF Connect está conectado a uno, desconéctalo primero.
3. Desde la raíz, en tu entorno Python, ejecuta:

   ```bash
   python3 -m pip install bleak
   python3 software/myoware-monitor/server.py --ble-jaw MyoWareMandibula --ble-brow MyoWareCeja
   ```

4. Abre http://127.0.0.1:8766, verifica ambas señales y sigue la [calibración de Toki](../toki-os/README.md#gestos-con-myoware-usb-o-ble). Si macOS pide acceso a Bluetooth, concédelo a la app desde la que ejecutas Python.

El modo BLE recibe números ASCII `0–4095` en la característica ENV del sketch (~20 Hz por dispositivo), los escala a `0–1023` y solo entrega pares recientes. En el panel A0 representa mandíbula y A3 ceja, aunque no hay Arduino UNO en este montaje.

## Qué muestra

- Últimos 10 segundos y lectura actual de A0 y A3 en cuentas ADC 0–1023.
- Estado de conexión y ausencia de datos recientes (más de 1,5 segundos).
- Un umbral manual por canal; no detecta por sí mismo intención ni contracción.
- Exportación CSV de los últimos 1500 registros en memoria: `unix_seconds,a0_env_adc,a3_env_adc`. No sube datos a ningún servidor externo.
- Para diagnóstico, `/data?seconds=60` conserva hasta 60 segundos en memoria (máximo 6000 pares). No se guardan al cerrar el monitor.

Acepta `A0:512,A3:380` por línea a 115200 baudios. Las líneas anteriores `ENV:512` y `512` se siguen aceptando como solo A0; A3 queda sin lectura y su celda CSV queda vacía. `/data` devuelve `samples` como filas `[unix_seconds, a0, a3]` (`null` si la línea no incluye A3).

Confirma que ambos selectores físicos estén en ENV. El servidor no configura ni reconoce el modo del sensor, y una lectura del pin no confirma que haya un sensor conectado. No incluye simulación de señal.

Para distinguir gestos, usa **Prueba de gestos** con A0 en la mandíbula y A3 en la frente. Calibra ambos y observa el último gesto y los contadores: A3 solo cuenta como ceja; A0, aun cuando A3 también se active, cuenta como mandíbula. Esto no activa ni envía acciones.

Selecciona **Abrir Woki OS con esta calibración** en el monitor y, en la pantalla de bienvenida, **Usar mouse + gestos MyoWare**. La calibración se guarda en el navegador para esa dirección (`localhost` y `127.0.0.1` guardan perfiles por separado). Con otro puntero, actívalo primero y abre **⌃** para pulsar **Activar gestos**. Los umbrales manuales del gráfico no se usan para clasificar gestos.

## Diagnóstico

- Sin puerto: comprobar cable USB de datos, adaptador y `arduino-cli board list`.
- USB abierto sin muestras: comprobar firmware y velocidad serial.
- Señal alrededor de 512: comprobar ENV/RAW y contacto; ese número solo no identifica la causa.
- No abrir dos procesos sobre el mismo puerto.

La prueba del parser/HTTP usa una pseudoterminal sintética: `python3 -m unittest discover -s tests -v`. Eso no valida al sensor físico.
