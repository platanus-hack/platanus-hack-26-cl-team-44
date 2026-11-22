// Arranca la api de wapi (Bun) escuchando solo en 127.0.0.1. wapi exporta { port, fetch } y Bun,
// sin hostname, escucha en 0.0.0.0; el 3101 no debe ser público. Ver wapi-api.service.
import api from "/opt/toki/wapi/apps/api/src/index.ts";

export default { ...api, hostname: "127.0.0.1" };
