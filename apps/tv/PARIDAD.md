# Paridad entre la TV actual y la TV v2

La TV actual es la especificación. Vive en `software/toki-os/woki-os.html` y en los scripts que carga.
La TV v2 vive en `apps/tv/` y se publica en `/v2/` y en `/equipo/v2/`.
La TV actual no cambia hasta que esta lista quede completa.

## Cómo leer esta lista

- `[x]` significa que la función existe en la v2 y su prueba pasa.
- `[ ]` significa que la función falta en la v2 o que su prueba todavía no existe.
- Cada línea cita el archivo y la línea de la TV actual. Las rutas cortas son relativas a `software/toki-os/`.
- `e2e:` nombra la prueba de Playwright. Corre la misma interacción en la TV actual y en la v2.
- `unit:` nombra la prueba de Vitest del motor portado.

## Resumen

| Grupo | Hecho | Falta |
|---|---|---|
| Total | 0 | por contar |

## 1. Arranque y configuración

- [ ] C1. Cuatro formas de abrir la TV: escenario, equipo, público y desarrollo. Calcula `WA_URL` y `AGENTE_URL`. `woki-os.html:691-722`
- [ ] C2. El token va en el header `X-Myo-Token` y nunca en la URL. `toki-config.js:2`, `woki-os.html:1054-1059`
- [ ] C3. SSE leído con `fetch` para mandar el header. Reconecta a los 3 s. `toki-sse.js:1-37`
- [ ] C4. Tema y paleta antes de pintar, sin parpadeo (`woki.theme`, `woki.palette`). `woki-os.html:433-434`
- [ ] C5. Nombre de la usuaria desde `/api/salud` del agente. `woki-os.html:724-728`
- [ ] C6. Lienzo de 1920×1080 escalado a la ventana. `woki-os.html:1225-1247`
- [ ] C7. Navegación por `#pantalla` con historial del navegador. `woki-os.html:1336-1360`

## 2. Inicio

- [ ] I1. Ocho tarjetas: Hablar, Escribir, Mensajes, SOS, Apps, Juegos, Descansar, Ajustes. `woki-os.html:734-742`, `woki-os.html:1254-1256`
- [ ] I2. SOS exige 2 s de mirada (`data-dwell="2000"`). `woki-os.html:738`
- [ ] I3. Descansar abre el modo descanso. `woki-os.html:741`, `woki-os.html:1707`
- [ ] I4. Pista inferior «Ceja elegir · Mandíbula cuidados». `woki-os.html:471`
- [ ] I5. Barra de estado: nombre de la pantalla, reloj, y «‹ Inicio» y «‹ Volver» fuera de Inicio. `woki-os.html:1262-1294`
- [ ] I6. Mosaico de logos en Apps y de portadas en Juegos. `os-juegos-servicios.js:42-53`

## 3. Puntero, permanencia e imán

- [ ] P1. El mouse hace de mirada, con suavizado de 2 cuadros. `woki-os.html:1902-1903`, `woki-os.html:1984`
- [ ] P2. Cursor de mirada visible (`#gaze`). `woki-os.html:287-291`, `woki-os.html:1990`
- [ ] P3. Permanencia que cuenta solo dentro del objetivo, con 160 ms de gracia. `magnetic-pointer.js:2-21`
- [ ] P4. Imán tipo burbuja: atrae al borde al acercarse y al centro al entrar. `magnetic-pointer.js:25-95`
- [ ] P5. Puntero de menú: no repite la última elección hasta que la mirada se aleja. `magnetic-pointer.js:133-155`, `woki-os.html:1644`
- [ ] P6. Contorno de progreso que sigue al objetivo. `magnetic-pointer.js:98-129`
- [ ] P7. Modo «mirada + ceja»: 350 ms para armar y la ceja confirma. `woki-os.html:706-708`, `woki-os.html:2063-2081`
- [ ] P8. Modo «solo mirada»: elige al llenar el tiempo de mirada. `woki-os.html:2066-2078`
- [ ] P9. Clases `focus`, `armed`, `blocked` y `pressed`, anillo `--p` e insignia «Listo». `woki-os.html:96-113`, `woki-os.html:1250-1252`
- [ ] P10. Clic directo con el mouse, sin entrenar la mirada. `woki-os.html:1837-1850`
- [ ] P11. Histéresis del foco al 12 % del lado menor. `woki-os.html:2045-2048`
- [ ] P12. Margen estricto para SOS y Descansar con punto de control fresco. `woki-os.html:2057`, `woki-os.html:2114-2124`
- [ ] P13. Escaneo cuando no hay rostro: la ceja elige el objetivo resaltado. `woki-os.html:1904-1907`, `woki-os.html:2015-2017`

## 4. Gestos

- [ ] G1. `Espacio` simula la ceja (bajar y subir). `woki-os.html:1865-1867`, `woki-os.html:1882-1884`
- [ ] G2. La ceja confirma el foco de la capa visible. `woki-os.html:1778-1835`
- [ ] G3. Mandíbula: en Inicio abre Cuidados, en otras pantallas vuelve, en la rueda vuelve. `woki-os.html:1807-1815`
- [ ] G4. Puente EMG opcional por WebSocket (`ws://localhost:8765`). `woki-os.html:1888-1899`
- [ ] G5. Cancela gestos al perder el foco de la ventana o al ocultarse. `woki-os.html:1885-1886`
- [ ] G6. Clic con la cara (cejas y boca) con MediaPipe. `woki-os.html:2592-2604`, `woki-os.html:2629-2636`

## 5. MyoWare

- [ ] M1. Calibración guiada: reposo, 5 cejas y 5 mandíbulas. `myoware-click.js:38-148`
- [ ] M2. Detector con prioridad de mandíbula y rearme al relajar. `myoware-click.js:150-190`
- [ ] M3. Cursor de paquetes: descarta historia vieja, huecos y fuentes nuevas. `myoware-click.js:192-222`
- [ ] M4. Perfil guardado y validado (`toki.myoware.gestures.v3`). `myoware-click.js:15`, `myoware-click.js:224-236`
- [ ] M5. Lectura de `/emg/gestures`, avisos de corte y de señal recuperada. `myoware-click.js:336-406`
- [ ] M6. Panel «Sensores MyoWare» en Controles: Calibrar gestos, Activar gestos, estado y último gesto. `woki-os.html:623-634`, `myoware-click.js:282-295`
- [ ] M7. «Usar mirada + MyoWare» y «Usar mouse + gestos MyoWare» en la elección de control. `woki-os.html:576-577`, `woki-os.html:2265-2306`
- [ ] M8. Modo MyoWare: sin permanencia, la ceja solo hace clic. `woki-os.html:812-822`

## 6. Hablar

- [ ] H1. Contexto «Sofía dice» editable por el acompañante. `Enter` pide frases nuevas. `woki-os.html:476-481`, `woki-os.html:1861-1863`
- [ ] H2. Cuatro frases locales por tema, sin repetir la forma anterior. `woki-os.html:751-796`, `woki-os.html:1363-1376`
- [ ] H3. Distribución: frase, frase, Escribir · frase, frase, Volver. `woki-os.html:1401-1409`
- [ ] H4. Emoji de cada tarjeta: abre el anillo de emociones. `woki-os.html:1399`, `woki-os.html:1613-1621`
- [ ] H5. Anillo: 6 emociones y Volver. Elegir cambia la tarjeta y avisa en la isla. `woki-os.html:1614-1618`, `woki-os.html:1665`
- [ ] H6. Decir: voz del sistema con la emoción (velocidad, tono y volumen) y franja «hablando». `woki-os.html:1623-1639`
- [ ] H7. Voz de ElevenLabs por el puente (`/api/voz/tts`) con respaldo en la voz del sistema. `woki-voz.js:43-65`
- [ ] H8. Indicador «Escribiendo». `woki-os.html:480`, `woki-os.html:2084`
- [ ] H9. Memoria local de frases dichas (`woki.mem.v1`). `woki-os.html:1416-1421`
- [ ] H10. Traza dev bajo cada tarjeta (Shift+D). `woki-os.html:1377-1393`, `layout.css:328-331`
- [ ] H11. Panel dev del agente: salud, personas, disparadores y simular. `dev-agente.js:52-148`
- [ ] H12. Opciones del agente por SSE (`/api/eventos`) que reemplazan las tarjetas. `dev-agente.js:81-121`
- [ ] H13. `?dev=1` abre el panel dev al cargar. `dev-agente.js:184`

## 7. Escribir

- [ ] K1. Cinco grupos de letras y luego las letras del grupo. `woki-os.html:800`, `woki-os.html:1460-1503`
- [ ] K2. Fila fija de 3 sugerencias y «Más ▸» con 7 más. `woki-os.html:1424-1429`, `woki-os.html:1482-1495`
- [ ] K3. Modo lista de sugerencias (Ajustes › Teclado). `woki-os.html:1474-1481`, `woki-os.html:1731-1732`
- [ ] K4. Predicción por n-gramas con diccionario de 20 000 palabras y aprendizaje local. `predict.js:76-231`, `woki-os.html:1430-1436`
- [ ] K5. Borrar que acelera: letra, resto de la palabra y palabra a palabra. `woki-os.html:1444-1453`, `woki-os.html:1691-1697`
- [ ] K6. Espacio y Decir. Decir habla, o confirma por WhatsApp en un chat. `woki-os.html:1690`, `woki-os.html:1701`
- [ ] K7. Completado fantasma en la línea de texto y mayúscula al inicio de frase. `woki-os.html:1538-1543`, `woki-os.html:1680`
- [ ] K8. Teclado por iniciales en un chat, con «✨ Completar» con Claude. `woki-os.html:960-1001`, `woki-os.html:1511-1532`
- [ ] K9. Imán dirigido: marca el grupo con la próxima inicial más probable. `woki-os.html:949-958`

## 8. Reacciones

- [ ] R1. Ocho reacciones, 4 por página, con «Más» y «Volver». `woki-os.html:797-801`, `woki-os.html:1570-1577`

## 9. Mensajes y WhatsApp

- [ ] W1. Contactos principales (hasta 6), «Ajustar» y «Volver», con textos de lista vacía. `woki-os.html:1065-1073`
- [ ] W2. Chat con historial (últimos 10) y marcas de entrega. `woki-os.html:860-882`, `woki-os.html:1079-1085`
- [ ] W3. Respuestas del chat: 2 del contexto, «Pregúntele a…» o «Después te respondo», «Otro» y «Escribir con iniciales». `woki-os.html:883-902`, `woki-os.html:1403-1409`
- [ ] W4. Respuestas de Claude por `/api/wa/suggest`, con caché por último mensaje y marca ✨. `woki-os.html:904-930`
- [ ] W5. Confirmación: destinatario y texto, Enviar pide otra ceja en 3 s. Cancela con «Cancelar» o 10 s sin respuesta. `woki-os.html:504-520`, `woki-os.html:1709-1719`, `woki-os.html:2085`
- [ ] W6. Envío por `/api/wa/send` con `idemKey`. Modo prueba dice «(prueba)». `woki-os.html:1100-1120`
- [ ] W7. Eventos SSE `/api/wa/events`: entrante, chat, estado, sesión, sugerencias. `woki-os.html:1121-1163`
- [ ] W8. Menciones en grupos: aviso, opciones del agente y respuesta desde otra pantalla. `woki-os.html:1003-1051`
- [ ] W9. Panel del acompañante (tecla K): buscar, elegir hasta 6, relación y guardar. `woki-os.html:657-681`, `woki-os.html:1165-1223`
- [ ] W10. Sin `WA_URL`: «WhatsApp no está configurado» y envío simulado. `woki-os.html:1067`, `woki-os.html:1712`

## 10. Alarma

- [ ] A1. SOS abre la alarma a pantalla completa: «SOS de prueba» y «No se contactó a nadie.». `woki-os.html:538-544`, `woki-os.html:2149-2164`
- [ ] A2. Contador «Sin respuesta simulada · N s · R para simular recepción». `woki-os.html:2169`
- [ ] A3. Pitidos que suben a los 30 s. `M` silencia. `woki-os.html:2165-2173`, `woki-os.html:1876`
- [ ] A4. `R` simula el llavero: primero «Respuesta simulada» en verde, después cierra con «Resuelto». `woki-os.html:2174-2184`
- [ ] A5. `Esc` y «Cerrar simulación» cierran. `Tab` queda en el botón. `woki-os.html:1856-1859`, `woki-os.html:2197`
- [ ] A6. Llamada real por el puente (`/api/emergencia/llamar` y `/api/emergencia/estado`). `woki-voz.js:78-132`
- [ ] A7. Aviso no urgente «Avisar a mi cuidador». `woki-os.html:2160-2161`
- [ ] A8. Al cerrar, SOS bajo el puntero queda bloqueado. `woki-os.html:2192-2194`
- [ ] A9. LCD y LEDs de la pantalla junto a la cama. `woki-os.html:2240-2251`

## 11. Calibración y elección de control

- [ ] L1. Capa inicial «Elige tu control»: Nariz, Mirada con webcam, Mirada con iPhone y Mouse. `woki-os.html:553-583`
- [ ] L2. Mouse cierra la capa y avisa «Modo demo: el mouse es la mirada». `woki-os.html:2898`
- [ ] L3. Teclas al iniciar: `Enter` nariz, `E` mirada, `I` iPhone, `Esc` cierra. `woki-os.html:2899-2910`
- [ ] L4. Puntero con la nariz (MediaPipe) y su calibración: centro, 4 esquinas y 3 objetivos. `woki-os.html:2426-2644`, `woki-os.html:2663-2719`
- [ ] L5. Mirada por webcam (ridge y WebEyeTrack): 15 puntos y 6 de comprobación. `woki-os.html:2322-2424`, `woki-os.html:2722-2816`
- [ ] L6. Recentrar con `V`, centrar nariz con `C`, nariz o mouse con `N`, mirada con `E`. `woki-os.html:1871-1872`, `woki-os.html:2911-2913`
- [ ] L7. «Usar calibración guardada». `woki-os.html:2848-2882`
- [ ] L8. Mirada con iPhone (WebSocket, 13 y 5 puntos, presets). `iphone-gaze.js:1-547`
- [ ] L9. Motor de mirada compartido (filtro One Euro, modelo, puntos). `software/eye-tracking/web/js/one-euro.js`, `software/eye-tracking/web/js/model.js`
- [ ] L10. Panel de cámara en Controles: vista previa, estado y «Activar cámara». `woki-os.html:611-621`

## 12. Descanso

- [ ] D1. Capa con reloj, «En descanso», Volver y SOS con 2 s de mirada. `woki-os.html:545-551`, `woki-os.html:2100-2142`
- [ ] D2. La pantalla de atrás queda inerte. Cambiar de pantalla cierra el descanso. `woki-os.html:2106`, `woki-os.html:1346`

## 13. Rueda de cuidados

- [ ] Q1. Diálogo con Ayuda urgente, Avisar a mi cuidador, Frases rápidas, Volver y Cerrar. `care-wheel.js:7-24`, `woki-os.html:589-594`
- [ ] Q2. Escaneo por turnos y sector por dirección de la mirada. «Pausar escaneo». `care-wheel.js:28-98`, `care-wheel.js:142-151`
- [ ] Q3. Se abre con «Cuidados» en la barra o con la mandíbula en Inicio. `woki-os.html:604`, `woki-os.html:2231-2238`
- [ ] Q4. SOS de prueba desde la rueda: la ceja cierra la simulación. `woki-os.html:2223-2226`, `woki-os.html:1821`
- [ ] Q5. Avisos hablados con la voz del sistema. `woki-os.html:2199-2215`

## 14. Ajustes

- [ ] S1. Diez tarjetas: Tiempo de mirada, Confirmar con, Voz, Puntero, Sensibilidad, Calibrar, Clic con cara, Teclado, Tema y color y Volver. `woki-os.html:1593-1611`
- [ ] S2. Tiempo de mirada: 800, 1000, 1200 y 1500 ms, guardado. `woki-os.html:690`, `woki-os.html:1734-1735`
- [ ] S3. Confirmar con: ceja o solo mirada. `woki-os.html:1736-1740`
- [ ] S4. Tema y color: Oscuro, Claro y 5 fondos. `woki-os.html:1581-1592`, `woki-os.html:1720-1724`

## 15. Escucha de la sala y voces

- [ ] E1. Modos siempre, voz y manual. `O` enciende o apaga. `Shift+O` cambia de modo. `?escucha=` elige. `myo-escucha.js:41-50`, `myo-escucha.js:614-626`
- [ ] E2. Botón «🎙 Escuchar» en Hablar e indicador en la barra. `myo-escucha.js:73-90`
- [ ] E3. Turnos por voz con tarjetas por tema y opciones del agente (`/api/tarjetas`, `/api/sugerir`). `myo-escucha.js:279-345`
- [ ] E4. Registrar voz: 20 s, consentimiento, guardar y borrar huella. `myo-escucha.js:352-426`

## 16. Apps y Juegos

- [ ] V1. Apps: Spotify, Rappi, BioBioChile, YouTube y otros por `apps-bridge`. `os-juegos-servicios.js:56-127`, `toki-apps.js`
- [ ] V2. Juegos: catálogo de Eye Gaze Games. `prototype-games.js`, `prototype-external-games.js`

## 17. Barra del acompañante y Controles

- [ ] B1. Barra: «Cuidados», interruptor de tema y «Controles». Recuerda si Controles está abierto. `woki-os.html:602-607`, `woki-os.html:831-847`
- [ ] B2. Controles: Cámara, Sensores MyoWare, Atajos de teclado y Diagnóstico. `woki-os.html:609-655`
- [ ] B3. Diagnóstico: puntero, gestos, SOS y WhatsApp. `woki-os.html:1296-1329`
- [ ] B4. Isla de avisos y registro de eventos. `woki-os.html:2253-2256`

## 18. Atajos de teclado

| Tecla | Acción | Cita | Estado |
|---|---|---|---|
| `Espacio` | Ceja | `woki-os.html:1865` | Falta |
| `Esc` | Cierra alarma, panel, campo de texto o calibración | `woki-os.html:1855-1863`, `woki-os.html:2901` | Falta |
| `T` | Tema claro u oscuro | `woki-os.html:1874` | Falta |
| `F` | Pantalla completa | `woki-os.html:1877-1880` | Falta |
| `K` | Panel de contactos | `woki-os.html:1869` | Falta |
| `R` | Llavero RFID | `woki-os.html:1868` | Falta |
| `M` | Silenciar la alarma | `woki-os.html:1876` | Falta |
| `G` | Simular pérdida del rostro | `woki-os.html:1870` | Falta |
| `W` | Simular temblor | `woki-os.html:1873` | Falta |
| `I` | Imán (fuera de la calibración) | `woki-os.html:1875` | Falta |
| `N` `C` `V` `E` | Nariz, centrar, recentrar, mirada | `woki-os.html:1871-1872`, `woki-os.html:2912-2913` | Falta |
| `O`, `Shift+O` | Escucha y modo de escucha | `myo-escucha.js:624-626` | Falta |
| `Shift+D` | Panel dev del agente | `dev-agente.js:179-183` | Falta |

## 19. Accesibilidad

- [ ] X1. Roles de diálogo, `aria-live` en el chat, `role="alert"` en la alarma y foco en el botón de cierre. `woki-os.html:483`, `woki-os.html:538-544`, `woki-os.html:2158`
- [ ] X2. Movimiento reducido y colores forzados. `woki-os.html:417-421`, `magnetic-pointer.css:16-19`
- [ ] X3. Objetivos grandes (6 cm o más) y bordes más anchos. `layout.css:1-8`, `layout.css:268-276`

## Fuera de alcance por ahora

- Modo tablet (`?entrada=teclado`) y `?controlGlobal`. `tablet-keyboard.js`, `woki-os.html:686-689`
- Botón Inicio deslizable, desactivado en la TV actual. `woki-os.html:1914-1948`
