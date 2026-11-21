# Apps de Toki

Desde la raíz de `toki`:

```sh
npm ci --prefix software/apps-bridge
node software/apps-bridge/server.mjs
```

Abre [Servicios](http://127.0.0.1:8790/?start=apps). El lobby usa el controlador compartido de mirada/nariz y contracción muscular. El servidor existente en el puerto 8000 también puede conectar con este servicio.

Requiere Node 22+, `spogo` en PATH y Spotify.app para el control local en macOS. La preparación comprueba esos requisitos. No instala programas desde solicitudes del navegador. BioBioChile solo requiere Internet; usa el RSS del medio y no necesita cuenta.

## Juegos

Desde [Juegos](http://127.0.0.1:8790/?start=games&acceso=elegir), elige Nariz, Mirada o Mouse. La selección con cámara abre la partida en una ventana de Chrome controlada por Toki. Permite la cámara si Chrome la solicita. La calibración se conserva al pasar del catálogo a la partida. Consulta los [detalles de la sesión de juegos](../browser-bridge/README.md).

## Spotify

Pulsa Adaptar Spotify. La interfaz y el conector se comprueban realmente y la solicitud pasa a Conectar Spotify. Para buscar, inicia sesión en Spotify Web en tu navegador y pulsa Usar mi sesión de Spotify. Esta acción importa solamente la sesión Spotify a un perfil `toki` de spogo; macOS puede pedir acceso al llavero. No se muestran cookies ni tokens en la interfaz ni se envían al generador. Desconectar elimina la copia de sesión de ese perfil.

El control local usa `spogo --engine applescript`; búsqueda usa el motor `connect`. La reproducción se comprueba consultando el estado posterior. Buscar, reproducir y pausar deben tener evidencia antes de habilitar; también se requiere la declaración de revisión del equipo y de prueba con la persona. Los controles locales pueden explorarse antes de conectar búsqueda, sin anunciar la adaptación como habilitada.

## Pedir otra app

El paciente elige un preset, que aporta nombre y tareas sin formulario. El servicio consulta repositorios públicos en GitHub; los candidatos solo aparecen en la configuración del equipo. La API conserva la posibilidad de solicitudes personalizadas asistidas. Los resultados son pistas, no conectores validados. La solicitud queda pendiente del equipo para trabajar con `$adapt-app`. Spotify y BioBioChile ya tienen adaptadores incluidos; el descubrimiento se usa cuando no existe uno registrado. Para fuentes RSS asistidas, el generador ya ejecuta adapt-app con Codex y produce un paquete declarativo; no descarga código de los resultados de GitHub. La skill está instalada en el entorno del agente en `~/.codex/skills/adapt-app`.

Solicitudes y avance se guardan en `~/Library/Application Support/Toki/apps/requests.json`. No se guardan allí credenciales ni búsquedas musicales. El servidor se limita a loopback, valida host/origen y exige un token temporal para la API. Solo ejecuta acciones explícitas con argumentos separados; no recibe comandos arbitrarios.

`TOKI_APPS_PORT` permite elegir puerto (las páginas en 8000 esperan 8790). `TOKI_APPS_STATE_DIR` permite aislar el registro para pruebas. Tras un reinicio, una preparación incompleta requiere reintento. Cancelar impide que una investigación tardía sobrescriba la cancelación. Los reintentos son explícitos, sin bucles de consumo.

Pruebas del servicio:

```sh
node --test tests/apps/*.test.mjs
```

Las pruebas utilizan un ejecutor Spotify simulado y no demuestran autenticación, reproducción real ni uso por pacientes.

Para la prueba de navegador, inicia `node tests/apps/browser-fixture.mjs` y ejecuta `playwright-cli -s=toki-apps-test run-code --filename=tests/browser/apps-check.cjs` con una sesión Playwright abierta. Después ejecuta `playwright-cli -s=toki-apps-test run-code --filename=tests/browser/apps-access-check.cjs` para pausa, revisión, paginación y navegación durante peticiones lentas. El fixture usa exclusivamente el puerto 8791 y un directorio temporal; no escribe resultados simulados en el registro de la demo. Cierra el fixture al terminar.

Verificación del primer piloto: estado, pausa y reanudación reales comprobados con Spotify.app y `spogo` 0.13.2. La búsqueda real queda pendiente de conexión web. Las pruebas actuales del shell usan mouse para apuntar y Espacio para simular contracción, con retroceso por doble pulso. No validan comodidad con cámara, sensor físico o pacientes.


### Recorrido del paciente y configuración

La entrada `/?start=apps` muestra hasta seis servicios por página. La paginación aparece a partir del séptimo. WhatsApp se encuentra en Mensajes. En Ajustes se puede cambiar la selección por permanencia. De forma inicial hay un segundo para explorar y dos para completar la selección. Solicitar una adaptación no exige escribir. Spotify abre el reproductor directamente y prepara el control local al entrar. Cada cinco segundos actualiza la canción, su portada y el estado desde Spotify.app mientras el reproductor está visible. Un único botón alterna entre reproducir y pausar. Siguiente canción usa la cola actual. Elegir música aparece al conectar la cuenta para buscar. El enlace directo es `/?start=spotify`. BioBioChile permite elegir titulares y leer extractos RSS por páginas, sin cuenta. YouTube, Rappi y Mercado Libre siguen pendientes de integración.

La configuración del equipo está en `/?start=apps&appsAdmin=1`: elegir Spotify y abrir su preparación para conectar la cuenta; después probar funciones y registrar la revisión. Este parámetro solo separa la presentación. No concede privilegios distintos ni sustituye una prueba con la persona.

El shell UI/UX maneja mirada/nariz, confirmación muscular, pausa e Inicio. Apps usa botones nativos, no impone dwell. El laboratorio `prototype-motion.html` es una superficie anterior; el recorrido principal y las comprobaciones actuales usan el shell del lobby.


### Arquitectura y segunda adaptación

[Contrato de adaptadores](ADAPTERS.md): manifiestos versionados, registro de implementaciones incluidas, preparación común, rutas `GET /api/adapters` y `POST /api/apps/:id/actions/:action`, evidencia y aceptación por app. Las rutas Spotify anteriores siguen disponibles.

BioBioChile: Servicios → Leer noticias → Preparar BioBioChile → Probar app → elegir titular → Continuar para leer el extracto → Volver. Se muestran noticias del RSS real, dos por página y texto en segmentos de hasta 180 caracteres. La prueba técnica deja el registro en `needs_test`; no marca una prueba personal como realizada.

Prueba adicional de navegador: `playwright-cli -s=toki-apps-test run-code --filename=tests/browser/news-check.cjs` contra el fixture 8791. Cubre lectura, paginación, retroceso, señal muscular simulada, fallo de red/reintento y aceptación separada. Datos sintéticos aislados del registro real.


### Generar e instalar un lector nuevo

En el computador del equipo: Codex CLI en PATH, `codex login` realizado y la skill `~/.codex/skills/adapt-app/SKILL.md` instalada. El servicio Apps debe estar corriendo. Preparación asistida, fuera del recorrido del paciente:

```sh
node software/apps-bridge/prepare-reader.mjs \
  --name Cooperativa \
  --feed https://www.cooperativa.cl/noticias/site/tax/port/all/rss_3___1.xml
```

La solicitud pasa por fuente comprobada → generación → prueba de listar/leer → instalación. El generador se ejecuta con herramientas desactivadas, entorno temporal, sandbox de solo lectura, salida JSON acotada y límite de tres minutos; reutiliza el inicio de sesión local de Codex. Procesa nombre, tareas, URL y metadata de la fuente; no recibe sesiones Spotify ni artículos completos. Solo se genera un paquete a la vez. Cancelar desde Servicios detiene el proceso; reintentar es explícito.

El resultado es **configuración validada para el lector compartido**, no JavaScript generado. El instalador fija fuente, dominio, acciones e interfaz; rechaza capacidades distintas de listar/leer. La fuente debe ser RSS público HTTPS sin redirecciones, con enlaces al mismo dominio. Se comprueba DNS público y se fija la dirección de conexión. Si hacen falta artículos completos, reproducción, cuentas o escritura en otro servicio, la solicitud queda pendiente de otra adaptación.

Los paquetes se guardan por SHA-256 en `~/Library/Application Support/Toki/apps/packages/`, con índice activo atómico, versión, origen del generador y evidencia. Se validan al arrancar. El catálogo incorpora las apps instaladas y las solicitudes de lectores automáticamente, con hasta seis tarjetas por página. La fuente aparece con su nombre en titulares y extractos.

Cooperativa fue generado con Codex y comprobado contra su fuente real el 21 de noviembre de 2026; queda `needs_test`. Instalar no acredita prueba personal. Aún no hay actualización ni rollback expuestos, instalación de CLIs externos, ni generación universal para WhatsApp, YouTube, Rappi o Mercado Libre.

Para verificar el catálogo dinámico: `playwright-cli -s=toki-apps-test run-code --filename=tests/browser/generated-reader-check.cjs` después de los demás recorridos contra el fixture 8791. Usa un generador sintético y un directorio temporal; no ejecuta Codex ni marca la revisión real.
