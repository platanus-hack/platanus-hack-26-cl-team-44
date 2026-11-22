# Despliegue y demo

La TV es una sola. Se abre de 3 formas. El token del puente nunca va en una URL.

| | Escenario (con hardware) | Equipo (cualquier navegador) | Público (jueces) |
|---|---|---|---|
| Dirección | `http://127.0.0.1:8766/woki-os.html` (doble clic en `Myo.command`) | https://179-66-157-161.sslip.io/equipo/ | https://179-66-157-161.sslip.io |
| Acceso | El monitor entrega el token desde variables de entorno (`/toki-config.js`) | Usuario `equipo` y contraseña (`make clave`); Caddy agrega el token por dentro | Libre |
| MyoWare | Real, por USB o BLE | Teclado: Espacio = ceja, J = mandíbula | Teclado |
| WhatsApp | Real (VPS) | Real (VPS) | Simulado |
| Agente y memoria | De la usuaria (VPS) | De la usuaria (VPS) | Agente demo con memoria ficticia (`toki-agente-demo`) |
| Apps (Rappi, Spotify, YouTube, noticias) | Reales (apps-bridge en el Mac) | Ilustrativas (datos de ejemplo) | Ilustrativas (datos de ejemplo) |

## Comandos del equipo

Con la llave SSH del equipo (`ssh toki-vps`):

| Comando | Qué hace |
|---|---|
| `make deploy` (`RAMA=x`) | Actualiza el repo en la VPS y corre `instalar.sh` ya actualizado |
| `make estado` | Servicios, WhatsApp, agente y commit en una pantalla |
| `make logs S=toki-puente` | Últimas 50 líneas de un servicio |
| `make semilla` | Sube `software/agent/data/semilla.json` (memoria real, fuera de git) y la carga |
| `make tarjetas` | Sube `software/agent/data/tarjetas.json` (tarjetas propias de la usuaria, fuera de git) |
| `make rotar-token` | Cambia el token del puente si se filtró y reinicia lo necesario |
| `make clave` | Copia la contraseña de `/equipo/` al portapapeles |
| `make escena` | Lo mismo que doble clic en `Myo.command` |

## VPS (Hostinger)

- Máquina: `srv2186003.hstgr.cloud`, 179.66.157.161, Ubuntu 26.04. SSH solo con llave; firewall con 22, 80 y 443.
- Caddy (HTTPS de Let's Encrypt, HTTP/3 apagado porque colgaba el navegador):
  - `/`: TV pública.
  - `/equipo/*`: TV del equipo con `basicauth`. `/equipo/wa/*` y `/equipo/agente/*` llevan el token, que agrega Caddy.
  - `/wa/api/*`: para la TV del escenario, con el header `X-Myo-Token`.
  - `/agente/*`: con el token del escenario va al agente real (8790). Sin ese token va al agente demo (8792) y Caddy le agrega `TOKI_TOKEN_DEMO`.
- Secretos, solo root y fuera de git:
  - `/opt/toki/puente.env`: wapi, token, ElevenLabs, Twilio.
  - `/opt/toki/caddy.env`: token del escenario, token del agente demo y hash de la contraseña.
  - `/opt/toki/toki-demo.env`: configuración del agente demo (puerto 8792, `TOKI_DATA`, tope y token).
  - `/opt/toki/equipo.clave`: contraseña de `/equipo/`.
  - `/opt/toki/agente.env`: suscripción de Claude.
  - `/opt/toki/wapi.env`: base y cifrado de wapi.
- El agente (`toki-agente`) usa `data/semilla.json` si existe y, si no, la semilla de ejemplo. Tope de 300 llamadas por día (`TOKI_MAX_DIA`).
- El agente demo (`toki-agente-demo`, 127.0.0.1:8792) corre el mismo código con `TOKI_DEMO=1`, la memoria ficticia de `software/agent/ejemplos/semilla.demo.json` en `/opt/toki/demo-data` y tope de 150 llamadas por día (`TOKI_MAX_DIA_DEMO` al instalar). Usa las mismas credenciales (`agente.env`). Rechaza las rutas que escriben, las de voces y `/api/grupo`.
- Los logs del puente no guardan nombres ni texto de los mensajes.

El token de la suscripción de Claude:

```bash
claude setup-token        # en el Mac; copia el token que imprime
read -s T && ssh toki-vps "umask 077 && printf 'CLAUDE_CODE_OAUTH_TOKEN=%s\n' '$T' > /opt/toki/agente.env && systemctl restart toki-agente toki-agente-demo" && unset T
```

### WhatsApp real en la VPS (wapi + puente)

`instalar.sh` también instala wapi y el puente. Todo escucha en 127.0.0.1; lo único público es `/wa/api/*` y `/equipo/wa/api/*`, con token.

| Servicio | Qué es | Dónde |
|---|---|---|
| `wapi-gateway` | La conexión con WhatsApp (el "dispositivo vinculado") | 127.0.0.1:3102 |
| `wapi-api` | API HTTP de wapi | 127.0.0.1:3101 |
| `wapi-worker` | Avisa al puente de los mensajes entrantes | sin puerto |
| `toki-puente` | `software/whatsapp-bridge` (TV ↔ wapi) | 127.0.0.1:8788, público en `/wa/api/*` |
| `postgresql`, `redis-server` | Base y colas de wapi | 127.0.0.1:5432 y 6379 |

- wapi está en `/opt/toki/wapi` (commit `4ca20d8`, usuario `wapi`). Sin dashboard y sin Docker.
- Escucha local: wapi no tiene opción de host; `deploy/wapi/solo-local.mjs` (gateway) y `deploy/wapi/api-local.ts` (api) lo fuerzan a 127.0.0.1.
- Secretos, solo root, fuera de git: `/opt/toki/wapi.env` (base, `ENCRYPTION_KEY`, `GATEWAY_TOKEN`) y `/opt/toki/puente.env` (`WAPI_PAT`, `WOKI_API_TOKEN`, claves de la sesión). Si cambia `ENCRYPTION_KEY` o se borra la base `wapi`, hay que volver a vincular.
- Lista blanca: `/opt/toki/puente/profile.json`, copia de `profile.example.json`. Los contactos reales se eligen desde la TV.
- El puente arranca en `WA_MODE=dry` hasta vincular el celular.

Vincular el celular (una vez; hace falta el teléfono para escanear el QR):

```bash
ssh -t toki-vps 'bash /opt/toki/repo/deploy/vincular-whatsapp.sh +569XXXXXXXX'
```

El QR sale en la terminal (agranda la ventana si se ve cortado). En el celular: WhatsApp → Ajustes → Dispositivos vinculados → Vincular un dispositivo. Al vincular, el script guarda las claves en `puente.env`, registra el webhook en `http://127.0.0.1:8788/webhook/wapi`, pasa a `WA_MODE=live` y reinicia `toki-puente`. No manda mensajes.

Revisar: `ssh toki-vps 'systemctl status wapi-gateway wapi-api wapi-worker toki-puente --no-pager; journalctl -u toki-puente -n 20 --no-pager'`.

## Escenario

1. Conecta el MyoWare por USB al Mac.
2. Doble clic en `Myo.command`, en la raíz del repo. También sirve `make escena` o `bash deploy/escena.sh --ble-jaw … --ble-brow …`.
3. El script revisa cada pieza y muestra ✅ o ❌: sensor, token, WhatsApp, agente, monitor y datos del sensor. Después abre Chrome en pantalla completa, con su propio perfil (`~/.toki-chrome`) para que la calibración se guarde.

En otro computador sin `ssh toki-vps`, crea `deploy/escena.env`, que git ignora, con `TOKI_WA_TOKEN=…`.

Antes de subir al escenario: `make estado` y una mención de prueba en el grupo del disparador.

## Rappi (escena del aniversario)

- Corre en el computador del escenario: `Myo.command` arranca apps-bridge en el puerto 8793 con `TOKI_RAPPI_PAIS=co` (Bogotá).
- Cuenta: `make rappi` abre el login oficial y guarda la sesión en `~/Library/Application Support/Myo/apps/` (token de la API y perfil de Chrome `rappi-chrome`). La primera vez, Rappi pide verificar el celular en la web. Nunca pegar códigos en el chat.
- Flujo en la TV: Servicios → Rappi → "💡 Sugerencia de Myo" (el agente de la VPS usa la memoria) → restaurante → producto → opciones → carrito → "Revisar importes" → "Hacer el pedido", con dos elecciones separadas.
- Checkout: `TOKI_RAPPI_CHECKOUT=api` (por defecto) usa solo llamadas a la API, en el orden de la web oficial: `checkout/detail`, `checkout-component`, `recalculate` y `shopping-cart-proxy/checkout` con el carrito recalculado. Probado con cobro real el 22-nov-2026 (pedido 2527563808, cancelado). `web` usa el checkout oficial en Chrome, como respaldo.
- Protecciones: tope de total, carrito igual al revisado (ticket de 5 min), un solo envío, sin reintentos. Antes del demo, el carrito de Rappi tiene que estar vacío.
