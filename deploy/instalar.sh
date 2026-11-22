#!/usr/bin/env bash
# Instala o actualiza Toki en la VPS. Se puede correr varias veces.
#   sudo TOKI_DOMINIO=179-66-157-161.sslip.io TOKI_RAMA=feat/agente-whatsapp bash deploy/instalar.sh
set -euo pipefail

DOMINIO="${TOKI_DOMINIO:?falta TOKI_DOMINIO, por ejemplo 179-66-157-161.sslip.io}"
RAMA="${TOKI_RAMA:-main}"
REPO_URL="https://github.com/platanus-hack/platanus-hack-26-cl-team-44.git"
BASE=/opt/toki

export DEBIAN_FRONTEND=noninteractive
command -v caddy >/dev/null || apt-get install -y -qq caddy
command -v node >/dev/null || apt-get install -y -qq nodejs npm
command -v claude >/dev/null || npm install -g --silent @anthropic-ai/claude-code
dpkg -s python3-venv >/dev/null 2>&1 || apt-get install -y -qq python3-venv
id toki >/dev/null 2>&1 || useradd -m -s /bin/bash toki

mkdir -p "$BASE"
# El repo es del usuario toki; root lo actualiza sin el error "dubious ownership".
git config --system --get-all safe.directory 2>/dev/null | grep -qx "$BASE/repo" || git config --system --add safe.directory "$BASE/repo"
if [ ! -d "$BASE/repo/.git" ]; then
  git clone -q "$REPO_URL" "$BASE/repo"
fi
git -C "$BASE/repo" fetch -q origin "$RAMA"
git -C "$BASE/repo" checkout -q -B "$RAMA" "origin/$RAMA"
chown -R toki:toki "$BASE/repo"

[ -d "$BASE/venv" ] || python3 -m venv "$BASE/venv"
"$BASE/venv/bin/pip" install -q -r "$BASE/repo/software/agent/requirements.txt"

# Memoria con la semilla de EJEMPLO (persona ficticia). Nunca la de la usuaria real.
if [ ! -f "$BASE/repo/software/agent/data/memoria.db" ]; then
  sudo -u toki "$BASE/venv/bin/python" "$BASE/repo/software/agent/scripts/semilla.py" --ejemplo
fi

# Configuración no secreta del agente
cat > "$BASE/toki.env" <<EOF
TOKI_ORIGENES=https://$DOMINIO,http://localhost:8000,http://127.0.0.1:8000,http://localhost:8766,http://127.0.0.1:8766
TOKI_MAX_DIA=${TOKI_MAX_DIA:-300}
EOF

if [ ! -f "$BASE/agente.env" ]; then
  echo "Falta $BASE/agente.env con CLAUDE_CODE_OAUTH_TOKEN (claude setup-token). El agente no va a responder hasta crearlo."
  touch "$BASE/agente.env"
fi
chmod 600 "$BASE/agente.env"

cp "$BASE/repo/deploy/toki-agente.service" /etc/systemd/system/toki-agente.service
mkdir -p /etc/systemd/system/caddy.service.d
printf '[Service]\nEnvironment=TOKI_DOMINIO=%s\n' "$DOMINIO" > /etc/systemd/system/caddy.service.d/toki.conf
cp "$BASE/repo/deploy/Caddyfile" /etc/caddy/Caddyfile

systemctl daemon-reload
systemctl enable -q --now toki-agente
systemctl restart toki-agente
systemctl enable -q caddy
systemctl restart caddy

sleep 3
echo "agente: $(systemctl is-active toki-agente) · caddy: $(systemctl is-active caddy)"
echo "URL: https://$DOMINIO"
