# Sesión Toki con control de juegos externos

Requisitos: macOS, Google Chrome, Node 22+ y el SO servido en `http://localhost:8000`.

Desde la raíz del workspace:

```bash
node toki/software/browser-bridge/start.mjs
```

Se abre una ventana Chrome dedicada con Toki y el puente vinculado a esa pestaña. En Juegos, configurar primero Eye Gaze Games (idioma y perfil), luego elegir juego. Activar Nariz o Mirada y calibrar. Solo esa ventana puede recibir el control del puente; una pestaña normal permite usar mouse pero no recibe la entrada de cámara dentro del iframe.

Ejecutar el comando otra vez reutiliza y trae al frente la misma pestaña. Cerrar la pestaña de Toki también cierra su puente y navegador dedicado. No se abre la cámara automáticamente al iniciar.

Cambiar a Mouse apaga las pistas de cámara y libera el modelo. Ocultar la pestaña hace lo mismo; al volver se reactiva únicamente si estaba encendida antes. El seguimiento procesa como máximo 24 cuadros por segundo y no vuelve a analizar el mismo cuadro. La partida externa conserva su pausa de control al regresar.

El clic extra está apagado por defecto porque los menús y juegos de Eye Gaze Games pueden confirmar con su propio dwell. Activarlo solo cuando se necesite clic de mouse. «Pausar control» detiene la entrada de Toki, no garantiza pausar el juego: usar también la pausa propia del juego.

Ctrl+C cierra la sesión. El perfil del navegador es temporal (ubicación del sistema); no se copia el perfil personal. No se guarda historial de miradas ni imágenes de cámara en el puente. La webcam la procesa la página de Toki, que ya carga su modelo externo.

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
```
