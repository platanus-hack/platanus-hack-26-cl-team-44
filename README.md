# Toki · Interfaz accesible con señales musculares

**Nombre provisional · Track: 🔧 Hardware · team-44 · Platanus Hack 26: Santiago ft. Buk**

![Hardware](https://img.shields.io/badge/Hardware-MyoWare_2_%2B_UNO-174E42?style=flat-square)
![Firmware](https://img.shields.io/badge/Firmware-Arduino_C%2B%2B-174E42?style=flat-square)
![Monitor](https://img.shields.io/badge/Monitor-Python_3_%2B_HTML-174E42?style=flat-square)
![MVP](https://img.shields.io/badge/MVP-Web_%2B_TypeScript-174E42?style=flat-square)
![3D](https://img.shields.io/badge/Impresión_3D-3_STL-174E42?style=flat-square)
![Estado](https://img.shields.io/badge/Estado-Prototipo_en_validación-9B6B22?style=flat-square)

> Explorar cómo una acción muscular voluntaria puede convertirse en una entrada para comunicarse y controlar una interfaz.

Toki reúne un **MVP de SO accesible** y un **banco de pruebas EMG**. Puedes explorar la interacción por mouse, cabeza, mirada y gestos musculares calibrados. La mandíbula abre una rueda de atajos y la ceja permite elegir, volver o activar un SOS simulado. Toki no es un dispositivo médico ni una alarma de emergencia validada.

## Probarlo

| Experiencia | Dirección | Requisitos |
|---|---|---|
| Lobby accesible de Toki | [Elegir mirada, nariz o mouse](http://127.0.0.1:8790/prototype-lobby.html?acceso=elegir) | Node 22+ y el [servidor local de Toki](software/apps-bridge/README.md) |
| MVP del SO | http://localhost:8000/woki-os.html | Python 3; mouse para la demo, cámara para explorar seguimiento |
| Monitor muscular | http://127.0.0.1:8766 | macOS/Linux, Python 3.10+; [UNO por USB o dos MyoWare por BLE](software/myoware-monitor/README.md) |
| Mirada con iPhone en el SO | En el MVP: **Mirada con iPhone (Face ID)** | iPhone con Face ID y la app Eye Tracking; misma red Wi-Fi. [Guía](software/eye-tracking/README.md) |
| Demo de eye-tracking | http://localhost:5173 | Node 18+; `node software/eye-tracking/web/serve.mjs` |
| Despliegue público | Pendiente | Completar `deploy-url` cuando exista una URL real |

**MVP sin hardware**, desde la raíz:

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory software/toki-os
```

Abrir la URL del MVP y elegir **Usar mouse (demo)**. El archivo conserva su nombre histórico para no romper los enlaces del equipo.

**Monitor con hardware**, después de seguir la [guía de conexión](docs/validation/MYOWARE.md):

```bash
arduino-cli board list
# Sustituir el puerto por el de tu UNO:
python3 software/myoware-monitor/server.py --serial-port /dev/cu.usbserial-1130
```

El programa no carga firmware automáticamente. [Compilación, carga y diagnóstico](software/myoware-monitor/README.md).

## Cómo se conecta

```
Electrodos → MyoWare + Link Shield
                       │ TRS: alimentación + señal
                       ▼
               Arduino Shield · A0
                       │ sobre UNO
                       ▼
                 Arduino UNO
                       │ USB de datos
                       ▼
              Monitor local en Mac
```

El Cable Shield es una pieza diferente y no participa en este montaje directo. Con electrodos sobre el cuerpo, el portátil debe estar solo a batería, sin cargador, dock ni monitor conectado a la red. Desconectar USB antes de cambiar conexiones. [Manual del fabricante](https://myoware.com/wp-content/uploads/2022/03/MyoWare_v2_QuickStartGuide.pdf).

## Impresión 3D

- **Consola de mesa.** Un soporte para el panel táctil de 7″ con webcam centrada y cuna trasera para la Raspberry Pi 4 en su case Vilros. [Descargar el STL](hardware/3d/consola-7/soporte.stl) · [Ver el montaje y la orientación de impresión](hardware/3d/README.md#consola-de-mesa).
- **Brazalete.** Dos piezas independientes para el Arduino Uno con MyoWare y la batería Xiaomi PB2067. [STL, editables y guía de impresión](hardware/3d/README.md#brazalete-toki-para-arduino-uno-y-xiaomi-pb2067).

## Dónde está cada cosa

| Carpeta | Contenido |
|---|---|
| [software/](software/) | SO de Emmy, demo de eye-tracking con iPhone, monitor muscular y puente WhatsApp |
| [firmware/](firmware/) | Programa del Arduino UNO |
| [hardware/](hardware/) | Conexiones, esquemas, Raspberry e impresión 3D |
| [docs/](docs/) | Guías, planes, investigación y requisitos del concurso |
| [tests/](tests/) | Pruebas del monitor local |

## Estado demostrado

| Capacidad | Estado y límite |
|---|---|
| Firmware A0 para UNO/ATmega328P | Compilado y cargado en el UNO del equipo |
| USB → monitor local | Se recibieron muestras reales; visualización en Chrome |
| Respuesta muscular | Se observaron variaciones; falta separar contracción de artefactos y confirmar ENV |
| SO accesible | MVP heredado de `woki-ux-prototipo`; no validado clínicamente |
| Mirada con iPhone (Face ID) | Calibración de 13+5 puntos; en el SO, 2,9° de error medio y 5,3° en el peor caso (24 calibraciones del equipo, puntos no vistos); sin movimiento de cabeza |
| EMG → atajos en el SO | Integrado con calibración; rueda y SOS simulados probados sin hardware. Falta validar los gestos sostenidos sobre el cuerpo. |
| WhatsApp | Código heredado; no probado de extremo a extremo en esta rama |
| Carcasas y soportes 3D | Tres STL disponibles. Falta validar el encaje y la estabilidad con el hardware real. |
| BLE, Ray-Ban Meta, Alexa y actuadores | Entrada BLE dual disponible; falta probar ambos sensores reales juntos. El resto queda fuera del prototipo. |

## Esquemas y documentación

- [Diferencia entre las placas](hardware/schematics/myoware-componentes.png)
- [Conexión al UNO](hardware/schematics/myoware-conexion-uno.png)
- [Orientación en bíceps](hardware/schematics/myoware-biceps.png)
- [Limitaciones de las ilustraciones](hardware/schematics/README.md)
- [Inventario](hardware/README.md) · [Prueba y evidencia](docs/validation/MYOWARE.md) · [Índice documental](docs/README.md)

Las imágenes son ilustraciones generadas, no planos eléctricos ni fotos del montaje real. Identificar cada conector por su etiqueta física.

## Entrega del concurso

Se conservan en la raíz los archivos esperados por el organizador:

- [`platanus-hack-project.jsonc`](platanus-hack-project.jsonc): mismas claves y comentarios; nombre provisional Toki. URL de despliegue pendiente.
- [`project-description.md`](project-description.md): descripción del alcance actual.
- [`project-logo.png`](project-logo.png): original conservado, pendiente de identidad Toki.

El organizador solicita un logo PNG de **1000 × 1000 y máximo 500 KB**, y recomienda desplegar mediante un repositorio personal espejo. No se creó un espejo ni se modificaron remotos de despliegue. [Requisitos completos y plantilla original](docs/competition/README.md).

## Equipo

- Juan Ortega ([@juanortega10](https://github.com/juanortega10))
- Jhomar Astuyauri ([@asther0](https://github.com/asther0))
- Nicolas Vargas ([@MrUprizing](https://github.com/MrUprizing))
- Manuel Torres ([@AmunM9](https://github.com/AmunM9))
- Emmy Daniela Arias Pardo ([@estparcae](https://github.com/estparcae))
