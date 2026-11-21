# Validación automatizada

`python3 -m unittest discover -s tests -v`

La prueba crea una pseudoterminal local con datos sintéticos. Comprueba parseo, rechazo de líneas inválidas, HTTP local, ausencia de publicación del código del servidor, antigüedad de muestras y desconexión. No utiliza el Arduino real ni demuestra respuesta muscular.

Firmware: `arduino-cli compile --fqbn arduino:avr:uno firmware/myoware_a0`.
