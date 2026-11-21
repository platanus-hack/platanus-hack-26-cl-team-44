# Eye-tracking para la demo: qué tan preciso puede ser y con qué

Investigación del 21-11-2026. **[V]** = verificado en la fuente; **[E]** = estimación nuestra.

## Precisión realista por opción (error angular; menos es mejor)

| Opción | Error típico | Costo | Notas |
|---|---|---|---|
| Tracker IR dedicado (Tobii Eye Tracker 5) | ~0,5–1° [E, Tobii no publica cifra para ET5] | ~USD 285 [V] | Luz IR propia → robusto a la iluminación. La versión de consumo es "solo para gaming/interacción"; para desarrollar un producto se necesita la ET5L + licencia comercial [V]. Para un **demo interno** sirve. |
| Webcam + modelo moderno + calibración personal | 1,5–2,5° [V, varios estudios]; 1,4° con mentonera [V] | USD 0 | Sin calibrar por usuario es inutilizable (75–110 mm de error) [V]. Los modelos basados en FaceMesh rinden bien al centro (~1,3°) y mal en las esquinas (hasta 19°) [V]. |
| WebGazer (JS en navegador) | 2,4–4°+ [V] | USD 0 | El más fácil, el menos preciso. Empeora con movimiento de cabeza [V]. |
| iPhone con Face ID (ARKit) | Sin estudio publicado; ~2–4° [E] | Ya lo tienes | ARKit da pose 3D de la cara, transformaciones de cada ojo y `lookAtPoint` a 60 fps. **No hay acceso al IR crudo** del TrueDepth: Apple solo expone profundidad + color [V]. Beam Eye Tracker (Eyeware) ya usa el iPhone como tracker para PC, sin cifras independientes [V]. |
| Apple Eye Tracking (iOS/iPadOS 18+) | No publicado | Gratis | Es un sistema de accesibilidad: controla el puntero, pero **las apps no reciben la mirada**. En Mac solo existe Head Pointer (cabeza, no ojos) [V]. |

Referencia: Apple Vision Pro, con cámaras IR dedicadas, mide ~1° [V].

## ¿Webcam USB dedicada vs. integrada?

Ayuda, pero no es un salto de categoría. Lo que mejora la precisión es **más píxeles sobre el ojo, más fps y luz pareja**: 1080p a 60 fps, montada bajo la pantalla y más cerca de la cara. La mejor "webcam" que ya tienes es el **iPhone como Continuity Camera** (sensor mejor que el de la MacBook). Las webcams con IR (tipo Windows Hello) toleran mejor la iluminación, pero no exponen sus APIs fácilmente.

## Recomendación

1. **Demo más precisa con poco esfuerzo:** Tobii Eye Tracker 5 (~USD 285) + nuestra UI con magnetismo. Riesgo: la licencia de consumo no permite comercializar.
2. **Demo con cero hardware:** iPhone como webcam + MediaPipe Iris/FaceMesh + regresión con calibración de 9–16 puntos + filtro 1€ + magnetismo. Error esperado ~2° [E]. Alcanza porque el diseño ya usa objetivos ≥3°.
3. **Versión iPad/iPhone nativa (después):** ARKit face tracking; la profundidad del TrueDepth estabiliza la pose de la cabeza.

Clave: con objetivos de ≥3° y magnetismo, un tracker de ~2° es usable. La precisión del modelo importa menos que el diseño.

## Fuentes

- Labvanced, webcam eye tracking 2.0 (1,8° mediana; 1,4° en laboratorio): https://www.labvanced.com/content/research/en/lab-notes/2026-10-webcam-eyetracking-2-0/
- Webcam vs EyeLink, Behavior Research Methods 2023: https://link.springer.com/article/10.3758/s13428-023-02237-8
- GazeFollower (open source, ACM 2025): https://dl.acm.org/doi/10.1145/3729410
- Modelo calibrado en Hugging Face (sin calibrar 75–110 mm): https://huggingface.co/kkrausse/gaze
- FaceMesh vs WebGazer, centro vs esquinas (2026): https://arxiv.org/pdf/2601.06279
- MediaPipe iris <1,9° (2024): https://www.arxiv.org/pdf/2401.00406
- UniGaze (WACV 2026): https://arxiv.org/abs/2502.02307
- Sin acceso a IR crudo del TrueDepth: https://developer.apple.com/forums/thread/120712 · https://arxiv.org/pdf/2201.10865.pdf
- Beam Eye Tracker con iPhone: https://appleinsider.com/articles/21/01/10/eyeware-beam-uses-your-iphone-to-track-eye-movements-in-games
- Tobii: ET5 solo gaming, ET5L para desarrollo: https://www.tobii.com/products/integration/tobii-streams-sdk · https://developer.tobii.com/?p=21458 · https://help.tobii.com/hc/en-us/articles/360014744577
- Precio ET5: https://shopsavvy.com/products/tobii-eye-tracker-5
- Apple Vision Pro ~1°: https://arxiv.org/pdf/2406.00255
- Mac Head Pointer: https://support.apple.com/guide/mac-help/mchl437b47b0/mac
