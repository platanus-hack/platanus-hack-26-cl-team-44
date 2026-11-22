---
name: adapt-app
description: Adapta una aplicación a Myo con una interfaz accesible conectada a funciones reales. Úsala al solicitar una app desde la tienda, evaluar un CLI o conector, o implementar una adaptación según el perfil de acceso de una persona.
---

# Adaptar una app

Entrega una adaptación utilizable de las tareas solicitadas, con evidencia de conexión real y estados visibles en Apps. Lee el glosario y el documento `docs/product/CREADOR-APPS-ELA.md` del repositorio Myo antes de cambiar su modelo.

## Fuente y modos de uso

La fuente de referencia es `.agents/skills/adapt-app/SKILL.md` dentro del repositorio Myo. Las copias personales se sincronizan desde ella. Las rutas de código y documentación de esta skill parten de la raíz de Myo.

- Como agente de desarrollo, sigue el recorrido completo y consulta los documentos del proyecto.
- En el generador RSS, `software/apps-bridge/generator/codex.mjs` carga este archivo directamente. La ejecución recibe una fuente ya comprobada, no dispone de herramientas y devuelve solo la receta del esquema indicado; no invoca `surface-recon`, REA ni consulta referencias externas. Las pruebas e instalación las realiza el proceso anfitrión. Conserva ese alcance limitado.

## Solicitud

Obtén internamente el nombre o URL de la app, las tareas deseadas, el entorno donde se usará y el perfil de acceso de la persona. Para el paciente, ofrece apps conocidas por rubro y tareas predefinidas: no conviertas esos datos internos en un formulario obligatorio. Reutiliza decisiones del proyecto y solicitudes guardadas; pregunta solo por información que cambie el resultado. Un diagnóstico no determina un perfil de interacción.

## Encontrar una conexión

Busca primero integraciones existentes: herramientas conectadas, CLI, SDK, conector o API documentada. Consulta repositorios originales y su código/documentación. Evalúa las tareas que cubren, autenticación, salida estructurada, plataforma, licencia y requisitos de cuenta. La popularidad o una coincidencia en GitHub no prueban funcionamiento.

Prueba el candidato con operaciones concretas. Distingue controlar un reproductor externo de producir audio dentro de Myo. Si la documentación y las pruebas cubren las tareas, reutiliza esa conexión. Si faltan contratos, autenticación, semántica de errores o confirmación de resultados, sigue la investigación siguiente antes de implementar esas capacidades.

Finaliza esta fase con una matriz breve: tarea, mecanismo, requisito, fuente/versión, prueba realizada, resultado observado y estado (comprobado, pendiente o no compatible). Reutiliza un conector probado y desarrolla solo lo que falta. Un resultado parcial debe conservar las tareas pendientes visibles.

## Investigar un contrato incompleto

Esta rama corresponde al agente de desarrollo con herramientas. Usa `surface-recon` cuando un CLI solo enumere la operación, la API no esté documentada, el país/versión cambie el comportamiento o falte probar el estado resultante. Lee la skill disponible y sus referencias aplicables; la fuente es [surface-recon de Crafter Station](https://github.com/crafter-station/skills/blob/main/skills/surface-recon/SKILL.md). Si no está instalada, consulta esa fuente sin instalar paquetes automáticamente. Registra la versión o revisión utilizada. Si no puedes acceder a sus instrucciones, declara la investigación pendiente y continúa las tareas que ya tienen contrato comprobado.

Delimita la investigación a las capacidades desconocidas y al acceso autorizado. Indica app, país/versión, tareas, cuenta disponible y qué resultado demostraría cada capacidad. Guarda el informe en `docs/research/<app>/recon.md` y conserva el registro de fricciones que pide la skill en `recon/friction.md`. Mantén sesiones, tokens y capturas con credenciales fuera del repositorio y del contexto de generación.

El informe debe separar observaciones de hipótesis y concluir qué capacidades se pueden implementar ahora. Para cada pendiente, exige el paso concreto que falta para comprobarlo. Una respuesta HTTP exitosa, una operación listada o un pedido creado no acreditan por sí solos la tarea completa: en una compra, pedido y pago requieren evidencia independiente del estado final. Las pruebas con efectos externos se limitan a lo autorizado; la investigación no amplía esa autorización.

Usa REA como herramienta opcional dentro de la investigación cuando aporte evidencia adicional; consulta su [repositorio y documentación](https://github.com/morluto/rea) si lo necesitas. No es una dependencia obligatoria de `surface-recon` ni de Myo.

Al recibir el informe, vuelve a `adapt-app`: convierte las capacidades comprobadas en acciones del adaptador y pruebas de aceptación; conserva las restantes como pendientes visibles. `surface-recon` termina con evidencia y un veredicto. La entrega de `adapt-app` sigue siendo la interfaz conectada, las pruebas y el estado real de instalación, no solo ese informe.

## Conectar y adaptar

En Myo, lee `software/apps-bridge/ADAPTERS.md` y reutiliza el registro/manifiesto versionado: acciones limitadas, requisitos de cuenta, interfaz y evidencia por adaptación. Añade la implementación al registro en lugar de crear rutas HTTP y reglas de revisión específicas por app. Preserva las mejoras existentes de la interfaz y coordina cambios con el trabajo UI/UX activo.

Para lectura de RSS público, reutiliza el generador declarativo existente de `software/apps-bridge/generator/` y la preparación asistida `prepare-reader.mjs`. El equipo proporciona nombre, fuente HTTPS y tareas; el paciente elige tarjetas. El generador ejecuta esta skill con Codex sin herramientas, valida una receta y usa el lector compartido: no escribe JavaScript ni instala repositorios. Conserva las tareas no cubiertas como pendientes. Solo informa de instalación después de la comprobación real de listar y leer y de guardar el paquete. La revisión personal sigue siendo una condición independiente. Para otras capacidades, desarrolla y comprueba el adaptador: el generador RSS no equivale a generación universal.

Mantén credenciales y sesiones en el dispositivo/cuenta de la persona, fuera de código, informes y artefactos de generación. Solicita el inicio de sesión en el servicio original cuando corresponda. Los adaptadores exponen acciones limitadas y argumentos validados; una interfaz web no debe aceptar comandos de shell arbitrarios.

Construye controles grandes y estables, con retroceso, pausa y recuperación. Respeta la cantidad de opciones acordada en la documentación vigente del catálogo y pagina el resto; las acciones principales deben caber en la pantalla sin desplazamiento ni escritura obligatoria. Reutiliza el shell y su controlador compartido, sin imponer permanencia cuando la persona confirma con músculo. Mantén autenticación asistida, detalles de conectores y revisión técnica fuera del recorrido cotidiano del paciente. Respeta el perfil y la entrada existente: mirada/nariz, permanencia, clic o señal muscular según lo acordado. Tras un cambio de pantalla o repintado, una mirada inmóvil no debe activar automáticamente otro objetivo. Al perder seguimiento, suspende la selección hasta recuperar control.

Integra la adaptación en Apps y sus solicitudes persistentes. El progreso corresponde a trabajo real: descubrimiento, interfaz, conexión, comprobación y revisión. Emplea porcentajes solo para cantidades medibles. Distingue sesión requerida, espera del equipo, fallo recuperable, cancelación y adaptación habilitada. Las solicitudes desconocidas pueden permanecer pendientes de construcción; describir una skill no implementa un generador autónomo.

## Comprobar y entregar

Ejecuta las tareas reales con el conector, verifica el resultado del servicio y prueba desconexión, errores, cancelación y reintento. Prueba la selección por permanencia sin dobles activaciones y la navegación con la entrada elegida. Usa datos sintéticos solo en pruebas identificadas como tales.

Registra lo observado y lo pendiente. En Myo, la revisión funcional del equipo y la prueba de las tareas por la persona son condiciones de habilitación. Un test automatizado o una demo con mouse no acreditan comodidad ni uso por pacientes.

Entrega código y pruebas, instrucciones de arranque, la entrada en la tienda y evidencia de aceptación. Conserva una versión utilizable al actualizar. Si falta autenticación o una prueba personal, deja la adaptación en ese estado y termina el trabajo independiente que sí puede completarse.
