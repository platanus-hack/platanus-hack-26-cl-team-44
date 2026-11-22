#!/usr/bin/env bash
# Escenario: el MyoWare va al computador; WhatsApp, agente y memoria están en la VPS.
# Doble clic en Toki.command (o: make escena). Sin argumentos busca solo el MyoWare por USB.
#
#   bash deploy/escena.sh                                   # busca /dev/cu.usbmodem* o /dev/ttyACM*
#   bash deploy/escena.sh --serial-port /dev/cu.usbmodem1101
#   bash deploy/escena.sh --ble-jaw MyoJaw --ble-brow MyoBrow
#
# Variables de entorno (o deploy/escena.env, que git ignora):
#   TOKI_REMOTO     URL de la VPS (por defecto https://179-66-157-161.sslip.io)
#   TOKI_WA_TOKEN   token del puente; si falta, se lee de la VPS con 'ssh toki-vps'
# El token nunca va en una URL: el monitor se lo entrega a la TV en /toki-config.js.
# Funciona en macOS y Linux (el monitor usa termios: en Windows, correrlo dentro de WSL).
set -uo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
[ -f "$RAIZ/deploy/escena.env" ] && { set -a; . "$RAIZ/deploy/escena.env"; set +a; }
REMOTO="${TOKI_REMOTO:-https://179-66-157-161.sslip.io}"
PUERTO=8766
ok() { printf '  ✅ %s\n' "$1"; }
ko() { printf '  ❌ %s\n' "$1"; }
fin() { echo; read -r -p "Enter para cerrar…" _ </dev/tty 2>/dev/null; exit 1; }

echo "Toki · escenario"
echo

# 1) Sensor: argumentos dados, o el primer puerto USB que aparezca
ARGS=("$@")
if [ ${#ARGS[@]} -eq 0 ]; then
  PUERTOS=(/dev/cu.usbmodem* /dev/ttyACM* /dev/ttyUSB*)
  SERIAL=""
  for p in "${PUERTOS[@]}"; do [ -e "$p" ] && { SERIAL="$p"; break; }; done
  if [ -n "$SERIAL" ]; then ARGS=(--serial-port "$SERIAL"); ok "MyoWare por USB: $SERIAL"
  else ko "No encuentro el MyoWare por USB. Revisa el cable o usa: bash deploy/escena.sh --ble-jaw … --ble-brow …"; fin; fi
fi

# 2) Token del puente: del entorno, o de la VPS por SSH
TOKEN="${TOKI_WA_TOKEN:-}"
[ -n "$TOKEN" ] || TOKEN="$(ssh -o ConnectTimeout=8 toki-vps "grep '^WOKI_API_TOKEN=' /opt/toki/puente.env | cut -d= -f2-" 2>/dev/null || true)"
if [ -n "$TOKEN" ]; then ok "Token del puente"; else ko "Sin token: define TOKI_WA_TOKEN en deploy/escena.env o configura 'ssh toki-vps'"; fin; fi

# 3) La VPS responde: WhatsApp y agente
wa=$(curl -s -m 8 -H "X-Woki-Token: $TOKEN" "$REMOTO/wa/api/wa/health" || true)
case "$wa" in *'"session":"connected"'*) ok "WhatsApp conectado en la VPS";; *) ko "WhatsApp no responde en $REMOTO (la TV va a mostrar 'sin conexión')";; esac
ag=$(curl -s -m 8 -H "X-Woki-Token: $TOKEN" "$REMOTO/agente/api/salud" || true)
case "$ag" in *'"ok": true'*) ok "Agente con memoria en la VPS";; *) ko "El agente no responde en $REMOTO";; esac

# 4) Monitor MyoWare: sirve la TV y los gestos
TOKI_REMOTO="$REMOTO" TOKI_WA_TOKEN="$TOKEN" python3 "$RAIZ/software/myoware-monitor/server.py" --http-port "$PUERTO" "${ARGS[@]}" &
MONITOR=$!
unset TOKEN
trap 'kill $MONITOR 2>/dev/null' EXIT INT TERM
listo=""
for _ in $(seq 1 30); do
  kill -0 $MONITOR 2>/dev/null || break
  curl -s -o /dev/null "http://127.0.0.1:$PUERTO/woki-os.html" && { listo=1; break; }
  sleep 0.5
done
if [ -n "$listo" ]; then ok "Monitor en http://127.0.0.1:$PUERTO"; else ko "El monitor no arrancó (¿el puerto $PUERTO está ocupado?)"; fin; fi
sleep 1
case "$(curl -s -m 3 "http://127.0.0.1:$PUERTO/data" || true)" in *'"connected": true'*|*'"connected":true'*) ok "Sensor enviando datos";; *) ko "El sensor no manda datos todavía (revisa que estén en modo ENV)";; esac

# 5) Chrome con su propio perfil (guarda la calibración entre ensayos) y en pantalla completa
URL="http://127.0.0.1:$PUERTO/woki-os.html"
PERFIL="$HOME/.toki-chrome"
if [ -d "/Applications/Google Chrome.app" ]; then
  open -na "Google Chrome" --args --user-data-dir="$PERFIL" --no-first-run --start-fullscreen "$URL"
elif command -v google-chrome >/dev/null; then
  google-chrome --user-data-dir="$PERFIL" --no-first-run --start-fullscreen "$URL" >/dev/null 2>&1 &
else
  echo "  Abre en Chrome: $URL"
fi
echo
echo "Listo. Deja esta ventana abierta; Ctrl+C la cierra y apaga el monitor."
wait $MONITOR
