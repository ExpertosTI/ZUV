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
export SMTP_HOST="${SMTP_HOST:-smtp.gmail.com}"
export SMTP_PORT="${SMTP_PORT:-587}"
export SMTP_USER="${SMTP_USER:-hello@zavinteriorclean.com}"
export SMTP_PASS="${SMTP_PASS:-}"
export SMTP_FROM_NAME="${SMTP_FROM_NAME:-ZAV Interior & Clean}"
export ADMIN_EMAIL="${ADMIN_EMAIL:-azhaliaestepan@gmail.com}"

if [ -z "$SMTP_PASS" ] || [[ "$SMTP_PASS" =~ TU_APP_PASSWORD|YOUR_GOOGLE|changeme ]]; then
  red "WARNING: SMTP_PASS is missing or still a placeholder."
  red "Google blocks the normal account password for SMTP."
  red "Create an App Password for hello@zavinteriorclean.com and set it in /opt/zuv/.env"
  red "  https://myaccount.google.com/apppasswords"
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

cyan "── 6. Force service update ────────────────────"
docker service update --force "$SERVICE_NAME" >/dev/null 2>&1 || true

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
