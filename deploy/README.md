# Despliegue y demo

La TV es una sola. Se abre de 2 formas, y el código elige los servicios según desde dónde se abre.

| | En escena (con hardware) | URL pública (sin hardware) |
|---|---|---|
| Dirección | `http://127.0.0.1:8766/woki-os.html` (la sirve el monitor MyoWare en el Mac) | https://179-66-157-161.sslip.io |
| MyoWare | Real, por USB o BLE | Teclado: Espacio = ceja, J = mandíbula |
| Mirada con iPhone | Real, por la red local | Webcam o mouse |
| WhatsApp | Real (puente de Emmy en el Mac) | Simulado |
| Agente | En el Mac, con la sesión de Claude Code | En la VPS, con `CLAUDE_CODE_OAUTH_TOKEN` |

## URL pública (VPS de Hostinger)

- Máquina: `srv2186003.hstgr.cloud`, 179.66.157.161, Ubuntu 26.04. Acceso: `ssh toki-vps`.
- Caddy sirve la TV en `/` y el agente en `/agente/*`, con HTTPS de Let's Encrypt. HTTP/3 está apagado: con él, el navegador se colgaba.
- El agente corre como el servicio `toki-agente`, con el usuario `toki` y la semilla de **ejemplo**.
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

## En escena (Mac del demo)

En este orden:

1. **wapi y el puente de WhatsApp**, como en `docs/product/GUIA-WAPI-SELF-HOST.md`. El puente se arranca con `ALLOWED_ORIGIN=http://127.0.0.1:8766`, porque la TV se abre desde el monitor.
2. **Agente:** `software/agent/.venv/bin/python software/agent/server.py`. Usa la sesión de Claude Code del Mac y `software/agent/data/semilla.json` con los datos reales.
3. **Monitor MyoWare** (sirve la TV): `python3 software/myoware-monitor/server.py --serial-port <puerto>` o con `--ble-jaw` y `--ble-brow`.
4. Abrir **http://127.0.0.1:8766/woki-os.html** en Chrome.

Antes de subir al escenario: aprobar el disparador del grupo (`?dev=1` → Aprobar) y mandar una mención de prueba.
