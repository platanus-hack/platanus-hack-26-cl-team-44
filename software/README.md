# Software

| Carpeta | Qué contiene | Cómo iniciar desde la raíz |
|---|---|---|
| [toki-os](toki-os/) | Interfaz de Emmy | `python3 -m http.server 8000 --bind 127.0.0.1 --directory software/toki-os` |
| [eye-tracking](eye-tracking/) | Demo de mirada con iPhone (Face ID) como sensor; su motor también lo usa Toki OS | `node software/eye-tracking/web/serve.mjs` |
| [myoware-monitor](myoware-monitor/) | Monitor muscular en vivo | Ver su README: requiere puerto serial |
| [whatsapp-bridge](whatsapp-bridge/) | Servicio de mensajería | Entrar a la carpeta y seguir su README |

La integración EMG → SO sigue pendiente. Se mantienen nombres internos, variables de entorno, puertos y protocolos del MVP.
