# PagePulser — Production Deployment Guide (Digital Ocean Droplet)

This guide covers a complete production deployment of PagePulser on a single Digital Ocean droplet using PM2 for process management and Nginx as a reverse proxy with SSL via Let's Encrypt.

---

## Table of Contents

1. [Droplet Requirements](#1-droplet-requirements)
2. [Initial Server Setup](#2-initial-server-setup)
3. [Install Dependencies](#3-install-dependencies)
4. [PostgreSQL Setup](#4-postgresql-setup)
5. [Redis Setup](#5-redis-setup)
6. [Clone & Build the Application](#6-clone--build-the-application)
7. [Environment Configuration](#7-environment-configuration)
8. [Database Migrations](#8-database-migrations)
9. [PM2 Process Management](#9-pm2-process-management)
10. [Nginx & SSL Setup](#10-nginx--ssl-setup)
11. [Firewall Configuration](#11-firewall-configuration)
12. [DNS Configuration](#12-dns-configuration)
13. [Stripe Webhooks](#13-stripe-webhooks)
14. [Post-Deploy Verification](#14-post-deploy-verification)
15. [Monitoring & Logs](#15-monitoring--logs)
16. [Backup Strategy](#16-backup-strategy)
17. [Updates & Redeployment](#17-updates--redeployment)
18. [Troubleshooting](#18-troubleshooting)

---

## 1. Droplet Requirements

| Spec | Starting (2 GB) | Scale-up (4 GB) |
|------|-----------------|-----------------|
| **RAM** | 2 GB | 4 GB |
| **vCPUs** | 1 | 2 |
| **Disk** | 50 GB SSD | 80 GB SSD |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| **Region** | Closest to target audience | — |
| **Cost** | ~$12/mo | ~$24/mo |

Playwright (used for PDF generation and auditing) needs ~400 MB RAM on its own, so 2 GB is the absolute floor. A 1 GB droplet **will not work** — Chromium alone will cause OOM kills.

**Digital Ocean plan**: Start with the **$12/mo Basic Droplet (2 GB / 1 vCPU)**. This is enough for early-stage traffic — audits run one at a time and queue up, which is fine with a handful of users. When audit queues get long or you start hitting memory limits, resize in-place to the 4 GB droplet (~1 minute downtime).

### Memory budget (2 GB droplet)

| Component | Approx. RAM |
|-----------|-------------|
| OS + Nginx + Redis | ~400 MB |
| PostgreSQL | ~500 MB |
| Express API | ~200 MB |
| Worker + Playwright | ~600 MB |
| Headroom | ~300 MB |

---

## 2. Initial Server Setup

### 2.1 SSH in as root

```bash
ssh root@YOUR_DROPLET_IP
```

### 2.2 Create a deploy user

```bash
adduser deploy
usermod -aG sudo deploy
```

### 2.3 Set up SSH key auth for the deploy user

```bash
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### 2.4 Disable root SSH login & password auth

```bash
sed -i 's/^PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd
```

### 2.5 Set the timezone

```bash
timedatectl set-timezone UTC
```

### 2.6 Update the system

```bash
apt update && apt upgrade -y
apt install -y build-essential curl git unzip
```

Now log out and re-login as the `deploy` user for everything below.

```bash
ssh deploy@YOUR_DROPLET_IP
```

---

## 3. Install Dependencies

### 3.1 Node.js 20 LTS (via NodeSource)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # should print v20.x
npm -v
```

### 3.2 PM2

```bash
sudo npm install -g pm2
```

### 3.3 Playwright system dependencies

Playwright needs OS-level browser libraries. Install them:

```bash
sudo npx playwright install-deps chromium
```

### 3.4 Nginx

```bash
sudo apt install -y nginx
```

### 3.5 Certbot (Let's Encrypt SSL)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

## 4. PostgreSQL Setup

### 4.1 Install PostgreSQL 16

```bash
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
sudo apt update
sudo apt install -y postgresql-16
```

### 4.2 Create the database & user

```bash
sudo -u postgres psql
```

```sql
CREATE USER pagepulser WITH PASSWORD 'GENERATE_A_STRONG_PASSWORD_HERE';
CREATE DATABASE pagepulser OWNER pagepulser;
GRANT ALL PRIVILEGES ON DATABASE pagepulser TO pagepulser;
\q
```

> **Generate a secure password**: `openssl rand -base64 32`

### 4.3 Tune PostgreSQL for your droplet

Edit `/etc/postgresql/16/main/postgresql.conf`:

**2 GB droplet (starting config):**

```ini
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
max_connections = 50
statement_timeout = 30000
idle_in_transaction_session_timeout = 60000
```

**4 GB droplet (after scaling up):**

```ini
shared_buffers = 1GB
effective_cache_size = 3GB
work_mem = 8MB
maintenance_work_mem = 256MB
max_connections = 100
statement_timeout = 30000
idle_in_transaction_session_timeout = 60000
```

Restart:

```bash
sudo systemctl restart postgresql
```

### 4.4 Verify connection

```bash
psql postgresql://pagepulser:YOUR_PASSWORD@localhost:5432/pagepulser -c "SELECT 1;"
```

---

## 5. Redis Setup

### 5.1 Install Redis

```bash
sudo apt install -y redis-server
```

### 5.2 Configure Redis

Edit `/etc/redis/redis.conf`:

```ini
maxmemory 64mb          # Increase to 256mb on 4 GB droplet
maxmemory-policy allkeys-lru
supervised systemd
```

### 5.3 Start & enable

```bash
sudo systemctl restart redis-server
sudo systemctl enable redis-server
redis-cli ping  # should print PONG
```

---

## 6. Clone & Build the Application

### 6.1 Clone the repo

```bash
cd /home/deploy
git clone git@github.com:YOUR_ORG/pagepulser.git
cd pagepulser
```

> If using HTTPS: `git clone https://github.com/YOUR_ORG/pagepulser.git`
> You'll need a deploy key or personal access token for private repos.

### 6.2 Install dependencies

```bash
npm run install:all
```

### 6.3 Install Playwright browsers

```bash
cd server
npx playwright install chromium
cd ..
```

### 6.4 Build both projects

```bash
npm run build
```

This runs:
- `server`: TypeScript → `server/dist/`
- `client`: Vite build → `client/dist/`

Verify both built successfully:

```bash
ls server/dist/index.js
ls client/dist/index.html
```

---

## 7. Environment Configuration

### 7.1 Create the server .env file

```bash
cp server/.env.example server/.env
nano server/.env
```

Set the following values for production:

```ini
# === CORE ===
PORT=3001
NODE_ENV=production

# === DATABASE ===
DATABASE_URL=postgresql://pagepulser:YOUR_DB_PASSWORD@localhost:5432/pagepulser

# === REDIS ===
REDIS_URL=redis://localhost:6379

# === AUTH ===
# Generate with: openssl rand -base64 64
JWT_SECRET=YOUR_64_CHAR_SECRET_HERE

# === CORS ===
# Your production domain(s), comma-separated
CORS_ORIGIN=https://pagepulser.com,https://www.pagepulser.com

# === EMAIL (Resend) ===
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=PagePulser <noreply@pagepulser.com>
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx

# === APPLICATION ===
APP_URL=https://pagepulser.com

# === STRIPE ===
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
STRIPE_PRICE_STARTER_MONTHLY=price_xxxxxxxxxxxx
STRIPE_PRICE_PRO_MONTHLY=price_xxxxxxxxxxxx
STRIPE_PRICE_AGENCY_MONTHLY=price_xxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxxxxxxxxxxx
STRIPE_COUPON_EARLY_ACCESS=

# Tier pricing (for analytics — match your Stripe plans)
TIER_PRICE_STARTER=19
TIER_PRICE_PRO=49
TIER_PRICE_AGENCY=99
TIER_PRICE_ENTERPRISE=199

# === OAUTH (optional) ===
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

# === GOOGLE CSE (for Index Exposure feature) ===
GOOGLE_CSE_API_KEY=
GOOGLE_CSE_ID=

# === WORKER TUNING ===
WORKER_POOL_SIZE=3               # Increase to 5 on 4 GB droplet
WORKER_POLLING_MS=2000
WORKER_MAX_CONCURRENT_JOBS=1     # Increase to 2 on 4 GB droplet
WORKER_HEALTH_PORT=3002
DISCOVERY_MAX_CONCURRENT=2       # Increase to 5 on 4 GB droplet

# === ERROR TRACKING (optional) ===
SENTRY_DSN=
```

### 7.2 Lock down the file

```bash
chmod 600 server/.env
```

---

## 8. Database Migrations

Run all migrations to set up the schema:

```bash
cd /home/deploy/pagepulser/server
npm run migrate
```

Verify:

```bash
npm run migrate:status
```

All 91 migrations should show as executed.

**Optional** — seed initial data (admin user, templates, etc.):

```bash
npm run seed
```

---

## 9. PM2 Process Management

### 9.1 Create the PM2 ecosystem file

```bash
nano /home/deploy/pagepulser/ecosystem.config.cjs
```

```js
module.exports = {
  apps: [
    {
      name: 'pagepulser-api',
      cwd: '/home/deploy/pagepulser/server',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '300M',   // Increase to 512M on 4 GB droplet
      error_file: '/home/deploy/pagepulser/logs/api-error.log',
      out_file: '/home/deploy/pagepulser/logs/api-out.log',
      merge_logs: true,
      time: true,
    },
    {
      name: 'pagepulser-worker',
      cwd: '/home/deploy/pagepulser/server',
      script: 'node_modules/.bin/tsx',
      args: 'src/worker.ts',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '700M',   // Increase to 1G on 4 GB droplet
      error_file: '/home/deploy/pagepulser/logs/worker-error.log',
      out_file: '/home/deploy/pagepulser/logs/worker-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
```

### 9.2 Create the logs directory

```bash
mkdir -p /home/deploy/pagepulser/logs
```

### 9.3 Start the processes

```bash
cd /home/deploy/pagepulser
pm2 start ecosystem.config.cjs
```

### 9.4 Verify both are running

```bash
pm2 status
```

You should see `pagepulser-api` and `pagepulser-worker` both `online`.

### 9.5 Test the API health check

```bash
curl http://localhost:3001/health
# {"status":"ok","service":"pagepulser","timestamp":"..."}
```

### 9.6 Save and set PM2 to start on boot

```bash
pm2 save
pm2 startup
```

Run the command PM2 outputs (it will look like `sudo env PATH=... pm2 startup systemd -u deploy --hp /home/deploy`).

---

## 10. Nginx & SSL Setup

### 10.1 Create the Nginx config

```bash
sudo nano /etc/nginx/sites-available/pagepulser
```

```nginx
server {
    listen 80;
    server_name pagepulser.com www.pagepulser.com;

    # Redirect HTTP → HTTPS (Certbot will handle this, but keep as fallback)
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name pagepulser.com www.pagepulser.com;

    # SSL certs — Certbot will populate these
    # ssl_certificate /etc/letsencrypt/live/pagepulser.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/pagepulser.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Client max body size (for file uploads)
    client_max_body_size 10m;

    # API — proxy to Express
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Uploaded files (blog images, etc.)
    location /uploads/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # Webhook routes (need raw body — just proxy through)
    location /api/webhooks/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static frontend — serve from Vite build output
    location / {
        root /home/deploy/pagepulser/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;

        # Cache static assets aggressively
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### 10.2 Enable the site

```bash
sudo ln -s /etc/nginx/sites-available/pagepulser /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 10.3 Obtain SSL certificate

First, make sure your domain's DNS A record points to the droplet IP. Then:

```bash
sudo certbot --nginx -d pagepulser.com -d www.pagepulser.com
```

Certbot will:
- Obtain the certificate
- Auto-configure Nginx with SSL
- Set up auto-renewal

Verify auto-renewal:

```bash
sudo certbot renew --dry-run
```

---

## 11. Firewall Configuration

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

This allows:
- **22** — SSH
- **80** — HTTP (redirects to HTTPS)
- **443** — HTTPS

All other ports (3001, 5432, 6379) are blocked externally — only accessible locally.

---

## 12. DNS Configuration

In your DNS provider (or Digital Ocean Networking), create:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_DROPLET_IP | 3600 |
| A | www | YOUR_DROPLET_IP | 3600 |

If using email (Resend), also add the required DNS records from your Resend dashboard for domain verification (SPF, DKIM, DMARC).

---

## 13. Stripe Webhooks

In the [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks):

1. Create a new endpoint: `https://pagepulser.com/api/webhooks/stripe`
2. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
3. Copy the signing secret to `STRIPE_WEBHOOK_SECRET` in your `.env`
4. Restart the API: `pm2 restart pagepulser-api`

Similarly for Resend webhooks if using email tracking:
- Endpoint: `https://pagepulser.com/api/webhooks/resend`
- Copy signing secret to `RESEND_WEBHOOK_SECRET`

---

## 14. Post-Deploy Verification

Run through this checklist after deployment:

```bash
# 1. API health
curl https://pagepulser.com/health

# 2. API version
curl https://pagepulser.com/api

# 3. Worker health
curl http://localhost:3002/health

# 4. Worker status (detailed)
curl http://localhost:3002/status

# 5. SSL check
curl -I https://pagepulser.com

# 6. Frontend loads
curl -s https://pagepulser.com | head -20

# 7. Check PM2 processes
pm2 status

# 8. Check for errors
pm2 logs --lines 50

# 9. Check database connectivity
psql $DATABASE_URL -c "SELECT COUNT(*) FROM _migrations;"

# 10. Check Redis
redis-cli ping
```

### Smoke test

1. Open `https://pagepulser.com` in a browser — frontend should load
2. Register a new account
3. Verify the confirmation email arrives
4. Log in and run a test audit
5. Confirm the audit completes and results display
6. Test PDF export
7. If Stripe is configured, test a subscription flow using Stripe test mode

---

## 15. Monitoring & Logs

### PM2 Logs

```bash
pm2 logs                        # All logs (tail)
pm2 logs pagepulser-api         # API only
pm2 logs pagepulser-worker      # Worker only
pm2 logs --lines 200            # Last 200 lines
```

### PM2 Monitoring dashboard

```bash
pm2 monit
```

### Log rotation

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 14
pm2 set pm2-logrotate:compress true
```

### Sentry (optional but recommended)

Set `SENTRY_DSN` in `.env` to enable error tracking for both the API and worker. Restart after adding:

```bash
pm2 restart all
```

### Uptime monitoring

Set up an external uptime check (e.g., UptimeRobot, Better Uptime) against:
- `https://pagepulser.com/health` — API health
- `https://pagepulser.com` — Frontend availability

---

## 16. Backup Strategy

### 16.1 Automated daily database backups

```bash
sudo mkdir -p /home/deploy/backups
sudo chown deploy:deploy /home/deploy/backups
```

Create the backup script:

```bash
nano /home/deploy/scripts/backup-db.sh
```

```bash
#!/bin/bash
set -e

BACKUP_DIR="/home/deploy/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="pagepulser_${TIMESTAMP}.sql.gz"

pg_dump postgresql://pagepulser:YOUR_DB_PASSWORD@localhost:5432/pagepulser | gzip > "${BACKUP_DIR}/${FILENAME}"

# Keep only last 14 days
find "${BACKUP_DIR}" -name "pagepulser_*.sql.gz" -mtime +14 -delete

echo "Backup complete: ${FILENAME}"
```

```bash
chmod +x /home/deploy/scripts/backup-db.sh
```

### 16.2 Schedule with cron

```bash
crontab -e
```

Add:

```
0 3 * * * /home/deploy/scripts/backup-db.sh >> /home/deploy/logs/backup.log 2>&1
```

This runs daily at 3 AM UTC.

### 16.3 Off-site backups (recommended)

Copy backups to Digital Ocean Spaces or S3:

```bash
# Install s3cmd or use doctl
sudo apt install -y s3cmd
# Configure: s3cmd --configure
# Add to backup script:
# s3cmd put "${BACKUP_DIR}/${FILENAME}" s3://your-bucket/pagepulser-backups/
```

### 16.4 Uploads directory

If users upload files, also back up `/home/deploy/pagepulser/server/uploads/`:

```bash
# Add to cron
0 4 * * * tar -czf /home/deploy/backups/uploads_$(date +\%Y\%m\%d).tar.gz /home/deploy/pagepulser/server/uploads/ 2>/dev/null
```

---

## 17. Updates & Redeployment

### Quick deploy script

```bash
nano /home/deploy/scripts/deploy.sh
```

```bash
#!/bin/bash
set -e

APP_DIR="/home/deploy/pagepulser"
cd "$APP_DIR"

echo "==> Pulling latest code..."
git pull origin main

echo "==> Installing dependencies..."
npm run install:all

echo "==> Building..."
npm run build

echo "==> Running migrations..."
cd server
npm run migrate
cd ..

echo "==> Restarting services..."
pm2 restart all

echo "==> Waiting for startup..."
sleep 3

echo "==> Health check..."
curl -sf http://localhost:3001/health || echo "WARNING: Health check failed!"

echo "==> Deploy complete!"
pm2 status
```

```bash
chmod +x /home/deploy/scripts/deploy.sh
```

### Usage

```bash
/home/deploy/scripts/deploy.sh
```

### Zero-downtime restart (optional)

If you want to avoid any dropped requests during restart:

```bash
pm2 reload pagepulser-api
```

`reload` does a graceful restart (waits for existing connections to close). Works best with `exec_mode: 'cluster'` and multiple instances if you scale up later.

---

## 18. Troubleshooting

### API won't start

```bash
# Check logs
pm2 logs pagepulser-api --lines 100

# Common issues:
# - DATABASE_URL wrong → check .env and test with psql
# - Port conflict → check `lsof -i :3001`
# - Missing .env → ensure server/.env exists
```

### Worker won't start

```bash
pm2 logs pagepulser-worker --lines 100

# Common issues:
# - Playwright browsers not installed → run `npx playwright install chromium` in server/
# - Missing system dependencies → run `sudo npx playwright install-deps chromium`
# - Out of memory → check `free -h`, increase droplet size
```

### 502 Bad Gateway from Nginx

```bash
# Check if API is running
pm2 status
curl http://localhost:3001/health

# Check Nginx error log
sudo tail -50 /var/log/nginx/error.log

# Common causes:
# - API not running
# - Wrong proxy_pass port in Nginx config
```

### Database connection issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql postgresql://pagepulser:PASSWORD@localhost:5432/pagepulser -c "SELECT 1;"

# Check connection count
psql postgresql://pagepulser:PASSWORD@localhost:5432/pagepulser -c "SELECT count(*) FROM pg_stat_activity;"
```

### SSL certificate renewal fails

```bash
sudo certbot renew --dry-run
# If it fails, check Nginx config and firewall (port 80 must be open)
```

### Out of memory / OOM kills

```bash
# Check current memory usage
free -h

# Check if PM2 processes were restarted due to memory
pm2 describe pagepulser-worker | grep restart

# On a 2 GB droplet, ensure these are set low in .env:
# WORKER_MAX_CONCURRENT_JOBS=1
# DISCOVERY_MAX_CONCURRENT=2
# WORKER_POOL_SIZE=3
```

### Audit jobs stuck in "processing"

```bash
# Check worker is running
pm2 status

# Check worker status endpoint
curl http://localhost:3002/status

# Reset stuck jobs (use with caution)
psql $DATABASE_URL -c "UPDATE audit_jobs SET status = 'pending' WHERE status = 'processing' AND updated_at < NOW() - INTERVAL '1 hour';"

# Restart worker
pm2 restart pagepulser-worker
```

---

## Quick Reference

| Service | Port | Access |
|---------|------|--------|
| Nginx (HTTP) | 80 | Public — redirects to 443 |
| Nginx (HTTPS) | 443 | Public |
| Express API | 3001 | Local only (behind Nginx) |
| Worker health | 3002 | Local only |
| PostgreSQL | 5432 | Local only |
| Redis | 6379 | Local only |

| Command | Purpose |
|---------|---------|
| `pm2 status` | Check all processes |
| `pm2 logs` | Tail all logs |
| `pm2 restart all` | Restart everything |
| `pm2 reload pagepulser-api` | Graceful API restart |
| `pm2 monit` | Real-time monitoring |
| `/home/deploy/scripts/deploy.sh` | Full redeploy |
| `/home/deploy/scripts/backup-db.sh` | Manual DB backup |
| `sudo certbot renew` | Renew SSL certs |
| `sudo nginx -t && sudo systemctl reload nginx` | Test & reload Nginx |
