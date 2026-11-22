#!/usr/bin/env bash
# Escenario: el MyoWare va al computador; WhatsApp, agente y memoria están en la VPS.
# Doble clic en Myo.command (o: make escena). Sin argumentos busca solo el MyoWare por USB.
#
#   bash deploy/escena.sh                                   # busca /dev/cu.usbmodem* o /dev/ttyACM*
#   bash deploy/escena.sh --serial-port /dev/cu.usbmodem1101
#   bash deploy/escena.sh --ble-jaw MyoJaw --ble-brow MyoBrow
#
# Variables de entorno (o deploy/escena.env, que git ignora):
#   TOKI_REMOTO     URL de la VPS (por defecto https://179-66-157-161.sslip.io)
#   TOKI_WA_TOKEN   token del puente; si falta, se lee de la VPS con 'ssh toki-vps'
#   TOKI_RAPPI_PAIS co (Bogotá, por defecto) o cl (Santiago), para apps-bridge (Rappi)
# El token nunca va en una URL: el monitor se lo entrega a la TV en /toki-config.js.
# Funciona en macOS y Linux (el monitor usa termios: en Windows, correrlo dentro de WSL).
set -uo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
[ -f "$RAIZ/deploy/escena.env" ] && { set -a; . "$RAIZ/deploy/escena.env"; set +a; }
REMOTO="${TOKI_REMOTO:-https://179-66-157-161.sslip.io}"
PUERTO=8766
APPS_PUERTO=8793                       # apps-bridge (Rappi, Spotify…); 8790 es el del agente
RAPPI_PAIS="${TOKI_RAPPI_PAIS:-co}"
ok() { printf '  ✅ %s\n' "$1"; }
ko() { printf '  ❌ %s\n' "$1"; }
fin() { echo; read -r -p "Enter para cerrar…" _ </dev/tty 2>/dev/null; exit 1; }

echo "Myo · escenario"
echo

# 1) Sensor: argumentos dados, o el primer puerto USB que aparezca
ARGS=("$@")
if [ ${#ARGS[@]} -eq 0 ]; then
  PUERTOS=(/dev/cu.usbserial* /dev/cu.wchusbserial* /dev/cu.usbmodem* /dev/ttyACM* /dev/ttyUSB*)   # UNO original: usbmodem; clones: usbserial/wchusbserial
  SERIAL=""
  for p in "${PUERTOS[@]}"; do [ -e "$p" ] && { SERIAL="$p"; break; }; done
  if [ -n "$SERIAL" ]; then ARGS=(--serial-port "$SERIAL"); ok "MyoWare por USB: $SERIAL"
  else
    # Sin USB: intenta los MyoWare por Bluetooth. Si tampoco están, la TV sigue funcionando con teclado y mouse.
    ARGS=(--ble-jaw "${TOKI_BLE_JAW:-MyoWareMandibula}" --ble-brow "${TOKI_BLE_BROW:-MyoWareCeja}")
    ko "Sin MyoWare por USB: intento Bluetooth (${ARGS[1]}, ${ARGS[3]}). Sin sensor: Espacio = ceja, J = mandíbula"
  fi
fi

# 2) Token del puente: del entorno, o de la VPS por SSH
TOKEN="${TOKI_WA_TOKEN:-}"
[ -n "$TOKEN" ] || TOKEN="$(ssh -o ConnectTimeout=8 toki-vps "grep '^WOKI_API_TOKEN=' /opt/toki/puente.env | cut -d= -f2-" 2>/dev/null || true)"
if [ -n "$TOKEN" ]; then ok "Token del puente"; else ko "Sin token: define TOKI_WA_TOKEN en deploy/escena.env o configura 'ssh toki-vps'"; fin; fi

# 3) La VPS responde: WhatsApp y agente
wa=$(curl -s -m 8 -H "X-Myo-Token: $TOKEN" "$REMOTO/wa/api/wa/health" || true)
case "$wa" in *'"session":"connected"'*) ok "WhatsApp conectado en la VPS";; *) ko "WhatsApp no responde en $REMOTO (la TV va a mostrar 'sin conexión')";; esac
ag=$(curl -s -m 8 -H "X-Myo-Token: $TOKEN" "$REMOTO/agente/api/salud" || true)
case "$ag" in *'"ok": true'*) ok "Agente con memoria en la VPS";; *) ko "El agente no responde en $REMOTO";; esac

# Spotify: macOS pide permiso de Automatización la primera vez. El aviso solo sale desde una terminal en primer plano.
if [ -d /Applications/Spotify.app ]; then
  if osascript -e 'tell application "Spotify" to player state' >/dev/null 2>&1; then ok "Spotify: permiso para controlarlo"
  else ko "Spotify: falta permiso. Acepta el aviso de macOS, o Ajustes › Privacidad y seguridad › Automatización › Terminal › Spotify"; fi
fi

# 4) apps-bridge local: Rappi (arma el carrito con la cuenta conectada; no paga) y los demás servicios
APPS=""
if command -v node >/dev/null; then
  [ -d "$RAIZ/software/apps-bridge/node_modules" ] || npm ci --silent --no-audit --no-fund --prefix "$RAIZ/software/apps-bridge" >/dev/null 2>&1
  TOKI_APPS_PORT=$APPS_PUERTO TOKI_RAPPI_PAIS="$RAPPI_PAIS" node "$RAIZ/software/apps-bridge/server.mjs" >/tmp/toki-apps.log 2>&1 &
  APPS=$!
  for _ in $(seq 1 20); do curl -s -o /dev/null "http://127.0.0.1:$APPS_PUERTO/" && break; sleep 0.5; done
  if curl -s -o /dev/null "http://127.0.0.1:$APPS_PUERTO/"; then ok "Servicios (Rappi $RAPPI_PAIS) en http://127.0.0.1:$APPS_PUERTO"; else ko "apps-bridge no arrancó (log: /tmp/toki-apps.log)"; fi
else
  ko "Falta Node: sin Rappi ni servicios"
fi

# 5) Monitor MyoWare: sirve la TV y los gestos
# Bluetooth necesita Bleak. Si el python3 del sistema no lo tiene, uv lo trae sin instalar nada global.
PY=(python3)
if [[ " ${ARGS[*]} " == *" --ble-"* ]] && ! python3 -c "import bleak" 2>/dev/null; then
  if command -v uv >/dev/null; then PY=(uv run --no-project --quiet --with bleak python); ok "Bleak vía uv (MyoWare por Bluetooth)"
  else ko "Falta Bleak para el MyoWare por Bluetooth: python3 -m pip install --user bleak (o instala uv)"; fi
fi
TOKI_APPS_URL="http://127.0.0.1:$APPS_PUERTO" TOKI_REMOTO="$REMOTO" TOKI_WA_TOKEN="$TOKEN" "${PY[@]}" "$RAIZ/software/myoware-monitor/server.py" --http-port "$PUERTO" "${ARGS[@]}" &
MONITOR=$!
unset TOKEN
trap 'kill $MONITOR $APPS 2>/dev/null' EXIT INT TERM
listo=""
for _ in $(seq 1 90); do   # la primera vez uv descarga Bleak
  kill -0 $MONITOR 2>/dev/null || break
  curl -s -o /dev/null "http://127.0.0.1:$PUERTO/woki-os.html" && { listo=1; break; }
  sleep 0.5
done
if [ -n "$listo" ]; then ok "Monitor en http://127.0.0.1:$PUERTO"; else ko "El monitor no arrancó (¿el puerto $PUERTO está ocupado?)"; fin; fi
sleep 1
case "$(curl -s -m 3 "http://127.0.0.1:$PUERTO/data" || true)" in *'"connected": true'*|*'"connected":true'*) ok "Sensor enviando datos";; *) ko "El sensor no manda datos: sin MyoWare, usa Espacio = ceja y J = mandíbula (si es Bluetooth, revisa Ajustes › Privacidad › Bluetooth)";; esac

# 6) Chrome con su propio perfil (guarda la calibración entre ensayos) y en pantalla completa
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
