// Precarga para el gateway de wapi (Node + tsx): fuerza que su servidor HTTP escuche solo en 127.0.0.1.
// wapi llama serve({ port }) sin hostname y Node escucha en todas las interfaces; el 3102 no debe ser público.
// Se carga con NODE_OPTIONS=--import=/opt/toki/wapi-local/solo-local.mjs (ver wapi-gateway.service).
import net from "node:net";

const listen = net.Server.prototype.listen;
net.Server.prototype.listen = function (...args) {
  const port = args[0];
  if (typeof port === "number" || (typeof port === "string" && /^\d+$/.test(port))) {
    if (typeof args[1] === "function") args.splice(1, 0, "127.0.0.1");
    else if (args[1] === undefined || args[1] === "0.0.0.0" || args[1] === "::") args[1] = "127.0.0.1";
  } else if (port && typeof port === "object" && !port.path && (!port.host || port.host === "0.0.0.0" || port.host === "::")) {
    args[0] = { ...port, host: "127.0.0.1" };
  }
  return listen.apply(this, args);
};
