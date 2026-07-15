#!/usr/bin/env bash
# ── ZAV — push Evolution secrets + deploy from your Mac ─────────
# Usage (from /Users/brainiacx/APPS/ZAV):
#   ./scripts/push-evo.sh
# Options:
#   ./scripts/push-evo.sh --no-deploy   # only sync .evolution.local + seed .env
#   VPS=root@45.9.191.18 ./scripts/push-evo.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VPS="${VPS:-root@45.9.191.18}"
REMOTE_DIR="${REMOTE_DIR:-/opt/zuv}"
LOCAL_EVO="$ROOT/.evolution.local"
RNV_EVO="/Users/brainiacx/APPS/rnv-manger/.evolution.local"
DO_DEPLOY=1

for arg in "$@"; do
  case "$arg" in
    --no-deploy) DO_DEPLOY=0 ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

cyan()  { printf "\033[36m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }
red()   { printf "\033[31m%s\033[0m\n" "$*" >&2; }

cd "$ROOT"

# 1) Ensure local .evolution.local (prefer existing; else copy global key from rnv-manger)
if [ ! -f "$LOCAL_EVO" ] || ! grep -q '^EVOLUTION_API_KEY=.\+' "$LOCAL_EVO"; then
  if [ -f "$RNV_EVO" ] && grep -q '^EVOLUTION_API_KEY=.\+' "$RNV_EVO"; then
    cyan "── Syncing global Evolution key from rnv-manger ──"
    python3 - <<'PY'
from pathlib import Path
rnv = Path("/Users/brainiacx/APPS/rnv-manger/.evolution.local").read_text()
kv = {}
for line in rnv.splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, v = line.split("=", 1)
    kv[k.strip()] = v.strip().strip('"').strip("'")
out = "\n".join([
    "# Evolution API — global AUTHENTICATION_API_KEY (from rnv-manger)",
    "# Live instance on evoapi: renace",
    "",
    f"EVOLUTION_API_URL={kv.get('EVOLUTION_API_URL', 'https://evoapi.renace.tech')}",
    f"EVOLUTION_API_KEY={kv['EVOLUTION_API_KEY']}",
    "EVOLUTION_INSTANCE=renace",
    "",
    "ADMIN_WHATSAPP=17174156171",
    "",
])
Path("/Users/brainiacx/APPS/ZAV/.evolution.local").write_text(out)
print("wrote .evolution.local")
PY
  else
    red "Missing $LOCAL_EVO and cannot find $RNV_EVO with EVOLUTION_API_KEY"
    exit 1
  fi
fi

# Force instance name to live evoapi instance
if grep -q '^EVOLUTION_INSTANCE=' "$LOCAL_EVO"; then
  sed -i.bak 's/^EVOLUTION_INSTANCE=.*/EVOLUTION_INSTANCE=renace/' "$LOCAL_EVO" && rm -f "${LOCAL_EVO}.bak"
else
  echo "EVOLUTION_INSTANCE=renace" >> "$LOCAL_EVO"
fi

INST="$(grep '^EVOLUTION_INSTANCE=' "$LOCAL_EVO" | cut -d= -f2-)"
KEYLEN="$(grep '^EVOLUTION_API_KEY=' "$LOCAL_EVO" | cut -d= -f2- | tr -d '"' | tr -d "'" | wc -c | tr -d ' ')"
cyan "── Local Evolution ready (instance=$INST, key len=$KEYLEN) ──"

# 2) Upload secrets (one scp — no paste of keys in chat)
cyan "── Upload .evolution.local → $VPS:$REMOTE_DIR ──"
scp -o StrictHostKeyChecking=accept-new "$LOCAL_EVO" "$VPS:$REMOTE_DIR/.evolution.local"

# 3) Seed .env + optional deploy on VPS (single SSH session)
cyan "── Remote seed${DO_DEPLOY:+ + deploy} ──"
ssh -o StrictHostKeyChecking=accept-new "$VPS" bash -s -- "$REMOTE_DIR" "$DO_DEPLOY" <<'REMOTE'
set -euo pipefail
REMOTE_DIR="$1"
DO_DEPLOY="$2"
cd "$REMOTE_DIR"

# Clear stale whatsapp state (old RENACE.TECH / zav-notify)
rm -f data/whatsapp.json 2>/dev/null || true
VOL="$(docker volume ls -q | grep -E 'zav_data|zuv_zav' | head -1 || true)"
if [ -n "$VOL" ]; then
  docker run --rm -v "$VOL:/data" alpine rm -f /data/whatsapp.json 2>/dev/null || true
fi

chmod +x scripts/seed-env.sh 2>/dev/null || true
./scripts/seed-env.sh

# Show non-secret fingerprint
echo "── Evolution on server ──"
grep -E '^EVOLUTION_(API_URL|INSTANCE)=' .evolution.local .env 2>/dev/null | sed 's/^\([^:]*\):/\1: /' || true
test -n "$(grep '^EVOLUTION_API_KEY=' .env | cut -d= -f2-)" && echo "EVOLUTION_API_KEY: set" || echo "EVOLUTION_API_KEY: MISSING"

if [ "$DO_DEPLOY" = "1" ]; then
  git fetch origin main && git reset --hard origin/main
  ./deploy.sh
  git rev-parse --short HEAD
  curl -fsS https://zavinteriorclean.com/healthz && echo " OK"
fi
REMOTE

green "✅ ZAV Evolution sync done → $VPS"
green "   Admin → WhatsApp → Connect (instance renace)"
