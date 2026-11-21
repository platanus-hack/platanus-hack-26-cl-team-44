# Toki OS

Interfaz de Emmy, trasladada desde `prototipo/` sin cambios al HTML ni a su JavaScript.

Desde la raíz:

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory software/toki-os
```

Abrir http://localhost:8000/woki-os.html y elegir **Usar mouse (demo)**. Se mantiene el nombre del archivo para conservar la URL del prototipo. Cámara y servicios externos requieren su propia configuración.

[Guía de diseño](../../docs/product/GUIA-DISENO.md) · [Plan](../../docs/product/PLAN.md)

## Mirada con iPhone (Face ID)

Cuarto puntero, además de mouse, nariz y mirada por webcam. Usa el iPhone como sensor (ARKit, 60 fps) con el mismo motor de la [demo de eye-tracking](../eye-tracking/README.md).

1. Instala y abre **Eye Tracking** en el iPhone (si ya tenías la versión anterior, "Soy Gaze", también sirve: el protocolo es el mismo) ([instrucciones](../eye-tracking/README.md#instalar-la-app-en-el-iphone-una-vez)). Debe estar en la misma red que el computador.
2. En la pantalla de inicio elige **Mirada con iPhone (Face ID)** (o tecla `I`), escribe la dirección que muestra el iPhone (por ejemplo `192.168.1.23:8788`) y **Conectar y calibrar**.
3. Sigue 13 puntos con los ojos y luego 5 de comprobación (~45 s). `Esc` cancela.

- **Cómo se elige:** manteniendo la mirada sobre el objetivo hasta que se llena el anillo (0,8 s; Ajustes › Tiempo de mirada). No hace falta ceja ni EMG. Al cambiar de puntero vuelve el modo anterior.
- **Dónde va el iPhone:** abajo, centrado bajo la pantalla, acostado (horizontal), a 40–60 cm de la cara, en un soporte (no sobre las teclas).
- **Cambiar de puntero:** Ajustes › Puntero recorre Mouse → Nariz → Mirada → iPhone. La calibración queda guardada y se reusa con **Usar la calibración guardada**.
- **Si se pierde la cara o la señal 1,5 s,** el SO pasa a escaneo con EMG, igual que con la nariz.
- **Sin movimiento de cabeza:** se calibra con la cabeza quieta y se usa solo el modelo plano lineal (`headCorrection: false`). Con 24 calibraciones reales dio 2,9° de media y 5,3° en el peor caso; el cuadrático tenía la misma media pero se desfasaba hasta 10,9°. La demo conserva como opción el paso de movimiento.
- **Probar sin iPhone:** `woki-os.html?iphone=sim`, escribiendo `sim` como dirección: la "mirada" es el mouse, pasando por el motor completo.

`eye-engine/` es un enlace simbólico a `../eye-tracking/web/js` (un solo código para la demo y el SO). `iphone-gaze.js` y `iphone-gaze.css` son el adaptador.

### Modo solo mirada (activo con el iPhone)

Todo se hace manteniendo la mirada; los gestos de ceja y mandíbula se desactivan (teclas, sensor EMG y clic con la cara) hasta volver a otro puntero.

- **Siempre hay salida:** Hablar (Escribir · Volver), Escribir (Volver en ambos niveles, palabra sugerida como tecla), Reacciones (Más · Volver), selector de emociones (Volver), Descanso (mirar "Volver" 2 s), Mensajes (Cancelar). Enviar se confirma siguiendo con la mirada en el botón.
- **Ajustes no deja atrapada a la persona:** "Confirmar con" y "Puntero" quedan fijos; "Calibrar" recalibra con la mirada y vuelve solo.
- **Sin cara o sin señal:** nada se elige hasta volver a verte (no hay escaneo, que necesita la ceja).
- **Imán y huecos:** el cursor se acerca al centro de la tarjeta enfocada y la mirada en el hueco entre tarjetas toma la más cercana.
- **Sin elecciones en cadena:** tras elegir, 0,7 s sin cargar; mirar fijo una tarjeta no la repite.
- **Tamaños** (portátil de 13–14" a ~50 cm): tarjetas de 6–7 cm por lado (≥ 2× el error medio del iPhone); en Escribir, 5,4 × 6 cm por sus 10 funciones.

## Tema y atajos

- **Tema claro / oscuro:** interruptor ☀︎/☾ abajo a la derecha o tecla `T`. Se recuerda en el navegador.
- **Atajos de desarrollo** (teclas simuladas, cámara, LCD, eventos): ocultos por defecto. La pestaña con flecha (⌃) de abajo a la derecha los muestra u oculta.
