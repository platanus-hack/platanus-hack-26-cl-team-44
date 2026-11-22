# Entrevista: REA y skill de adaptación de apps

Estado: primera y segunda rondas aceptadas por Jhomar. En Q6 añadió una barra de progreso visible durante la preparación. Aceptó Q12, la tienda inicial (Q15) y posteriormente Q11, Q13 y Q14 mediante «sí a las tres». Confirmó buscar integraciones existentes antes de recurrir a REA. La elección concreta de CLI sigue sujeta a prueba técnica.

## Base acordada

Según `CREADOR-APPS-ELA.md`, la creación bajo demanda es central: la persona o su ayudante solicita una app; Myo investiga y produce una adaptación conectada a sus funciones reales. El vocabulario vigente está en `../../GLOSSARY.md`.

## Primera ronda — recomendaciones aceptadas

1. **Primera prueba completa.** ¿Usar Spotify, con buscar música, elegir un resultado y reproducir/pausar, como primer caso de aceptación del creador? Recomendación: sí. Sigue pendiente verificar su viabilidad técnica; no limita la visión a un catálogo fijo.
2. **Responsabilidad de la skill.** ¿Debe dirigir todo el proceso desde la solicitud hasta una adaptación funcional, incluyendo investigación, diseño, conexión y comprobación? Recomendación: sí; REA es una herramienta de investigación dentro del proceso.
3. **Personalización.** ¿Cada adaptación recibe un perfil de acceso de la persona y conserva controles consistentes entre apps? Recomendación: sí; compartir estructura y variar tamaño, densidad, método de selección y tiempos según el perfil. Los valores concretos y su validación quedan pendientes.
4. **Apps sin API suficiente.** ¿Permitir automatización de navegador como alternativa cuando una API documentada no cubra las tareas? Recomendación: sí, con estados explícitos de conexión requerida o incompatibilidad si no se puede completar el flujo real de forma fiable.
5. **Activación inicial.** ¿La primera versión genera y comprueba automáticamente, pero requiere revisión del equipo antes de quedar disponible para la persona? Recomendación: sí; diferenciar generación bajo demanda de publicación sin revisión.

## Ramas posteriores

- Caso inicial → requisitos del servicio, cuenta, tareas, fallos y criterios verificables de aceptación.
- Responsabilidad de la skill → entradas, salidas, ejecución local o remota, dependencias y límites de tiempo/coste.
- Perfil de acceso → configuración, calibración, pruebas con la persona y asistencia necesaria.
- Estrategia de conexión → autenticación, almacenamiento de sesión, acciones con consecuencias, recuperación y mantenimiento.
- Activación → responsable, criterios de revisión, instalación, actualizaciones y reversión.

## Hechos verificados

- Repositorio REA confirmado: https://github.com/morluto/rea. Su README describe investigación con agentes y un MCP; no un generador específico de accesibilidad.
- `command -v rea` no devuelve ruta en el entorno actual. Esto solo comprueba su ausencia del PATH.
- No se encontró implementación del creador ni del conector Spotify en software/tests/skills locales revisados.
- Hay calibración y permanencia guardadas en el navegador, pero no un perfil de acceso por persona claramente delimitado.
- Existe un puente de entrada para páginas externas y un conector específico de WhatsApp; no demuestran el creador universal.
- Spotify ofrece API oficial para buscar y controlar reproducción. Reproducir/pausar y Web Playback SDK requieren Premium; Development Mode permite hasta cinco usuarios autorizados y exige Premium al propietario. Fuentes: https://developer.spotify.com/documentation/web-api/concepts/quota-modes y https://developer.spotify.com/documentation/web-api/reference/start-a-users-playback.
- El SDK permite audio dentro del navegador; su activación inicial y autoplay deben probarse con el método de entrada real. Fuente: https://developer.spotify.com/documentation/web-playback-sdk/reference.
- No se inspeccionó la cuenta ni se ejecutó reproducción real. Los requisitos documentados no demuestran integración operativa.

## Segunda ronda — recomendaciones aceptadas

6. **Entorno inicial:** recomendar navegador de escritorio en el computador del usuario, con el generador ejecutándose localmente en el computador del equipo durante la primera versión. La adaptación se usa desde Myo; ampliar despliegue después.
7. **Preparación del perfil:** recomendar configuración inicial asistida por persona de apoyo, con participación de la persona usuaria; esta debe conservar acceso directo a pausa y ajustes de interacción.
8. **Cuenta y sesión:** recomendar cuenta propia del usuario, inicio de sesión en el servicio original, sesión conservada en su equipo y desconexión disponible; sin entregar contraseñas al generador. El mecanismo concreto depende de los requisitos del servicio.
9. **Aceptación:** recomendar dos condiciones antes de habilitar: revisión funcional del equipo y prueba de las tareas por la persona con su método de acceso. Una prueba del equipo queda identificada como demo técnica.
10. **Mantenimiento:** recomendar reutilizar una adaptación ya comprobada de la misma app, aplicando el perfil individual; ante roturas, avisar y enviar a revisión del equipo antes de publicar una reparación.

### Aclaración aceptada de Q6: progreso visible

Jhomar pidió que aparezca una barra de progreso mientras se prepara la app. Se incorpora al alcance. Traducción de diseño: mostrar etapas comprensibles —investigar, crear, conectar, comprobar— y distinguir esperas por inicio de sesión, revisión del equipo y prueba con la persona. Usar porcentajes solo cuando el trabajo sea medible; no presentar toda la generación como una descarga ni prometer tiempo restante sin datos. El detalle de navegación durante la espera se plantea en Q11.

## Tercera ronda — pendiente

11. **Espera y recuperación:** recomendar que se pueda volver al inicio de Myo durante la preparación, consultar avance y cancelar; si falla, conservar trabajo aprovechable y ofrecer reintento explícito, sin ciclos ilimitados. Mostrar «pendiente de revisión/prueba» hasta cumplir las condiciones de habilitación.
12. **Primer piloto Spotify:** recomendar piloto privado con cuenta Premium autorizada. No se presupone que Jhomar tenga esa cuenta; se comprobará durante la conexión. Publicación a terceros queda fuera de esta primera prueba y requiere revisar acceso del servicio.
13. **Salida de audio:** recomendar reproducir en el computador de Myo mediante SDK, con preparación inicial asistida si el navegador requiere activación. Verificar posteriormente que el control accesible funciona sin esa ayuda.
14. **Entrada inicial:** recomendar que la primera adaptación use el control de mirada/nariz y permanencia ya explorado en Myo, con clic alternativo. Para Spotify, búsqueda de canciones mediante teclado accesible, resultados grandes y reproducción/pausa; navegación por playlists en una ampliación posterior. Pendiente validación del método con la persona.

### Aclaración de Q12: reutilizar CLIs existentes

Jhomar acepta el piloto Premium y propone buscar un CLI de Spotify ya construido. La investigación debe evaluar esa opción antes de asumir que hay que implementar directamente OAuth, SDK o automatización. REA puede estudiar las partes que no estén documentadas; un CLI puede ser la base del conector.

Candidato verificado por documentación, todavía sin instalación ni prueba: [spogo](https://github.com/openclaw/spogo), proyecto comunitario con búsqueda, play/pause, estado, dispositivos y salida JSON. Ofrece OAuth para Web API y cookies de sesión para endpoints internos; el modo AppleScript controla Spotify.app en macOS. Fuentes: https://spogo.sh/auth.html y https://spogo.sh/engines.html.

Enfoque confirmado por Jhomar al preguntar si sería una búsqueda en GitHub cuando ya existe: investigar primero conectores/CLIs existentes para cada app y reutilizar el que supere pruebas reales; desarrollar solo las capacidades faltantes. REA pasa a ser una herramienta opcional de investigación. La UI accesible, el perfil individual y la comprobación siguen siendo responsabilidad de Myo. No se ha demostrado que spogo reproduzca audio por sí mismo ni que cualquier cuenta pueda ejecutar todas sus funciones. Q13 debe considerar controlar Spotify.app en el mismo computador, además del SDK dentro del navegador.

### Siguiente paso de diseño

Q13 aceptada en su formulación revisada: Spotify.app como reproductor en el computador del usuario, controlado desde Myo mediante un puente local, si la prueba del CLI confirma esa ruta. Esto es distinto del generador que se ejecuta en el computador del equipo (Q6). El navegador de Myo no invoca un binario local directamente. También se aceptaron Q11 (espera/recuperación) y Q14 (entrada/búsqueda).

### Entrada tipo tienda de apps

Jhomar propone una opción/card «Apps» en el inicio y algunas aplicaciones dentro, como una app store. Se incorpora esa entrada al diseño. Mantener el creador bajo demanda acordado: descubrir una app conocida y pedir una no listada deben desembocar en el mismo proceso de adaptación.

Q15 aceptada explícitamente por Jhomar: la primera versión presenta Spotify como primer candidato y «Pedir otra app», y va incorporando cards conforme se investigan otras integraciones. Separar visualmente las apps habilitadas de las que requieren preparación; no confundir presencia en el catálogo con compatibilidad comprobada.

La propuesta de navegación no resolvía por sí sola espera, reproductor local y controles; esas tres decisiones quedaron aceptadas explícitamente en el turno posterior.

## Preparación para la primera demo visible

Inspección local: `spogo` no está en PATH; Node y Bun están disponibles. Myo se sirve como HTML/JS/CSS con un servidor local. `prototype-motion.html` contiene el control de cámara/permanencia; `prototype-lobby.html` es una vista separada cuya cabecera indica prueba táctil/teclado. No dar por existente la integración entre ambas vistas.

Trabajo pendiente para mostrar el recorrido acordado:

1. Construir la entrada Apps, Spotify, Pedir otra app, detalle de tareas y estados de preparación/espera/error/lista.
2. Preparar el coordinador y la skill de adaptación con descubrimiento de integraciones existentes, evidencia de capacidades y REA opcional. El progreso debe provenir de trabajo real; una solicitud todavía no procesada queda pendiente, sin simular generación completada.
3. Instalar y verificar el CLI candidato; implementar el puente local que recibe acciones concretas de la interfaz y devuelve resultados/estado.
4. Conectar la cuenta propia mediante la ruta elegida y comprobar búsqueda, selección, reproducción y pausa. No se inspeccionaron cuenta ni credenciales.
5. Probar navegación, persistencia de solicitudes, cancelación/reintento, errores y entrada accesible. La comprobación con la persona sigue siendo requisito para habilitación de uso, distinto de la demo técnica.

El sistema general todavía requiere concretar límites operativos de generación, despliegue entre equipos y protocolo de revisión/prueba; no son capacidades ya implementadas ni quedan resueltas por la interfaz de tienda.

## Implementación autorizada y verificada

Jhomar autorizó arrancar mediante «ok, go». Se implementó la primera demo en `software/apps-bridge` y los módulos `software/toki-os/toki-apps*`, compartidos entre lobby y prototipo de mirada/nariz. La tienda fue abierta y observada en Chrome.

- `spogo` 0.13.2 instalado. Estado de Spotify.app, pausa y reanudación reales comprobados; restaurado el estado inicial de reproducción tras la prueba.
- El estado de Spotify tarda en reflejar algunas órdenes: el conector espera confirmación mediante consultas antes de acreditar una acción.
- La búsqueda real necesita la sesión de Spotify Web. El acceso automático al llavero de Chrome no se completó; la demo presenta la conexión explícita y mantiene la adaptación pendiente.
- Seis pruebas del servicio pasan: revisión/evidencia obligatorias, persistencia, cancelación sin sobrescritura tardía, límites de API/argumentos, errores sin credenciales y espera de estado real.
- Prueba de navegador con servicio Spotify sintético aislado: recorrido de tienda, preparación persistente, búsqueda/reproducción/pausa, revisión, solicitud/cancelación, diseño móvil, permanencia sin activación doble, pérdida de seguimiento, pausa y teclado accesible. Sin errores JavaScript en esa prueba. No se probó cámara física ni pacientes.
- Búsqueda pública real en GitHub respondió correctamente. Las nuevas apps quedan pendientes del equipo tras descubrir candidatos; no se anuncia un generador universal operativo.
- Skill `adapt-app` instalada inicialmente en el equipo; ahora se distribuye y mantiene en [`.agents/skills/adapt-app/SKILL.md`](../../.agents/skills/adapt-app/SKILL.md), dentro del repositorio.

La demo usa `http://127.0.0.1:8790`; el puerto 8787 ya estaba ocupado por otro servicio y se conservó intacto.

La elección de entorno y los requisitos de Spotify desbloquearán las decisiones de ejecución, empaquetado, límites de tiempo/coste y autenticación concreta. El perfil y la aceptación desbloquearán el protocolo de prueba y los criterios de comodidad. Siguen pendientes las políticas de confirmación para acciones con consecuencias en futuras apps.

Se actualizará el glosario cuando se resuelvan nuevos términos. Solo se propondrán ADR para decisiones costosas de revertir que documenten alternativas y razones reales.


### Corrección posterior de Jhomar — UI/UX para uso autónomo

Rechaza el gran formulario de nombre/tareas del prototipo. Pide apps conocidas en Chile, una por rubro, con recorrido pensado para mirada y confirmación muscular. Esta corrección prevalece sobre la primera propuesta Spotify + «Pedir otra app». El catálogo presenta presets y estados honestos; escribir no es requisito. Se coordina explícitamente con la terminal UI/UX, no con la de diseño 3D. Véase la sección de corrección en CREADOR-APPS-ELA.md.
