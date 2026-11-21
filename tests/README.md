# Validación automatizada

`python3 -m unittest discover -s tests -v`

La prueba crea una pseudoterminal local con datos sintéticos. Comprueba pares A0/A3 (incluidas líneas fragmentadas), compatibilidad con el firmware anterior, rechazo de líneas inválidas, HTTP local, ausencia de publicación del código del servidor, antigüedad de muestras y desconexión. No utiliza el Arduino real ni demuestra respuesta muscular.

Firmware: `arduino-cli compile --fqbn arduino:avr:uno firmware/myoware_a0`.

Toki OS: `node --test tests/test_*.cjs`. Comprueba el clic directo, la calibración de ambos canales, la prioridad de mandíbula, un evento por contracción y el bloqueo de clics en estados no válidos.
