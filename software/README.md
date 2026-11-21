# Software

| Carpeta | Qué contiene | Cómo iniciar desde la raíz |
|---|---|---|
| [toki-os](toki-os/) | Toki OS · [Abrir el inicio](http://127.0.0.1:8790/) | `npm ci --prefix software/apps-bridge` y luego `npm start --prefix software/apps-bridge` |
| [eye-tracking](eye-tracking/) | Demo de mirada con iPhone (Face ID) como sensor; su motor también lo usa Toki OS | `node software/eye-tracking/web/serve.mjs` |
| [myoware-monitor](myoware-monitor/) | Monitor muscular en vivo | Ver su README: requiere puerto serial |
| [whatsapp-bridge](whatsapp-bridge/) | Servicio de mensajería | Entrar a la carpeta y seguir su README |

El banco de pruebas de gestos MyoWare y mirada con iPhone tiene su propio recorrido. [Guía del banco de pruebas](toki-os/README.md#banco-de-pruebas)
