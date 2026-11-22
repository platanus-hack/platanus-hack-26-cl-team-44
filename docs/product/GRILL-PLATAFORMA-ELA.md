# Entrevista: plataforma accesible, juego familiar y adaptación de apps

Estado: exploración abierta. Jhomar autorizó integrar Juegos en el prototipo de movimiento para probar mirada/nariz. Las demás decisiones continúan abiertas.

## Intención expresada

Facilitar que una persona con ELA use aplicaciones de comunicación, entretenimiento y servicios. Explorar un minijuego compartido con un familiar que usa su computador y un mando Xbox. Investigar REA como apoyo para comprender aplicaciones existentes y crear una experiencia accesible.

## Evidencia inicial

- El README del repositorio local corresponde al remoto `platanus-hack/platanus-hack-26-cl-team-44`. Declara pendiente la integración de EMG con el SO y la validación completa de WhatsApp.
- `software/toki-os/woki-os.html` contiene modo de permanencia de mirada y un consumidor de eventos EMG en WebSocket; su presencia no prueba integración física ni usabilidad con pacientes.
- El brief previo describe una persona con movimiento ocular y de cabeza, sin habla funcional ni manos útiles. Es una hipótesis del proyecto, no evidencia de validación con una persona real.
- [REA](https://github.com/morluto/rea): su README describe análisis de aplicaciones, binarios, JavaScript y sitios para producir evidencia y apoyar implementaciones. No establece una conversión automática a interfaces accesibles ni una integración operativa con Rappi.
- [SpecialEffect Eye Gaze Games](https://www.specialeffect.org.uk/how-we-can-help/eye-gaze-games): referencia existente de juegos con mirada, switches y opciones multijugador. La compatibilidad exacta con nuestro mando y montaje queda sin probar.
- [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/full-list/): recomienda alternativas al tiempo preciso y acciones durante pausa.

## Propuesta inicial (cooperación descartada por Jhomar)

Juego cooperativo con roles diferentes: el familiar pilota una nave con mando; la persona con ELA elige entre pocas zonas grandes para abrir rutas, dirigir un rescate o activar un escudo. Las decisiones deben cambiar el resultado y no exigir reflejos, seguimiento continuo de objetos o contracciones repetitivas. Pausa disponible y ritmo configurable. Mecánica original propuesta, no implementación existente ni accesibilidad demostrada.

Proponer «adaptación accesible» para la experiencia rediseñada y «conector» para la comunicación efectiva con el servicio. REA sería una herramienta de investigación durante la creación del conector; una interfaz recreada por sí sola no envía mensajes ni realiza pedidos.

## Primera ronda pendiente

1. ¿Diseñar la visión completa y distinguir qué se demuestra en el hack de lo que sigue después? Recomendación: sí, manteniendo las tres ramas.
2. ¿Partir de selección en zonas grandes y confirmación configurable, sin hacer obligatoria una contracción muscular? Recomendación: sí; capacidad y fiabilidad por validar.
3. ¿Priorizar cooperación con roles distintos y contribución decisiva de ambos? Recomendación: sí; competitivo por turnos es una alternativa posterior.
4. ¿Entender agregar apps como habilitar adaptaciones respaldadas por conectores probados, dejando generación bajo demanda como una hipótesis por investigar? Recomendación: sí; confirmar si la conversión automática es parte esencial de la propuesta.

## Ramas pendientes tras las respuestas

- Juego: mecánica definitiva, mismo lugar o remoto, sesión y reconexión, ritmo, pausa, errores de entrada, comunicación durante juego, éxito y pruebas con usuarios.
- Interacción: capacidades del usuario inicial, calibración, fatiga, alternativa de confirmación, ayuda de familiares y autonomía.
- Apps: primer flujo real de WhatsApp y Rappi, autenticación, confirmación de acciones, fallos, alcance del catálogo y actualización de conectores.
- REA: superficie concreta a investigar, evidencia necesaria, alcance de generación y criterio para considerar una adaptación utilizable.
- Entrega: prioridades, requisitos verificables y confirmación del entendimiento compartido.

Las definiciones consensuadas se incorporarán a `GLOSSARY.md`. Los ADR se crearán únicamente si hay decisiones con costes de reversión relevantes y alternativas reales.


## Actualización de Jhomar: juegos individuales

- Decisión explícita: minijuegos individuales para la persona con ELA, sin cooperación obligatoria.
- Petición concreta: incorporar Juegos en `prototype-motion.html?motion=spatial` para probar con mirada o nariz.
- Posibilidad futura, no compromiso cerrado: clasificación pública donde familiares jueguen desde sus laptops también con mirada/nariz.
- Q4 necesita explicación: catálogo de adaptaciones previamente preparadas frente a creación de una adaptación al buscar una app. Sigue sin responder.

### Implementación de exploración autorizada

Se añadieron dos juegos locales originales (Constelaciones y Parejas) al prototipo y un acceso al catálogo externo de SpecialEffect. No son copias ni integraciones de los juegos de SpecialEffect. El puntero de cámara de Myo no se transmite a páginas externas. Los resultados actuales se guardan en este navegador; no hay leaderboard público implementado.

Los juegos usan el sistema existente de puntero/calibración y permanencia de 1,1 s, con alternativa de clic. Constelaciones permite recoger 10 estrellas sin reloj. Parejas mantiene las figuras reveladas hasta que se elija continuar. Pérdida de cara, descanso o calibración suspenden los objetivos del juego; una partida activa vuelve pausada.

Pendiente: probar precisión y comodidad con la cámara real; acordar si la clasificación compartida debe ser pública o familiar y qué mide; definir la estrategia de adaptación de apps. Las recomendaciones de la primera ronda no respondidas no se consideran aceptadas.

### Verificación de la integración de Juegos

`tests/browser/games-check.cjs`, ejecutado con `playwright-cli -s=toki-games run-code --filename=toki/tests/browser/games-check.cjs` desde el workspace, pasó: partida de estrellas mediante coordenadas simuladas en `setGaze` y permanencia; estabilidad de pausa; pareja incorrecta visible sin temporizador; puntuación de parejas; persistencia de récords al recargar; suspensión al perder seguimiento; advertencia sobre control externo. Sin errores JavaScript en esa ejecución. Inspección visual realizada a 1440 × 1000. Esto no prueba precisión de mirada/nariz con cámara real ni usabilidad con pacientes.

## Segunda corrección de Jhomar: creador bajo demanda y juegos originales

- Q4 resuelta explícitamente: la persona o su ayudante solicita una app X; Myo la investiga con REA y rediseña la UI/UX para utilizarla. El creador bajo demanda es central, no una línea opcional posterior. Ver `CREADOR-APPS-ELA.md`.
- Jhomar rechazó la calidad de los minijuegos locales básicos y pidió entender e integrar los originales de Eye Gaze Games. El acceso principal de Juegos ahora presenta ese catálogo y carga las páginas originales dentro del SO.
- Se implementó un puente local de navegador para que mirada/nariz pueda producir entrada real en páginas embebidas de otros orígenes. Se verificó movimiento y clic por permanencia con coordenadas simuladas. Pendiente prueba física de cámara y partidas completas de cada juego.
- El creador no se presenta como implementado: todavía faltan motor REA, generación UI/UX, conectores, pruebas e instalación de adaptaciones.
