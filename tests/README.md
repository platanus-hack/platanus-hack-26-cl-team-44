# Validación automatizada

`python3 -m unittest discover -s tests -v`

La prueba crea una pseudoterminal local con datos sintéticos. Comprueba parseo, rechazo de líneas inválidas, HTTP local, ausencia de publicación del código del servidor, antigüedad de muestras y desconexión. No utiliza el Arduino real ni demuestra respuesta muscular.

Firmware: `arduino-cli compile --fqbn arduino:avr:uno firmware/myoware_a0`.

Toki OS: `node tests/test_os_click.cjs`, `node tests/test_os_iphone.mjs`, `node tests/test_predict.mjs` (predicción) y `node tests/test_iphone_presets.mjs` (presets de calibración) y `node tests/test_os_delete.cjs` (borrar que acelera) (contrato de la mirada con iPhone: opción al inicio, motor compartido y sin movimiento de cabeza).

Eye-tracking (motor y demo): `cd software/eye-tracking/web && npm test`.
