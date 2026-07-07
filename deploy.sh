#!/usr/bin/env bash
# ── ZAV Interior & Clean — Renace Protocol deploy.sh ─────────
#  Usage on VPS:
#      cd /opt/zuv && ./deploy.sh
#  First run: clones the repo into PROJECT_DIR, then deploys.
#
#  Stack: zuv  ·  Domain: zavinteriorclean.com  ·  Network: RenaceNet
#  Repo:  https://github.com/ExpertosTI/ZUV

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/ExpertosTI/ZUV.git}"
PROJECT_DIR="${PROJECT_DIR:-/opt/zuv}"
STACK_NAME="${STACK_NAME:-zuv}"
SERVICE_NAME="${STACK_NAME}_web"
DOMAIN="${DOMAIN:-zavinteriorclean.com}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"

cyan()  { printf "\033[36m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }
red()   { printf "\033[31m%s\033[0m\n" "$*" >&2; }

cyan "── 1. Sync source ($DEPLOY_BRANCH) ─────────────"
if [ -d "$PROJECT_DIR/.git" ]; then
  cd "$PROJECT_DIR"
  git fetch origin "$DEPLOY_BRANCH"
  git checkout "$DEPLOY_BRANCH" 2>/dev/null || git checkout -b "$DEPLOY_BRANCH" "origin/$DEPLOY_BRANCH"
  git reset --hard "origin/$DEPLOY_BRANCH"
else
  git clone --branch "$DEPLOY_BRANCH" "$REPO_URL" "$PROJECT_DIR"
  cd "$PROJECT_DIR"
fi

cyan "── 2. Load secrets (.env) ─────────────────────"
# Safe KEY=VALUE loader (handles spaces, &, quotes — never `source`s the file)
load_env_file() {
  local file="$1" line key val
  [ -f "$file" ] || return 0
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"
    case "$line" in
      ''|\#*) continue ;;
    esac
    key="${line%%=*}"
    val="${line#*=}"
    key="${key%"${key##*[![:space:]]}"}"
    key="${key#"${key%%[![:space:]]*}"}"
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    if [[ "$val" =~ ^\"(.*)\"$ ]]; then val="${BASH_REMATCH[1]}"
    elif [[ "$val" =~ ^\'(.*)\'$ ]]; then val="${BASH_REMATCH[1]}"
    fi
    export "$key=$val"
  done < "$file"
}
load_env_file "$PROJECT_DIR/.env"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-04J27}"
export SMTP_USER="${SMTP_USER:-hello@zavinteriorclean.com}"
# @zavinteriorclean.com uses Google Workspace — auto-resolve to Gmail SMTP unless SMTP_PROFILE=hostinger
export SMTP_PROFILE="${SMTP_PROFILE:-}"
if [[ -z "$SMTP_PROFILE" && "$SMTP_USER" == *"@zavinteriorclean.com" ]]; then
  export SMTP_HOST="${SMTP_HOST:-smtp.gmail.com}"
  export SMTP_PORT="${SMTP_PORT:-587}"
elif [[ "$SMTP_PROFILE" == "hostinger" ]]; then
  export SMTP_HOST="${SMTP_HOST:-smtp.hostinger.com}"
  export SMTP_PORT="${SMTP_PORT:-465}"
else
  export SMTP_HOST="${SMTP_HOST:-smtp.gmail.com}"
  export SMTP_PORT="${SMTP_PORT:-587}"
fi
export SMTP_PASS="${SMTP_PASS:-}"
export SMTP_FROM_NAME="${SMTP_FROM_NAME:-ZAV Interior & Clean}"
export SMTP_REPLY_TO="${SMTP_REPLY_TO:-hello@zavinteriorclean.com}"
export PUBLIC_SITE_URL="${PUBLIC_SITE_URL:-https://zavinteriorclean.com}"
export ADMIN_EMAIL="${ADMIN_EMAIL:-azhaliaestepan@gmail.com}"

if [ -z "$SMTP_PASS" ] || [[ "$SMTP_PASS" =~ TU_APP_PASSWORD|YOUR_GOOGLE|changeme ]]; then
  red "WARNING: SMTP_PASS is missing or still a placeholder in /opt/zuv/.env"
fi
if [ -n "$SMTP_PASS" ]; then
  cyan "   SMTP user: $SMTP_USER  pass: set (${#SMTP_PASS} chars)"
else
  red "   SMTP pass: NOT SET — quote emails will not send"
fi

cyan "── 3. Build image (low priority) ──────────────"
export DOCKER_BUILDKIT=1
nice -n 19 ionice -c 3 docker compose build --pull

cyan "── 4. Ensure RenaceNet exists ─────────────────"
if ! docker network ls --format '{{.Name}}' | grep -qx "RenaceNet"; then
  docker network create --driver overlay --attachable RenaceNet
fi

cyan "── 5. Deploy stack ($STACK_NAME → $DOMAIN) ────"
# Bake image tag used by stack
docker tag zuv-web:latest zuv-web:latest 2>/dev/null || true
docker stack deploy -c docker-compose.yml "$STACK_NAME"

cyan "── 6. Inject mail secrets into service ─────────"
# Swarm often drops env_file; force SMTP vars onto the running service
sleep 2
docker service update \
  --env-rm "SMTP_HOST" \
  --env-rm "SMTP_PORT" \
  --env-rm "SMTP_USER" \
  --env-rm "SMTP_PASS" \
  --env-rm "SMTP_PROFILE" \
  --env-rm "SMTP_FROM_NAME" \
  --env-rm "SMTP_REPLY_TO" \
  --env-rm "ADMIN_EMAIL" \
  --env-rm "PUBLIC_SITE_URL" \
  --env-rm "ADMIN_PASSWORD" \
  --env-add "SMTP_HOST=${SMTP_HOST}" \
  --env-add "SMTP_PORT=${SMTP_PORT}" \
  --env-add "SMTP_USER=${SMTP_USER}" \
  --env-add "SMTP_PASS=${SMTP_PASS}" \
  --env-add "SMTP_PROFILE=${SMTP_PROFILE}" \
  --env-add "SMTP_FROM_NAME=${SMTP_FROM_NAME}" \
  --env-add "SMTP_REPLY_TO=${SMTP_REPLY_TO}" \
  --env-add "ADMIN_EMAIL=${ADMIN_EMAIL}" \
  --env-add "PUBLIC_SITE_URL=${PUBLIC_SITE_URL}" \
  --env-add "ADMIN_PASSWORD=${ADMIN_PASSWORD}" \
  --force \
  "$SERVICE_NAME" >/dev/null

cyan "── 7. Cleanup dangling images ─────────────────"
docker image prune -f >/dev/null

green ""
green "✅ ZAV Interior & Clean deployed."
green "   Site:    https://$DOMAIN"
green "   Alias:   https://zav.renace.tech"
green "   Service: $SERVICE_NAME"
green "   Network: RenaceNet"
green "   Commit:  $(git rev-parse --short HEAD)"
green "   Logs:    docker service logs -f $SERVICE_NAME"
