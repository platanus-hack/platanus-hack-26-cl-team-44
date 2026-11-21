# Creador de apps accesibles de Toki

## Decisión explícita de Jhomar

La generación bajo demanda es parte central del producto. El paciente o su ayudante pide una aplicación (por ejemplo Spotify) mediante una acción como «Instalar» o «Adaptar». Toki investiga la aplicación con REA y produce una UI/UX pensada para su método de interacción. No se limita a habilitar un catálogo de adaptaciones previamente hechas.

## Resultado que debe producir

Una adaptación utilizable y conectada al servicio real, con acceso desde el inicio de Toki. Para Spotify, por ejemplo: encontrar música, elegir una lista y controlar la reproducción. Una imagen, un iframe o un clon de pantallas sin ejecución real no cumplen este resultado.

## Flujo propuesto (aún no implementado)

1. Solicitud: nombre o URL de la app y funciones que se quieren utilizar.
2. Investigación: REA y documentación oficial identifican capacidades, flujo, autenticación y límites. Preferir una API documentada cuando exista; REA aporta evidencia donde falte documentación.
3. Diseño: transformar tareas en opciones grandes y estables, reducir pasos y precisión requerida, ofrecer pausa, retroceso y confirmaciones comprensibles. Parametrizar mirada, nariz, permanencia y señal muscular según el usuario.
4. Conexión: implementar acciones y lectura del servicio; pedir al usuario iniciar sesión cuando corresponda, sin fingir autenticación o resultados.
5. Prueba: completar tareas reales y comprobar estados de error, pérdida de control, cancelación y recuperación. Probar con el método de entrada de la persona.
6. Instalación: publicar la adaptación dentro de su Toki, identificando funciones disponibles y pendientes; conservar una versión anterior que permita revertir.

Una solicitud puede acabar en «necesita conexión», «necesita revisión» o «no compatible todavía». La UI no debe anunciar «instalado» mientras falten funciones prometidas.

## Qué está y qué falta

Se acordó la intención y el resultado. No se ha implementado el motor de creación, ni ejecutado REA sobre Spotify, ni creado su conector. El comando `rea` no estaba disponible en PATH al revisar este entorno. La integración de juegos externos es una prueba del contenedor y del control, no una prueba del creador universal.

## Decisiones por resolver

- Qué funciones mínimas debe cubrir cada primera adaptación y quién revisa el resultado antes de instalarlo.
- Si se diseña un perfil por persona o uno inicial configurable y cómo se prueba la comodidad real.
- Dónde se ejecuta la investigación/generación y cómo se mantienen conectores cuando cambian los servicios.
- Nombre de la acción: recomendar «Adaptar app» antes de «Instalar», porque describe el trabajo que está comenzando.
