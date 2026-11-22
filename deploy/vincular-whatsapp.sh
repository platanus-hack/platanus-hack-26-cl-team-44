#!/usr/bin/env bash
# Vincula el celular de WhatsApp a wapi en la VPS y deja el puente en modo live.
#   ssh -t toki-vps 'bash /opt/toki/repo/deploy/vincular-whatsapp.sh +569XXXXXXXX'
# 1) vincular.ts dibuja el QR en esta terminal (y en /opt/toki/puente/qr.html) y espera 3 min al escaneo.
# 2) Guarda WAPI_SESSION_ID, WAPI_API_KEY y WAPI_WEBHOOK_SECRET en /opt/toki/puente.env (sin mostrarlos).
# 3) Registra el webhook en http://127.0.0.1:8788/webhook/wapi, pasa a WA_MODE=live y reinicia toki-puente.
# No manda ningún mensaje. Se puede repetir: reutiliza la sesión del mismo número.
set -euo pipefail

TEL="${1:?pasa el número del celular con +, por ejemplo +569XXXXXXXX}"
ENV_FILE=/opt/toki/puente.env
PUENTE=/opt/toki/repo/software/whatsapp-bridge
[ "$(id -u)" = 0 ] || { echo "Córrelo como root (lee $ENV_FILE)"; exit 1; }
systemctl is-active -q wapi-api wapi-gateway || { echo "wapi no está corriendo: systemctl status wapi-api wapi-gateway"; exit 1; }

cd "$PUENTE"
set -a; . "$ENV_FILE"; set +a
ENV_FILE="$ENV_FILE" QR_FILE=/opt/toki/puente/qr.html ./node_modules/.bin/tsx vincular.ts "$TEL"

set -a; . "$ENV_FILE"; set +a
./node_modules/.bin/tsx setup-webhook.ts "http://127.0.0.1:${PORT:-8788}"

sed -i 's/^WA_MODE=.*/WA_MODE=live/' "$ENV_FILE"
chmod 600 "$ENV_FILE"
systemctl restart toki-puente
sleep 3
systemctl is-active toki-puente
curl -s -H "X-Woki-Token: $WOKI_API_TOKEN" "http://127.0.0.1:${PORT:-8788}/api/wa/health" | sed -E 's/"contacts":\[[^]]*\]/"contacts":[…]/'
echo
