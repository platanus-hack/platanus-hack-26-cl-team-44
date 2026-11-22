# Paridad entre la TV actual y la TV v2

La TV actual es la especificación. Vive en `software/toki-os/woki-os.html` y en los scripts que carga.
La TV v2 vive en `apps/tv/` y se publica en `/v2/` y en `/equipo/v2/`.
La TV actual no cambia hasta que esta lista quede completa.

## Cómo leer esta lista

- `[x]` significa que la función existe en la v2 y su prueba pasa.
- `[ ]` significa que la función falta en la v2 o que su prueba todavía no existe.
- Cada línea cita el archivo y la línea de la TV actual. Las rutas cortas son relativas a `software/toki-os/`.
- `e2e:` nombra el archivo de Playwright en `apps/tv/e2e/`. Cada prueba corre la misma interacción en la TV actual (`/woki-os.html`) y en la v2 (`/v2/`), con los backends simulados.
- `unit:` nombra la prueba de Vitest en `apps/tv/src/`.
- «Hecha, sin prueba» marca código portado que todavía no tiene una prueba propia. No cuenta como hecho.

## Resumen

Estado al 22-nov-2026. 124 funciones en la lista.

| Grupo | Hecho | Falta |
|---|---|---|
| 1. Arranque y configuración | 5 | 2 |
| 2. Inicio | 5 | 1 |
| 3. Puntero, permanencia e imán | 9 | 5 |
| 4. Gestos | 3 | 3 |
| 5. MyoWare | 8 | 1 |
| 6. Hablar | 10 | 3 |
| 7. Escribir | 8 | 2 |
| 8. Reacciones | 1 | 0 |
| 9. Mensajes y WhatsApp | 10 | 1 |
| 10. Alarma | 6 | 4 |
| 11. Calibración y elección de control | 4 | 8 |
| 12. Descanso | 2 | 0 |
| 13. Rueda de cuidados | 4 | 1 |
| 14. Ajustes | 4 | 1 |
| 15. Escucha de la sala y voces | 0 | 4 |
| 16. Apps y Juegos | 0 | 2 |
| 17. Barra del acompañante y Controles | 4 | 0 |
| 19. Accesibilidad | 1 | 2 |
| **Total** | **84** | **40** |

Atajos de teclado (sección 18): 11 de 13 hechos. Faltan `N C V E` y `O`, `Shift+O`.

Pruebas: 92 e2e (46 interacciones × 2 TVs) y 55 unitarias, todas en verde.

## 1. Arranque y configuración

- [x] C1. Cuatro formas de abrir la TV: escenario, equipo, público y desarrollo. Calcula `WA_URL` y `AGENTE_URL`. `woki-os.html:691-722` · unit: `net/net.test.ts`
- [x] C2. El token va en el header `X-Myo-Token` y nunca en la URL. `toki-config.js:2`, `woki-os.html:1054-1059` · unit: `net/net.test.ts`
- [x] C3. SSE leído con `fetch` para mandar el header. Reconecta a los 3 s. `toki-sse.js:1-37` · unit: `net/net.test.ts`
- [x] C4. Tema y paleta antes de pintar, sin parpadeo (`woki.theme`, `woki.palette`). `woki-os.html:433-434` · e2e: `ajustes.spec.ts` (S4 C4)
- [ ] C5. Nombre de la usuaria desde `/api/salud` del agente. `woki-os.html:724-728` · Hecha, sin prueba.
- [ ] C6. Lienzo de 1920×1080 escalado a la ventana. `woki-os.html:1225-1247` · Hecha, sin prueba. Capturas iguales a 1600×1000.
- [x] C7. Navegación por `#pantalla` con historial del navegador. `woki-os.html:1336-1360` · e2e: `inicio.spec.ts` (C7)

## 2. Inicio

- [x] I1. Ocho tarjetas: Hablar, Escribir, Mensajes, SOS, Apps, Juegos, Descansar, Ajustes. `woki-os.html:734-742` · e2e: `inicio.spec.ts` (I1)
- [x] I2. SOS exige 2 s de mirada (`data-dwell="2000"`). `woki-os.html:738` · e2e: `inicio.spec.ts` (I2)
- [x] I3. Descansar abre el modo descanso. `woki-os.html:741`, `woki-os.html:1707` · e2e: `alarma.spec.ts` (D1 D2)
- [x] I4. Pista inferior «Ceja elegir · Mandíbula cuidados». `woki-os.html:471` · e2e: `inicio.spec.ts` (I1 I4 I5)
- [x] I5. Barra de estado: nombre de la pantalla, reloj, y «‹ Inicio» y «‹ Volver» fuera de Inicio. `woki-os.html:1262-1294` · e2e: `inicio.spec.ts` (C7 I5 P10)
- [ ] I6. Mosaico de logos en Apps y de portadas en Juegos. `os-juegos-servicios.js:42-53` · Falta: la v2 muestra el ícono.

## 3. Puntero, permanencia e imán

- [x] P1. El mouse hace de mirada, con suavizado de 2 cuadros. `woki-os.html:1902-1903`, `woki-os.html:1984` · e2e: `inicio.spec.ts` (P1 P7)
- [ ] P2. Cursor de mirada visible (`#gaze`). `woki-os.html:287-291`, `woki-os.html:1990` · Hecha, sin prueba.
- [x] P3. Permanencia que cuenta solo dentro del objetivo, con 160 ms de gracia. `magnetic-pointer.js:2-21` · unit: `engines/pointer/pointer.test.ts`
- [x] P4. Imán tipo burbuja: atrae al borde al acercarse y al centro al entrar. `magnetic-pointer.js:25-95` · unit: `engines/pointer/pointer.test.ts`
- [ ] P5. Puntero de menú: no repite la última elección hasta que la mirada se aleja. `magnetic-pointer.js:133-155`, `woki-os.html:1644` · Hecha, sin prueba.
- [ ] P6. Contorno de progreso que sigue al objetivo. `magnetic-pointer.js:98-129` · Hecha, sin prueba.
- [x] P7. Modo «mirada + ceja»: 350 ms para armar y la ceja confirma. `woki-os.html:706-708`, `woki-os.html:2063-2081` · e2e: `inicio.spec.ts` (P1 P7 P9 G1 G2)
- [x] P8. Modo «solo mirada»: elige al llenar el tiempo de mirada. `woki-os.html:2066-2078` · e2e: `inicio.spec.ts` (P8 S3)
- [x] P9. Clases `focus`, `armed`, `blocked` y `pressed`, anillo `--p` e insignia «Listo». `woki-os.html:96-113`, `woki-os.html:1250-1252` · e2e: `inicio.spec.ts` (P1 P7 P9)
- [x] P10. Clic directo con el mouse, sin entrenar la mirada. `woki-os.html:1837-1850` · e2e: `inicio.spec.ts` (C7 I5 P10)
- [ ] P11. Histéresis del foco al 12 % del lado menor. `woki-os.html:2045-2048` · Falta: solo aplica sin el puntero de menú (nariz o webcam).
- [ ] P12. Margen estricto para SOS y Descansar con punto de control fresco. `woki-os.html:2057`, `woki-os.html:2114-2124` · Hecha para el mouse, sin prueba propia.
- [x] P13. Escaneo cuando no hay rostro: la ceja elige el objetivo resaltado. `woki-os.html:1904-1907`, `woki-os.html:2015-2017` · e2e: `ajustes.spec.ts` (P13)
- [x] P14. Permanencia de 2 s en el descanso. `woki-os.html:2127-2142` · e2e: `alarma.spec.ts` (D1)

## 4. Gestos

- [x] G1. `Espacio` simula la ceja (bajar y subir). `woki-os.html:1865-1867`, `woki-os.html:1882-1884` · e2e: `inicio.spec.ts` (G1) · unit: `engines/gestures/gestures.test.ts`
- [x] G2. La ceja confirma el foco de la capa visible. `woki-os.html:1778-1835` · e2e: `inicio.spec.ts` (G2) · unit: `engines/gestures/gestures.test.ts`
- [x] G3. Mandíbula: en Inicio abre Cuidados, en otras pantallas vuelve, en la rueda vuelve. `woki-os.html:1807-1815` · e2e: `myoware.spec.ts` (G3) · unit: `engines/gestures/gestures.test.ts`
- [ ] G4. Puente EMG opcional por WebSocket (`ws://localhost:8765`). `woki-os.html:1888-1899` · Hecha, sin prueba.
- [ ] G5. Cancela gestos al perder el foco de la ventana o al ocultarse. `woki-os.html:1885-1886` · Hecha, sin prueba.
- [ ] G6. Clic con la cara (cejas y boca) con MediaPipe. `woki-os.html:2592-2604`, `woki-os.html:2629-2636` · Falta: depende de la cámara (L4).

## 5. MyoWare

- [x] M1. Calibración guiada: reposo, 5 cejas y 5 mandíbulas. `myoware-click.js:38-148` · e2e: `myoware.spec.ts` (M1) · unit: `engines/myoware/detector.test.ts`
- [x] M2. Detector con prioridad de mandíbula y rearme al relajar. `myoware-click.js:150-190` · unit: `engines/myoware/detector.test.ts`
- [x] M3. Cursor de paquetes: descarta historia vieja, huecos y fuentes nuevas. `myoware-click.js:192-222` · unit: `engines/myoware/detector.test.ts`
- [x] M4. Perfil guardado y validado (`toki.myoware.gestures.v3`). `myoware-click.js:15`, `myoware-click.js:224-236` · e2e: `myoware.spec.ts` (M4, M7) · unit: `engines/myoware/client.test.ts`
- [x] M5. Lectura de `/emg/gestures`, avisos de corte y de señal recuperada. `myoware-click.js:336-406` · e2e: `myoware.spec.ts` (M5) · unit: `engines/myoware/client.test.ts`
- [x] M6. Panel «Sensores MyoWare» en Controles: Calibrar gestos, Activar gestos, estado y último gesto. `woki-os.html:623-634`, `myoware-click.js:282-295` · e2e: `myoware.spec.ts` (M6)
- [x] M7. «Usar mouse + gestos MyoWare» en la elección de control. `woki-os.html:577`, `woki-os.html:2269-2276` · e2e: `myoware.spec.ts` (M7)
- [ ] M7b. «Usar mirada + MyoWare». `woki-os.html:576`, `woki-os.html:2278-2284` · Falta: depende de la mirada por webcam (L5).
- [x] M8. Modo MyoWare: sin permanencia, la ceja solo hace clic. `woki-os.html:812-822` · e2e: `myoware.spec.ts` (M8)

## 6. Hablar

- [x] H1. Contexto «Sofía dice» editable por el acompañante. `Enter` pide frases nuevas. `woki-os.html:476-481`, `woki-os.html:1861-1863` · e2e: `hablar.spec.ts` (H1)
- [x] H2. Cuatro frases locales por tema, sin repetir la forma anterior. `woki-os.html:751-796`, `woki-os.html:1363-1376` · e2e: `hablar.spec.ts` (H1 H2 H3)
- [x] H3. Distribución: frase, frase, Escribir · frase, frase, Volver. `woki-os.html:1401-1409` · e2e: `hablar.spec.ts` (H1 H2 H3)
- [x] H4. Emoji de cada tarjeta: abre el anillo de emociones. `woki-os.html:1399`, `woki-os.html:1613-1621` · e2e: `hablar.spec.ts` (H4 H5)
- [x] H5. Anillo: 6 emociones y Volver. Elegir cambia la tarjeta y avisa en la isla. `woki-os.html:1614-1618`, `woki-os.html:1665` · e2e: `hablar.spec.ts` (H4 H5)
- [x] H6. Decir: voz del sistema con la emoción y franja «hablando». `woki-os.html:1623-1639` · e2e: `hablar.spec.ts` (H6)
- [ ] H7. Voz de ElevenLabs por el puente (`/api/voz/tts`) con respaldo en la voz del sistema. `woki-voz.js:43-65` · Hecha, sin prueba.
- [ ] H8. Indicador «Escribiendo». `woki-os.html:480`, `woki-os.html:2084` · Hecha, sin prueba.
- [ ] H9. Memoria local de frases dichas (`woki.mem.v1`). `woki-os.html:1416-1421` · Hecha, sin prueba.
- [x] H10. Traza dev bajo cada tarjeta (Shift+D). `woki-os.html:1377-1393`, `layout.css:328-331` · e2e: `agente.spec.ts` (H10)
- [x] H11. Panel dev del agente: salud, personas, disparadores y simular. `dev-agente.js:52-148` · e2e: `agente.spec.ts` (H11)
- [x] H12. Opciones del agente por SSE (`/api/eventos`) que reemplazan las tarjetas. `dev-agente.js:81-121` · e2e: `agente.spec.ts` (H12)
- [x] H13. `?dev=1` abre el panel dev al cargar. `dev-agente.js:184` · e2e: `agente.spec.ts` (H13)

## 7. Escribir

- [x] K1. Cinco grupos de letras y luego las letras del grupo. `woki-os.html:800`, `woki-os.html:1460-1503` · e2e: `teclado.spec.ts` (K1)
- [x] K2. Fila fija de 3 sugerencias y «Más ▸» con 7 más. `woki-os.html:1424-1429`, `woki-os.html:1482-1495` · e2e: `teclado.spec.ts` (K1, K2)
- [x] K3. Modo lista de sugerencias (Ajustes › Teclado). `woki-os.html:1474-1481`, `woki-os.html:1731-1732` · e2e: `teclado.spec.ts` (K3)
- [x] K4. Predicción por n-gramas con diccionario de 20 000 palabras y aprendizaje local. `predict.js:76-231`, `woki-os.html:1430-1436` · e2e: `teclado.spec.ts` (las dos TVs muestran las mismas palabras que el predictor) · unit: `engines/predict/predict.test.ts`
- [x] K5. Borrar que acelera: letra, resto de la palabra y palabra a palabra. `woki-os.html:1444-1453`, `woki-os.html:1691-1697` · e2e: `teclado.spec.ts` (K5) · unit: `domain/keyboard.test.ts`
- [x] K6. Espacio y Decir. Decir habla lo escrito. `woki-os.html:1690`, `woki-os.html:1701` · e2e: `teclado.spec.ts` (K5 K6)
- [x] K7. Mayúscula al inicio de frase al aceptar una sugerencia. `woki-os.html:1457`, `woki-os.html:1680` · e2e: `teclado.spec.ts` (K7)
- [ ] K7b. Completado fantasma en la línea de texto. `woki-os.html:1538-1543` · Hecha, sin prueba.
- [x] K8. Teclado por iniciales en un chat, con «✨ Completar» con Claude. `woki-os.html:960-1001`, `woki-os.html:1511-1532` · e2e: `whatsapp.spec.ts` (K8)
- [ ] K9. Imán dirigido: marca el grupo con la próxima inicial más probable. `woki-os.html:949-958` · Hecha, sin prueba.

## 8. Reacciones

- [x] R1. Ocho reacciones, 4 por página, con «Más» y «Volver». `woki-os.html:797-801`, `woki-os.html:1570-1577` · e2e: `hablar.spec.ts` (R1)

## 9. Mensajes y WhatsApp

- [x] W1. Contactos principales (hasta 6), «Ajustar» y «Volver». `woki-os.html:1065-1073` · e2e: `whatsapp.spec.ts` (W1)
- [x] W2. Chat con historial (últimos 10) y marcas de entrega. `woki-os.html:860-882`, `woki-os.html:1079-1085` · e2e: `whatsapp.spec.ts` (W2)
- [x] W3. Respuestas del chat: 2 del contexto, «Pregúntele a…», «Otro» y «Escribir con iniciales». `woki-os.html:883-902`, `woki-os.html:1403-1409` · e2e: `whatsapp.spec.ts` (W3)
- [x] W4. Respuestas de Claude por `/api/wa/suggest`, con marca ✨. `woki-os.html:904-930` · e2e: `whatsapp.spec.ts` (W4)
- [x] W5. Confirmación: Enviar pide otra ceja en 3 s. Sin la segunda, no envía. `woki-os.html:504-520`, `woki-os.html:1709-1719` · e2e: `whatsapp.spec.ts` (W5)
- [x] W6. Envío por `/api/wa/send` con `idemKey`. Modo prueba dice «(prueba)». `woki-os.html:1100-1120` · e2e: `whatsapp.spec.ts` (W6)
- [x] W7. Mensaje entrante por SSE: aviso y chat abierto. `woki-os.html:1121-1127` · e2e: `whatsapp.spec.ts` (W7)
- [ ] W7b. Eventos SSE de chat, estado, sesión y sugerencias. Cancelar tras 10 s sin respuesta. `woki-os.html:1140-1157`, `woki-os.html:2085` · Hecha, sin prueba.
- [x] W8. Menciones en grupos: aviso, opciones del agente y envío al grupo. `woki-os.html:1003-1051` · e2e: `whatsapp.spec.ts` (W8)
- [x] W9. Panel del acompañante (tecla K): buscar, elegir hasta 6, relación y guardar. `woki-os.html:657-681`, `woki-os.html:1165-1223` · e2e: `whatsapp.spec.ts` (W9)
- [x] W10. Sin `WA_URL`: «WhatsApp no está configurado» y envío simulado. `woki-os.html:1067`, `woki-os.html:1712` · unit: `ui/screens/contacts.test.tsx` (la e2e corre en localhost y siempre tiene puente)

## 10. Alarma

- [x] A1. SOS abre la alarma: «SOS de prueba» y «No se contactó a nadie.». Pantalla de atrás inerte. `woki-os.html:538-544`, `woki-os.html:2149-2164` · e2e: `alarma.spec.ts` (A1)
- [x] A2. Contador «Sin respuesta simulada · N s · R para simular recepción». `woki-os.html:2169` · e2e: `alarma.spec.ts` (A2)
- [x] A3. `M` silencia la alarma. `woki-os.html:1876` · e2e: `alarma.spec.ts` (A3)
- [ ] A3b. Pitidos que suben a los 30 s. `woki-os.html:2165-2173` · Hecha, sin prueba.
- [x] A4. `R` simula el llavero: primero «Respuesta simulada» en verde, después cierra con «Resuelto». `woki-os.html:2174-2184` · e2e: `alarma.spec.ts` (A4)
- [x] A5. `Esc` y «Cerrar simulación» cierran. `woki-os.html:1856-1859`, `woki-os.html:2197` · e2e: `alarma.spec.ts` (A5)
- [ ] A6. Llamada real por el puente (`/api/emergencia/llamar` y `/api/emergencia/estado`). `woki-voz.js:78-132` · Hecha, sin prueba.
- [x] A7. Aviso no urgente «Avisar a mi cuidador». `woki-os.html:2160-2161` · e2e: `cuidados.spec.ts` (A7)
- [ ] A8. Al cerrar, SOS bajo el puntero queda bloqueado. `woki-os.html:2192-2194` · Hecha, sin prueba.
- [ ] A9. LCD y LEDs junto a la cama. `woki-os.html:2240-2251` · Reposo con prueba (`ajustes.spec.ts`, B2 B3 A9). Falta: segundos en la línea de emergencia.

## 11. Calibración y elección de control

- [x] L1. Capa inicial «Elige tu control»: Nariz, Mirada con webcam, Mirada con iPhone y Mouse. `woki-os.html:553-583` · e2e: `inicio.spec.ts` (L1 L2)
- [x] L2. Mouse cierra la capa y avisa «Modo demo: el mouse es la mirada». `woki-os.html:2898` · e2e: `inicio.spec.ts` (L1 L2)
- [x] L3. `Esc` cierra la elección de control. `woki-os.html:2901-2905` · e2e: `inicio.spec.ts` (L3)
- [ ] L3b. `Enter` nariz, `E` mirada, `I` iPhone al iniciar. `woki-os.html:2907-2909` · Falta: la v2 avisa que esas opciones no están.
- [ ] L4. Puntero con la nariz (MediaPipe) y su calibración. `woki-os.html:2426-2644`, `woki-os.html:2663-2719` · Falta.
- [ ] L5. Mirada por webcam (ridge y WebEyeTrack): 15 puntos y 6 de comprobación. `woki-os.html:2322-2424`, `woki-os.html:2722-2816` · Falta.
- [ ] L6. Recentrar con `V`, centrar nariz con `C`, nariz o mouse con `N`, mirada con `E`. `woki-os.html:1871-1872`, `woki-os.html:2911-2913` · Falta.
- [ ] L7. «Usar calibración guardada». `woki-os.html:2848-2882` · Falta.
- [ ] L8. Mirada con iPhone (WebSocket, 13 y 5 puntos, presets). `iphone-gaze.js:1-547` · Falta la pantalla. El motor ya entra a la v2 (L9).
- [x] L9. Motor de mirada compartido: filtro One Euro, modelo, protocolo y puntos. `software/eye-tracking/web/js/` · unit: `engines/gaze/gaze.test.ts` (importa el mismo motor, sin copiarlo)
- [ ] L10. Panel de cámara en Controles funcional. `woki-os.html:611-621` · Falta: la v2 muestra el panel y avisa que la cámara no está.
- [ ] L11. Ajustes › Puntero rota entre mouse, nariz, mirada e iPhone. `woki-os.html:1744-1745` · Falta: la v2 queda en mouse.

## 12. Descanso

- [x] D1. Capa con reloj, «En descanso», Volver y SOS con 2 s de mirada. `woki-os.html:545-551`, `woki-os.html:2100-2142` · e2e: `alarma.spec.ts` (D1 D2, D1)
- [x] D2. La pantalla de atrás queda inerte y el foco va a Volver. `woki-os.html:2106-2111` · e2e: `alarma.spec.ts` (D1 D2)

## 13. Rueda de cuidados

- [x] Q1. Diálogo con Ayuda urgente, Avisar a mi cuidador, Frases rápidas, Volver y Cerrar. `care-wheel.js:7-24`, `woki-os.html:589-594` · e2e: `cuidados.spec.ts` (Q1) · unit: `engines/careWheel/careWheel.test.ts`
- [x] Q2. Escaneo por turnos, sector por dirección de la mirada y «Pausar escaneo». `care-wheel.js:28-98`, `care-wheel.js:142-151` · e2e: `cuidados.spec.ts` (Q2) · unit: `engines/careWheel/careWheel.test.ts`
- [x] Q3. Se abre con «Cuidados» en la barra o con la mandíbula en Inicio. `woki-os.html:604`, `woki-os.html:2231-2238` · e2e: `cuidados.spec.ts` (Q3), `myoware.spec.ts` (G3)
- [x] Q4. SOS de prueba desde la rueda, con confirmación y foco de vuelta en «Cuidados». `woki-os.html:2223-2226`, `woki-os.html:2191` · e2e: `cuidados.spec.ts` (Q4)
- [ ] Q5. Avisos hablados con la voz del sistema. `woki-os.html:2199-2215` · Hecha, sin prueba.

## 14. Ajustes

- [x] S1. Diez tarjetas en el mismo orden. Sensibilidad, Clic con cara y Calibrar responden igual. `woki-os.html:1593-1611` · e2e: `ajustes.spec.ts` (S1)
- [x] S2. Tiempo de mirada: 800, 1000, 1200 y 1500 ms, guardado. `woki-os.html:690`, `woki-os.html:1734-1735` · e2e: `ajustes.spec.ts` (S2)
- [x] S3. Confirmar con: ceja o solo mirada. `woki-os.html:1736-1740` · e2e: `inicio.spec.ts` (P8 S3)
- [x] S4. Tema y color: Oscuro, Claro y 5 fondos, guardado. `woki-os.html:1581-1592`, `woki-os.html:1720-1724` · e2e: `ajustes.spec.ts` (S4 C4)
- [ ] S5. Voz: recorre las voces de ElevenLabs o del sistema y dice «Hola, esta es mi voz.». `woki-os.html:1741-1743` · Hecha, sin prueba.

## 15. Escucha de la sala y voces

- [ ] E1. Modos siempre, voz y manual. `O` enciende o apaga. `Shift+O` cambia de modo. `?escucha=` elige. `myo-escucha.js:41-50`, `myo-escucha.js:614-626` · Falta.
- [ ] E2. Botón «🎙 Escuchar» en Hablar e indicador en la barra. `myo-escucha.js:73-90` · Falta.
- [ ] E3. Turnos por voz con tarjetas por tema y opciones del agente (`/api/tarjetas`, `/api/sugerir`). `myo-escucha.js:279-345` · Falta.
- [ ] E4. Registrar voz: 20 s, consentimiento, guardar y borrar huella. `myo-escucha.js:352-426` · Falta.

## 16. Apps y Juegos

- [ ] V1. Apps: Spotify, Rappi, BioBioChile, YouTube y otros por `apps-bridge`. `os-juegos-servicios.js:56-127`, `toki-apps.js` · Falta: la v2 muestra «Apps todavía no está en la v2» con Volver.
- [ ] V2. Juegos: catálogo de Eye Gaze Games. `prototype-games.js`, `prototype-external-games.js` · Falta: igual que Apps.

## 17. Barra del acompañante y Controles

- [x] B1. Barra: «Cuidados», interruptor de tema y «Controles». Recuerda si Controles está abierto. `woki-os.html:602-607`, `woki-os.html:831-847` · e2e: `ajustes.spec.ts` (B1)
- [x] B2. Controles: Sensores MyoWare, Atajos de teclado y Diagnóstico. `woki-os.html:609-655` · e2e: `ajustes.spec.ts` (B2), `myoware.spec.ts` (M6)
- [x] B3. Diagnóstico: puntero, gestos, SOS y WhatsApp. `woki-os.html:1296-1329` · e2e: `ajustes.spec.ts` (B3)
- [x] B4. Isla de avisos. `woki-os.html:2253-2255` · e2e: casi todas las pruebas leen `#isTx`.

## 18. Atajos de teclado

| Tecla | Acción | Cita | Estado |
|---|---|---|---|
| `Espacio` | Ceja | `woki-os.html:1865` | Hecho · `inicio.spec.ts` |
| `Esc` | Cierra alarma, panel, campo de texto o calibración | `woki-os.html:1855-1863`, `woki-os.html:2901` | Hecho · `alarma.spec.ts`, `whatsapp.spec.ts`, `inicio.spec.ts`, `hablar.spec.ts` |
| `T` | Tema claro u oscuro | `woki-os.html:1874` | Hecho · `ajustes.spec.ts` |
| `F` | Pantalla completa | `woki-os.html:1877-1880` | Hecho · `ajustes.spec.ts` |
| `K` | Panel de contactos | `woki-os.html:1869` | Hecho · `whatsapp.spec.ts` |
| `R` | Llavero RFID | `woki-os.html:1868` | Hecho · `alarma.spec.ts` |
| `M` | Silenciar la alarma | `woki-os.html:1876` | Hecho · `alarma.spec.ts` |
| `G` | Simular pérdida del rostro | `woki-os.html:1870` | Hecho · `ajustes.spec.ts` |
| `W` | Simular temblor | `woki-os.html:1873` | Hecho · `ajustes.spec.ts` |
| `I` | Imán (fuera de la calibración) | `woki-os.html:1875` | Hecho · `ajustes.spec.ts` |
| `Shift+D` | Panel dev del agente | `dev-agente.js:179-183` | Hecho · `agente.spec.ts` |
| `N` `C` `V` `E` | Nariz, centrar, recentrar, mirada | `woki-os.html:1871-1872`, `woki-os.html:2912-2913` | Falta (cámara) |
| `O`, `Shift+O` | Escucha y modo de escucha | `myo-escucha.js:624-626` | Falta (escucha) |

## 19. Accesibilidad

- [x] X1. Roles de diálogo, `aria-live` en el chat, `role="alert"` en la alarma y foco en el botón de cierre, en Volver del descanso y de vuelta en «Cuidados». `woki-os.html:483`, `woki-os.html:538-544`, `woki-os.html:2158` · e2e: `alarma.spec.ts` (A1 A2 X1, D1 D2), `cuidados.spec.ts` (Q4)
- [ ] X2. Movimiento reducido y colores forzados. `woki-os.html:417-421`, `magnetic-pointer.css:16-19` · CSS copiado sin cambios, sin prueba.
- [ ] X3. Objetivos grandes (6 cm o más) y bordes más anchos. `layout.css:1-8`, `layout.css:268-276` · CSS copiado sin cambios, sin prueba. Capturas de Inicio, Hablar y Escribir iguales a 1600×1000.

La v2 suma una mejora sin cambiar el aspecto: la isla tiene `role="status"` y `aria-live`, y la etiqueta del contexto en Hablar queda asociada a su campo.

## Diferencias conocidas de la v2

- Apps y Juegos abren una pantalla que dice que todavía no están, con Volver.
- Nariz, Mirada con webcam y Mirada con iPhone muestran un aviso en la elección de control. Mouse funciona igual.
- El panel de cámara y Ajustes › Puntero avisan que la v2 usa el mouse.
- No hay botón «🎙 Escuchar», indicador de escucha ni «Registrar voz».
- La barra muestra una etiqueta «v2» para no confundir las dos TVs.

## Errores que encontraron las pruebas de paridad

- `createGestures` llamaba a `setTimeout` como método de otro objeto. Chrome responde «Illegal invocation» y el latido de MyoWare se caía. Vitest no lo veía porque Node ignora el receptor. Lo encontró `myoware.spec.ts` y ahora lo cubre `engines/gestures/gestures.test.ts`.

## Fuera de alcance por ahora

- Modo tablet (`?entrada=teclado`) y `?controlGlobal`. `tablet-keyboard.js`, `woki-os.html:686-689`
- Botón Inicio deslizable, desactivado en la TV actual. `woki-os.html:1914-1948`
