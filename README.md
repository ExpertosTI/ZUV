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

## Features

- Multi-step free estimate form (service → size → frequency → contact)
- Live counters: visits, quotes, homes cared for
- Client work feed (seeded + admin-managed)
- Language: English primary, Spanish secondary, Portuguese option
- Auto-detects `Accept-Language` / device language; manual toggle persists in cookie
- Brand assets from flyer + `zav_interior_clean_logo.svg`

## Deploy (RenaceNet / Swarm)

On the VPS (same protocol as Moonshadows / Maretta):

```bash
export ADMIN_PASSWORD='04J27'
./deploy.sh
```

- Stack: `zav`
- Domain: `https://zavinteriorclean.com`
- Network: `RenaceNet` (overlay)
- Traefik: `web` / `websecure`, cert resolver `letsencryptresolver`
- Health: `/healthz`
