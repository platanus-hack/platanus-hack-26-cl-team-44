# Despliegue y demo

La TV es una sola. Se abre de 2 formas, y el código elige los servicios según desde dónde se abre.

| | En escena (con hardware) | URL pública (sin hardware) |
|---|---|---|
| Dirección | `http://127.0.0.1:8766/woki-os.html` (la sirve el monitor MyoWare en el Mac) | https://179-66-157-161.sslip.io |
| MyoWare | Real, por USB o BLE | Teclado: Espacio = ceja, J = mandíbula |
| Mirada con iPhone | Real, por la red local | Webcam o mouse |
| WhatsApp | Real (puente de Emmy en el Mac) | Simulado. Real con `?wa_token=` (wapi y el puente en la VPS) |
| Agente | En el Mac, con la sesión de Claude Code | En la VPS, con `CLAUDE_CODE_OAUTH_TOKEN` |

## URL pública (VPS de Hostinger)

- Máquina: `srv2186003.hstgr.cloud`, 179.66.157.161, Ubuntu 26.04. Acceso: `ssh toki-vps`.
- Caddy sirve la TV en `/` y el agente en `/agente/*`, con HTTPS de Let's Encrypt. HTTP/3 está apagado: con él, el navegador se colgaba.
- El agente corre como el servicio `toki-agente`, con el usuario `toki`. Sin `data/semilla.json` usa la semilla de **ejemplo**.
- `/agente/*` exige el mismo token del puente (`TOKI_TOKEN` en `/opt/toki/toki.env`): sin `?wa_token=`, el modo dev público no ve la memoria. El puente llama al agente directo, sin token.
- Memoria real: `scp software/agent/data/semilla.json toki-vps:/opt/toki/repo/software/agent/data/` y `ssh toki-vps 'cd /opt/toki/repo/software/agent && sudo -u toki /opt/toki/venv/bin/python scripts/semilla.py && systemctl restart toki-agente'`.
- Tope de 300 llamadas al agente por día (`TOKI_MAX_DIA` en `/opt/toki/toki.env`).
- Modo dev para los jueces: https://179-66-157-161.sslip.io/?dev=1

Instalar o actualizar:

```bash
ssh toki-vps 'cd /opt/toki/repo && git pull -q && TOKI_DOMINIO=179-66-157-161.sslip.io TOKI_RAMA=<rama> bash deploy/instalar.sh'
```

El token de la suscripción va en `/opt/toki/agente.env` (solo root, fuera de git):

```bash
claude setup-token        # en el Mac; copia el token que imprime
read -s T && ssh toki-vps "umask 077 && printf 'CLAUDE_CODE_OAUTH_TOKEN=%s\n' '$T' > /opt/toki/agente.env && systemctl restart toki-agente" && unset T
```

Revisar: `ssh toki-vps 'systemctl status toki-agente caddy --no-pager; journalctl -u toki-agente -n 20 --no-pager'`.

### WhatsApp real en la VPS (wapi + puente)

`instalar.sh` también instala wapi y el puente. Todo escucha en 127.0.0.1; lo único público es `/wa/api/*`, con token.

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

Abrir la TV con WhatsApp real (una vez por navegador; el token queda en `localStorage` como `woki_wa_token` y se borra de la barra):

```bash
ssh toki-vps "grep '^WOKI_API_TOKEN=' /opt/toki/puente.env | cut -d= -f2"   # copia el valor
# https://179-66-157-161.sslip.io/?wa_token=<valor>     · ?wa_token= (vacío) lo borra
```

Sin token, la URL pública sigue con WhatsApp simulado. El token va en el header `X-Woki-Token`; el SSE (`/api/wa/events`) lo manda como `?token=`, porque EventSource no admite headers.

Revisar: `ssh toki-vps 'systemctl status wapi-gateway wapi-api wapi-worker toki-puente --no-pager; journalctl -u toki-puente -n 20 --no-pager'`.

## En escena (Mac del demo)

En este orden:

1. **wapi y el puente de WhatsApp**, como en `docs/product/GUIA-WAPI-SELF-HOST.md`. El puente se arranca con `ALLOWED_ORIGIN=http://127.0.0.1:8766`, porque la TV se abre desde el monitor.
2. **Agente:** `software/agent/.venv/bin/python software/agent/server.py`. Usa la sesión de Claude Code del Mac y `software/agent/data/semilla.json` con los datos reales.
3. **Monitor MyoWare** (sirve la TV): `python3 software/myoware-monitor/server.py --serial-port <puerto>` o con `--ble-jaw` y `--ble-brow`.
4. Abrir **http://127.0.0.1:8766/woki-os.html** en Chrome.

Antes de subir al escenario: aprobar el disparador del grupo (`?dev=1` → Aprobar) y mandar una mención de prueba.
