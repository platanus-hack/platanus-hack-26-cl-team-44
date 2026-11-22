# Demo de eye-tracking con iPhone (TrueDepth → Mac)

> En este repo la demo vive en `software/eye-tracking/`. Su motor (`web/js/`) también lo usa **Myo OS** como puntero "Mirada con iPhone", sin movimiento de cabeza: ver [software/toki-os](../toki-os/README.md#mirada-con-iphone-face-id).

El iPhone funciona **solo como sensor**: corre ARKit Face Tracking (infrarrojo + profundidad + cámara frontal), sin dibujar nada, y envía 192 bytes por cuadro a 60 fps. El Mac hace todo lo demás en el navegador: calibración, selección automática del mejor modelo, suavizado y la demo.

```
iPhone (EyeTracking, ARKit)  ──WebSocket :8788 (Wi-Fi)──▶  Navegador en el Mac (web/)
 ojos · lookAt · cabeza · parpadeo                      calibra → valida → demo
```

## Usarlo

1. **iPhone:** abre **Eye Tracking**. Anota la dirección que muestra, por ejemplo `192.168.1.23:8788`.
2. **Mac:** `node software/eye-tracking/web/serve.mjs` y abre http://localhost:5173/?host=192.168.1.23:8788 (mejor en Chrome).
3. Escribe la dirección del iPhone → **Conectar** → sigue la guía **Ubícate** → **Calibrar** (~30 s, en pantalla completa) → **Probar la demo**.

Atajos en la demo: `Z` Rejilla · `X` Libre · `C` Precisión (mide tu error real en vivo) · `V` Entrenar · `B` Tarea · `,` punto crudo · `.` suavizado · `M` diagnóstico · `R R` recalibrar (dos veces: un toque accidental no borra la calibración).

**Teclas fantasma:** una tecla sostenida nunca dispara un atajo, y si pasa se muestra un aviso. Motivo: con el iPhone apoyado sobre el teclado, al moverse el computador el iPhone apretaba `E` y lanzaba decenas de pruebas de estabilidad superpuestas (log del 21-11 13:42: 149 pruebas, una cada ~80 ms) o recalibraciones con su cuenta "3, 2, 1".

Sin iPhone: el botón **Probar sin iPhone** simula la mirada con el mouse.

## Robustez al movimiento de la cabeza

**Modelo actual: plano + corrección de cabeza** (`web/js/model.js` + `web/js/head-correction.js`).

1. **Plano:** el rayo de mirada de ARKit (que ya incluye el giro de la cabeza) se corta con el plano de la cámara y se mapea a la pantalla. Es geométricamente robusto a acercarse, alejarse o desplazarse. Se elige y ajusta solo con los puntos de cabeza quieta.
2. **Corrección de cabeza (solo si hubo paso de movimiento):** aprende, de forma lineal, cuánto se desvía el punto según cuánto giraste o te moviste respecto de la calibración. Es conservadora:
   - la penalización está en unidades físicas, así que con poca evidencia la corrección es ≈ 0;
   - nunca corrige más de 1,5× lo observado al calibrar.

**Medido con 17 calibraciones reales** (12 con paso de movimiento; error en puntos que el modelo no vio):

| | Quieto (medio / peor) | Moviéndote, cuadro a cuadro |
|---|---|---|
| Selección anterior (3D o "directo" a veces) | 3,09° / 9,1° | 3,42° |
| Modelo 3D cabeza+ojo | 2,84° / 7,5° | 3,34° |
| **Plano + corrección (actual)** | **1,83° / 2,7°** | **2,46°** |

- Sin paso de movimiento la corrección no ayudaba (1,66° → 1,72°), por eso no se aplica y queda el plano tal cual.
- El modelo 3D (`head-model.js`) y el modelo "directo" siguen en el código (`fitBest(..., { head3d: true })`), pero ya no se eligen: con datos reales eran peores.

**Calibración con movimiento (opcional, marcada por defecto):** después de los 13 puntos hay 3 puntos donde mueves la cabeza suavemente mirando el punto, y al final 2 más para **medir el error con movimiento**.

- **Por qué viene marcada:** con ella se aprende la corrección de cabeza, que baja el error al girar de 3,4° a 2,4° (cuadro a cuadro).
- **Por qué es opcional:** ~27 % de las personas con ELA tiene debilidad de cuello y ninguna guía clínica (Tobii Dynavox) pide mover la cabeza al calibrar. Si se desmarca, se usa el modelo plano sin corrección: tolera acercarse y desplazarse, pero no tanto los giros.

> Nota: una simulación anterior suponía que ARKit comprime el giro del ojo a ~0,45× y por eso favorecía al modelo 3D. Con datos reales esa compresión no siempre aparece (con el iPhone centrado, ARKit ve ~90–125 % del movimiento) y el modelo plano resultó mejor.

**Otras protecciones:**
- **Un solo ojo basta:** si uno está cerrado o caído (ptosis, frecuente en ELA), manda el otro. Solo se descarta el cuadro cuando parpadean ambos.
- La app vieja del iPhone (v1) sigue funcionando, con el modelo 2D.

Simulador: flechas mueven la cabeza, `+`/`-` la acercan o alejan, `J`/`L` giran, `I`/`K` inclinan, `U`/`O` ladean, `M` activa micro-movimientos automáticos y `0` centra.

## Ciclo de mejora (logs + análisis)

Cada sesión se guarda sola en `software/eye-tracking/logs/<sesión>.json` (fuera de git: son datos biométricos). El log incluye:

- telemetría por segundo: fps, % de cara, parpadeos, cortes, latencia, luz y temperatura;
- eventos de falla: cara perdida, iPhone movido, cabeza movida, ventana cambiada y reconexiones;
- las pruebas de estabilidad por ubicación;
- cada calibración con sus cuadros crudos;
- los errores del modo Precisión.

```bash
node software/eye-tracking/tools/analyze.mjs            # analiza el último log
```

El análisis:
- resume la señal;
- compara las ubicaciones por estabilidad;
- muestra el temblor por punto, el movimiento de cabeza y el error por zona;
- **vuelve a calibrar con el código actual** sobre tus datos reales, para medir cada mejora del modelo sin repetir la prueba;
- da recomendaciones concretas.

Herramientas en la página:
- **Ubícate › Medir estabilidad (E):** 3 s mirando un punto, que da tu temblor de mirada en grados. Pruébalo en cada ubicación (Abajo, Arriba…) y gana la de menor número (★).
- **Foto de diagnóstico** (opcional): una foto con la webcam del Mac para revisar luz, reflejos y encuadre. Se guarda solo en `logs/`.
- **Resultado › Afinar (A):** 8 puntos más en los bordes. Se re-entrena con todo y se valida en lugares nuevos.
- **Demo › Diagnóstico (D):** panel en vivo con fps, latencia, % de cara, parpadeos, pérdidas, temblor (°), error de calibración y en vivo, cuánto moviste la cabeza o el iPhone, deriva corregida, luz y temperatura.

## Dónde poner el iPhone

- **Abajo y centrado bajo la pantalla, horizontal (acostado), mirando tu cara a 35–60 cm.** Es la ubicación estándar de los trackers (Tobii): desde arriba, pestañas y párpados tapan los ojos al mirar hacia abajo.
- **En un soporte o delante del teclado, nunca sobre las teclas**: el iPhone las aprieta solo cuando se mueve el computador.
- Con párpados caídos (ptosis), súbelo un poco para no obligar a mirar hacia abajo.
- La pantalla **Ubícate** dice en una frase qué mover (p. ej. "Mueve el iPhone un poco hacia tu derecha"). La zona del esquema usa los mismos umbrales que los checks.
- **Apóyalo firme.** Si se mueve después de calibrar, la demo te avisa ("Moviste el iPhone") y hay que recalibrar con `R`.
- Luz de frente o de lado, nunca detrás. El sol directo ciega el infrarrojo.
- Con lentes, evita que una lámpara o ventana se refleje en ellos; inclínalos un poco.
- La pantalla del iPhone se oscurece sola para no reflejarse en tus ojos y para que no se caliente.

## Instalar la app en el iPhone (una vez)

Tu Team ID de Apple y tu prefijo de identificador **no van en el repo**: se pasan al generar el proyecto. El Team ID está en Xcode › Settings › Accounts (o en developer.apple.com › Membership). El prefijo es cualquier dominio invertido tuyo (`com.tunombre`).

```bash
cd software/eye-tracking/ios
DEVELOPMENT_TEAM=TU_TEAM_ID BUNDLE_ID_PREFIX=com.tunombre xcodegen generate
xcodebuild -project EyeTracking.xcodeproj -scheme EyeTracking -destination 'generic/platform=iOS' -derivedDataPath build -allowProvisioningUpdates build
xcrun devicectl device install app --device <ID> build/Build/Products/Debug-iphoneos/EyeTracking.app
```

Requisitos: Modo desarrollador activado y el iPhone **desbloqueado** al instalar. La primera vez: Ajustes › General › VPN y gestión de dispositivos › confiar en tu certificado de desarrollador. Con equipo personal (gratis), la app caduca a los 7 días; se reinstala con el mismo comando.

## Precisión: cómo funciona

- **Calibración:** 13 puntos que cubren los bordes y 5 de validación en otras zonas. El error que se reporta se mide en puntos que el modelo no vio.
- **Instrucción → punto:** mientras hay texto el punto está oculto (si se ve, la vista se va al punto y no se lee). La cuenta "Empieza en 3" va bajo el texto. Luego el texto se desvanece y el punto aparece encogiéndose; se esperan 700 ms (latencia de ~200 ms + salto) antes de medir. Antes, el primer punto de cada fase podía medirse con la vista aún en el texto.
- **Validación cruzada honesta:** cada pliegue del modelo 3D se re-ajusta desde cero (antes partía de la solución que ya había visto el punto apartado: hasta 25 % optimista), y los pliegues se agrupan por lugar de pantalla (el centro estaba repetido como punto fijo y de movimiento).
- **Modelos candidatos:**
  - *plano*: el rayo de mirada 3D cortado con el plano de la pantalla. Compensa movimientos de la cabeza.
  - *directo*: regresión sobre los ángulos de mirada.
  - Cada uno se prueba con 3 fuentes (lookAt de ARKit, ojos promediados e híbrido) y 6 niveles de regularización. Gana el de menor error en validación cruzada "deja un punto fuera".
- **Robustez:**
  - Las muestras con parpadeo o pérdida de cara se descartan, igual que las miradas atípicas.
  - Al parpadear, el cursor se congela en vez de saltar.
  - El filtro One Euro suaviza fuerte cuando la mirada está quieta y casi nada en los movimientos rápidos.
  - Hay magnetismo hacia el centro de la celda.
  - Corrección implícita de deriva: cada selección ajusta un poco el desfase.
- **iPhone:**
  - Sin render y en una cola dedicada; no retiene cuadros de ARKit.
  - Ajusta la temperatura bajando de 60 a 30 fps y luego pausando.
  - Corre a 30 fps cuando no hay ningún Mac conectado.
  - Si el Wi-Fi va lento, descarta cuadros en vez de acumular latencia.

## Si algo falla

| Síntoma | Causa probable | Solución |
|---|---|---|
| "No se pudo conectar" | Redes distintas o Wi-Fi con aislamiento de clientes | Misma red; o comparte Internet del iPhone por USB al Mac y usa la IP del puente |
| La app dice "Esperando red… Red local" | Permiso de Red local denegado | Ajustes › Privacidad › Red local › Eye Tracking |
| "Señal perdida" | iPhone bloqueado o app en segundo plano | Desbloquéalo y deja la app abierta (no se autobloquea) |
| Error alto en la calibración | Distancia, luz, reflejos o cabeza en movimiento | Sigue los checks de **Ubícate** y recalibra |
| "iPhone caliente" | Funda, sol o carga inalámbrica | Quita la funda y usa cable |

## Tests

```bash
cd software/eye-tracking/web && npm test && npm run check
```
