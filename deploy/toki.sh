#!/usr/bin/env bash
# Comandos del equipo para la VPS y el escenario. Usa 'ssh toki-vps' (llave SSH del equipo).
#
#   bash deploy/toki.sh deploy [rama]   despliega (por defecto main) y deja todo corriendo
#   bash deploy/toki.sh estado          servicios, WhatsApp y agente en una pantalla
#   bash deploy/toki.sh logs [servicio] últimas 50 líneas (toki-puente, toki-agente, wapi-gateway, caddy)
#   bash deploy/toki.sh semilla         sube software/agent/data/semilla.json (la memoria real) y la carga
#   bash deploy/toki.sh rotar-token     cambia el token del puente (si se filtró) y reinicia lo necesario
#   bash deploy/toki.sh clave           copia la contraseña de /equipo/ al portapapeles (usuario: equipo)
#   bash deploy/toki.sh escena          arranca el escenario (igual que doble clic en Myo.command)
#   bash deploy/toki.sh rappi           abre el login oficial de Rappi (Colombia por defecto) y guarda la sesión local
#   bash deploy/toki.sh llave "ssh-ed25519 AAAA… nombre"   autoriza la llave SSH de otra persona del equipo en la VPS
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
VPS="${TOKI_VPS:-toki-vps}"
DOMINIO="${TOKI_DOMINIO:-179-66-157-161.sslip.io}"
cmd="${1:-ayuda}"; shift || true

en_vps() { ssh -o ConnectTimeout=10 "$VPS" "$@"; }

case "$cmd" in
  deploy)
    rama="${1:-main}"
    # Primero actualiza el repo y después corre el instalador ya actualizado (no una copia vieja de sí mismo).
    en_vps "cd /opt/toki/repo && git fetch -q origin && git checkout -q -B '$rama' 'origin/$rama' && git log --oneline -1 \
      && TOKI_DOMINIO='$DOMINIO' TOKI_RAMA='$rama' bash deploy/instalar.sh > /tmp/instalar.log 2>&1 \
      && tail -2 /tmp/instalar.log || { echo 'Falló el instalador. Últimas líneas:'; tail -20 /tmp/instalar.log; exit 1; }"
    ;;
  estado)
    en_vps 'for u in caddy toki-agente toki-puente wapi-gateway wapi-api wapi-worker; do printf "%-14s %s\n" "$u" "$(systemctl is-active $u)"; done
      set -a; . /opt/toki/puente.env; set +a
      curl -s -m 5 -H "X-Myo-Token: $WOKI_API_TOKEN" 127.0.0.1:8788/api/wa/health | python3 -c "import json,sys; d=json.load(sys.stdin); print(\"whatsapp      \", d[\"mode\"], d[\"session\"], \"· envíos hoy\", d[\"sentToday\"])" || echo "whatsapp       sin respuesta"
      curl -s -m 5 127.0.0.1:8790/api/salud | python3 -c "import json,sys; d=json.load(sys.stdin); print(\"agente        \", d[\"usuaria\"], \"·\", d[\"personas\"], \"personas · uso hoy\", d[\"uso_hoy\"], \"·\", \" \".join(x[\"id\"]+\"=\"+x[\"estado\"] for x in d[\"disparadores\"]))" || echo "agente         sin respuesta"
      git -C /opt/toki/repo log --oneline -1 | sed "s/^/código         /"'
    ;;
  logs)
    en_vps "journalctl -u '${1:-toki-puente}' -n 50 --no-pager -o short-iso"
    ;;
  semilla)
    f="$RAIZ/software/agent/data/semilla.json"
    [ -f "$f" ] || { echo "No existe $f (la memoria real no está en git)."; exit 1; }
    scp -q "$f" "$VPS:/opt/toki/repo/software/agent/data/semilla.json"
    en_vps 'cd /opt/toki/repo/software/agent && chown toki:toki data/semilla.json && chmod 600 data/semilla.json \
      && sudo -u toki /opt/toki/venv/bin/python scripts/semilla.py | tail -1 && systemctl restart toki-agente'
    ;;
  tarjetas)
    # Tarjetas propias de la usuaria (fuera de git). El agente las lee en cada pedido: no hace falta reiniciar.
    f="$RAIZ/software/agent/data/tarjetas.json"
    [ -f "$f" ] || { echo "No existe $f (las tarjetas propias no están en git)."; exit 1; }
    python3 -c "import json,sys; d=json.load(open(sys.argv[1])); assert isinstance(d.get('tarjetas'), list)" "$f" \
      || { echo "$f no es válido: debe ser {\"tarjetas\": [...]}"; exit 1; }
    scp -q "$f" "$VPS:/opt/toki/repo/software/agent/data/tarjetas.json"
    en_vps 'chown toki:toki /opt/toki/repo/software/agent/data/tarjetas.json && chmod 600 /opt/toki/repo/software/agent/data/tarjetas.json && echo "tarjetas subidas"'
    ;;
  rotar-token)
    en_vps 'set -e; T=$(openssl rand -hex 24); sed -i "s/^WOKI_API_TOKEN=.*/WOKI_API_TOKEN=$T/" /opt/toki/puente.env; unset T; echo "token nuevo guardado"'
    "$0" deploy "$(en_vps 'git -C /opt/toki/repo rev-parse --abbrev-ref HEAD')"
    echo "Listo. El escenario lo toma solo la próxima vez que abras Myo.command."
    ;;
  clave)
    en_vps 'cat /opt/toki/equipo.clave' | tr -d '\n' | pbcopy
    echo "Contraseña de https://$DOMINIO/equipo/ copiada al portapapeles. Usuario: equipo"
    ;;
  escena)
    exec bash "$RAIZ/deploy/escena.sh" "$@"
    ;;
  llave)
    k="${1:-}"
    [[ "$k" =~ ^ssh-(ed25519|rsa)\ [A-Za-z0-9+/=]{60,}( .*)?$ ]] || { echo 'Pásame la llave PÚBLICA completa (empieza con ssh-ed25519 o ssh-rsa), entre comillas.'; exit 1; }
    printf '%s\n' "$k" | en_vps 'k=$(cat); grep -qxF "$k" /root/.ssh/authorized_keys || printf "%s\n" "$k" >> /root/.ssh/authorized_keys; echo "llaves autorizadas: $(grep -c . /root/.ssh/authorized_keys)"'
    ;;
  rappi)
    [ -d "$RAIZ/software/apps-bridge/node_modules" ] || npm ci --silent --no-audit --no-fund --prefix "$RAIZ/software/apps-bridge"
    TOKI_RAPPI_PAIS="${TOKI_RAPPI_PAIS:-co}" node "$RAIZ/software/apps-bridge/connectors/rappi-login.mjs"
    ;;
  *)
    sed -n '2,13p' "$0"
    ;;
esac
