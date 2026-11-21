# Rappi Chile mediante Crafter Station

Comprobado el 21 de noviembre de 2026. **La exploración accesible de Rappi Chile ya está implementada en Toki. El carrito con cuenta real y el pedido completo todavía no están validados ni habilitados como servicio terminado.**

## Continuación implementada

Abrir Toki en `http://127.0.0.1:8790/?start=apps` → Rappi → Probar app. Se puede elegir categoría, restaurante, producto y opciones reales con tarjetas. La interfaz muestra tres restaurantes/productos y dos opciones por página, con retroceso y descanso en el shell compartido. Sin cuenta se explora la ubicación predeterminada pública de Santiago; la cobertura de una dirección particular requiere la sesión.

La prueba posterior al informe inicial descubrió el flujo de invitado de la web chilena: GET `/api/rocket/v2/guest/passport/`, POST `/api/rocket/v2/guest`. Con esa sesión temporal se comprobaron HTTP 200 en detalle de tienda y opciones de producto. Little Caesars devolvió tres grupos de acompañamientos, salsas y bebidas. El detalle de tienda contiene metadata, no su menú completo. Este hallazgo sustituye el bloqueo por 401 de esas consultas **sin ninguna sesión** en la matriz inicial.

Implementación: [`rappi.mjs`](../../../software/apps-bridge/adapters/rappi.mjs), [`rappi-client.mjs`](../../../software/apps-bridge/connectors/rappi-client.mjs), [`rappi-login.mjs`](../../../software/apps-bridge/connectors/rappi-login.mjs). El bridge usa las operaciones auditadas con un transporte Node restringido; no ejecuta el servidor ni el MCP original. Autenticación local, lectura de dirección activa, carrito, opciones y prevención de reenvíos están implementados; solo la parte pública tiene evidencia real hasta conectar la cuenta.

Pruebas de navegador: búsqueda y selección reales, opciones reales, tamaños 1280×800, 1024×768 y 390×844, sin formularios ni controles recortados; recuperación ante una respuesta tardía simulada. También se comprobó selección por contracción simulada con Espacio: la posición inmóvil tras cambiar de pantalla no eligió automáticamente otro restaurante. No acredita una prueba física con cámara/sensor ni comodidad personal.

Para repetir la prueba pública de navegador, `tests/browser/rappi-check.cjs` espera el piloto aislado en 8792. Nunca añade comida a un carrito real. Se puede arrancar desde la raíz con `TOKI_APPS_PORT=8792 TOKI_APPS_STATE_DIR=/tmp/toki-rappi-qa node software/apps-bridge/server.mjs`, abrir ese sitio con playwright-cli y ejecutar `run-code --filename tests/browser/rappi-check.cjs`.

Las 29 pruebas de backend pasan sobre `main` actualizado (incluida la portabilidad de `adapt-app`). `rappi.test.mjs` y `rappi-login.test.mjs` usan fixtures y cubren validación de opciones, precios del servidor, sesión/generación, repetición de operaciones, errores, límites de respuesta, permisos del archivo y captura de sesión restringida al origen chileno. `rappi-cart-fixture-check.cjs` intercepta las acciones del navegador con datos sintéticos y comprueba opciones obligatorias, selección máxima, una sola escritura, carrito en escritorio/móvil y ausencia de compra. Esa última prueba **no acredita carrito real** ni escribe evidencia de cuenta en el bridge.

Conexión asistida desde `?start=apps&appsAdmin=1` → Rappi → Conectar Rappi Chile, o `node software/apps-bridge/connectors/rappi-login.mjs`. La persona inicia sesión exclusivamente en Rappi oficial; después se comprueba la cuenta y la dirección activa. No pegar tokens ni códigos en el chat. Ver instrucciones completas en [ADAPTERS.md](../../../software/apps-bridge/ADAPTERS.md#comida-rappi-chile-parcial).

La web chilena actual también expone en su JavaScript `createPreOrderCheckoutSession`, sobre `/api/ms/shopping-cart-proxy/{storeType}/create-checkout-session`, que devuelve `payment_url`, vencimiento y estado. Es una pista comprobada en código público, **no una compra ni un pago probados**. No se llamó esa operación. Falta verificar su contrato y un recorrido accesible completo; no se sustituye por el `place_order` defectuoso del CLI.

## Candidato y alcance

- Fuente: [crafter-station/rappi-cli](https://github.com/crafter-station/rappi-cli), versión 0.0.6, commit `5c4e5b03e7df8f275a6e4b0dbef74a589e842515`.
- Bun/TypeScript; comandos, API HTTP y MCP sobre endpoints internos de Rappi. No es un SDK oficial de Rappi. El paquete declara MIT; el checkout auditado no incluye archivo LICENSE.
- El código fija Colombia en host, origen, login, coordenadas y formato. El parche adjunto cambia solamente la configuración necesaria para comprobar lectura en Chile; **no es un port completo** y conserva el login colombiano original.
- El JavaScript público de [Rappi Chile](https://www.rappi.cl/login), `/_astro/environment.B4cGmwvl.js`, declara `https://services.rappi.cl`, `https://images.rappi.cl`, `es-CL`, `CLP` y precisión monetaria cero. Se verificó descargándolo desde el sitio, sin sesión.
- Coordenadas de prueba: las predeterminadas públicas de Rappi Chile, `-33.4147039, -70.6023703`. No representan el domicilio de una persona ni acreditan cobertura de despacho a su dirección.

## Resultado de la prueba inicial del CLI (antes de implementar la sesión invitada)

| Tarea | Mecanismo | Requisito / evidencia | Estado |
|---|---|---|---|
| Buscar comida | `services/search.ts`, consulta «pizza» | Sin cuenta; 39 tiendas; `SearchResultSchema.safeParse` válido; comando `bun src/commands/search.ts pizza` terminó con código 0 | Comprobado |
| Ver productos de búsqueda | `stores[].products[]` | Little Caesars Nueva Providencia, Under Pizza Panorámico y Melt Callao; nombres, IDs, disponibilidad y precios recibidos | Comprobado para resultados de búsqueda |
| Catálogo general | `getRestaurantCatalog` | HTTP 200, pero solo metadata, sin restaurantes | No utilizable en esta prueba |
| Menú completo | `getStoreDetail` sobre una tienda devuelta por búsqueda | HTTP 401 sin sesión | Pendiente de autenticación; 401 no prueba que baste iniciar sesión |
| Opciones del producto | `getProductToppings` sobre producto real | HTTP 401 sin sesión | Pendiente de autenticación |
| Inicio de sesión Chile | Login oficial + captura local revisada | El comando original abre Colombia; falta adaptar y verificar el flujo actual de Chile | Pendiente |
| Dirección, carrito y total | Servicios existentes del CLI | Cuenta chilena y dirección seleccionada; no ejecutados | Pendiente |
| Comprar y seguir pedido | `placeOrder` / `getOrders` | No ejecutados; pago incompleto reportado por upstream | No habilitar todavía |
| Mirada y confirmación muscular | Shell y controlador compartidos de Toki | No hay aún interfaz Rappi conectada ni prueba personal | Pendiente |

La evidencia reducida está en [evidence-2026-11-21.json](./evidence-2026-11-21.json). Son datos públicos observados, no fixtures. El número de tiendas, stock y precios puede cambiar. La búsqueda incluso devuelve algunos importes decimales: para presentación usar CLP sin decimales y para cobrar utilizar el total confirmado por checkout, nunca calcularlo desde tarjetas.

## Repetir la comprobación sin cuenta

Requiere Git y Bun. Ejecutar desde la raíz de Toki; usar un directorio nuevo fuera del repo. El script llama las funciones reales del checkout, valida la búsqueda con el esquema original y consulta catálogo, tienda y opciones. No llama carrito, direcciones, checkout ni pedidos. No lee sesiones locales de Rappi.

```sh
git clone https://github.com/crafter-station/rappi-cli.git /tmp/rappi-chile-check
git -C /tmp/rappi-chile-check checkout 5c4e5b03e7df8f275a6e4b0dbef74a589e842515
git -C /tmp/rappi-chile-check apply "$PWD/docs/research/rappi-chile/chile-readonly.patch"
cp docs/research/rappi-chile/verify.ts /tmp/rappi-chile-check/toki-chile-check.ts
cd /tmp/rappi-chile-check
bun install --ignore-scripts --frozen-lockfile
bun toki-chile-check.ts
```

El informe se escribe como `toki-chile-evidence.json`. Se usa token vacío, no una credencial ficticia ni ajena. El parche **no bloquea** los demás comandos del CLI: el carácter de solo lectura corresponde a este script. No levantar su servidor HTTP para integrarlo directamente: el código auditado permite CORS genérico, no autentica al llamador y expone acciones de compra usando la sesión local.

## Implementación siguiente en Toki

1. Reutilizar los servicios del CLI mediante un wrapper local con acciones y argumentos limitados. Configurar país explícito, timeout/cancelación y salida JSON; no pasar comandos de shell desde la interfaz ni exponer el servidor original.
2. Adaptar el login a `www.rappi.cl/login`, comprobar el host y el flujo real de autenticación, guardar sesión local con permisos restringidos y no incluir token ni datos personales en logs o informes. Esa configuración asistida ocurre fuera del recorrido del paciente.
3. Registrar un adaptador bajo el contrato común. Separar evidencia de `search`, `product`, `cart`, `quote`, `order` y `tracking`; permitir explorar sin declarar que ya puede comprar. No interpretar HTTP 200 sin productos como éxito funcional.
4. Conectar una cuenta chilena y verificar dirección seleccionada, opciones de producto, carrito y cotización final. Mantener cualquier compra pendiente hasta mostrar comercio, productos, dirección, total y una confirmación deliberada. No reintentar automáticamente una creación de pedido con resultado incierto.
5. Resolver y verificar el pago. Hay un [reporte abierto #2](https://github.com/crafter-station/rappi-cli/issues/2) de pedidos despachados sin cargo final en Colombia. Es evidencia reportada, no reproducida aquí. El [PR #3](https://github.com/crafter-station/rappi-cli/pull/3) añade advertencias y expresamente no corrige el flujo de cobro. «Pedido creado» no acredita «pagado».
6. Construir la experiencia con el equipo UI/UX: Comida → categorías/favoritos → productos → opciones necesarias → revisar → confirmar → seguimiento. Tarjetas paginadas, sin escritura obligatoria, con retroceso/pausa y el controlador de mirada y músculo existente. Categorías y favoritos deben resolver productos reales; el número de opciones sigue el perfil de la persona. Probar estabilidad del foco, pérdida de seguimiento y prevención de doble compra antes de la prueba personal.

No fue necesario REA para descubrir el host ni comprobar búsqueda. Puede usarse investigación adicional si faltan pasos del login o del pago; no reemplaza probarlos.

## Investigación siguiente

El trabajo anterior siguió `adapt-app` y comprobaciones directas del CLI y la web; no ejecutó el procedimiento completo de `surface-recon`. La [skill de Crafter Station](https://github.com/crafter-station/skills/blob/main/skills/surface-recon/SKILL.md) es adecuada para investigar el checkout pendiente: distinguir evidencia observada e inferencia, correlacionar acciones con solicitudes y verificar respuesta junto con estado posterior. Esa investigación requiere una sesión autorizada; no convierte una compra enumerada en una compra comprobada. La [skill `adapt-app`](../../../.agents/skills/adapt-app/SKILL.md#investigar-un-contrato-incompleto) incorpora ahora esa rama de investigación. Su informe alimenta la implementación; `adapt-app` conserva la responsabilidad de la interfaz y sus pruebas accesibles.
