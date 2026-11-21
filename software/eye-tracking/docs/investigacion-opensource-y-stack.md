# Investigación: proyectos open source de eye-tracking con teléfono y webcam, y evaluación del stack

> Investigación rápida (nov 2026) para el demo de eye-tracking con iPhone 16 Pro (ARKit Face Tracking) más un navegador en el Mac.
> Convención: **[V]** = verificado en la fuente citada (a veces solo el abstract o el README) · **[E]** = estimación propia, inferencia o dato no confirmado en esta búsqueda.
> Las cifras en cm de los estudios con teléfono se miden sobre la pantalla del teléfono, a la distancia de uso del teléfono. **No son comparables directamente** con grados ni con una pantalla de Mac a ~60 cm. Como referencia geométrica, a 57 cm 1° ≈ 1 cm **[E: trigonometría]**.

---

## 1. Dónde estamos frente al estado del arte

- Nuestro error con datos reales es de 1–2,5° en el centro **(dato interno)**. Las cifras publicadas son estas:
  - ARKit puro, evaluado: **3,18° (1,44 cm)**, N = 9 y N = 8 (Greinacher y Voigt-Antons, HCII 2020) **[V: abstract]**.
  - Eyeware Beam (TrueDepth, cerrado): **1,5° "en condiciones ideales"**. El propio fabricante admite que la precisión **empeora hacia los bordes y en pantallas grandes**, y que puede caer "varios grados" con más distancia y más movimiento de cabeza **[V: diapositivas de Eyeware en VSS 2021]**.
  - Los mejores modelos de apariencia entre datasets distintos dan **4,5–6° sin calibrar** (UniGaze-H: 4,51° en MPIIFaceGaze y 5,88° en EYEDIAP) **[V]**.
  - WebGazer: 3,65° en laboratorio **[V: tesis de Utrecht]** y **8–11° "tal como se despliega"**, según un preprint de 2026 **[V: preprint no revisado por pares]**.
- **Conclusión [E]:** en el centro ya estamos al nivel de Beam o mejor. El problema real es el **borde**, y Beam reconoce el mismo síntoma. Un modelo de apariencia genérico sin calibrar **no** nos ganaría en el centro. Solo podría ayudar en los bordes, y solo si se fusiona con lo que ya tenemos.
- **La compresión de ARKit está documentada.** Otero-Millan (Frontiers in Neurology, 2022) midió con ARKit en un iPhone 12 Pro, sin calibración, a 60 Hz:
  - error de **23 %** en la amplitud del ojo, frente a 15 % en la cabeza;
  - error horizontal del 17 % y vertical del 27 %;
  - errores de **hasta 10° en movimientos de 25°**;
  - precisión (desviación estándar) de 1,3° en el ojo y 0,8° en la cabeza **[V]**.
  - El paper no publica la "ganancia" como tal. Nuestro ~0,4–0,5× es compatible con esos datos, pero es más extremo **[E]**.
- Un desarrollador en los foros de Apple (oct 2025, sin respuestas) describe exactamente nuestros síntomas usando blendshapes: necesita movimientos exagerados para llegar a los bordes, hay deriva entre calibraciones y el seguimiento "funciona mejor si se mueve la cabeza" **[V]**.

---

## 2. Proyectos y productos

### 2.1 Tabla comparativa

| Proyecto | Fuente de datos | Método | Precisión reportada | Licencia | Qué copiar |
|---|---|---|---|---|---|
| **GazeCapture / iTracker** (MIT, 2016) | RGB frontal, iPhone/iPad | CNN con recortes de ambos ojos, cara y "face grid"; 10–15 fps en el móvil | 1,71 cm (teléfono) y 2,53 cm (tablet) sin calibrar; **1,34 cm / 2,12 cm con calibración** **[V]** | Código de investigación; los pesos están en Caffe **[V]**. La licencia del dataset es solo para investigación **[E]** | La "face grid" como entrada (posición de la cara en la imagen) **[E]** |
| **Google, Nature Comms 2020** | RGB, teléfono en soporte | CNN más **regresión ligera por persona sobre la penúltima capa** | **1,92 cm → 0,46 cm** al personalizar con unos 100 cuadros (~30 s); 0,42 cm frente a 0,55 cm de unas Tobii **[V]** | Paper; el código no es público **[E]** | **Regresión por persona sobre un embedding**. Es la técnica más rentable **[V]** |
| **WebEyeTrack** (2025) | Webcam / navegador | BlazeGaze (0,16 M parámetros) más pose de cabeza de MediaPipe; **personalización few-shot con MAML**, k ≤ 9 puntos; TF.js | 2,32 cm en GazeCapture; 4,56 cm en MPIIFaceGaze; 2,4 ms en un iPhone 14 **[V]** | No se indica en el paper **[V]** | Calibración de 9 puntos que ajusta los pesos del modelo; todo en el navegador **[V]** |
| **TinyTracker** | RGB | iTracker cuantizado | ~600 KB, 41 veces más pequeño "sin pérdida significativa" **[V]** | Paper | Modelo pequeño apto para Core ML **[E]** |
| **EyeTrackKit** (AFSR, fork de ukitomato) | ARKit | Fusión de *raycast*, `lookAtPoint` y ángulos de blendshapes; calibración de 9 puntos con **afín 2D**; Kalman por eje | No publica cifras (solo residuos por perfil) **[V]** | MIT **[V]** | Validación de que se puede fusionar con blendshapes; perfil de calibración en JSON con residuos **[V]**. El afín 2D es inferior a nuestro modelo 3D **[E]** |
| **kyle-fox/ios-eye-tracking** | ARKit | Envoltorio de datos de ARKit, registro a 60 fps para investigación | Sin cifras **[V]** | (no revisada) | Nada nuevo **[E]** |
| **Eyeware Beam** | TrueDepth (y webcam desde 2023) | Propietario, "3D, separado de ARKit" **[V: prensa]**. Fundadores del Idiap/EPFL: Funes Mora hizo su doctorado en **gaze 3D con RGB-D, rectificando la imagen del ojo a una pose canónica** **[V]** | 1,5° en condiciones ideales; empeora en los bordes **[V: fabricante]** | Cerrado; SDK para Windows | **Rectificar el recorte del ojo con la pose 3D** (paper IJCV 2016) **[V]** |
| **Hawkeye Access / Testing** | TrueDepth | No publicado | Sin cifras. Una reseña: "casi imposible" seleccionar íconos pequeños **[V]** | Cerrado | Selección por sonrisa, parpadeo o fijación (*dwell*) **[V]** |
| **SeeSo (VisualCamp)** | RGB, SDK móvil | Propietario | Sin cifra oficial en grados. En EyeTheia (2026) muestra menos *jitter* que EyeTheia (26,2 frente a 69,4 px) **[V]** | Comercial | — |
| **Apple Eye Tracking (iOS 18)** | Cámara frontal, ML en el dispositivo | Calibración siguiendo un punto; control por *dwell* | Apple no publica cifras **[V]** | Cerrado, sin API | Solo controla **el propio iPhone o iPad**, no el Mac **[E]** |
| **opentrack con iPhone** | Beam → UDP 4242 | Solo pose de cabeza a 6 grados de libertad hacia juegos; la mirada va a OBS | — **[V]** | ISC (opentrack) **[E]** | Nada para la mirada **[V]** |
| **WebGazer** (Brown) | Webcam | Regresión lineal regularizada (ridge) sobre parches del ojo más **autocalibración con clics y cursor** | 3,65° en laboratorio; 8–11° desplegado **[V]** | GPLv3 (LGPLv3 si la empresa vale < USD 1 M); mantenimiento terminado en 2026 **[V]** | **Calibración implícita con interacciones** **[V]** |
| **EyeGestures** | Webcam / teléfono | v1 geométrico; v2 con ML y **recalibración continua cada pocos segundos** | Sin cifras **[V]** | GPL-3 o comercial **[V]** | Recalibración continua, con opción de "congelarla" **[V]** |
| **GazeFollower** | Webcam | CNN MGazeNet (7 M imágenes; 32 M a pedido) más calibración | Sin cifras en el README (paper en PACMCGIT 2025) **[V]** | **CC BY-NC-SA** (no comercial) **[V]** | — |
| **L2CS-Net** | Webcam, cara | ResNet50 con pérdida combinada de clasificación por bins y regresión (*yaw* y *pitch*) | 3,92° en MPIIFaceGaze (dentro del mismo dataset) **[V]** | **MIT**; pesos disponibles **[V]** | Candidato a convertir con coremltools **[E]** |
| **UniGaze** (WACV 2026) | Cara normalizada de 224 × 224 | ViT B/L/H preentrenado con MAE | Entre datasets: 4,51° en MPIIFaceGaze y 5,88° en EYEDIAP (H) **[V]** | **No comercial (MG-NC-RAI-2.0)** **[V]** | Usa la **normalización de datos** de Zhang 2018 **[V]** |

### 2.2 Lecciones transversales

1. **Personalizar es lo que más rinde.** Google pasó de 1,92 a 0,46 cm (unas cuatro veces mejor) con una regresión por persona encima de la red **[V]**. iTracker mejora entre un 16 % y un 22 % calibrando **[V: calculado de sus cifras]**. Nosotros ya personalizamos, así que el margen está en *qué* personalizamos y en lo bien condicionado que esté **[E]**.
2. **La calibración implícita o continua es la norma en webcam.** WebGazer usa clics, EyeGestures recalibra cada pocos segundos **[V]**. Para ELA no hay clics, pero sí **selecciones confirmadas por *dwell***, que sirven como muestras etiquetadas **[E]**.
3. **La normalización de la imagen** (deformar la imagen a una cámara virtual frontal con distancia fija, usando la pose de la cabeza) es estándar en los modelos de apariencia. La versión revisada de Zhang 2018 (sin factor de escala) mejora entre un 9,5 % y un 32,7 % **[V]**. **Con TrueDepth tenemos la pose 3D y el centro de cada ojo gratis y en escala métrica**, que es justo lo que esa normalización necesita **[E]**.
4. **Nadie publica buena precisión en los bordes** **[V: Beam lo admite]**. La UI tiene que asumirlo: objetivos más grandes o menos objetivos en la periferia **[E]**.

---

## 3. Combinar la geometría de TrueDepth con un modelo de apariencia

- **Antecedente directo: Funes Mora y Odobez (CVPR 2014, IJCV 2016).** Usan un sensor RGB-D (Kinect) y un modelo 3D morfable (3DMM) para seguir la cabeza, **re-renderizan la imagen del ojo a un punto de vista canónico** y estiman la mirada en 3D. Esto les da invariancia a la pose y al usuario **[V]**. Es la base científica de Eyeware **[V: biografía del fundador]**. Beam en iPhone afirma usar un método propio "separado de ARKit" **[V: prensa]**, lo que sugiere que no se fía del ángulo de ojo de ARKit **[E]**.
- **Tesis "Practical and Rich User Digitization" (arXiv 2403.00153).** Entrena una CNN de mirada con GazeCapture (RGB y profundidad), la convierte de PyTorch a Core ML y recorta la cara con Vision en un iPhone 12 Pro Max. Resultado: **7 fps y 121,3 ms con RGB-D; 85,3 ms solo con RGB** **[V: snippet]**. No pude verificar si la profundidad mejora la precisión, porque el PDF excede el límite **[—]**.
- **No encontré** ningún proyecto público que recorte los ojos desde `ARFrame.capturedImage` usando las transformaciones de ojo de ARKit para alimentar un modelo de apariencia **[V: ausencia en esta búsqueda]**.
- **No encontré modelos Core ML de mirada listos** (ni iTracker convertido) **[V: ausencia]**. Opciones para obtener uno:
  - convertir L2CS-Net (MIT, PyTorch) con coremltools **[E: 1–2 días]**;
  - convertir iTracker desde PyTorch, con reimplementaciones enlazadas desde el repo del CSAIL **[V]**;
  - usar TinyTracker (~600 KB) **[V]**.
- Datos de cámara relevantes:
  - `ARFaceTrackingConfiguration` reporta formatos de 1440 × 1080, 1920 × 1440, 3840 × 2160 y 640 × 480, según la referencia de Apple **[V]**;
  - en un iPhone 14 Pro, `capturedImage` medía 1440 × 1080 y la profundidad 640 × 480 **[V: foro]**;
  - qué formato da 60 fps en el 16 Pro hay que **comprobarlo enumerando `supportedVideoFormats`** **[E]**.
- **Viabilidad [E]:** el pipeline sería:
  1. proyectar los centros de los ojos con `ARCamera.projectPoint`;
  2. normalizar a la Zhang 2018 usando la pose de ARKit;
  3. recortar dos parches de ~60 × 36 o la cara a 224 × 224;
  4. pasar una CNN en el Neural Engine;
  5. emitir *yaw* y *pitch* como **feature adicional** que se fusiona con el ángulo de ARKit en el Mac.

  En el A18 Pro debería caber a 30–60 fps con un modelo pequeño. Con ResNet50 quizá no **[E]**.

---

## 4. Evaluación del stack

### 4.1 Fuente de datos

| Opción | Pros | Contras | Veredicto |
|---|---|---|---|
| **ARKit (actual)** | Pose 3D métrica y estable; 60 Hz; centros de ojo; coste casi nulo; sin entrenar | Ganancia comprimida y saturada **[V: Otero-Millan; datos internos]**; caja negra que puede cambiar con iOS **[E]** | **Mantener como columna vertebral** para la pose y la geometría |
| **Vision `VNDetectFaceLandmarks`** (pupilas) | Sin ARKit; da pupilas en 2D | Solo landmarks en 2D sin pose métrica; las pupilas tiemblan a la resolución de la cara **[E]**; no resuelve la compresión **[E]** | **No vale la pena** como reemplazo. Como mucho, una feature extra barata **[E]** |
| **Modelo propio sobre la imagen** | Ataca la causa (la apariencia real del iris); los bordes podrían mejorar **[E]** | Esfuerzo alto; los modelos genéricos rinden 4,5–6° entre datasets **[V]**, así que **necesita calibración por persona**; licencias (UniGaze y GazeFollower son no comerciales) **[V]** | **Fase 3**: como feature fusionada, nunca como reemplazo |

### 4.2 Transporte

| Opción | Notas | Veredicto |
|---|---|---|
| **WebSocket por Wi-Fi (actual)** | Simple y compatible con el navegador. El *jitter* de Wi-Fi y los cambios de red son riesgos **[E]**. Beam usa la misma topología (misma red e IP manual) **[V]** | **Mantener** para el demo. Medir la latencia por cuadro con marca de tiempo del teléfono y RTT |
| **USB** | Menor latencia y sin depender de la red **[E]**. En iOS el camino habitual es un túnel TCP sobre usbmux (p. ej. la librería *peertalk*) **[E: no verificado aquí]**. No es accesible desde el navegador sin un puente nativo | Solo con app nativa en el Mac |
| **Multipeer Connectivity** | Descubrimiento automático, sin IP manual **[E]** | Requiere app nativa en el Mac; no ofrece una ventaja clara frente a Network.framework con Bonjour **[E]** | No prioritario. **Bonjour con Network.framework** resuelve el descubrimiento sin cambiar de protocolo **[E]** |

### 4.3 Navegador frente a app nativa de macOS

- Para **mover el cursor del sistema** hace falta una app nativa con `CGEvent` y el **permiso de Accesibilidad**. Apple ha rechazado en el App Store apps que usan `CGEvent.post` **[V: foros]**, así que conviene distribuir fuera del App Store **[E]**.
- macOS ya trae **Head Pointer** (Control del puntero con la cámara) y **Dwell** **[V]**, pero no tiene eye-tracking por cámara documentado **[V: ausencia]**. Sirven como fallback para el usuario.
- **Recomendación [E]:**
  - mantener el navegador para la calibración, la visualización y la UI del AAC;
  - cuando haga falta controlar el SO, agregar un **helper nativo mínimo** (barra de menú, ~150 líneas en Swift) que reciba `{x, y, click}` por WebSocket local y emita los eventos;
  - no reescribir todo en nativo.

### 4.4 Matemática: JS propio frente a librerías

- Levenberg–Marquardt con menos de 15 parámetros y ridge con menos de 100 features es trivial en JS. **No hay un problema de rendimiento [E].**
- El riesgo real es **numérico**, no de velocidad: resolver ecuaciones normales mal condicionadas. **ml-matrix** (sin dependencias, con SVD, QR y pseudoinversa) ayuda a diagnosticar el número de condición y los valores singulares del Jacobiano **[E]**. Es una sola dependencia ESM vendorizable **[E]**.
- **TF.js / ONNX Runtime Web**: solo tienen sentido si el modelo de apariencia corre en el Mac. Es mejor que **la CNN corra en el iPhone (ANE) y viaje solo el ángulo** **[E]**, porque mandar imágenes por Wi-Fi a 60 fps es caro e innecesario **[E]**. La excepción es la personalización estilo WebEyeTrack (MAML en el navegador) **[V: es factible con TF.js]**.

---

## 5. Diagnóstico de nuestros problemas

1. **La ganancia varía entre calibraciones [E].** Con la cabeza quieta, *ganancia del ojo*, *distancia y orientación de la pantalla* y *offset del centro del ojo* producen casi el mismo efecto en pantalla: un desplazamiento proporcional al ángulo. Las columnas del Jacobiano son casi colineales y LM elige combinaciones distintas en cada sesión. La fase de cabeza ayuda solo si el usuario **fija un punto mientras mueve la cabeza**, porque eso separa la "ganancia ocular" de la geometría (el reflejo vestíbulo-ocular contrarrota el ojo, así que ARKit ve ojo y cabeza con signos opuestos y amplitudes conocidas).
2. **Saturación hacia los bordes [V].** Una ganancia lineal no modela una respuesta que se comprime más en la periferia. Hace falta una **curva monotónica por eje** (p. ej. una cúbica impar o la inversa de tanh) **[E]**. El horizontal y el vertical tienen errores distintos (17 % frente a 27 %) **[V]**, así que **ganancias separadas por eje** **[E]**.
3. **"Peor en un lado" [E].** Hipótesis a verificar:
   - **(a)** el iPhone no está centrado bajo la pantalla, y ARKit satura en función del ángulo **respecto a la cámara**, no respecto a la pantalla;
   - **(b)** el ojo más alejado de la dirección de la mirada queda tapado o escorzado por la nariz.

   Mitigaciones: centrar el teléfono, y **ponderar cada ojo por separado** según la dirección (confiar más en el ojo "del lado" hacia el que se mira).

---

## 6. Recomendaciones, en orden

| # | Cambio | Por qué | Esfuerzo **[E]** |
|---|---|---|---|
| 1 | **Reparametrizar la calibración**: (a) fijar la geometría teléfono–pantalla en un *setup* único (medida física o sesión larga con mucho movimiento de cabeza) y **congelarla**; (b) por sesión ajustar solo la ganancia y el offset **por ojo y por eje**, con una **curva no lineal** y un **prior o regularización** hacia valores poblacionales (p. ej. ganancia ≈ 0,45); (c) agregar una fase de "**fijar el punto central y girar la cabeza**"; (d) reportar el número de condición del Jacobiano, y el error por zona con puntos de validación aparte | Ataca directamente el mal condicionamiento y la saturación, que son nuestros dos problemas medidos | 2–4 días |
| 2 | **Corrector residual por persona más recalibración implícita**: ridge sobre [ángulos de ARKit de ambos ojos, blendshapes eyeLook*, pose y posición de la cabeza] que predice el *residuo* del modelo 3D (la idea de Google: regresión ligera encima del modelo base). Se actualiza online con **selecciones confirmadas por *dwell*** (la idea de WebGazer y EyeGestures), con ventana deslizante y límite de cambio para no aprender errores | Es la técnica con mejor retorno documentado (unas 4 veces en Google **[V]**). Corrige la deriva durante el día sin recalibrar, algo crítico por la fatiga en ELA | 3–5 días |
| 3 | **Canal de apariencia en el iPhone**: recorte del ojo normalizado con la pose de ARKit, CNN en Core ML (L2CS-Net con MIT, o una pequeña reentrenada) y envío de *yaw* y *pitch* como feature adicional al corrector del punto 2 | Es la única vía que mira el iris real y puede recuperar los bordes saturados. Hacerlo solo si 1 y 2 no alcanzan el objetivo en los bordes | 1–3 semanas |
| 4 | **Helper nativo de macOS** para el cursor y el clic (`CGEvent`, permiso de Accesibilidad), manteniendo la UI web | Necesario para pasar de demo a uso real en el SO | 1–2 días |
| 5 | **Transporte**: Bonjour para el descubrimiento, marca de tiempo por cuadro y medición de latencia. USB solo si el *jitter* de Wi-Fi resulta ser un problema medido | Hoy no hay evidencia de que el transporte sea el cuello de botella | 0,5–1 día |
| — | **No hacer**: reemplazar ARKit por Vision; migrar la matemática a TF.js u ONNX; adoptar UniGaze o GazeFollower en un producto (por licencia) | Bajo retorno o riesgo legal | — |

**Diseño de UI asociado [E]:** objetivos más grandes en la periferia, el teclado AAC concentrado en la zona central, y *dwell* adaptativo según el error estimado por zona.

---

## Fuentes

- GazeCapture / iTracker: https://arxiv.org/abs/1606.05814 · https://gazecapture.csail.mit.edu/cvpr2016_gazecapture.pdf · https://github.com/CSAILVision/GazeCapture
- Google, personalización en smartphone (Nature Comms 2020): https://pmc.ncbi.nlm.nih.gov/articles/PMC7486382 · https://research.google/blog/accelerating-eye-movement-research-for-wellness-and-accessibility/
- WebEyeTrack: https://arxiv.org/html/2508.19544v1 · https://github.com/RedForestAI/WebEyeTrack
- TinyTracker / revisión de mirada en móviles: https://arxiv.org/html/2307.00122v1
- EyeTrackKit: https://github.com/AFSR/EyeTrackKit · https://github.com/ukitomato/EyeTrackKit
- kyle-fox/ios-eye-tracking: https://www.github.com/kyle-fox/ios-eye-tracking
- Eyeware Beam: https://www.2021.visionsciences.org/pdf/Eyeware.pdf · https://appleinsider.com/articles/21/01/10/eyeware-beam-uses-your-iphone-to-track-eye-movements-in-games · https://eyeware.tech/about/
- opentrack con iPhone: https://www.github.com/opentrack/opentrack/wiki/An-iPhone-iPad-Head-&-Eye-Tracker-w-OpenTrack
- Funes Mora y Odobez, RGB-D: https://www.idiap.ch/~odobez/publications/FunesOdobez-GazeEstimationRGBD-IJCV-2015.pdf · https://openaccess.thecvf.com/content_cvpr_2014/papers/Mora_Geometric_Generative_Gaze_2014_CVPR_paper.pdf
- Hawkeye: https://venturebeat.com/2019/10/16/hawkeye-lets-you-do-eye-tracking-tests-on-latest-iphones-and-ipads · https://apps.apple.com/us/app/hawkeye-access/id1439231627
- SeeSo frente a EyeTheia: https://arxiv.org/pdf/2601.06279
- Apple Eye Tracking iOS 18: https://www.macrumors.com/2024/05/15/ios-18-accessibility-features · https://9to5mac.com/2024/09/19/turn-on-iphone-eye-tracking-ios-18/
- Precisión de ARKit: https://unpaywall.org/10.1007%2F978-3-030-49059-1_32 (Greinacher 2020) · https://www.frontiersin.org/articles/10.3389/fneur.2022.789581/full (Otero-Millan 2022)
- Foro de Apple sobre la calibración con ARKit: https://developer.apple.com/forums/thread/803872
- `lookAtPoint`: https://developer.apple.com/documentation/arkit/arfaceanchor/lookatpoint
- Formatos de video de ARKit: https://developer.apple.com/documentation/analytics-reports/arkit-video-formats · https://developer.apple.com/forums/thread/724790
- WebGazer: https://github.com/brownhci/WebGazer · https://jeffhuang.com/papers/WebGazer_IJCAI16.pdf · https://studenttheses.uu.nl/bitstream/handle/20.500.12932/40709/Eindwerkstuk_Bachelor_KI_Mark_Wessel_6008283_final.pdf · https://arxiv.org/pdf/2608.11566
- EyeGestures: https://pypi.org/project/eyegestures
- GazeFollower: https://pypi.org/project/gazefollower/ · https://dblp1.uni-trier.de/rec/journals/pacmcgit/ZhuDHWZW25.html
- L2CS-Net: https://arxiv.org/pdf/2203.03339 · https://github.com/Ahmednull/L2CS-Net
- UniGaze: https://arxiv.org/html/2502.02307v2 · https://github.com/ut-vision/UniGaze
- Normalización de datos (Zhang 2018): https://perceptualui.org/publications/zhang18_etra/
- Core ML de mirada en iPhone (tesis): https://arxiv.org/pdf/2403.00153
- macOS Head Pointer y Dwell: https://support.apple.com/guide/mac-help/mchlb2d4782b · `CGEvent` y Accesibilidad: https://developer.apple.com/forums/thread/744492 · https://developer.apple.com/forums/thread/820594
