# Firmware

`myoware_a0/`: sketch para UNO R3/ATmega328P. Lee A0 y A3 y emite pares como `A0:512,A3:380` a 115200 baudios, aproximadamente 100 pares/s. Cada valor está en el rango ADC 0–1023. Seleccionar ENV en ambos Link Shields; el sketch no detecta la posición física. No sirve para adquirir RAW a su ancho de banda completo.
