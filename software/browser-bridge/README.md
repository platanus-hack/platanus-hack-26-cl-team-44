# Sesión Toki con control de juegos externos

En el [lobby de Toki](http://127.0.0.1:8790/?start=games) elige un juego. Mouse, Nariz y Mirada mantienen la partida en la misma pestaña. La cabecera conserva Inicio, Descansar y Ajustes. El control de cámara conserva su calibración y el tiempo de permanencia elegido en la tablet.

En modo cámara el servidor arranca Chrome en segundo plano, recibe imágenes del juego y las presenta en su tarjeta. Sólo se envían al juego las coordenadas del puntero y las selecciones. Las imágenes de la cámara se procesan en la tablet. El perfil de SpecialEffect queda en la carpeta `juegos` del directorio de datos de Apps. Volver al catálogo o salir de Juegos cierra el proceso de la partida. En modo mouse el juego utiliza su iframe directamente. [Iniciar el servidor de Toki](../apps-bridge/README.md).

## Laboratorio independiente

El lanzador de `prototype-motion.html` requiere macOS, Chrome y Node 22+, con el prototipo servido en `http://localhost:8000`.

Desde la raíz del workspace:

```bash
node toki/software/browser-bridge/start.mjs
```

Se abre una ventana Chrome dedicada con Toki y el puente vinculado a esa pestaña. En Juegos, configurar primero Eye Gaze Games (idioma y perfil), luego elegir juego. Activar Nariz o Mirada y calibrar. Ese puente manual dirige el puntero a la ventana del laboratorio.

Ejecutar el comando otra vez reutiliza y trae al frente la misma pestaña. Cerrar la pestaña de Toki también cierra su puente y navegador dedicado. No se abre la cámara automáticamente al iniciar.

Cambiar a Mouse apaga las pistas de cámara y libera el modelo. Ocultar la pestaña hace lo mismo; al volver se reactiva únicamente si estaba encendida antes. El seguimiento procesa como máximo 24 cuadros por segundo y no vuelve a analizar el mismo cuadro. La partida externa conserva su pausa de control al regresar.

En el juego dentro del lobby, «Clic extra» usa el tiempo de permanencia elegido en la tablet. Desactívalo si prefieres que el juego cuente la permanencia. En el prototipo independiente, el clic extra está apagado por defecto porque los menús y juegos de Eye Gaze Games pueden confirmar con su propio dwell. Activarlo solo cuando se necesite clic de mouse. «Pausar control» detiene la entrada de Toki, no garantiza pausar el juego: usar también la pausa propia del juego.

Ctrl+C cierra la sesión. El lanzador independiente usa un perfil temporal. No se guarda historial de miradas ni imágenes de cámara en el puente. La webcam la procesa la página de Toki, que ya carga su modelo externo.

El transporte valida origen, host, token, tamaño y coordenadas; el token viaja inicialmente en fragmento y se retira de la URL tras guardarse en sessionStorage. No hay puerto CDP abierto. No abrir el servidor a otras interfaces ni compartir el token de sesión.

Prueba del puente con navegador y servicio real:

```bash
node toki/tests/browser/external-games-check.mjs
```

Esta prueba simula coordenadas a la entrada de Toki; no valida precisión física del seguimiento. Usa una sesión aislada y cierra su navegador tanto al terminar como al fallar (límite de dos minutos). La captura queda en `/tmp/toki-external.png`.

Comprobaciones de recursos, sin encender la cámara física:

```bash
node --test toki/tests/browser/camera-lifecycle.test.mjs
node toki/tests/browser/bridge-session-check.mjs
node toki/tests/browser/lobby-games-check.mjs
```
