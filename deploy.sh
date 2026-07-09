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
export SMTP_USER="${SMTP_USER:-info@renace.tech}"
# Hostinger relay for @renace.tech · Google Workspace for @zavinteriorclean.com
export SMTP_PROFILE="${SMTP_PROFILE:-}"
if [[ -z "$SMTP_PROFILE" ]]; then
  if [[ "$SMTP_USER" == *"@renace.tech" ]]; then
    export SMTP_PROFILE=hostinger
  elif [[ "$SMTP_USER" == *"@zavinteriorclean.com" ]]; then
    export SMTP_PROFILE=google
  fi
fi
if [[ "$SMTP_PROFILE" == "hostinger" || "$SMTP_USER" == *"@renace.tech" ]]; then
  export SMTP_HOST="${SMTP_HOST:-smtp.hostinger.com}"
  export SMTP_PORT="${SMTP_PORT:-465}"
elif [[ -z "$SMTP_PROFILE" && "$SMTP_USER" == *"@zavinteriorclean.com" ]]; then
  export SMTP_HOST="${SMTP_HOST:-smtp.gmail.com}"
  export SMTP_PORT="${SMTP_PORT:-587}"
else
  export SMTP_HOST="${SMTP_HOST:-smtp.gmail.com}"
  export SMTP_PORT="${SMTP_PORT:-587}"
fi
export SMTP_PASS="${SMTP_PASS:-}"
export SMTP_FROM="${SMTP_FROM:-hello@zavinteriorclean.com}"
export SMTP_FROM_NAME="${SMTP_FROM_NAME:-ZAV Interior & Clean}"
export SMTP_REPLY_TO="${SMTP_REPLY_TO:-hello@zavinteriorclean.com}"
export PUBLIC_SITE_URL="${PUBLIC_SITE_URL:-https://zavinteriorclean.com}"
export ADMIN_EMAIL="${ADMIN_EMAIL:-azhaliaestepan@gmail.com}"
export EVOLUTION_API_URL="${EVOLUTION_API_URL:-}"
export EVOLUTION_API_KEY="${EVOLUTION_API_KEY:-}"
export EVOLUTION_INSTANCE="${EVOLUTION_INSTANCE:-}"
export ADMIN_WHATSAPP="${ADMIN_WHATSAPP:-17174156171}"
export GEMINI_API_KEY="${GEMINI_API_KEY:-}"
export GEMINI_MODEL="${GEMINI_MODEL:-gemini-2.5-flash}"

# Merge .evolution.local into env for deploy
if [ -f "$PROJECT_DIR/.evolution.local" ]; then
  load_env_file "$PROJECT_DIR/.evolution.local"
fi

if [ -n "$EVOLUTION_API_URL" ] && [ -n "$EVOLUTION_API_KEY" ]; then
  cyan "   WhatsApp:  Evolution configured (${EVOLUTION_INSTANCE:-?}) → admin …${ADMIN_WHATSAPP: -4}"
else
  red "   WhatsApp:  NOT SET — only email on quotes"
fi
if [ -n "$GEMINI_API_KEY" ]; then
  cyan "   Gemini:    configured (${#GEMINI_API_KEY} chars, model $GEMINI_MODEL)"
else
  red "   Gemini:    NOT SET — admin assistant disabled"
fi

if [ -z "$SMTP_PASS" ] || [[ "$SMTP_PASS" =~ TU_APP_PASSWORD|YOUR_GOOGLE|changeme ]]; then
  red "WARNING: SMTP_PASS is missing or still a placeholder in /opt/zuv/.env"
fi
if [ -n "$SMTP_PASS" ]; then
  cyan "   SMTP profile: ${SMTP_PROFILE:-auto} · ${SMTP_HOST}:${SMTP_PORT}"
  cyan "   SMTP user: $SMTP_USER  pass: set (${#SMTP_PASS} chars) · reply-to: $SMTP_REPLY_TO"
  if [[ "$SMTP_PROFILE" == "hostinger" && "$SMTP_USER" != *"@renace.tech" ]]; then
    red "   WARNING: hostinger profile but SMTP_USER is not @renace.tech"
  fi
  if [[ "$SMTP_USER" == *"@renace.tech" && ${#SMTP_PASS} -ne 12 ]]; then
    red "   WARNING: renace.tech pass should be 12 chars — got ${#SMTP_PASS} (check .env)"
  fi
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

cyan "── 6. Inject secrets into service ─────────────"
# Swarm often drops env_file; force runtime vars onto the running service
sleep 2

ENV_PAIRS=(
  "SMTP_HOST=${SMTP_HOST}"
  "SMTP_PORT=${SMTP_PORT}"
  "SMTP_USER=${SMTP_USER}"
  "SMTP_PASS=${SMTP_PASS}"
  "SMTP_PROFILE=${SMTP_PROFILE}"
  "SMTP_FROM=${SMTP_FROM}"
  "SMTP_FROM_NAME=${SMTP_FROM_NAME}"
  "SMTP_REPLY_TO=${SMTP_REPLY_TO}"
  "ADMIN_EMAIL=${ADMIN_EMAIL}"
  "PUBLIC_SITE_URL=${PUBLIC_SITE_URL}"
  "ADMIN_PASSWORD=${ADMIN_PASSWORD}"
  "EVOLUTION_API_URL=${EVOLUTION_API_URL}"
  "EVOLUTION_API_KEY=${EVOLUTION_API_KEY}"
  "EVOLUTION_INSTANCE=${EVOLUTION_INSTANCE}"
  "ADMIN_WHATSAPP=${ADMIN_WHATSAPP}"
  "GEMINI_API_KEY=${GEMINI_API_KEY}"
  "GEMINI_MODEL=${GEMINI_MODEL}"
)

UPDATE_ARGS=(--force)
for pair in "${ENV_PAIRS[@]}"; do
  key="${pair%%=*}"
  UPDATE_ARGS+=(--env-rm "$key")
done
for pair in "${ENV_PAIRS[@]}"; do
  UPDATE_ARGS+=(--env-add "$pair")
done

docker service update "${UPDATE_ARGS[@]}" "$SERVICE_NAME" >/dev/null

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
