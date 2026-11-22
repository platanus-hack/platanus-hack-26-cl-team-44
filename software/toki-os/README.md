# Toki OS

La interfaz oficial es [woki-os.html](woki-os.html). Su inicio tiene siete tarjetas e incluye Juegos, Apps y Ajustes. Integra las nuevas pantallas en este SO y sus módulos para mantener una sola interfaz de producto.

Desde la raíz del repositorio, con Node 22 o posterior:

```bash
npm ci --prefix software/apps-bridge
npm start --prefix software/apps-bridge
```

[Abrir Toki OS](http://127.0.0.1:8790/)

**Mirada** usa WebEyeTrack con la webcam si pasa la comprobación de la calibración habitual. Si no está disponible o no pasa, se usa el rastreador anterior si pasó su comprobación. Si ya tenías una calibración, vuelve a elegir **Mirada** para probar WebEyeTrack. El puntero se estabiliza al mirar fijo y responde más rápido al saltar entre tarjetas. Con el imán habilitado (`I` en Woki), también gana alcance en los bordes y esquinas. El procesamiento es local; solo se guardan los parámetros de calibración para esa cámara. La primera carga de sus modelos requiere conexión.

En la instalación por etapas, el monitor Python reenvía solo los archivos fijos del modelo WebEyeTrack al Apps Bridge local indicado por `TOKI_APPS_URL`. La conexión del sensor, el perfil y los tokens de etapa se mantienen en su mismo origen. Si Apps Bridge no está disponible, se usa MediaPipe. La integración en `:8790` y la transferencia sin configuración entre el monitor independiente (`:8766`) y Woki siguen funcionando.

Para usar la calibración ampliada, elige **Calibrar con la mirada** en Woki: sigue 15 puntos, incluidos los bordes y las esquinas, y después 6 puntos distintos de comprobación. Toma unos 45 segundos sin reintentos. Los perfiles anteriores siguen disponibles, pero no incorporan los puntos nuevos hasta que vuelvas a calibrar.

WebEyeTrack usa tres fotogramas estables y separados por punto. Si no hay tres muestras que coincidan, repite ese punto una vez. No se alarga la toma de cada punto, aunque ajustar el modelo puede tardar unos segundos más. Los perfiles guardados siguen funcionando; vuelve a calibrar para usar las nuevas muestras.

| HTML | Uso en el proyecto |
|---|---|
| [woki-os.html](woki-os.html) | SO oficial. Edita aquí el inicio, la navegación y la calibración. |
| [index.html](index.html) | Acceso desde la raíz y compatibilidad con enlaces guardados de la tablet. |
| [prototype-lobby.html](prototype-lobby.html) | Prototipo de tablet de cinco tarjetas, conservado para pruebas y enlaces anteriores. |
| `prototype-motion.html` | Catálogo que se abre dentro de Juegos y laboratorio de movimiento. |
| `prototype-ela.html` | Exploración de diseño anterior. |

## Banco de pruebas

### Comparar mirada por webcam

Desde la raíz, ejecuta `node software/toki-os/tools/gaze-benchmark.mjs` y abre [la prueba local](http://127.0.0.1:8791/) en Chrome. Cierra otras pestañas que estén usando la cámara. Con la misma postura y el mismo tamaño de ventana, completa la calibración de Toki, la de WebEyeTrack y sus rondas de 12 recuadros grandes y pequeños. Solo mira el centro de cada objetivo.

La tabla compara aciertos, objetivos sin señal y tiempo mediano hasta acertar. La prueba usa los punteros con sus filtros propios, sin imán ni clic automático. No cambia el puntero normal de Toki ni guarda el video o las mediciones. La primera carga requiere Internet para descargar el modelo de [WebEyeTrack 0.0.2](https://github.com/RedForestAI/WebEyeTrack/tree/main/js) y MediaPipe. El servidor escucha solo en el equipo local.

Si WebEyeTrack no responde, puedes reintentar solo ese modelo sin repetir Toki mientras no recargues ni cambies el tamaño de la ventana.

**Ensayar la demo con WebEyeTrack** hace una ronda aparte en las tarjetas reales de Inicio, sin activar ninguna acción. Mira el punto blanco de cada tarjeta indicada: cuenta la primera tarjeta sobre la que el puntero permanece 180 ms dentro de los 2 s de cada intento. La meta para el ensayo es **10 de 12**. El resultado incluye los fallos por tarjeta, el tiempo de procesamiento por fotograma y la dispersión del puntero al mirar fijo. No se cambia el puntero normal de Toki.

**Comparar calibraciones en Woki** prueba los dos métodos de WebEyeTrack (el último fotograma frente a tres muestras estables por punto). Las rondas usan la misma cámara, los mismos 15 puntos y las tarjetas que tenga el Inicio real de Woki. No hace falta hacer clic ni confirmar con la ceja. Compara aciertos al primer intento, falta de señal, tiempo de adquisición y dispersión p90 al mirar fijo al centro. Mide el modelo sin imán ni suavizado y no reemplaza tu perfil guardado.

### Demo sin sensor

Desde la raíz del repositorio:

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory software/toki-os
```

Abrir http://localhost:8000/woki-os.html y elegir **Usar mouse (demo)**. Enfoca una opción y pulsa `Espacio` para simular la ceja. También puedes elegir con clic.

### Gestos con MyoWare (USB o BLE)

1. Inicia el [monitor MyoWare](../myoware-monitor/README.md) con dos sensores en ENV: **mandíbula y ceja**, por USB (A0/A3) o BLE (dos Wireless Shield). Con electrodos puestos, sigue las precauciones de alimentación del montaje elegido.
2. En el [calibrador integrado](http://127.0.0.1:8790/myoware/), pulsa **Calibrar gestos**. Sigue los avisos: hablar y parpadear normalmente, cinco levantadas de ceja y cinco contracciones suaves de mandíbula. Pulsa **Probar gestos** para confirmar las etiquetas antes de usar el clic.
3. Selecciona **Abrir Woki OS con esta calibración**. En la bienvenida, pulsa **Usar mirada + MyoWare** para apuntar con la webcam y confirmar con la ceja, o **Usar mouse + gestos MyoWare**. Woki reutiliza la calibración guardada de la mirada si está disponible. El enlace del monitor anterior (`8766`) conserva su calibración al pasar a Woki. Si entras directamente a Woki, puedes activar o calibrar los gestos desde **⌃** abajo a la derecha.
4. Enfoca una opción y levanta la ceja para elegir. **‹ Volver**, arriba a la izquierda, vuelve un nivel sin borrar el borrador y admite ceja o clic.

Con MyoWare, apuntar solo enfoca la opción: no hay barra que llenar ni selección por permanencia. La ceja solo hace clic, al detectarse y sin esperar a que la sueltes. Una contracción de mandíbula hace **Volver** fuera de Inicio, sin apuntar ni añadir una espera. En Inicio abre la **Rueda de cuidados**. Con la webcam, mira hacia arriba, derecha, abajo o izquierda para resaltar un sector sin apuntar justo al botón. Si miras al centro o se pierde la señal, la rueda resalta y lee las opciones por turno. Suelta la mandíbula y usa la ceja para elegir; otra contracción cierra la rueda o vuelve al menú principal. **Cuidados**, en la barra inferior, también abre la rueda con mouse o teclado.

La rueda incluye **Ayuda urgente**, **Avisar a mi cuidador**, **Frases rápidas** y **Volver**. Desde esa rueda, **Iniciar SOS de prueba** solo muestra la simulación: no llama ni envía mensajes. La acción SOS normal conserva el intento de llamada al contacto de emergencia cuando está configurado; comprueba la barra de estado antes de usarla. La rueda no sustituye un medio independiente de pedir ayuda.

Si ya calibraste la ceja en este navegador, **Calibrar con la mirada** y **Usar la calibración guardada** también activan MyoWare al terminar la preparación de la webcam, salvo si elegiste **Solo mirada**.

La calibración de banco acepta al menos tres detecciones por gesto y rechaza activaciones en reposo, confusiones o repeticiones. El detector da prioridad a la mandíbula cuando contamina la señal de ceja para evitar clics falsos. Si la señal se corta, Woki cancela el gesto pendiente y reintenta por su cuenta. Cuando vuelve la señal de la misma conexión, relaja la cara antes del siguiente clic. Si cambió la conexión del sensor, vuelve a calibrar los gestos.

La detección se pausa cuando la página está oculta; al regresar requiere relajar la cara. La calibración se conserva en el mismo navegador y dirección mientras no cambie la conexión del sensor. Si recolocas los electrodos, desactiva los gestos antes de moverlos y vuelve a calibrar. No es un sistema de emergencia validado.

[Guía de diseño](../../docs/product/GUIA-DISENO.md) · [Plan](../../docs/product/PLAN.md)

## Mirada con iPhone (Face ID)

Cuarto puntero, además de mouse, nariz y mirada por webcam. Usa el iPhone como sensor (ARKit, 60 fps) con el mismo motor de la [demo de eye-tracking](../eye-tracking/README.md).

1. Instala y abre **Eye Tracking** en el iPhone (si ya tenías la versión anterior, "Soy Gaze", también sirve: el protocolo es el mismo) ([instrucciones](../eye-tracking/README.md#instalar-la-app-en-el-iphone-una-vez)). Debe estar en la misma red que el computador.
2. En la pantalla de inicio elige **Mirada con iPhone (Face ID)** (o tecla `I`), escribe la dirección que muestra el iPhone (por ejemplo `192.168.1.23:8788`) y **Conectar y calibrar**.
3. Sigue 13 puntos con los ojos y luego 5 de comprobación (~45 s). `Esc` cancela.

- **Cómo se elige (Ajustes › Confirmar con, se recuerda):**
  - **Ceja** (por defecto): la mirada resalta el objetivo y la ceja confirma al instante. No hay clic automático al mantener la mirada.
  - **Mirada** (opcional): mantener la mirada hasta que se llena el indicador o usar la ceja. El tiempo se ajusta en **Tiempo de mirada**.
  - Una calibración MyoWare guardada se activa al entrar en modo iPhone. También puedes usar `Espacio` para simular la ceja o hacer clic con el mouse. Al cambiar de puntero vuelve el modo anterior.
- **Dónde va el iPhone:** abajo, centrado bajo la pantalla, acostado (horizontal), a 40–60 cm de la cara, en un soporte (no sobre las teclas).
- **Cambiar de puntero:** Ajustes › Puntero recorre Mouse → Nariz → Mirada → iPhone. La calibración queda guardada y se reusa con **Usar la calibración guardada**.
- **Si se pierde la cara o la señal 1,5 s,** el SO pasa a escaneo con EMG, igual que con la nariz.
- **Sin movimiento de cabeza:** se calibra con la cabeza quieta y se usa solo el modelo plano lineal (`headCorrection: false`). Con 24 calibraciones reales dio 2,9° de media y 5,3° en el peor caso; el cuadrático tenía la misma media pero se desfasaba hasta 10,9°. La demo conserva como opción el paso de movimiento.
- **Probar sin iPhone:** `woki-os.html?iphone=sim`, escribiendo `sim` como dirección: la "mirada" es el mouse, pasando por el motor completo.

`eye-engine/` es un enlace simbólico a `../eye-tracking/web/js` (un solo código para la demo y el SO). `iphone-gaze.js` y `iphone-gaze.css` son el adaptador.

### Mirada para apuntar, ceja para confirmar

- **Siempre hay salida:** enfoca **Volver** y confirma con la ceja, también desde Descanso y el selector de emociones. En Mensajes, **Cancelar** vuelve al inicio; enviar sigue requiriendo dos confirmaciones.
- **Ajustes:** **Confirmar con** ofrece Ceja y Mirada; **Puntero** queda fijo y **Calibrar** vuelve solo al terminar.
- **Sin cara o sin señal:** escaneo con la ceja, igual que con la nariz.
- **Imán y huecos:** el cursor se acerca al centro de la tarjeta enfocada y la mirada en el hueco entre tarjetas toma la más cercana.
- **Sin elecciones en cadena:** en modo Ceja, mirar no selecciona; en modo Mirada, hay una pausa tras elegir.
- **Bordes más grandes:** con 27 calibraciones reales, el error mediano fue 2,2° en el centro, ~2,7° en los bordes y 5,2° en las esquinas. Las columnas de los extremos son 1,2× más anchas y, en el teclado de 3 filas, las de arriba y abajo algo más altas que la del medio.
- **Tamaños** (portátil de 13–14" a ~50 cm): tarjetas de 6–7 cm por lado (≥ 2× el error medio del iPhone); en Escribir, 5,4 × 6 cm por sus 10 funciones.

### Presets de calibración

- El panel del iPhone queda simple: dirección, **Conectar y calibrar**, **Usar la última calibración**, **Presets…** y **Volver**.
- **"Usar la última calibración"** cambia cada vez que se calibra. Los **presets** (ventana **Presets…**) no: solo cambian con "Guardar la actual como preset" o "Cargar archivo".
- **Presets del repo:** los archivos de [`presets/`](presets/) listados en `presets/index.json` aparecen marcados «repo». Para agregar uno: `node software/toki-os/tools/add-preset.mjs <archivo descargado>`.
- La primera vez que se carga esta versión, la calibración guardada se protege sola como preset ("Mi calibración · fecha").
- **"Descargar archivo"** guarda la calibración en un JSON; **"Cargar archivo"** la recupera (se valida: solo modelos planos, sin movimiento de cabeza).
- Al usar un preset manda la dirección escrita en el panel (la IP del iPhone puede cambiar).

## Escribir con sugerencias

- **Fila fija de sugerencias** arriba del teclado: las 3 mejores, siempre en el mismo lugar, a **1 mirada** (con mayúscula si empieza la frase). **Más ▸** abre las 7 siguientes y **Volver**. Tarjetas de 6,7 × 4 cm.
- Medido con 15 frases de CAA no vistas: ahorra el **60 %** de las selecciones la primera vez (51 % con la lista aparte) y el **86 %** cuando ya se dijeron.
- **Motor** (`predict.js`): n-gramas con *Stupid Backoff* (α = 0,4, Brants et al. 2007), sin conexión. Predice la palabra siguiente por contexto y completa la actual sin importar tildes ("como" → "cómo"; la ñ sí cuenta). Tolera un error de tipeo desde 4 letras.
- **Aprende en el dispositivo** (como Gboard o QuickType): todo lo que se dice suma a un caché personal de palabras y pares de palabras, con olvido lento (vida media 60 días). Los nombres se aprenden con mayúscula si la persona los escribe así.
- **Borrar que acelera** (como la tecla de borrar del iPhone): una vez borra una letra; si se sigue mirando, borra el resto de la palabra y luego palabra a palabra. Mirar otra tecla vuelve a letra por letra. Borrar "posición" pasó de ~8 selecciones a 2.
- **Ajustes › Teclado** elige entre **Sugerencias fijas** (la fila de arriba, 1 mirada) y **Sugerencias en lista** (un solo botón que abre la lista, 2 miradas, tarjetas más altas). Se recuerda.
- **Por qué así:** una fila fija junto al teclado es lo que mejor rinde en tecleo por mirada (MacKenzie y Zhang, ETRA 2008) y el ahorro casi no crece más allá de ~6 sugerencias (Adhikary et al. 2022). Las variantes sin tilde poco frecuentes ("unico") no se muestran; "como/cómo" sí.
- **Diccionario base** (`lexicon-es.js`): se genera con `tools/build-lexicon.mjs` desde `es_50k.txt` de [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords) (CC BY-SA 4.0). Sin generar, se usa una lista mínima de respaldo.

## Juegos y Apps en Myo OS

Para probar Juegos y Apps, ábrelo desde el servidor de apps: `npm start --prefix software/apps-bridge` y http://127.0.0.1:8790/woki-os.html.

- **Inicio.** La primera fila reúne Hablar, Escribir y Mensajes. La segunda contiene Apps, Juegos y Ajustes. **SOS** y **Descansar** comparten una fila al pie de la pantalla. **Descansar** pausa la selección. **Volver** reanuda en el mismo lugar. Para escuchar música, elige **Apps → Spotify**.
- **Juegos** abre las seis portadas de Eye Gaze Games de SpecialEffect. Al elegir una, la partida se amplía a la ventana y la cámara sigue activa si se usa para apuntar. El botón **← Juegos** vuelve al catálogo. Con la mirada, nariz o iPhone, el servidor de Apps transmite la partida en la misma pantalla y recibe la posición del puntero. Mantenerlo sobre una opción o confirmar con la ceja o Espacio envía el clic. Con mouse, se interactúa directamente con el juego.
- **Apps:** Spotify, BioBioChile, YouTube, Rappi y Mercado Libre, con el módulo `toki-apps.js` y `apps-bridge`.
- **Spotify necesita `spogo`:** Toki controla la app de escritorio de Spotify con el programa [`spogo`](https://github.com/steipete/spogo), que hay que instalar una vez en el computador (macOS). Sin él, Spotify no carga: el servidor marca el error "El conector de Spotify todavía no está instalado en este computador".

  ```bash
  brew install steipete/tap/spogo
  ```

  Después reinicia el servidor (`npm start --prefix software/apps-bridge`) y abre Spotify.app. Para buscar canciones también hay que conectar la sesión de Spotify Web (ver [apps-bridge](../apps-bridge/README.md#spotify)).
- **Siempre hay salida:** "‹ Inicio" en la barra, "← Juegos" dentro de una partida y "Volver" dentro de cada app. Con el iPhone, tras elegir hay 0,7 s de bloqueo, igual que en el resto del SO.
- **Ajustes › Tema y color:** **Oscuro** o **Claro**, y cinco fondos: **Noche** (el de siempre), **Bosque**, **Océano**, **Atardecer** y **Lavanda**. Se recuerdan en el navegador (`woki.theme` y `woki.palette`).
- **Código:** `os-juegos-servicios.js` y `os-juegos-servicios.css` conectan los módulos del equipo sin copiarlos. `os-colores.css` define los fondos. Los módulos solo cambian su comportamiento dentro de Myo OS (`window.TOKI_OS_SHELL`); la tablet queda igual.

## Tema y atajos

- **Tema claro / oscuro:** interruptor ☀︎/☾ abajo a la derecha o tecla `T`. Se recuerda en el navegador.
- **Controles** muestra la cámara, la detección de rostro y los grupos de sensores, atajos y diagnóstico. El panel recuerda si lo dejaste abierto o cerrado. **Activar cámara** inicia la vista previa y **Apagar cámara** libera la cámara.
