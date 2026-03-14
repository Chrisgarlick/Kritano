# Connecting PagePulser to DigitalOcean Managed PostgreSQL

## Overview

This plan covers migrating from the local Docker PostgreSQL instance to a DigitalOcean Managed Database (PostgreSQL). This gives you automated backups, failover, connection pooling, and no need to run Postgres on the same droplet as the app — freeing up RAM for audits.

## Why Managed PostgreSQL?

- **Frees droplet RAM** — Postgres on Docker uses ~100-200MB, which matters on a 1-2GB droplet
- **Automated daily backups** — point-in-time recovery included
- **High availability** — standby nodes available on higher plans
- **Managed security** — automatic patching, SSL enforced by default
- **Connection pooling** — built-in PgBouncer, no extra setup

## DigitalOcean Managed Database Plans

| Plan | RAM | Storage | Connections | Price/mo |
|------|-----|---------|-------------|----------|
| Basic 1 vCPU | 1 GB | 10 GB | 22 | $15 |
| Basic 2 vCPU | 2 GB | 25 GB | 44 | $30 |
| Basic 4 vCPU | 4 GB | 38 GB | 88 | $60 |

The **Basic 1 vCPU ($15/mo)** plan is sufficient for early-stage. 22 connections covers the app's needs (API pool: 20, Worker pool: 5+2 = 27 total, but with PgBouncer connection pooling this is fine).

## Key Decisions

1. **SSL is mandatory** — DigitalOcean managed databases enforce SSL. The app currently has no SSL config, so this needs adding.
2. **Connection pooling mode** — Use DigitalOcean's built-in PgBouncer in `transaction` mode to maximise connection reuse.
3. **Trusted sources** — Restrict database access to only the droplet's IP address.
4. **Migration strategy** — Run `npm run migrate` against the remote database to set up schema from scratch (no data to migrate from dev).

---

## Step 1: Create the Managed Database on DigitalOcean

1. Go to **DigitalOcean Dashboard → Databases → Create Database Cluster**
2. Choose:
   - **Engine**: PostgreSQL 16
   - **Region**: Same as your droplet (e.g., LON1 for London)
   - **Plan**: Basic $15/mo (1 vCPU, 1 GB RAM, 10 GB disk)
   - **Database name**: `pagepulser`
3. Under **Trusted Sources**, add your droplet so only it can connect
4. Note the connection details:
   - **Host**: `db-postgresql-lon1-xxxxx-do-user-xxxxx-0.b.db.ondigitalocean.com`
   - **Port**: `25060`
   - **Username**: `doadmin`
   - **Password**: (auto-generated)
   - **Database**: `defaultdb` (you'll create `pagepulser` DB)
   - **SSL Mode**: `require` (mandatory)

5. Also note the **Connection Pool** details (PgBouncer):
   - **Port**: `25061` (different from direct port)
   - **Pool mode**: Transaction (recommended)

---

## Step 2: Create the `pagepulser` Database

Connect via the DigitalOcean web console or `psql`:

```bash
psql "postgresql://doadmin:<password>@<host>:25060/defaultdb?sslmode=require"
```

Then:

```sql
CREATE DATABASE pagepulser;
```

---

## Step 3: Code Changes — Add SSL Support

### 3a. Update `server/src/db/index.ts`

The `pg` library supports SSL via the connection string parameter `?sslmode=require`, but DigitalOcean also provides a CA certificate for full verification. The simplest approach is to use `sslmode=require` in the DATABASE_URL and configure the pool to accept it.

```typescript
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});
```

**Why `rejectUnauthorized: false`?**
DigitalOcean uses self-signed CA certificates. You can optionally download their CA cert and set `ca: fs.readFileSync('ca-certificate.crt')` for full verification, but `rejectUnauthorized: false` with `sslmode=require` still encrypts the connection — it just doesn't verify the server's certificate identity. Since you're restricting access to trusted sources (your droplet IP), this is acceptable.

**For stricter security (optional):**
```typescript
import fs from 'fs';

ssl: isProduction ? {
  rejectUnauthorized: true,
  ca: fs.readFileSync(process.env.DATABASE_CA_CERT || '/path/to/ca-certificate.crt').toString(),
} : false,
```

### 3b. Update `server/src/index.ts`

Add the same SSL config to the API server's pool:

```typescript
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});
```

### 3c. Update `server/src/worker.ts`

Add SSL to both worker pools:

```typescript
const isProduction = process.env.NODE_ENV === 'production';
const sslConfig = isProduction ? { rejectUnauthorized: false } : false;

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: WORKER_POOL_SIZE,
  ssl: sslConfig,
});

const coldProspectPool = new Pool({
  connectionString: DATABASE_URL,
  max: 2,
  ssl: sslConfig,
});
```

### 3d. Update `server/src/db/migrate.ts`

Add SSL to the migration runner pool:

```typescript
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});
```

### 3e. Update `server/src/db/seed.ts`

Same pattern — add SSL config.

### 3f. Update `server/src/cold-prospect-cli.ts`

Same pattern — add SSL config.

---

## Step 4: Centralise the SSL Config (Recommended Refactor)

Rather than duplicating SSL logic in 6 files, create a shared helper:

**New file: `server/src/db/config.ts`**

```typescript
import type { PoolConfig } from 'pg';

const isProduction = process.env.NODE_ENV === 'production';

export function getPoolConfig(overrides?: Partial<PoolConfig>): PoolConfig {
  return {
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    ...overrides,
  };
}
```

Then each file just does:

```typescript
import { getPoolConfig } from './db/config.js';

const pool = new Pool(getPoolConfig({ max: 5 }));
```

---

## Step 5: Environment Variables (Production)

Set these on your droplet (e.g., in `/etc/environment` or your PM2 ecosystem file):

```env
NODE_ENV=production
DATABASE_URL=postgresql://doadmin:<password>@<host>:25060/pagepulser?sslmode=require
REDIS_URL=redis://localhost:6379
JWT_SECRET=<generate-a-64-char-secure-secret>
CORS_ORIGIN=https://pagepulser.com
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
EMAIL_FROM=PagePulser <noreply@pagepulser.com>
APP_URL=https://pagepulser.com
RESEND_API_KEY=<your-key>
```

**Important:** Use the **direct connection** string (port 25060) for migrations and seeds. Use the **connection pool** string (port 25061) for the API server and worker if you want PgBouncer pooling. However, PgBouncer in transaction mode doesn't support prepared statements, and `pg` uses prepared statements by default. To use PgBouncer, you'd need to disable prepared statements:

```typescript
// Only needed if connecting via PgBouncer (port 25061)
const pool = new Pool({
  ...getPoolConfig(),
  // Disable prepared statements for PgBouncer compatibility
  statement_timeout: undefined,
});
```

**Recommendation:** Start with the **direct connection** (port 25060). The app's own connection pooling via `pg.Pool` is sufficient. Only switch to PgBouncer if you hit the 22-connection limit.

---

## Step 6: Run Migrations on Production

From the droplet:

```bash
cd /path/to/pagepulser/server
NODE_ENV=production DATABASE_URL="postgresql://doadmin:<password>@<host>:25060/pagepulser?sslmode=require" npm run migrate
```

Then seed (if needed):

```bash
NODE_ENV=production DATABASE_URL="..." npm run migrate:seed
```

---

## Step 7: Remove Postgres from Docker Compose (Production)

On the droplet, you only need Redis and the app. Remove the `postgres` service and `postgres_data` volume from docker-compose.yml (or create a separate `docker-compose.prod.yml`).

---

## Connection Limits Summary

With the Basic $15/mo plan (22 max connections) and the app's current pool config:

| Component | Pool Size | Notes |
|-----------|-----------|-------|
| API Server | 20 | Main request handling |
| Worker (primary) | 5 | Audits, campaigns, trials |
| Worker (cold prospect) | 2 | Isolated pool |
| Migration runner | 1 | Only during deployments |
| **Total possible** | **28** | Exceeds 22 limit |

**This is fine** because:
- The API and worker don't all use max connections simultaneously
- `pg.Pool` only creates connections on demand, not upfront
- Typical usage is 5-10 active connections

But if you hit connection limits, either:
1. Reduce pool sizes (API: 15, Worker: 3)
2. Upgrade to Basic 2 vCPU ($30/mo, 44 connections)
3. Switch to PgBouncer connection pooling (port 25061)

---

## Critical Files to Modify

| File | Change |
|------|--------|
| `server/src/db/index.ts` | Add SSL config |
| `server/src/db/config.ts` | **NEW** — centralised pool config |
| `server/src/index.ts` | Use shared pool config |
| `server/src/worker.ts` | Use shared pool config |
| `server/src/db/migrate.ts` | Add SSL config |
| `server/src/db/seed.ts` | Add SSL config |
| `server/src/cold-prospect-cli.ts` | Add SSL config |
| `server/.env.example` | Add production DATABASE_URL example |

---

## Testing Plan

1. **Local development** — ensure `NODE_ENV=development` still uses Docker Postgres without SSL (no breakage)
2. **SSL connection test** — temporarily point `DATABASE_URL` at the DO managed DB from local machine and run `npm run migrate:status`
3. **Migration test** — run `npm run migrate` against the remote DB and verify all 85 migrations execute
4. **Seed test** — run `npm run migrate:seed` and verify admin user is created
5. **API test** — start the server pointing at the remote DB and verify login/audit flows
6. **Worker test** — start the worker pointing at the remote DB and verify audit processing

---

## Implementation Order

1. Create `server/src/db/config.ts` (centralised pool config)
2. Update all 6 files to use shared config
3. Update `server/.env.example` with production example
4. Test locally (verify no breakage)
5. Create DigitalOcean managed database
6. Add trusted source (droplet IP)
7. Create `pagepulser` database
8. Run migrations
9. Seed admin user
10. Deploy app pointing at managed DB
11. Remove Postgres from Docker on droplet
