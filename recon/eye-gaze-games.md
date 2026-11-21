# Eye Gaze Games: integración desde Toki

## Alcance y veredicto

**Construir de forma acotada.** Se puede mostrar el servicio original dentro de Toki; el control por cámara requiere un puente de entrada del navegador. No hay evidencia de una API pública de puntero para que una página padre transmita mirada mediante postMessage. No se copió el juego ni se eliminó su atribución.

Terreno: frontend interactivo (Svelte, juegos Unity/WebGL y juegos en iframe). Recon realizado con el catálogo desplegado, navegador y archivos JavaScript públicos; no mediante REA, que no estaba instalado.

## Observado

- `GET https://www.eyegazegames.com/carousel` devuelve 200. El catálogo muestra Petal Pinchers, Othello, Open Drive, Mole Miners, Eye Drive, Gazey Golf, Snakes & Ladders, Solitaire, 4 in a Row, Chess, Checkers, Sudoku, Sudoku Monsters y Music.
- El primer uso pide idioma y un perfil del servicio. «Crear usuario» genera un perfil del servicio; no es solamente almacenamiento local. Para no crear perfiles en cada prueba, la experiencia final debe reutilizar un perfil persistente.
- La página se renderizó dentro de un iframe de `localhost:8000` durante la verificación. No se observaron X-Frame-Options ni frame-ancestors en la respuesta del catálogo.
- `GET /game?id=mole_miners` crea un iframe a `https://prod.games.eyegazegames.com/?game=moleminers`. En la primera prueba su contenido permaneció vacío: no se considera juego verificado.
- `GET /gamesource?id=gazey_golf` carga Unity desde `https://assets.eyegazegames.io/prod/gazeygolf/Build/`. Se observó menú e instrucciones en español: elegir ángulo, elegir potencia y golpear; alternar controles. La selección del menú se completó por permanencia del puntero.
- En `gamesource.svelte-ba4c50c7.js` se observa `createUnityInstance`, integración de usuario y configuración con `se_platform` y el servicio `io-server-test.fly.dev`.
- En `game.svelte-19ba0387.js` se observa postMessage para configuración, pausa y estado. Eso NO demuestra un contrato público de entrada ocular.
- El catálogo y sus imágenes se obtienen del servicio original. Las seis tarjetas de Toki son accesos a rutas originales; «Todos los juegos» abre su catálogo completo.

## Fuentes de la investigación

- https://www.eyegazegames.com/carousel
- https://www.eyegazegames.com/_app/pages/carousel.svelte-c1a211f9.js
- https://www.eyegazegames.com/_app/chunks/menu-state-a447a4fa.js
- https://www.eyegazegames.com/_app/pages/game.svelte-19ba0387.js
- https://www.eyegazegames.com/_app/pages/gamesource.svelte-ba4c50c7.js
- https://chromedevtools.github.io/devtools-protocol/tot/Input/#method-dispatchMouseEvent

Se buscaron documentación/API/SDK de Eye Gaze Games; no se encontró contrato oficial de integración. `/openapi.json`, `/swagger.json`, `/.well-known/openapi.json`, `/api/schema` y `/llms.txt` devolvieron 404. El HAR de exploración se guardó fuera del repositorio en `/tmp/eye-recon.har`; contiene estado del perfil de prueba y no se debe publicar.

## Traza causal

| Interacción | Estado/código | Resultado observado |
|---|---|---|
| Elegir idioma | Svelte y perfil de usuario | Bienvenida en español |
| Elegir Mole Miners y Jugar | Ruta /game, iframe prod.games | Contenedor abierto; juego sin contenido en esa prueba |
| Abrir Gazey Golf | /gamesource, Unity loader/data/wasm | Menú y pantalla de instrucciones visibles |
| Mantener puntero sobre Cómo se juega | Control de permanencia del juego | Pantalla con ángulo/potencia/golpe |
| Incrustar catálogo en Toki | iframe con origen original | Selector de idioma dentro del SO |

## Implementación del puente

`software/browser-bridge/start.mjs` abre Chrome dedicado y usa CDP por pipes privados del proceso (sin puerto de depuración). Un servidor HTTP ligado a 127.0.0.1 acepta únicamente origen localhost:8000, token de sesión y dos acciones limitadas: movimiento y clic. El objetivo está fijado a la pestaña Toki creada por ese proceso. No mueve el cursor global del sistema.

La UI transmite coordenadas CSS del viewport de Toki, por lo que Chrome resuelve la entrada en los iframes de otros orígenes. Se envía únicamente mientras la cámara está activa, el juego visible y el seguimiento disponible. La pausa suspende el control; no se afirma que pause internamente todos los juegos.

## Por verificar

- Precisión y comodidad con cámara real y pacientes: probar nariz, mirada y calibración con la persona.
- Cada juego y sus modalidades: completar una partida en cada ruta; cargar un canvas no basta.
- Persistencia entre sesiones del lanzador: el prototipo usa un perfil temporal aislado. Diseñar una opción persistente antes de uso diario.
- Ranking compartido: no se ha implementado una API de resultados ni clasificación Toki.
- Derechos y soporte de distribución comercial: el iframe probado es evidencia técnica, no acuerdo comercial con SpecialEffect.

Riesgo de mantenimiento: rutas, parámetros y juegos externos pueden cambiar sin un contrato de integración. Límites de tasa: no medidos; no se observaron cabeceras de cuota en las respuestas revisadas.

## Resultado del test del puente

`node toki/tests/browser/external-games-check.mjs` pasó tras corregir el selector del test: el iframe real recibió `mousemove` y `click` con `isTrusted=true` a partir de coordenadas simuladas en `setGaze` y la permanencia de Toki. El clic eligió español dentro de la página externa. Captura en `/tmp/toki-external.png`. Esto demuestra el transporte de entrada entre orígenes; no demuestra precisión de la webcam ni una partida completa en cada juego.

La prueba ampliada también completó la creación del perfil de prueba, cambió desde Toki a Gazey Golf y verificó el canvas Unity visible dentro del iframe. Esa ejecución pasó. No se completó una partida de golf ni se midió precisión física de cámara.
