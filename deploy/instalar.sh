#!/usr/bin/env bash
# Instala o actualiza Myo en la VPS. Se puede correr varias veces.
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

# Memoria: la de EJEMPLO si no hay base. La real (data/semilla.json) se copia a mano y no se pisa:
#   scp software/agent/data/semilla.json toki-vps:/opt/toki/repo/software/agent/data/ y correr semilla.py como toki.
if [ ! -f "$BASE/repo/software/agent/data/memoria.db" ]; then
  sudo -u toki "$BASE/venv/bin/python" "$BASE/repo/software/agent/scripts/semilla.py" --ejemplo
fi

# Configuración no secreta del agente
ORIGENES="https://$DOMINIO,http://localhost:8000,http://127.0.0.1:8000,http://localhost:8766,http://127.0.0.1:8766"
cat > "$BASE/toki.env" <<EOF
TOKI_ORIGENES=$ORIGENES
TOKI_MAX_DIA=${TOKI_MAX_DIA:-300}
EOF

if [ ! -f "$BASE/agente.env" ]; then
  echo "Falta $BASE/agente.env con CLAUDE_CODE_OAUTH_TOKEN (claude setup-token). El agente no va a responder hasta crearlo."
  touch "$BASE/agente.env"
fi
chmod 600 "$BASE/agente.env"

# ---------- agente demo (TV pública, 127.0.0.1:8792) · mismo código y credenciales, memoria ficticia ----------
# Token propio: se crea una vez y queda en caddy.env (Caddy lo agrega en /agente/ cuando no viene el del escenario).
TOKEN_DEMO=$(grep -s '^TOKI_TOKEN_DEMO=' "$BASE/caddy.env" | cut -d= -f2- || true)
[ -n "$TOKEN_DEMO" ] || TOKEN_DEMO=$(openssl rand -hex 24)
# Mismos orígenes que el agente real: el preflight CORS de la TV del escenario no trae el token y llega al demo.
( umask 077; cat > "$BASE/toki-demo.env" <<EOF
TOKI_DEMO=1
TOKI_AGENTE_PORT=8792
TOKI_DATA=$BASE/demo-data
TOKI_ORIGENES=$ORIGENES
TOKI_MAX_DIA=${TOKI_MAX_DIA_DEMO:-150}
TOKI_TOKEN=$TOKEN_DEMO
EOF
)
chown root:root "$BASE/toki-demo.env"; chmod 600 "$BASE/toki-demo.env"
# Memoria ficticia: se recarga en cada deploy (la misma semilla deja la misma base). La demo no escribe en esa carpeta.
install -d -o toki -g toki -m 700 "$BASE/demo-data"
runuser -u toki -- env TOKI_DATA="$BASE/demo-data" "$BASE/venv/bin/python" "$BASE/repo/software/agent/scripts/semilla.py" \
  --semilla "$BASE/repo/software/agent/ejemplos/semilla.demo.json" >/dev/null
cp "$BASE/repo/deploy/toki-agente-demo.service" /etc/systemd/system/toki-agente-demo.service

# ---------- wapi (WhatsApp) · gateway 3102, api 3101 y webhook-worker, todo en 127.0.0.1 ----------
WAPI_COMMIT="${WAPI_COMMIT:-4ca20d8}"
dpkg -s postgresql >/dev/null 2>&1 || apt-get install -y -qq postgresql
dpkg -s redis-server >/dev/null 2>&1 || apt-get install -y -qq redis-server
command -v bun >/dev/null || npm install -g --silent bun@1.4.2
systemctl enable -q --now postgresql redis-server
id wapi >/dev/null 2>&1 || useradd -r -m -d "$BASE/wapi-home" -s /usr/sbin/nologin wapi

git config --system --get-all safe.directory 2>/dev/null | grep -qx "$BASE/wapi" || git config --system --add safe.directory "$BASE/wapi"
[ -d "$BASE/wapi/.git" ] || git clone -q https://github.com/crafter-station/wapi.git "$BASE/wapi"
if [ "$(git -C "$BASE/wapi" rev-parse --short=7 HEAD)" != "${WAPI_COMMIT:0:7}" ]; then
  git -C "$BASE/wapi" fetch -q origin
  git -C "$BASE/wapi" checkout -q "$WAPI_COMMIT"
fi
chown -R wapi:wapi "$BASE/wapi"
runuser -u wapi -- bash -c "cd '$BASE/wapi' && bun install --frozen-lockfile --silent"

# Secretos de wapi: se crean una sola vez. Si cambia ENCRYPTION_KEY o se borra la base, hay que volver a vincular el celular.
if [ ! -s "$BASE/wapi.env" ]; then
  PW=$(openssl rand -hex 24)
  ( umask 077; cat > "$BASE/wapi.env" <<EOF
DATABASE_URL=postgres://wapi:$PW@127.0.0.1:5432/wapi
REDIS_URL=redis://127.0.0.1:6379
ENCRYPTION_KEY=$(openssl rand -hex 32)
GATEWAY_TOKEN=$(openssl rand -hex 24)
GATEWAY_URL=http://127.0.0.1:3102
PUBLIC_URL=http://127.0.0.1:3101
AUDIT_BODIES=off
EOF
  )
  if (cd /tmp && runuser -u postgres -- psql -qAt -c "select 1 from pg_roles where rolname='wapi'") | grep -q 1; then
    (cd /tmp && runuser -u postgres -- psql -q -c "alter role wapi login password '$PW'") >/dev/null
  else
    (cd /tmp && runuser -u postgres -- psql -q -c "create role wapi login password '$PW'") >/dev/null
  fi
  unset PW
fi
chown root:root "$BASE/wapi.env"; chmod 600 "$BASE/wapi.env"
(cd /tmp && runuser -u postgres -- psql -qAt -c "select 1 from pg_database where datname='wapi'") | grep -q 1 \
  || (cd /tmp && runuser -u postgres -- createdb -O wapi wapi)

# Comando de una vez como el usuario wapi, con los secretos de wapi.env (sin pasarlos por la línea de comandos)
como_wapi() {
  systemd-run --quiet --wait --pipe --uid=wapi --gid=wapi -p WorkingDirectory="$BASE/wapi" \
    -p EnvironmentFile="$BASE/wapi.env" -E PATH=/usr/local/bin:/usr/bin:/bin "$@"
}
como_wapi bun run --cwd packages/db migrate >/dev/null

# Arranques solo-local de wapi (ver deploy/wapi/)
mkdir -p "$BASE/wapi-local"
cp "$BASE/repo/deploy/wapi/solo-local.mjs" "$BASE/repo/deploy/wapi/api-local.ts" "$BASE/wapi-local/"
chmod 644 "$BASE/wapi-local/"*
for u in wapi-gateway wapi-api wapi-worker; do cp "$BASE/repo/deploy/$u.service" "/etc/systemd/system/$u.service"; done

# ---------- puente de WhatsApp (toki-puente, 127.0.0.1:8788) ----------
PUENTE_ENV="$BASE/puente.env"
( umask 077; touch "$PUENTE_ENV" )
chown root:root "$PUENTE_ENV"; chmod 600 "$PUENTE_ENV"
# Agrega la variable solo si falta: nunca pisa lo que ya está (claves de la sesión, WA_MODE=live).
pon_si_falta() { grep -q "^$1=" "$PUENTE_ENV" || printf '%s=%s\n' "$1" "$2" >> "$PUENTE_ENV"; }
pon_si_falta WA_MODE dry                      # pasa a live con deploy/vincular-whatsapp.sh, al vincular el celular
pon_si_falta PORT 8788
pon_si_falta ALLOWED_ORIGIN "https://$DOMINIO"
# El monitor MyoWare del escenario (TV en http://127.0.0.1:8766) también usa este puente: se agrega si falta.
grep -q '^ALLOWED_ORIGIN=.*127.0.0.1:8766' "$PUENTE_ENV" || sed -i 's#^ALLOWED_ORIGIN=\(.*\)#ALLOWED_ORIGIN=\1,http://127.0.0.1:8766#' "$PUENTE_ENV"
pon_si_falta PUBLIC_HOST "$DOMINIO"
pon_si_falta WAPI_BASE_URL http://127.0.0.1:3101
pon_si_falta AGENT_URL http://127.0.0.1:8790
pon_si_falta PROFILE "$BASE/puente/profile.json"
pon_si_falta WOKI_API_TOKEN "$(openssl rand -hex 24)"
pon_si_falta WAPI_WEBHOOK_SECRET "$(openssl rand -hex 32)"   # vincular.ts lo reemplaza por el secreto de la sesión
if ! grep -q '^WAPI_PAT=' "$PUENTE_ENV"; then
  PAT=$(como_wapi bun ops/seed-ci.ts | tail -n 1)
  [ -n "$PAT" ] && printf 'WAPI_PAT=%s\n' "$PAT" >> "$PUENTE_ENV"
  unset PAT
fi

# Lista blanca: la de EJEMPLO. Los contactos reales se eligen desde la TV (no están en git).
install -d -o toki -g toki -m 700 "$BASE/puente"
[ -f "$BASE/puente/profile.json" ] || install -o toki -g toki -m 600 "$BASE/repo/software/whatsapp-bridge/profile.example.json" "$BASE/puente/profile.json"
runuser -u toki -- bash -c "cd '$BASE/repo/software/whatsapp-bridge' && npm ci --silent --no-audit --no-fund"
cp "$BASE/repo/deploy/toki-puente.service" /etc/systemd/system/toki-puente.service

# El agente público exige el mismo token del puente (TOKI_TOKEN); el puente lo llama directo, sin token.
printf 'TOKI_TOKEN=%s\n' "$(grep '^WOKI_API_TOKEN=' "$PUENTE_ENV" | cut -d= -f2-)" >> "$BASE/toki.env"
chmod 600 "$BASE/toki.env"

cp "$BASE/repo/deploy/toki-agente.service" /etc/systemd/system/toki-agente.service
# Huellas de voz (software/voces): Python 3.12 aparte, porque torch no tiene ruedas para el 3.14 del sistema.
# torch solo CPU (1,3 GB; la versión con GPU pesa 5 GB) y webrtcvad ya compilado (la VPS no tiene compilador de C).
# El Python que baja uv va a $BASE/python (no a /root): el servicio corre como el usuario toki.
export PATH="/root/.local/bin:$PATH" UV_PYTHON_INSTALL_DIR="$BASE/python"
command -v uv >/dev/null || curl -LsSf https://astral.sh/uv/install.sh | sh >/dev/null
if ! sudo -u toki "$BASE/voces-venv/bin/python" -c "import resemblyzer" 2>/dev/null; then
  rm -rf "$BASE/voces-venv"
  uv venv -q --python 3.12 "$BASE/voces-venv"
  uv pip install -q --python "$BASE/voces-venv/bin/python" --index-url https://download.pytorch.org/whl/cpu "torch==2.*"
  uv pip install -q --python "$BASE/voces-venv/bin/python" webrtcvad-wheels numpy scipy librosa
  uv pip install -q --python "$BASE/voces-venv/bin/python" --no-deps resemblyzer==0.1.4
fi
cp "$BASE/repo/deploy/toki-voces.service" /etc/systemd/system/toki-voces.service
# /equipo/: contraseña del equipo (se crea una vez; verla con: cat /opt/toki/equipo.clave) y token para Caddy
if [ ! -s "$BASE/equipo.clave" ]; then ( umask 077; openssl rand -base64 18 | tr -d '/+=' > "$BASE/equipo.clave" ); fi
( umask 077; {
  printf 'TOKI_TOKEN=%s\n' "$(grep '^WOKI_API_TOKEN=' "$PUENTE_ENV" | cut -d= -f2-)"
  printf 'TOKI_EQUIPO_HASH=%s\n' "$(caddy hash-password --plaintext "$(cat "$BASE/equipo.clave")")"
  printf 'TOKI_TOKEN_DEMO=%s\n' "$TOKEN_DEMO"
} > "$BASE/caddy.env" )
mkdir -p /etc/systemd/system/caddy.service.d
printf '[Service]\nEnvironment=TOKI_DOMINIO=%s\nEnvironmentFile=%s/caddy.env\n' "$DOMINIO" "$BASE" > /etc/systemd/system/caddy.service.d/toki.conf
# Se guarda el Caddyfile anterior: si el nuevo no es válido, Caddy sigue con ese (ver el cierre).
[ -f /etc/caddy/Caddyfile ] && cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.anterior
cp "$BASE/repo/deploy/Caddyfile" /etc/caddy/Caddyfile

systemctl daemon-reload
systemctl enable -q --now toki-agente
systemctl restart toki-agente
systemctl enable -q toki-agente-demo
systemctl restart toki-agente-demo
systemctl enable -q toki-voces
systemctl restart toki-voces
# wapi solo se reinicia si está apagado o con TOKI_REINICIAR_WAPI=1: reiniciar el gateway corta WhatsApp unos segundos
# y la TV muestra "WhatsApp se desconectó". Un deploy de Myo no cambia wapi.
for u in wapi-gateway wapi-api wapi-worker; do
  systemctl enable -q "$u"
  if [ "${TOKI_REINICIAR_WAPI:-0}" = 1 ]; then systemctl restart "$u"; else systemctl start "$u"; fi
done
# Si la sesión ya está vinculada, el webhook queda apuntando al puente local (idempotente)
if grep -q '^WAPI_SESSION_ID=' "$PUENTE_ENV"; then
  sleep 5
  ( cd "$BASE/repo/software/whatsapp-bridge" && set -a && . "$PUENTE_ENV" && set +a \
    && ./node_modules/.bin/tsx setup-webhook.ts "http://127.0.0.1:8788" >/dev/null ) || echo "No se pudo registrar el webhook de wapi"
fi
systemctl enable -q toki-puente
systemctl restart toki-puente
# ---------- cierre de la VPS ----------
# SSH solo con llave (la del equipo ya está en /root/.ssh/authorized_keys) y firewall: 22, 80 y 443.
if [ -s /root/.ssh/authorized_keys ]; then
  printf 'PasswordAuthentication no\nKbdInteractiveAuthentication no\nPermitRootLogin prohibit-password\n' > /etc/ssh/sshd_config.d/10-toki.conf
  sshd -t && systemctl reload ssh
fi
if command -v ufw >/dev/null; then
  ufw allow 22/tcp >/dev/null; ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null
  ufw --force enable >/dev/null
fi

systemctl enable -q caddy
# Valida el Caddyfile con las mismas variables que usa el servicio (caddy.env). Si falla, vuelve el anterior.
if systemd-run --quiet --wait --pipe -p EnvironmentFile="$BASE/caddy.env" -E TOKI_DOMINIO="$DOMINIO" -E HOME=/root \
     "$(command -v caddy)" validate --config /etc/caddy/Caddyfile --adapter caddyfile > /tmp/caddy-validar.log 2>&1; then
  systemctl restart caddy
else
  echo "El Caddyfile nuevo no es válido (ver /tmp/caddy-validar.log). Caddy sigue con el anterior."
  if [ -f /etc/caddy/Caddyfile.anterior ]; then cp /etc/caddy/Caddyfile.anterior /etc/caddy/Caddyfile; fi
fi

sleep 3
echo "agente: $(systemctl is-active toki-agente) · agente demo: $(systemctl is-active toki-agente-demo) · voces: $(systemctl is-active toki-voces) · caddy: $(systemctl is-active caddy)"
echo "wapi: gateway $(systemctl is-active wapi-gateway) · api $(systemctl is-active wapi-api) · worker $(systemctl is-active wapi-worker) · puente: $(systemctl is-active toki-puente) ($(grep '^WA_MODE=' "$PUENTE_ENV" | cut -d= -f2))"
echo "URL: https://$DOMINIO"
