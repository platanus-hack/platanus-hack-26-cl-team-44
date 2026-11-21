# Auditoría del eye-demo · 21-11-2026

Revisión completa de `software/eye-tracking/`: código, hipótesis y UX. Cada afirmación tiene **datos propios** (los logs de `software/eye-tracking/logs/`, re-ajustados con el código actual) o **fuente externa**. Si no hay ninguna de las dos, se dice.

## 1. Lo que estaba mal y se corrigió

| # | Problema | Evidencia | Arreglo |
|---|---|---|---|
| 1 | **Pruebas de estabilidad y recalibraciones que se lanzaban solas ("3, 2, 1" una y otra vez)** | Log 13:42: 149 pruebas de estabilidad, una cada ~80 ms. Ese es el ritmo de autorrepetición de una tecla sostenida. Causa: el iPhone apoyado sobre el teclado aprieta `E`, `R` o `Enter` cuando se mueve el computador. Además, la prueba no impedía lanzar otra mientras corría. | Una tecla sostenida nunca dispara un atajo y muestra un aviso ("¿el iPhone está sobre el teclado?"). Una prueba a la vez. Una calibración a la vez (`Enter` sobre el botón disparaba dos). Recalibrar pide `R R`. "Moviste el iPhone" solo aparece si el cambio de ángulo dura más de 1,5 s, no por un golpe. |
| 2 | **Punto visible durante el texto** | El punto distrae, la persona no lee, y el texto desaparece cuando vuelve a leerlo. Además, la "puerta de fijación" solo comprobaba que la mirada estuviera quieta, no que hubiera llegado al punto: el primer punto de cada fase podía medirse con la vista aún en el texto. | El punto queda oculto mientras hay texto. "Empieza en 3" va bajo el texto. El texto se desvanece (250 ms), el punto aparece encogiéndose y se esperan 700 ms antes de medir (latencia sacádica de 150–200 ms + el salto). |
| 3 | **"Buscando tu cara" poco claro** | El texto era estático. La zona verde (±20 cm) no coincidía con el check "iPhone frente a tu cara" (±7°): el dibujo podía decir "dentro" con el check en rojo. | Una sola instrucción concreta ("Mueve el iPhone un poco hacia tu derecha", "Inclínalo…", "Muy cerca…"), flecha sobre el iPhone, medidor de distancia, silueta que "respira" mientras busca y la misma zona que los checks (con test). Las instrucciones son para **mover el iPhone**, no a la persona. |
| 4 | **Validación cruzada optimista del modelo 3D** | Cada pliegue arrancaba desde la solución que ya había visto el punto apartado (hasta 25 % optimista en un log). Además, el centro estaba repetido como punto fijo y como punto de movimiento. | Ajuste nuevo por pliegue, agrupado por lugar de pantalla. Con los 11 logs: error con movimiento de 2,93° a 2,75°; error estático igual (2,64° → 2,63°). |
| 5 | **"Calculando…" de ~10–25 s** | El segundo ajuste repetía toda la selección de modelos. | Solo se re-entrena el modelo ya elegido. |
| 6 | Grados sin escala física | Sin el tamaño de la pantalla, la escala px→° del ajuste variaba de 2 000 a 18 000 px/m entre logs. | Se muestra "≈" en ese caso. |
| 7 | Detalles | El submuestreo por punto usaba solo los primeros cuadros. Un rayo inválido desactivaba el filtro de atípicos de todo el punto. "Acierto al primer intento" contaba palabras en vez de ensayos. | Corregidos, con tests. |

## 2. Hipótesis revisadas

| Hipótesis | Veredicto | Base |
|---|---|---|
| Hay que pedir mover la cabeza al calibrar | **Ayuda, pero no puede ser obligatorio.** | Con los logs: con movimiento 2,6° (peor 5,3°); sin él 5,8° con 3D (peor 21,6°) o 3,7° solo 2D (peor 8,8°). Pero el 27 % de las personas con ELA tiene debilidad de cuello ([PubMed 40931867](https://pubmed.ncbi.nlm.nih.gov/40931867/)), y Tobii Dynavox nunca pide moverla: adapta el montaje a la persona ([Tobii Dynavox](https://us.tobiidynavox.com/blogs/support-articles/how-can-i-position-the-device-to-get-a-better-calibration)). **Ahora es opcional (marcado por defecto). Si se omite, se usa solo 2D.** |
| iPhone abajo y centrado | **Confirmado.** | Es la ubicación estándar de Tobii: desde arriba, pestañas y párpados tapan los ojos. Con párpados caídos, subirlo un poco (Tobii Dynavox). |
| iPhone sobre el teclado | **Mal.** | Aprieta teclas (punto 1). Debe ir en un soporte o delante del teclado. |
| Distancia de 35–60 cm | Razonable para ARKit. | Tobii trabaja a 50–80 cm, pero el TrueDepth gana resolución más cerca. Tus sesiones: 41–60 cm. Sin estudio específico. |
| ARKit "comprime" el giro del ojo | **Compatible, sin cifra publicada.** | Parker et al. 2022: error de amplitud del 17 % (horizontal) y 27 % (vertical), y crece con la amplitud ([Front. Neurol.](https://www.frontiersin.org/articles/10.3389/fneur.2022.789581/full)). Lo del ~0,45× es medición nuestra. |
| Precisión esperable con ARKit | ~1,3–3,2°. | Parker 2022: 1,3° de precisión. Greinacher 2020: 3,18° de exactitud. Tus calibraciones: 1,3–2,6° típico. **Estás en el rango publicado.** |
| Umbrales de estabilidad (<1° bien, <1,8° regular) | Razonables. | Trackers de consumo: ~0,9° de mediana, p90 ~1,9° (Feit et al., [Microsoft Research](https://www.microsoft.com/en-us/research/wp-content/uploads/2017/01/everyday_eyetracking-1.pdf)). |
| Dwell de 800 ms | Confirmado. | Estudio con pacientes con ELA: 800 ms. Rango habitual de 450–1000 ms. |
| Filtro One Euro (β = 0,006 px) | Coherente. | Feit: β ≈ 0,2 en cm ≈ 0,004 en px. Mismo orden. |

## 3. Pendiente (no resuelto aquí)

- **Escala física:** el error en grados es fiable solo si se reconoce el tamaño de la pantalla (Mac: automático; monitor externo: escribir las pulgadas).
- **Personas sin control de cabeza:** el modelo 2D sin movimiento da 3,7° de media. Para mejorarlo sin pedir movimiento, la vía es el movimiento natural entre sesiones (Entrenar con clics) o un prior de la geometría. Requiere más datos.
- Nada de esto se ha probado con personas con ELA. Todos los logs son del equipo.
