# Puente WhatsApp

Código trasladado desde `woki-bridge/` sin cambios de lógica, imports, variables de entorno ni protecciones de acceso local.

Desde la raíz:

```bash
cd software/whatsapp-bridge
npm ci
cp profile.example.json profile.json
# Crear .env siguiendo la guía; no subir credenciales ni contactos.
npm run dev
```

[Guía de configuración](../../docs/product/GUIA-WAPI-PASO-A-PASO.md) · [Self-host](../../docs/product/GUIA-WAPI-SELF-HOST.md)

La configuración `.env` y los perfiles locales deben vivir en esta carpeta. Si tenías una instalación anterior, mueve también esos archivos locales ignorados. El nombre del paquete y las variables `WOKI_*` se conservan por compatibilidad. No se enviaron mensajes durante la reorganización.
