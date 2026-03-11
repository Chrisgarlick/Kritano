# PagePulser

**See What Others Miss** — A comprehensive web accessibility, SEO, security, and performance auditing platform.

## Tech Stack

- **Backend**: Node.js, Express, PostgreSQL, Redis
- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Infrastructure**: Docker Compose

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose

### Setup

```bash
# 1. Clone and install dependencies
npm run install:all

# 2. Start infrastructure (PostgreSQL, Redis, Mailpit)
docker compose up -d

# 3. Copy environment file
cp .env.example .env

# 4. Run database migrations
cd server && npm run migrate

# 5. Seed development data
npm run seed

# 6. Start development servers
cd .. && npm run dev
```

The app will be available at:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **Mailpit** (email UI): http://localhost:8025

## Project Structure

```
pagepulser/
├── client/          # React frontend (Vite)
├── server/          # Node.js backend (Express)
├── docs/            # Documentation & guidelines
└── docker-compose.yml
```

## Development

```bash
npm run dev           # Start both client & server
npm run dev:server    # Server only
npm run dev:client    # Client only
```

## Deployment Phases

This project is being deployed incrementally. See [docs/phases.md](docs/phases.md) for the full phased deployment plan.

Current: **Phase 1 — Foundation & Infrastructure**
