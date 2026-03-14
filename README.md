# PagePulser

Web accessibility auditing SaaS platform.

**Stack:** Node.js, Express, PostgreSQL, Redis, BullMQ, React, TypeScript, Tailwind CSS, Docker.

---

## Prerequisites

- **Node.js** v20+ (tested on v22)
- **Docker Desktop** (for PostgreSQL, Redis, Mailpit)
- **npm**

---

## Quick Start

### 1. Clone and install dependencies

```bash
git clone <repo-url> pagepulser
cd pagepulser
npm run install:all
```

This installs root, server, and client dependencies in one command.

### 2. Set up environment variables

```bash
cp server/.env.example server/.env
```

The defaults work out of the box for local development. You'll need to fill in:

- `JWT_SECRET` — generate with `openssl rand -base64 64`
- `STRIPE_*` keys — only needed if testing billing
- `GOOGLE_CSE_*` keys — only needed for the index exposure feature

### 3. Start Docker services

```bash
docker compose up -d
```

This starts:

| Service    | Port  | Purpose                        |
|------------|-------|--------------------------------|
| PostgreSQL | 5433  | Database                       |
| Redis      | 6380  | Job queue (BullMQ)             |
| Mailpit    | 8025  | Local email testing (SMTP: 1025) |

### 4. Run database migrations and seed

```bash
cd server
npm run migrate:seed
cd ..
```

### 5. Start the dev servers

```bash
npm run dev
```

This starts both the API server and the React client concurrently:

- **API:** http://localhost:3001
- **Client:** http://localhost:3000
- **Mailpit UI:** http://localhost:8025

---

## Project Structure

```
pagepulser/
  client/          React frontend (Vite + TypeScript + Tailwind)
  server/          Express API + BullMQ worker
    src/
      db/          Migrations and seed
      routes/      API routes
      services/    Business logic (audit engines, email, billing, etc.)
    prospect-output/     Cold prospect JSON outputs (gitignored)
    prospect-settings.json  Local prospect CLI settings (gitignored)
  docs/            Brand guidelines, feature plans
  docker-compose.yml
```

---

## Common Commands

Run from the **root** directory unless noted otherwise.

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API + client together |
| `npm run dev:server` | Start API only |
| `npm run dev:client` | Start client only |
| `npm run build` | Build server + client for production |

Run from the **server/** directory:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API with hot reload |
| `npm run worker` | Start BullMQ background worker |
| `npm run worker:dev` | Start worker with hot reload |
| `npm run migrate` | Run pending migrations |
| `npm run migrate:seed` | Migrate + seed database |
| `npm run migrate:status` | Check migration status |
| `npm run migrate:refresh` | Drop all + re-migrate (destructive) |
| `npm run seed` | Seed database |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |

---

## Cold Prospect Pipeline

A standalone CLI for finding newly registered domains with live websites and contact emails. **Does not require Docker or the database** — runs entirely in-memory and outputs JSON files.

Run from the **server/** directory:

```bash
# Full pipeline — downloads NRD feed, checks DNS/HTTP, extracts emails, outputs JSON
npm run prospects

# Import domains from a CSV file instead of the NRD feed
npm run prospects -- import domains.csv

# List previous output files
npm run prospects -- list

# View current settings
npm run prospects -- settings

# Update a setting
npm run prospects -- set daily_limit 2500
npm run prospects -- set min_score 60
npm run prospects -- set tlds com,co.uk,io

# Clear checkpoints and start fresh
npm run prospects -- reset
```

### Settings

Settings are stored in `server/prospect-settings.json` (created automatically on first use). You can edit the file directly or use `npm run prospects -- set`.

| Setting | Default | Description |
|---------|---------|-------------|
| `daily_limit` | 5000 | Max domains to process per run |
| `email_limit` | 50 | Max outreach emails per day |
| `min_score` | 50 | Minimum quality score to qualify |
| `tlds` | com, co.uk, org.uk, uk, io, co, net | TLDs to include |
| `excluded` | *(empty)* | Keywords to exclude from domains |
| `auto_outreach` | false | Auto-send outreach emails |

### Output

Qualified prospects are written to `server/prospect-output/qualified-prospects-YYYY-MM-DD.json`. Each entry includes domain, contact email, quality score, technology stack, and more.

To import results into the main app's database, use the admin panel's JSON import feature (`POST /api/admin/cold-prospects/import-json`).

---

## Docker Services

```bash
docker compose up -d      # Start all services
docker compose down        # Stop all services
docker compose logs -f     # Tail logs
```

To reset the database completely:

```bash
docker compose down -v     # Removes volumes (deletes all data)
docker compose up -d
cd server && npm run migrate:seed
```
