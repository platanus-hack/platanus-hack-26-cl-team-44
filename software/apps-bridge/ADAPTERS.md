# Adaptaciones de Myo

El registro contiene código revisado incluido con Myo y paquetes declarativos validados que usan el lector RSS compartido. El servidor no carga módulos elegidos por una petición web ni ejecuta resultados de GitHub.

## Contrato v1

Cada fábrica devuelve `manifest`, `prepare(context)`, `execute(action, payload, context)` y opcionalmente `errorMessage(error)`.

- `manifest`: `schemaVersion`, `id`, `name`, `aliases`, `version`, `interface: {kind, entry}`, `auth`, `dependencies`, `source`, `actions` y `requiredEvidence`.
- Una acción declara `id`, `mutates` y `requiresAccount`. El servidor rechaza acciones no declaradas y solicitudes cuyo trabajo pertenece a otra app.
- `prepare({signal, report})`: comprueba requisitos y conexión; devuelve el estado real de preparación. `report` publica etapas comprobadas. No marca `ready`.
- `execute(action, payload, {signal, evidence, connected, disconnected})`: valida sus argumentos, ejecuta una capacidad concreta y devuelve datos estructurados. `evidence` registra éxito comprobado, no una orden simplemente enviada.
- `errorMessage` evita filtrar respuestas sensibles del conector. Los errores intencionales con `status` deben incluir exclusivamente mensajes aptos para la interfaz.

La preparación guarda `adapterVersion`. Una versión distinta bloquea la ejecución hasta volver a preparar. Cancelar/reintentar incrementa una generación: resultados tardíos no pueden reactivar el trabajo ni sumar evidencia a su nueva ejecución. Las acciones que modifican el servicio se serializan por adaptador; las lecturas pueden coexistir.

## API común

Todas requieren el token temporal del bridge, salvo obtener la sesión:

- `GET /api/adapters`: manifiestos de las adaptaciones incluidas e instaladas (`generated:true`).
- `POST /api/jobs`: `{name, tasks, sourceUrl?}`. Los nombres registrados usan su adaptador. Una fuente RSS asistida activa el generador; sin fuente se conserva descubrimiento GitHub y espera del equipo. La API no es un formulario para pacientes.
- `POST /api/apps/:id/actions/:action`: `{jobId, ...argumentos}`.
- `POST /api/jobs/:jobId/review`: requiere evidencia declarada por ese adaptador, `functional:true` y `personal:true`.
- Cancelación/reintento y persistencia son compartidos. `/api/spotify/:action` se conserva para clientes anteriores; los componentes actuales usan la API común.

La revisión personal no debe marcarse mediante una prueba automatizada contra datos reales. Los fixtures prueban esa transición en un registro temporal separado.

## Adaptaciones incluidas

| Adaptación | Conexión | Tareas | Cuenta | Evidencia para revisar |
|---|---|---|---|---|
| Spotify 1.0.0 | spogo, Spotify.app/macOS | Estado, reproducción/pausa, siguiente; búsqueda de catálogo | Sesión web para buscar | search, play, pause |
| YouTube 1.0.0 | IFrame Player API oficial y oEmbed | Elegir videos de Chile Travel, reproducir y pausar | Ninguna para la selección pública | list, play, pause |
| BioBioChile 1.0.0 | RSS publicado por el medio | Listar titulares, seleccionar y leer extractos paginados | Ninguna | list, read |
| Rappi Chile 0.1.0 (parcial) | Operaciones auditadas de Crafter Station + sesión invitada oficial | Categorías, restaurantes, productos, opciones; conexión local y carrito implementados | Cuenta y dirección chilena para carrito | search, products, select, cart, quote, order, tracking; las últimas etapas siguen pendientes |

Spotify conserva portada y estado real al abrir, actualización sin sustituir el control enfocado, reproducción local y vista de configuración separada.

BioBioChile usa `https://www.biobiochile.cl/static/feed-rss`, enlazado en el pie de la página oficial. El enlace alternativo Feedburner estaba atrasado durante la comprobación y no se usa. La interfaz muestra fecha de fuente y señala fuentes con más de 48 horas. No presenta extractos como artículos completos ni redacta noticias nuevas.

Miniaturas: el lector RSS toma la imagen de `enclosure` (tipo `image/*`), `media:content`, `media:thumbnail` o la primera `<img>` del contenido, sin emojis. El RSS de BioBioChile no trae ninguna de ellas; solo hay alguna `<img>` suelta en `content:encoded`. Por eso el adaptador hace en paralelo una sola petición a la lista JSON pública del medio (`https://www.biobiochile.cl/lista/api/get-todo`, límite de 3 MB y 6 s, sin redirecciones). Asocia cada noticia por URL con su foto destacada (`post_image.thumbnails.medium`, 750×400) en `media.biobiochile.cl`. No pide el HTML de cada nota. Si esa petición falla, las noticias se muestran igual, sin imagen. Toda URL de imagen se valida en el servidor: solo `https`, sin credenciales, puertos ni IP. En BioBioChile se acepta únicamente `media.biobiochile.cl`. La interfaz vuelve a comprobar `https` y escapa la URL. La tarjeta pone el titular a la izquierda y la miniatura 16:9 a la derecha. Si la imagen no carga, la tarjeta queda solo con texto.

RSS se limita a 2 MB, tiempo de espera de 12 segundos, sin redirecciones, DTD ni entidades definidas por el documento. Se descartan enlaces fuera de noticias del dominio oficial. Se sirve texto escapado, nunca HTML del feed. Caché de cinco minutos en memoria; un fallo al actualizar muestra recuperación, sin inventar contenido. La lectura conserva el artículo elegido aunque cambie el feed mientras se recorre la lista.

## Añadir otra app

1. Comprobar una conexión real a las tareas solicitadas (CLI/API/SDK). Si falta contrato o evidencia, seguir la [rama de investigación de adapt-app](../../.agents/skills/adapt-app/SKILL.md#investigar-un-contrato-incompleto), que usa `surface-recon`; REA queda como herramienta opcional.
2. Crear una fábrica en `adapters/` y su manifiesto, con acciones y validación explícitas.
3. Añadirla al registro de `createAppsServer`; no añadir rutas específicas de HTTP ni otra lógica de revisión.
4. Reutilizar una interfaz existente (`music`, `news`, `video` o `food`) si encaja, o implementar una nueva con botones nativos, pocas opciones y paginación. El servidor comprueba que el tipo de interfaz esté soportado.
5. Añadir el preset del catálogo si corresponde. Probar conexión, errores, cancelación, requisitos de cuenta y recorrido completo con el control acordado.
6. Preparar, registrar evidencia funcional y realizar la prueba personal antes de marcarla lista.

Una prueba con un tercer adaptador sintético demuestra que registro, despacho y revisión no requieren rutas especiales por app. Para lectura pública, `generator/` añade generación declarativa e instalación sin una fábrica nueva por medio. Las demás capacidades siguen el proceso de desarrollo anterior.

## Límites pendientes

- Para lectores con `sourceUrl`, preparar invoca Codex con la skill `adapt-app`, valida una receta RSS, comprueba funciones e instala. No genera interfaces arbitrarias: selecciona la interfaz de noticias compartida.
- Hay instalación local de paquetes RSS por contenido y recarga tras reinicio. No hay instalación de código externo, actualizaciones ni rollback expuestos; los artefactos previos no se borran.
- REA no está integrado ni fue necesario para estas dos conexiones.
- Autenticación asistida y prueba física/personal siguen pendientes donde corresponda. BioBioChile puede usarse como prueba sin cuenta; Spotify conserva su búsqueda pendiente de sesión web.

## Evidencia de esta entrega (21 noviembre 2026)

- 16 pruebas de servicio pasan: contrato común, tercer adaptador sintético, revisión específica por capacidades, aislamiento de apps, cancelación y resultados tardíos, sanitización de RSS, red y regresiones Spotify.
- Cuatro recorridos de navegador contra fixture: `apps-check.cjs`, `apps-access-check.cjs`, `news-check.cjs`, `generated-reader-check.cjs`. Incluyen contracción simulada, doble retroceso, pausa, errores/reintento, paginación y tamaños 1280×800, 1024×768 y 390×844.
- En el servidor real, BioBioChile devolvió 20 titulares, fecha de fuente del mismo día y extractos. Listar y abrir un extracto registraron `list` y `read`; la solicitud permanece `needs_test`.
- El endpoint genérico de estado Spotify se comprobó contra Spotify.app real. No se cambió la reproducción para esta comprobación.
- La búsqueda Spotify sigue pendiente de sesión web; la comodidad con cámara y sensor físico requiere prueba personal.


## Generación de lectores

`generator/codex.mjs` lee [la skill versionada](../../.agents/skills/adapt-app/SKILL.md) mediante una URL relativa a su propio módulo y compila una receta limitada bajo ese contrato. No busca una copia en la carpeta personal. `skillSha256` identifica el contenido exacto empleado al generar cada paquete. `generator/packages.mjs` verifica que nombre, fuente, capacidades y campos coincidan con el pedido; tareas no soportadas no se instalan. El servidor fija ID derivado de la URL, versión y dominio de artículos. El paquete contiene solo datos, metadata y evidencia, nunca módulos ejecutables ni cuerpos de noticias. El instalador publica el índice atómicamente después de list/read reales; al reiniciar comprueba esquema y digest antes de registrar.

`generator/public-fetch.mjs` restringe HTTPS público, sin credenciales, puertos alternativos ni redirecciones; comprueba resolución DNS y fija la IP para la conexión TLS. Se mantienen límites RSS, extracción de texto y paginación de la implementación BioBio, ahora en `adapters/rss-reader.mjs`. Los fixtures inyectan transporte y generador sin acceder a Codex ni Internet.

El servidor sigue siendo local de confianza: `appsAdmin` separa presentación, no privilegios. Generar requiere una configuración asistida de fuente. Los paquetes no son un formato de importación libre ni una tienda de código descargado.


## Video: YouTube

`adapters/youtube.mjs` registra la categoría `video`. Verifica la selección pública mediante oEmbed y ofrece `list`, `select` y `observe` por las rutas comunes. `select` devuelve un ticket ligado al trabajo, video y generación; no registra reproducción. `observe` acepta únicamente estados 1/2 del video seleccionado y exige reproducción previa para acreditar pausa. Cancelar/reintentar o elegir otro video invalida la observación anterior.

`toki-video.js` usa la [API oficial de reproductor](https://developers.google.com/youtube/iframe_api_reference), con origen explícito, sin autoplay y controles de Myo fuera del iframe. La evidencia procede de eventos confirmados por el reproductor en el cliente local de confianza; no es una prueba criptográfica ni una consulta independiente del servidor a YouTube. El navegador local ya puede declarar la revisión funcional/personal. Los callbacks tardíos no cambian otras pantallas. La sincronización de solicitudes conserva el iframe; salir destruye el reproductor.

El catálogo ofrece seis videos públicos de Chile Travel con miniaturas de YouTube. Sin búsqueda general, cuenta personal, suscripciones ni generación automática de adaptadores de video. Un video puede dejar de permitir reproducción integrada; la interfaz muestra error, reintento y regreso. La prueba real de play/pause funciona; la habilitación personal sigue pendiente.

`tests/apps/youtube.test.mjs` comprueba aislamiento de observaciones, generación, selección, orden play/pause y errores. `tests/browser/youtube-check.cjs` usa un doble explícito de la API de YouTube sobre el fixture 8791 para comprobar tamaños, estabilidad, recuperación y salida. No escribe evidencia simulada en el registro real.

## Comida: Rappi Chile (parcial)

`adapters/rappi.mjs` está incluido en el registro. El transporte Node de `connectors/rappi-client.mjs` implementa las operaciones verificadas de `crafter-station/rappi-cli@5c4e5b0` y el flujo de invitado observado en la web chilena. No instala código de GitHub ni levanta el servidor HTTP del CLI. Solo contacta `services.rappi.cl`; limita respuesta, tiempo, acciones y errores públicos.

El paciente elige cuatro categorías, tres restaurantes/productos por página y dos opciones por página. No se exige escribir. Las búsquedas sin cuenta usan la ubicación predeterminada pública de Rappi Chile en Santiago, identificada en pantalla; no es una dirección de entrega. La selección procede de productos devueltos por la búsqueda, **no del menú completo**. Las opciones se consultan con una sesión de invitado mantenida solo en memoria. El shell compartido conserva retroceso, descanso y confirmación muscular.

Para conectar una cuenta desde la configuración asistida: abrir `/?start=apps&appsAdmin=1`, elegir Rappi y «Conectar Rappi Chile». Se abre Chrome oficial; la persona introduce sus credenciales allí. «Comprobar sesión» valida la cuenta y lee la dirección activa chilena. Alternativamente:

```sh
node software/apps-bridge/connectors/rappi-login.mjs
```

El login valida origen exacto y respuesta de usuario antes de guardar `rappi-session.json` con permisos `0600`, bajo el directorio de estado (`TOKI_APPS_STATE_DIR` para el comando). El token nunca se devuelve al frontend ni se imprime. La ventana espera hasta diez minutos. Desconectar elimina el archivo local, no revoca otras sesiones del servicio.

Carrito y recálculo están implementados y probados con fixtures; **falta validarlos con una cuenta real chilena**. Añadir requiere una selección reciente del mismo trabajo/generación/sesión, opciones válidas, dirección activa sin cambios y carrito previo vacío. La primera versión permite una unidad; no reemplaza carritos existentes. Un resultado incierto exige consultar el carrito; no se reenvía automáticamente. Los importes del carrito no se presentan como total final autorizado.

No existe acción de crear pedido ni cobro: el checkout del CLI tiene un fallo abierto reportado y el flujo chileno actual debe verificarse con cuenta. La evidencia exigida incluye pedido, pago/cotización y seguimiento pendientes, por lo que esta versión no puede marcarse lista para comprar. No hay revisión personal acreditada. Investigación, comandos y resultados: [Rappi Chile](../../docs/research/rappi-chile/README.md).
