# ZAV Interior & Clean

Polished mobile-first landing for [zavinteriorclean.com](https://zavinteriorclean.com/) — Progressive-style quote wizard, live metrics, client feed, and EN / ES / PT with device language detection.

## Stack

- Astro (SSR) + Tailwind CSS v4
- Node adapter for APIs and persistent metrics
- GSAP-style interactions (custom cursor, magnets, tilt, floating life icons)
- JSON file store under `data/` (Docker volume in production)

## Local

```bash
npm install
npm run dev
```

Open `http://localhost:4321`

Admin metrics (hidden): type `ZAV` anywhere on the page, then enter PIN `04J27` (override with `ADMIN_PASSWORD`). Same pattern as Moonshadows Sentinel. Mobile: open `/#zav`.

### Quote emails (Google Workspace)

On each quote, the app emails:

- the **client** (confirmation, in their language)
- the **admin** (`ADMIN_EMAIL`, default `azhaliaestepan@gmail.com`)

From: `hello@zavinteriorclean.com` via Gmail SMTP.

Google rejects the normal account password for SMTP. Create an **App Password**:

1. In Google Admin / account for `hello@zavinteriorclean.com`, enable **2-Step Verification**
2. Open [App passwords](https://myaccount.google.com/apppasswords)
3. Create one for “Mail” / “Other (ZAV site)”
4. Put the 16-character password in `.env`:

```bash
SMTP_USER=hello@zavinteriorclean.com
SMTP_PASS=xxxx xxxx xxxx xxxx
ADMIN_EMAIL=azhaliaestepan@gmail.com
```

Testimonials stay in their original language (`translate="no"`) when the site language changes.

## Features

- Multi-step free estimate form (service → size → frequency → contact)
- Live counters: visits, quotes, homes cared for
- Client work feed (seeded + admin-managed)
- Language: English primary, Spanish secondary, Portuguese option
- Auto-detects `Accept-Language` / device language; manual toggle persists in cookie
- Brand assets from flyer + `zav_interior_clean_logo.svg`

## Deploy (RenaceNet / Swarm)

Repo: [ExpertosTI/ZUV](https://github.com/ExpertosTI/ZUV)

On the VPS (same protocol as Moonshadows / Maretta):

```bash
# First time
git clone https://github.com/ExpertosTI/ZUV.git /opt/zuv
cd /opt/zuv

# Secrets (create once)
cat >/opt/zuv/.env <<'EOF'
ADMIN_PASSWORD=04J27
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=hello@zavinteriorclean.com
SMTP_PASS=YOUR_GOOGLE_APP_PASSWORD
SMTP_FROM_NAME=ZAV Interior & Clean
ADMIN_EMAIL=azhaliaestepan@gmail.com
EOF

# Deploy / update
export $(grep -v '^#' .env | xargs)
./deploy.sh
```

- Stack: `zuv` · Service: `zuv_web`
- Domain: `https://zavinteriorclean.com`
- Network: `RenaceNet` (overlay)
- Traefik: `web` / `websecure`, cert resolver `letsencryptresolver`
- Health: `/healthz`

```bash
# Logs
docker service logs -f zuv_web
```
