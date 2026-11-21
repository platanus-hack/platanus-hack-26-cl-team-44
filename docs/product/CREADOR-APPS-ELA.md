# Creador de apps accesibles de Toki

## Decisión explícita de Jhomar

La generación bajo demanda es parte central del producto. El paciente o su ayudante pide una aplicación (por ejemplo Spotify) mediante una acción como «Instalar» o «Adaptar». Toki investiga primero conexiones existentes, usa REA cuando aporta evidencia y produce una UI/UX pensada para su método de interacción. No se limita a habilitar un catálogo de adaptaciones previamente hechas.

## Resultado que debe producir

Una adaptación utilizable y conectada al servicio real, con acceso desde el inicio de Toki. Para Spotify, por ejemplo: encontrar música, elegir una lista y controlar la reproducción. Una imagen, un iframe o un clon de pantallas sin ejecución real no cumplen este resultado.

## Flujo del producto (primer piloto implementado parcialmente)

1. Solicitud: la persona elige una app conocida por actividad; nombre y tareas se completan desde un preset. Las solicitudes nuevas se configuran de forma asistida, sin exigir un formulario al paciente.
2. Investigación y selección: buscar primero integraciones existentes (CLI, SDK, conector o API documentada) y comprobar que cubren las tareas solicitadas. Evaluar documentación, código, licencia, autenticación, entorno compatible y comportamiento real. REA es opcional y aporta evidencia sobre capacidades o flujos que no estén resueltos/documentados. Una coincidencia de búsqueda no demuestra compatibilidad.
3. Diseño: transformar tareas en opciones grandes y estables, reducir pasos y precisión requerida, ofrecer pausa, retroceso y confirmaciones comprensibles. Parametrizar mirada, nariz, permanencia y señal muscular según el usuario.
4. Conexión: implementar acciones y lectura del servicio; pedir al usuario iniciar sesión cuando corresponda, sin fingir autenticación o resultados.
5. Prueba: completar tareas reales y comprobar estados de error, pérdida de control, cancelación y recuperación. Probar con el método de entrada de la persona.
6. Instalación: publicar la adaptación dentro de su Toki, identificando funciones disponibles y pendientes; conservar una versión anterior que permita revertir.

Una solicitud puede acabar en «necesita conexión», «necesita revisión» o «no compatible todavía». La UI no debe anunciar «instalado» mientras falten funciones prometidas.

## Qué está y qué falta (actualizado 21 noviembre 2026)

Hay un registro común de adaptadores versionados: Spotify, BioBioChile y YouTube incluidos, Rappi Chile parcial, más lectores RSS generados e instalados como paquetes declarativos. Comparten preparación, rutas de acciones, persistencia, evidencia y revisión. Las interfaces siguen siendo componentes construidos por el equipo; la metadata del adaptador determina cuál abrir.

Spotify conserva estado, portada, reproducción/pausa y siguiente canción locales mediante spogo. La búsqueda requiere conectar una sesión web. BioBioChile lista titulares reales y permite elegir y leer extractos RSS por páginas sin cuenta; conserva fecha y procedencia, y no presenta extractos como artículos completos.

Las solicitudes con una fuente RSS pública configurada por el equipo ejecutan adapt-app mediante Codex, validan una receta, comprueban listar/leer e instalan un paquete versionado local. Cooperativa ya completó ese recorrido real y espera prueba personal. El catálogo incorpora esos lectores sin añadir una pantalla por medio. YouTube cuenta además con un adaptador incluido de video: selección pública de Chile Travel, reproducción y pausa con la API oficial; la generación automática sigue limitada a lectores. Las demás solicitudes buscan candidatos en GitHub y esperan adaptación del equipo. No hay generación universal, instalación de código externo ni actualización/rollback expuestos. REA no está integrado y no fue necesario para estas conexiones.

Rappi Chile ya ofrece exploración accesible de categorías, restaurantes, productos y opciones reales. La conexión local y el carrito están implementados, pendientes de validación con cuenta chilena; compra y pago siguen sin habilitar. `surface-recon` es el procedimiento de investigación previsto para comprobar ese contrato pendiente.

La habilitación requiere evidencia declarada por cada adaptador y prueba/revisión con la persona. Las pruebas sintéticas y técnicas no completan esa revisión personal. Contrato, extensibilidad, fuentes y límites: `software/apps-bridge/ADAPTERS.md`; arranque: `software/apps-bridge/README.md`.

## Skill y generador

[`adapt-app`](../../.agents/skills/adapt-app/SKILL.md) contiene las instrucciones para investigar conexiones, construir una interfaz accesible y comprobar tareas. La skill está versionada en este repositorio. El generador de RSS lee esa misma copia; no necesita una skill instalada en la carpeta personal del desarrollador. Sigue requiriendo Codex CLI y una sesión local configurada.

Cuando una capacidad no está verificada, `adapt-app` usa `surface-recon` para investigar el contrato y sus resultados. El informe separa lo observado de lo pendiente y vuelve al proceso de implementación accesible. Es una instrucción para el agente de desarrollo, no una integración automática nueva del bridge; el generador RSS sin herramientas no ejecuta esa investigación. REA conserva su papel opcional.

La skill guía al agente. El código de `software/apps-bridge/generator/` valida e instala los paquetes. La generación automática sigue limitada a lectores RSS; versionar las instrucciones no añade generación para otras categorías ni completa la prueba personal. [Uso y mantenimiento de las skills](../../.agents/skills/README.md).

## Decisiones por resolver

- Criterios de comodidad y recuperación que se comprobarán con la persona.
- CLI y mecanismo de conexión concretos, sujetos a prueba con Spotify.
- Límites de tiempo/coste, política concreta de reintentos y despliegue entre equipos.
- Nombre de la acción: recomendar «Adaptar app» antes de «Instalar», porque describe el trabajo que está comenzando.

## Decisiones aceptadas en la entrevista del creador

Jhomar aceptó las recomendaciones de la primera ronda de `GRILL-CREADOR-APPS.md`:

- Spotify será el primer caso: buscar música, elegir un resultado y reproducir/pausar, sujeto a verificar requisitos del servicio.
- La skill coordinará investigación, diseño, conexión y comprobación; REA será una herramienta de investigación dentro del proceso.
- Cada adaptación recibirá el perfil de acceso individual y mantendrá controles consistentes entre apps.
- Se permite automatización del navegador cuando la API documentada no cubra las tareas; declarar límites reales cuando no sea viable.
- La primera versión requiere revisión del equipo antes de habilitar la adaptación.

Jhomar también aceptó la segunda ronda:

- Toki se usa en navegador de escritorio; el generador se ejecuta inicialmente en el computador del equipo.
- La configuración del perfil puede ser asistida, con participación de la persona y acceso directo a pausa y ajustes.
- Se usa la cuenta propia de la persona, iniciando sesión en el servicio original; sesión conservada en su equipo y opción de desconexión. No entregar contraseñas al generador.
- Habilitar requiere revisión funcional del equipo y prueba de las tareas con la persona y su método de acceso. La demo del equipo solo demuestra funcionamiento técnico.
- Reutilizar adaptaciones comprobadas aplicando el perfil individual; revisar las reparaciones antes de habilitarlas.
- Mostrar una barra de progreso durante la preparación. Las etapas de investigación, creación, conexión y comprobación deben reflejar avance real, con esperas explícitas por conexión, revisión o prueba. El porcentaje se reserva para operaciones medibles.

La tercera ronda de `GRILL-CREADOR-APPS.md` concreta el comportamiento de esa espera y el primer piloto Spotify. El piloto y el coordinador de solicitudes están implementados; la generación automática está limitada a lectores RSS configurados por el equipo.

Actualización aceptada («sí a las tres»): la preparación continúa mientras se usa Toki, con avance consultable, cancelación y reintento; se acepta controlar Spotify.app local mediante un componente local si el CLI supera la prueba; el recorrido inicial usará mirada/nariz y permanencia, clic alternativo y teclado accesible para buscar canciones. Quedan por concretar los criterios de comodidad con la persona, los límites de ejecución y los detalles técnicos de conexión; las decisiones de producto mencionadas ya no están abiertas.

Jhomar aceptó el piloto privado con Premium (Q12) y confirmó el enfoque de buscar y reutilizar integraciones existentes antes de recurrir a REA. Se instaló `spogo` 0.13.2 y se eligió para el piloto, con lectura de estado y reproducción/pausa local verificadas. La búsqueda de catálogo queda pendiente de conectar la sesión web. REA es opcional; no se presupone que deba reconstruir capacidades ya disponibles.

La responsabilidad del creador sigue siendo entregar una adaptación funcional: descubrir candidatos, verificar sus capacidades, construir el vínculo con la interfaz accesible y comprobar las tareas reales. «Buscar en GitHub» describe una fase de descubrimiento, no una herramienta específica ya instalada ni el proceso completo.

## Entrada desde Apps

Jhomar propone una card «Apps» en el lobby que abra una experiencia similar a una tienda de aplicaciones. Se incorpora como entrada al creador: descubrir apps conocidas, solicitar una adaptación y consultar su avance o disponibilidad.

Propuesta de organización pendiente de concretar:

- «Mis apps»: adaptaciones habilitadas, con acción «Abrir».
- Apps conocidas: cards con nombre, funciones y estado real de compatibilidad; «Adaptar» inicia el trabajo cuando todavía hace falta crearlo o prepararlo.
- «Pedir otra app»: nombre o URL y tareas deseadas, conservando la generación bajo demanda.
- Solicitudes en curso: progreso por etapas y acciones necesarias de conexión, revisión o prueba. Una card visible no significa integración probada.

Jhomar aceptó explícitamente mostrar Spotify como primer candidato y «Pedir otra app» en la primera versión, incorporando más cards conforme se investigan sus integraciones. No anunciar otras adaptaciones como disponibles sin comprobarlas. El número de cards por pantalla y su organización se ajustarán al perfil de acceso.


## Corrección UI/UX acordada — 21 noviembre 2026

Esta decisión sustituye el formulario «Pedir otra app» y la entrada con teclado como recorrido principal. El paciente elige una actividad con mirada/nariz y confirma con su control muscular; permanencia sigue siendo una preferencia, no un requisito impuesto por Apps.

- Servicios muestra Spotify, YouTube, BioBioChile, Rappi y Mercado Libre Chile junto con los lectores instalados, como Cooperativa. Caben seis tarjetas por página. Cada tarjeta indica el estado de su adaptación. El acceso a WhatsApp está en Mensajes.
- Elegir una app sin adaptación → descripción breve → Preparar → progreso real y estado pendiente. No escribir nombre, URL ni tareas. El backend conserva solicitudes personalizadas para configuración asistida.
- Spotify → reproducir/pausar/estado/elegir música → cuatro búsquedas predefinidas → hasta tres resultados por página. No hay formulario en el recorrido del paciente.
- Shell compartido con la terminal de UI/UX: Inicio, Ajustes, pausa y controlador de mirada/músculo en `tablet-access.js`. Apps usa botones nativos y `TokiApps.active.back()` para el retroceso por doble contracción. No redefine el launcher ni el modo de selección.
- Configuración del equipo en `?start=apps&appsAdmin=1`: conexión de cuenta y aceptación funcional/personal. Es una separación de presentación, no autenticación ni un nuevo límite de seguridad. La revisión sigue siendo obligatoria para marcar lista una adaptación.
- Sin desplazamiento en los recorridos del paciente comprobados a 1280×800, 1024×768 y 390×844. Validación automatizada con señal muscular simulada por Espacio; falta prueba física de cámara/MyoWare y comodidad con la persona.

Referencias de contexto local: [Rappi Chile](https://www.rappi.cl/) y [BioBioChile](https://www.biobiochile.cl/). Confirman los servicios correspondientes, no disponibilidad de conectores ni accesibilidad de las adaptaciones. Mercado Libre Chile conserva la adaptación pendiente; no se verificó su integración.
