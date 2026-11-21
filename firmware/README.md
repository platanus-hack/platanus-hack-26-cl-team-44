# Firmware

`myoware_a0/`: sketch para UNO R3/ATmega328P. Lee A0 y A3 y emite pares como `A0:512,A3:380` a 115200 baudios, aproximadamente 100 pares/s. Cada valor está en el rango ADC 0–1023. Seleccionar ENV en ambos Link Shields; el sketch no detecta la posición física. No sirve para adquirir RAW a su ancho de banda completo.

`myoware_env_ble/`: sketch ESP32 para MyoWare Wireless Shield (núcleo `esp32:esp32` 4.0.0, destino `esp32:esp32:esp32`). Conserva el protocolo de `MyoWareEnvTest.ino`: GPIO39, muestras ENV de 12 bits en ASCII y notificaciones BLE cada 50 ms. Configura un `kDeviceName` distinto por unidad o identifícalas por su ID BLE. [Uso con el monitor](../software/myoware-monitor/README.md#usar-dos-myoware-ble).
