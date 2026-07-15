# ZAV Interior & Clean

Landing mobile-first for [zavinteriorclean.com](https://zavinteriorclean.com/) — quote wizard, client feed, EN / ES / PT.

## Stack

- Astro SSR + Tailwind CSS v4
- Node adapter + JSON store in `data/` (Docker volume in production)

## Local

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:4321`

Admin: type `ZAV` on the page (or open `/#zav`), then enter the PIN from `ADMIN_PASSWORD` in `.env`.

### Quote emails

Each quote emails the client and `ADMIN_EMAIL` via SMTP (see `.env.example`).

## Deploy (RenaceNet / Swarm)

Repo: [ExpertosTI/ZUV](https://github.com/ExpertosTI/ZUV)

```bash
ssh root@45.9.191.18
cd /opt/zuv
git fetch origin main && git reset --hard origin/main
./deploy.sh
git rev-parse --short HEAD
curl -fsS https://zavinteriorclean.com/healthz && echo " OK"
```

Secrets stay in `/opt/zuv/.env` on the server. Never commit them.
