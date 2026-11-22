<div align="center">

<img src="project-logo.png" alt="Myo" width="200" />

### Myo devuelve las decisiones a personas con ELA. Se usa solo con la cara.

**[▶ Probar la demo](https://179-66-157-161.sslip.io)** · [Ver capturas](#qué-hace) · [Cómo funciona](#cómo-funciona) · [Correr en local](#correr-en-local)

Track 🔧 Hardware · team-44 · Platanus Hack 26: Santiago ft. Buk

![Mirada](https://img.shields.io/badge/Mirada-Webcam_·_iPhone_Face_ID-174E42?style=flat-square)
![Músculo](https://img.shields.io/badge/Gestos-MyoWare_2_+_Arduino-174E42?style=flat-square)
![Voz](https://img.shields.io/badge/Voz-ElevenLabs-174E42?style=flat-square)
![IA](https://img.shields.io/badge/Sugerencias-Claude-174E42?style=flat-square)
![Estado](https://img.shields.io/badge/Estado-Prototipo_funcional-174E42?style=flat-square)

<img src="docs/screenshots/01-inicio.png" alt="Inicio de Myo OS" width="820" />

</div>

## El problema

Con la ELA, una persona lo siente todo, pero pierde poco a poco la voz y el movimiento. Lo que más extraña no es moverse: es **decidir**. Qué responder, qué comer, qué ver, a quién llamar. Y de noche, si la máscara de ventilación se suelta, no puede pedir ayuda.

## La solución

**En Myo, la cara es el mouse.** La mirada apunta y un gesto elige:

- **Apuntar:** la mirada, con una webcam o con la cámara Face ID de un iPhone. También sirve la nariz o un mouse.
- **Elegir:** levantar la ceja o mantener la mirada. La mandíbula abre los atajos de cuidado. Los gestos se leen con la cámara o con sensores musculares **MyoWare**.

Con eso, Myo OS, un sistema hecho para la mirada, permite hablar con su propia voz, responder WhatsApp, elegir qué comer, ver o escuchar, y pedir ayuda. **Myo no devuelve la movilidad. Devuelve las decisiones.**

![Persona con dos sensores MyoWare conectados a un Arduino en una habitación de cuidados. En la laptop se ve una respuesta sugerida por el asistente y, abajo, la vista de cámara con indicadores en los ojos y la nariz.](docs/myo-en-habitacion.png)

*Escena simulada. El asistente de Myo propone «Sí, agua por favor» y la persona apunta a la respuesta con la mirada.*

## Qué hace

| | |
|---|---|
| ![Hablar](docs/screenshots/05-conversacion.png) **Responder sin esperar a nadie.** Llega un WhatsApp y Myo propone respuestas con tono y emoción, a partir de la conversación y la memoria de la persona. Se dicen con **su propia voz** (clonada en ElevenLabs). | ![Escribir](docs/screenshots/03-escribir.png) **Escribir lo que quiera.** Teclado por grupos de letras que completa la palabra: «ag» → *agua*. |
| ![Pedido](docs/screenshots/11-pedido.png) **Elegir qué comer.** Rappi real: categorías, tiendas y productos con foto y precio. | ![Video](docs/screenshots/07-video.png) **Elegir qué ver.** YouTube, Spotify y noticias completas de BioBioChile, en botones grandes. |

**Pedir ayuda.** La tarjeta SOS (2 s de mirada) llama **a todos sus contactos de emergencia a la vez** con un agente telefónico de ElevenLabs. La pantalla muestra quién contestó y **quién viene en camino**.

<details>
<summary><b>Ver todas las pantallas (16 capturas)</b></summary>

Capturas del modo demo, donde el mouse hace de mirada. Los contactos y la conversación son de ejemplo; Rappi, YouTube, BioBioChile y Spotify muestran datos reales.

| | |
|---|---|
| ![Inicio](docs/screenshots/01-inicio.png) **Inicio.** Ocho tarjetas grandes; SOS pide 2 s de mirada. | ![Hablar](docs/screenshots/02-hablar.png) **Hablar.** Respuestas sugeridas a lo que le dicen. |
| ![Escribir](docs/screenshots/03-escribir.png) **Escribir.** Palabras sugeridas mientras escribe. | ![Mensajes](docs/screenshots/04-mensajes.png) **Mensajes.** Sus contactos principales de WhatsApp. |
| ![Conversación](docs/screenshots/05-conversacion.png) **Conversación.** Responde a su hija con una mirada. | ![Apps](docs/screenshots/06-apps.png) **Apps.** Música, videos, noticias y compras. |
| ![Video](docs/screenshots/07-video.png) **YouTube.** Elige un video y lo reproduce o pausa. | ![Noticias](docs/screenshots/08-noticias.png) **Noticias.** Titulares de BioBioChile con imagen. |
| ![Noticia](docs/screenshots/09-noticia.png) **Lectura.** La nota completa, en páginas grandes. | ![Rappi](docs/screenshots/10-rappi.png) **Rappi.** Categorías de restaurantes. |
| ![Pedido](docs/screenshots/11-pedido.png) **Pedido.** Producto real con foto y precio. | ![Spotify](docs/screenshots/12-spotify.png) **Spotify.** Canción actual, línea de tiempo y controles. |
| ![Juegos](docs/screenshots/13-juegos.png) **Juegos.** Catálogo de Eye Gaze Games. | ![Ajustes](docs/screenshots/14-ajustes.png) **Ajustes.** Tiempo de mirada, voz, puntero y tema. |
| ![Descansar](docs/screenshots/15-descansar.png) **Descansar.** Pausa la mirada y deja Volver y SOS. | ![Modo claro](docs/screenshots/16-inicio-claro.png) **Modo claro.** Disponible en todas las pantallas. |

</details>

## Pruébalo en un minuto

1. Abre **https://179-66-157-161.sslip.io** en Chrome. No hace falta instalar nada.
2. En la bienvenida elige **Usar mouse (demo)**: el mouse hace de mirada.
3. Mantén el puntero sobre una tarjeta hasta que se llene, o simula los gestos con el teclado: **Espacio = ceja** (elegir) y **J = mandíbula** (atajos de cuidado).

La demo pública usa conversaciones de ejemplo y protege la memoria y los contactos de la usuaria. Su SOS es una simulación segura, pensada para mostrar el flujo completo.

## Cómo funciona

```mermaid
flowchart LR
  subgraph Entradas
    W[Webcam<br/>mirada o nariz]
    I[iPhone Face ID<br/>mirada con ARKit]
    M[MyoWare 2 + Arduino<br/>ceja y mandíbula]
  end
  M -->|USB o BLE| MON[Monitor MyoWare<br/>Python]
  W --> OS
  I -->|WebSocket, 60 fps| OS
  MON -->|HTTP, gestos calibrados| OS[Myo OS<br/>navegador]
  OS --> AB[apps-bridge · Node<br/>Spotify · YouTube · BioBio · Rappi]
  OS --> WB[Puente WhatsApp · TypeScript<br/>wapi · voz y SOS con ElevenLabs]
  WB --> AG[Agente · Python<br/>Claude + memoria SQLite]
```

| Pieza | Qué hace | Carpeta |
|---|---|---|
| **Myo OS** | La interfaz: tarjetas grandes, selección por permanencia o ceja, calibración, descanso y SOS. | [software/toki-os](software/toki-os/) |
| **Mirada con iPhone** | Usa el iPhone como sensor (ARKit TrueDepth): envía la geometría de los ojos, nunca imágenes. | [software/eye-tracking](software/eye-tracking/) |
| **Monitor MyoWare** | Lee los sensores musculares, calibra los gestos y los entrega al SO. | [software/myoware-monitor](software/myoware-monitor/) · [firmware](firmware/) |
| **apps-bridge** | Adapta servicios reales a controles grandes y accesibles. | [software/apps-bridge](software/apps-bridge/) |
| **Puente WhatsApp** | Mensajes reales, voz clonada y llamadas de emergencia en paralelo. | [software/whatsapp-bridge](software/whatsapp-bridge/) |
| **Agente** | Propone respuestas con resumen, emoción y fuente, usando la memoria de la persona. | [software/agent](software/agent/) |

Cada servicio se adaptó para usarse sin mouse. La skill [`adapt-app`](.agents/skills/adapt-app/SKILL.md) documenta cómo investigar una app, preparar sus controles y comprobar sus funciones; el generador incluido ya crea lectores de noticias RSS. [Contrato de adaptadores](software/apps-bridge/ADAPTERS.md).

## Hardware

### MyoWare por cable

El montaje cableado de dos canales usa dos sensores MyoWare 2.0, cada uno con su Link Shield. Cada cable negro une el puerto de referencia de un sensor con uno de los dos electrodos **REF**, ubicados juntos en el centro de la frente. Los dos cables TRS van de los Link Shields a **A0** y **A3** del Arduino Shield, montado sobre un **Arduino UNO R3**. El UNO envía las lecturas al computador por USB de datos. [Guía del montaje cableado](docs/validation/MYOWARE.md#montaje-de-un-canal) · [Link y Arduino Shields del fabricante](https://myoware.com/products/link-and-arduino-shields/).

![Ilustración conceptual de una persona con un sensor MyoWare y un Link Shield en cada sien, dos electrodos REF juntos en el centro de la frente, y dos cables TRS hasta el Arduino Shield sobre el UNO](hardware/schematics/myoware-rostro-dos-canales.png)

*Ilustración del prototipo. La colocación en las sienes y la frente queda por validar en una prueba física.* [Guía avanzada de MyoWare 2.0](https://myoware.com/wp-content/uploads/2022/03/MyoWare_v2_AdvancedGuide-Updated.pdf).

| Pieza | SKU | Inventario | Uso |
|---|---|---:|---|
| MyoWare 2 Muscle Sensor | `DEV-27924` | 3 | Dos sensores para los canales A0 y A3. |
| Electrodos adhesivos EMG/ECG/EKG de 24 mm | `SEN-12969` | 10 paquetes de 10 | Tres por sensor (MID, END y REF). |
| MyoWare 2.0 Reference Cable | `KIT-19627` | 1 paquete de 10 | Conecta un electrodo REF remoto a cada sensor. |
| MyoWare 2.0 Link Shield | `DEV-18425` | 2 | Uno encima de cada sensor. |
| Cable de audio TRS de 1 m | `CAB-18983` | 2 | Uno de cada Link Shield al Arduino Shield. |
| MyoWare 2.0 Arduino Shield | `DEV-18426` | 1 | Recibe ambos canales sobre el UNO R3. |
| MyoWare 2.0 Cable Shield | `DEV-18386` | 2 | Adaptador para separar los tres electrodos del sensor mediante un cable de electrodos. |
| MyoWare 2.0 Wireless Shield, Ding & Dent | `DD-27114` | 3 | Reservado para la variante inalámbrica. |

El **Cable Shield** permite llevar MID, END y REF por un cable de electrodos. La ilustración muestra el montaje con **REF remoto** y MID y END bajo el sensor. El puerto del Cable Shield está reservado para el cable de electrodos. Los TRS unen los Link Shields al Arduino Shield. [Comparación de las placas](hardware/schematics/myoware-componentes.png) · [Ficha del Cable Shield](https://myoware.com/products/cable-shield/).

**Seguridad eléctrica:** con electrodos sobre el cuerpo, el computador debe estar solo a batería, sin cargador, dock ni monitor conectado a la red. Desconecta el USB antes de cambiar conexiones. [Guía de conexión y prueba](docs/validation/MYOWARE.md).

[Diagrama de un canal](hardware/schematics/myoware-conexion-uno-ref.png) · [capturas del conector y cable REF](hardware/schematics/README.md#conector-y-cable-ref) · [registro real del canal A0](docs/validation/MYOWARE.md#registro-real-del-canal-a0) · [ejemplo simulado de contracciones](docs/validation/MYOWARE.md#ejemplo-simulado-de-contracciones).

### Consola, brazalete y mirada

- **Consola de mesa:** soporte impreso en 3D para un panel de 7″ con webcam centrada y una Raspberry Pi 4. [STL y montaje](hardware/3d/README.md#consola-de-mesa).
- **Brazalete:** dos piezas impresas para el Arduino y la batería. [STL y guía](hardware/3d/README.md#brazalete-myo-para-arduino-uno-y-xiaomi-pb2067).
- **Sensor de mirada:** cualquier iPhone con Face ID, acostado bajo la pantalla, a 40–60 cm de la cara.

## Estado del prototipo

Myo es un **prototipo funcional de punta a punta** y una buena primera versión de lo que puede ser: se controla de verdad con la mirada y con gestos musculares, y conecta servicios reales como WhatsApp, voz clonada, llamadas de emergencia, Rappi, YouTube, Spotify y noticias.

- **Mirada precisa con un iPhone:** 2,9° de error medio en 24 calibraciones reales.
- **Varias formas de controlarlo:** iPhone, webcam (mirada o nariz), sensores MyoWare por USB o BLE, y mouse.
- **Demo pública** lista para probar en el navegador.

Como todo prototipo nacido en un hackathon, todavía no está validado clínicamente ni a gran escala. El siguiente paso es probarlo con más personas y equipos de salud. Mientras tanto, Myo acompaña a los cuidados y alarmas médicas, sin reemplazarlos.

## Correr en local

Con Node 22 o posterior, desde la raíz del repositorio:

```bash
npm ci --prefix software/apps-bridge
npm start --prefix software/apps-bridge
```

Abre http://127.0.0.1:8790/woki-os.html. Para la mirada con iPhone, instala la app del [eye-tracking](software/eye-tracking/README.md#instalar-la-app-en-el-iphone-una-vez) y elige **Mirada con iPhone (Face ID)**. El escenario completo, con MyoWare, WhatsApp y agente, se abre con doble clic en [`Myo.command`](Myo.command). [Despliegue y escenarios](deploy/README.md).

| Para probar… | Guía |
|---|---|
| Gestos MyoWare y mirada con iPhone sin hardware | [Banco de pruebas](software/toki-os/README.md#banco-de-pruebas) |
| Sensores reales (UNO por USB o BLE) | [Monitor muscular](software/myoware-monitor/README.md) |
| WhatsApp, voz y SOS | [Puente WhatsApp](software/whatsapp-bridge/README.md) |
| Tests | [tests/](tests/README.md) |

## Tecnologías

| Capa | Tecnología |
|---|---|
| Interfaz | HTML, CSS y JavaScript sin framework |
| Mirada | ARKit (Swift) en iPhone, modelo de calibración propio en el navegador, webcam |
| Señal muscular | MyoWare 2.0, Arduino (C++), monitor en Python, BLE |
| Servicios | Node 22 (apps-bridge), TypeScript (puente WhatsApp con wapi), Python (agente) |
| IA y voz | Claude (respuestas y memoria), ElevenLabs (voz clonada y agente telefónico) |
| Infraestructura | VPS con Caddy y systemd; piezas impresas en 3D |

## Uso de IA

En el producto, Claude propone respuestas y ElevenLabs genera la voz y hace las llamadas del SOS. Durante el hackathon, el equipo también usó asistentes de código con IA para programar y documentar, y revisó y probó el resultado.

## Estructura del repositorio

| Carpeta | Contenido |
|---|---|
| [software/](software/) | Myo OS, mirada con iPhone, monitor muscular, apps-bridge, puente WhatsApp y agente |
| [firmware/](firmware/) | Programas del Arduino (USB y BLE) |
| [hardware/](hardware/) | Conexiones, esquemas, Raspberry Pi e impresión 3D |
| [docs/](docs/README.md) | Guías, investigación, validación y capturas |
| [deploy/](deploy/) | Despliegue en la VPS y escenario de la demo |
| [tests/](tests/) | Pruebas del SO, los adaptadores y el monitor |

## Equipo

- Juan Ortega ([@juanortega10](https://github.com/juanortega10))
- Jhomar Astuyauri ([@asther0](https://github.com/asther0))
- Nicolas Vargas ([@MrUprizing](https://github.com/MrUprizing))
- Manuel Torres ([@AmunM9](https://github.com/AmunM9))
- Emmy Daniela Arias Pardo ([@estparcae](https://github.com/estparcae))

## Créditos

Los juegos del catálogo son de [Eye Gaze Games](https://www.eyegazegames.com/), de SpecialEffect con Sun & Moon Studios y Earth Interactive. [Créditos](https://www.specialeffect.org.uk/how-we-can-help/eye-gaze-games). Las noticias son de BioBioChile y los videos de Chile Travel, cada uno con sus derechos.
