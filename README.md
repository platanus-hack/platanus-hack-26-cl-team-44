# Toki · Interfaz accesible con señales musculares

**Nombre provisional · Track: 🔧 Hardware · team-44 · Platanus Hack 26: Santiago ft. Buk**

![Hardware](https://img.shields.io/badge/Hardware-MyoWare_2_%2B_UNO-174E42?style=flat-square)
![Firmware](https://img.shields.io/badge/Firmware-Arduino_C%2B%2B-174E42?style=flat-square)
![Monitor](https://img.shields.io/badge/Monitor-Python_3_%2B_HTML-174E42?style=flat-square)
![MVP](https://img.shields.io/badge/MVP-Web_%2B_TypeScript-174E42?style=flat-square)
![3D](https://img.shields.io/badge/Impresión_3D-3_STL-174E42?style=flat-square)
![Estado](https://img.shields.io/badge/Estado-Prototipo_en_validación-9B6B22?style=flat-square)

> Explorar cómo una acción muscular voluntaria puede convertirse en una entrada para comunicarse y controlar una interfaz.

Toki reúne un **MVP de SO accesible** y un **banco de pruebas EMG**. Puedes explorar la interacción por mouse, cabeza, mirada y gestos musculares calibrados. La ceja permite elegir el control enfocado, incluido **Volver**. Toki no es un dispositivo médico ni una alarma de emergencia validada.

## Probarlo

**Toki OS** abre la pantalla con Hablar, Mensajes, Compañía, Servicios y Juegos. Desde la raíz del repositorio, con Node 22 o posterior, ejecuta:

```bash
npm ci --prefix software/apps-bridge
npm start --prefix software/apps-bridge
```

Abre [Toki OS en tu equipo](http://127.0.0.1:8790/). En el primer inicio elige Mirada, Nariz o Mouse. Para desarrollar la pantalla principal, edita [software/toki-os/index.html](software/toki-os/index.html).

### Herramientas de prueba

| Experiencia | Dirección | Requisitos |
|---|---|---|
| Banco de gestos MyoWare y mirada con iPhone | [Guía de pruebas](software/toki-os/README.md#banco-de-pruebas) | Mouse para simular gestos, sensores o iPhone para probar la entrada física |
| Monitor muscular | http://127.0.0.1:8766 | macOS/Linux, Python 3.10+; [UNO por USB o dos MyoWare por BLE](software/myoware-monitor/README.md) |
| Demo de eye-tracking | http://localhost:5173 | Node 18+; `node software/eye-tracking/web/serve.mjs` |
| Despliegue público | Pendiente | Completar `deploy-url` cuando exista una URL real |

**Monitor con hardware**, después de seguir la [guía de conexión](docs/validation/MYOWARE.md):

```bash
arduino-cli board list
# Sustituir el puerto por el de tu UNO:
python3 software/myoware-monitor/server.py --serial-port /dev/cu.usbserial-1130
```

El programa no carga firmware automáticamente. [Compilación, carga y diagnóstico](software/myoware-monitor/README.md).

## Adaptación de apps

La skill [`adapt-app`](.agents/skills/adapt-app/SKILL.md) describe cómo investigar una conexión, preparar controles accesibles y comprobar las funciones reales de una app. Está incluida en el repositorio; el generador usa esta copia versionada.

La generación automática disponible crea lectores de noticias RSS. Para ejecutarla, el computador del equipo necesita Codex CLI y una sesión iniciada; la prueba con la persona sigue pendiente hasta realizarla. [Preparar una adaptación](software/apps-bridge/README.md#generar-e-instalar-un-lector-nuevo) · [Contrato y límites](software/apps-bridge/ADAPTERS.md) · [Mantener la skill](.agents/skills/README.md).

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
| [software/](software/) | Toki OS, demo de eye-tracking con iPhone, monitor muscular y puente WhatsApp |
| [firmware/](firmware/) | Programa del Arduino UNO |
| [hardware/](hardware/) | Conexiones, esquemas, Raspberry e impresión 3D |
| [docs/](docs/) | Guías, planes, investigación y requisitos del concurso |
| [tests/](tests/) | Pruebas del monitor local |

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
