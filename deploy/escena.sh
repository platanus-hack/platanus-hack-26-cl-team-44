#!/usr/bin/env bash
# Escenario: el MyoWare va al computador; WhatsApp, agente y memoria están en la VPS.
#
#   bash deploy/escena.sh --serial-port /dev/cu.usbmodem1101
#   bash deploy/escena.sh --ble-jaw MyoJaw --ble-brow MyoBrow
#
# 1) Arranca el monitor MyoWare (sirve la TV y los gestos en http://127.0.0.1:8766).
# 2) Abre Chrome en la TV. El monitor le entrega TOKI_REMOTO y TOKI_WA_TOKEN en /toki-config.js.
# Variables de entorno (o deploy/escena.env, que git ignora):
#   TOKI_REMOTO     URL de la VPS (por defecto https://179-66-157-161.sslip.io)
#   TOKI_WA_TOKEN   token del puente; si falta, se lee de la VPS con 'ssh toki-vps'
# Funciona en macOS y Linux (el monitor usa termios: en Windows, correrlo dentro de WSL).
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
[ -f "$RAIZ/deploy/escena.env" ] && { set -a; . "$RAIZ/deploy/escena.env"; set +a; }
REMOTO="${TOKI_REMOTO:-https://179-66-157-161.sslip.io}"
PUERTO=8766
[ $# -gt 0 ] || { sed -n '2,13p' "$0"; exit 1; }

TOKEN="${TOKI_WA_TOKEN:-}"
if [ -z "$TOKEN" ]; then
  TOKEN="$(ssh -o ConnectTimeout=8 toki-vps "grep '^WOKI_API_TOKEN=' /opt/toki/puente.env | cut -d= -f2-" 2>/dev/null || true)"
fi
[ -n "$TOKEN" ] || { echo "Sin token: define TOKI_WA_TOKEN o configura 'ssh toki-vps'."; exit 1; }

# La VPS tiene que responder antes de subir al escenario
code=$(curl -s -o /dev/null -w '%{http_code}' -m 8 -H "X-Woki-Token: $TOKEN" "$REMOTO/wa/api/wa/health" || true)
[ "$code" = 200 ] && echo "VPS: WhatsApp responde" || echo "Ojo: $REMOTO/wa respondió '$code'. La TV va a mostrar WhatsApp sin conexión."

TOKI_REMOTO="$REMOTO" TOKI_WA_TOKEN="$TOKEN" python3 "$RAIZ/software/myoware-monitor/server.py" --http-port "$PUERTO" "$@" &
MONITOR=$!
trap 'kill $MONITOR 2>/dev/null' EXIT
for _ in $(seq 1 20); do curl -s -o /dev/null "http://127.0.0.1:$PUERTO/woki-os.html" && break; sleep 0.5; done

URL="http://127.0.0.1:$PUERTO/woki-os.html"
if command -v open >/dev/null; then open -a "Google Chrome" "$URL"
elif command -v google-chrome >/dev/null; then google-chrome "$URL" >/dev/null 2>&1 &
else echo "Abre en Chrome: $URL"; fi
unset TOKEN
echo "Monitor corriendo (Ctrl+C para cerrar)."
wait $MONITOR
