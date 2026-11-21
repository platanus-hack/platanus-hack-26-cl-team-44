# Toki · Interfaz accesible con señales musculares

**Nombre provisional · Track: 🔧 Hardware · team-44 · Platanus Hack 26: Santiago ft. Buk**

![Hardware](https://img.shields.io/badge/Hardware-MyoWare_2_%2B_UNO-174E42?style=flat-square)
![Firmware](https://img.shields.io/badge/Firmware-Arduino_C%2B%2B-174E42?style=flat-square)
![Monitor](https://img.shields.io/badge/Monitor-Python_3_%2B_HTML-174E42?style=flat-square)
![MVP](https://img.shields.io/badge/MVP-Web_%2B_TypeScript-174E42?style=flat-square)
![3D](https://img.shields.io/badge/Impresión_3D-Por_diseñar-9B6B22?style=flat-square)
![Estado](https://img.shields.io/badge/Estado-Prototipo_en_validación-9B6B22?style=flat-square)

> Explorar cómo una acción muscular voluntaria puede convertirse en una entrada para comunicarse y controlar una interfaz.

Toki reúne un **MVP de SO accesible** y un **banco de pruebas EMG**. El MVP permite explorar interacción por mouse, cabeza y mirada; el banco lee un sensor MyoWare con un Arduino UNO y muestra sus muestras en el navegador. **Todavía no están integrados.** El alcance y nombre final del producto siguen abiertos; no es un dispositivo médico ni una alarma de emergencia validada.

## Probarlo

| Experiencia | Dirección | Requisitos |
|---|---|---|
| MVP del SO | http://localhost:8000/woki-os.html | Python 3; mouse para la demo, cámara para explorar seguimiento |
| Monitor muscular | http://127.0.0.1:8766 | macOS/Linux, Python 3.10+, UNO con firmware, sensor y Link Shield |
| Despliegue público | Pendiente | Completar `deploy-url` cuando exista una URL real |

**MVP sin hardware**, desde la raíz:

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory prototipo
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

## Estructura del proyecto

| Ruta | Responsabilidad |
|---|---|
| [`firmware/`](firmware/) | Código que se carga a los microcontroladores |
| [`software/`](software/) | Monitor local e índice del SO |
| [`hardware/`](hardware/) | Inventario, conexiones, esquemas y fotos reales |
| [`mechanical/`](mechanical/) | CAD editable, STL/3MF y registro de impresiones |
| [`docs/`](docs/) | Arquitectura, concurso y pruebas |
| [`tests/`](tests/) | Comprobaciones reproducibles del monitor |
| [`scripts/`](scripts/) | Lugar para futuras herramientas de instalación y mantenimiento |
| [`data/`](data/) | Política de datos; las capturas personales no se versionan |
| [`prototipo/`](prototipo/) | MVP heredado del SO, conservado en su ruta original |
| [`woki-bridge/`](woki-bridge/) | Puente WhatsApp heredado; conserva rutas y variables de entorno |
| [`raspberry/`](raspberry/) | Investigación y montaje del equipo dedicado |

La documentación de investigación de Emmy sigue en sus rutas originales. [Mapa y criterio de organización](docs/architecture/README.md).

## Estado demostrado

| Capacidad | Estado y límite |
|---|---|
| Firmware A0 para UNO/ATmega328P | Compilado y cargado en el UNO del equipo |
| USB → monitor local | Se recibieron muestras reales; visualización en Chrome |
| Respuesta muscular | Se observaron variaciones; falta separar contracción de artefactos y confirmar ENV |
| SO accesible | MVP heredado de `woki-ux-prototipo`; no validado clínicamente |
| EMG → clic en el SO | Pendiente de integración y calibración |
| WhatsApp | Código heredado; no probado de extremo a extremo en esta rama |
| Carcasas y soportes 3D | Estructura preparada; sin modelos imprimibles todavía |
| BLE, Ray-Ban Meta, Alexa y actuadores | Fuera de la prueba cableada actual |

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

Organización del README inspirada en [team-28 Bogotá](https://github.com/platanus-hack/platanus-hack-26-co-team-28): badges, mapa de servicios, estado demostrado y documentación navegable.
