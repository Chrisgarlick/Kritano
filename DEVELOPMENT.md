# pagepulser Development Guide

## Quick Start

```bash
# Start database
docker compose up -d

# Install dependencies (first time only)
npm run install:all

# Run development servers (client + server)
npm run dev
```

- **Client:** http://localhost:3000
- **Server:** http://localhost:3001
- **Database:** localhost:5433

---

## Docker Commands

```bash
# Start database
docker compose up -d

# Stop database
docker compose down

# Stop and remove data (fresh start)
docker compose down -v

# View database logs
docker logs pagepulser-db

# Follow logs in real-time
docker logs -f pagepulser-db
```

---

## Database Migrations

```bash
# Run pending migrations
npm run migrate

# Check migration status (see which are pending/executed)
npm run migrate:status

# Drop all tables and re-run all migrations (asks for confirmation)
npm run migrate:refresh

# Mark all migrations as executed without running them
# (useful for existing databases set up manually)
npm run migrate:adopt
```

### Creating a New Migration

1. Create a new SQL file in `server/src/db/migrations/`
2. Use the format: `XXX_description.sql` (e.g., `028_add_feature.sql`)
3. Run `npm run migrate` to apply it

---

## Database Commands

### Connect to Database

```bash
# Interactive psql session
docker exec -it pagepulser-db psql -U pagepulser -d pagepulser

# Run a single query
docker exec pagepulser-db psql -U pagepulser -d pagepulser -c "YOUR SQL HERE"
```

### View Data

```bash
# List all tables
docker exec pagepulser-db psql -U pagepulser -d pagepulser -c "\dt"

# View all users
docker exec pagepulser-db psql -U pagepulser -d pagepulser -c "SELECT id, email, status, email_verified, created_at FROM users;"

# View refresh tokens
docker exec pagepulser-db psql -U pagepulser -d pagepulser -c "SELECT id, user_id, is_revoked, created_at FROM refresh_tokens ORDER BY created_at DESC LIMIT 10;"

# View audit logs
docker exec pagepulser-db psql -U pagepulser -d pagepulser -c "SELECT event_type, event_status, ip_address, created_at FROM auth_audit_logs ORDER BY created_at DESC LIMIT 20;"
```

### User Management

```bash
# Verify a user's email (skip email verification)
docker exec pagepulser-db psql -U pagepulser -d pagepulser -c \
  "UPDATE users SET email_verified = true, email_verified_at = NOW(), status = 'active' WHERE email = 'user@example.com';"

# Unlock a locked account
docker exec pagepulser-db psql -U pagepulser -d pagepulser -c \
  "UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE email = 'user@example.com';"

# Make a user admin
docker exec pagepulser-db psql -U pagepulser -d pagepulser -c \
  "UPDATE users SET role = 'admin' WHERE email = 'user@example.com';"

# Delete a user (for testing)
docker exec pagepulser-db psql -U pagepulser -d pagepulser -c \
  "DELETE FROM users WHERE email = 'user@example.com';"
```

### Reset Database

```bash
# Clear all auth data (keeps tables)
docker exec pagepulser-db psql -U pagepulser -d pagepulser -c "
  TRUNCATE users, refresh_tokens, email_verification_tokens, auth_audit_logs, rate_limit_records CASCADE;
"

# Full reset (delete container and volume)
docker compose down -v
docker compose up -d
```

---

## Email Setup (Resend)

For local development, emails are logged to the server console instead of being sent.

To enable real email sending:

1. Sign up at [resend.com](https://resend.com)
2. Add and verify your domain
3. Update `.env`:
   ```
   RESEND_API_KEY=re_your_api_key
   EMAIL_FROM=pagepulser <noreply@yourdomain.com>
   ```

---

## API Endpoints

### Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout current session |
| POST | `/api/auth/logout-all` | Logout all sessions |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/sessions` | Get active sessions |
| POST | `/api/auth/verify-email` | Verify email token |
| POST | `/api/auth/resend-verification` | Resend verification email |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |

### Audit Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/audits` | Start new audit |
| GET | `/api/audits` | List user's audits |
| GET | `/api/audits/:id` | Get audit details |
| GET | `/api/audits/:id/findings` | Get audit findings |
| GET | `/api/audits/:id/pages` | Get crawled pages |
| GET | `/api/audits/:id/stream` | SSE for real-time progress |
| POST | `/api/audits/:id/cancel` | Cancel running audit |
| DELETE | `/api/audits/:id` | Delete completed audit |

### Test with cURL

```bash
# Health check
curl http://localhost:3001/health

# Register (get CSRF token first by visiting the site)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN" \
  -d '{"email":"test@example.com","password":"SecurePass123!","firstName":"Test","lastName":"User"}'
```

---

## Spider Worker

The spider worker processes audit jobs from the queue.

```bash
# Start worker (production)
cd server && npm run worker

# Start worker (development with hot reload)
cd server && npm run worker:dev
```

### View Audit Data

```bash
# List audit jobs
docker exec pagepulser-db psql -U pagepulser -d pagepulser -c \
  "SELECT id, target_url, status, pages_found, pages_crawled, total_issues FROM audit_jobs ORDER BY created_at DESC LIMIT 10;"

# View audit findings
docker exec pagepulser-db psql -U pagepulser -d pagepulser -c \
  "SELECT category, severity, COUNT(*) FROM audit_findings GROUP BY category, severity ORDER BY category, severity;"

# View crawled pages for an audit
docker exec pagepulser-db psql -U pagepulser -d pagepulser -c \
  "SELECT url, crawl_status, status_code, response_time_ms FROM audit_pages WHERE audit_job_id = 'YOUR_AUDIT_ID' ORDER BY created_at LIMIT 20;"
```

### Clear Audit Data

```bash
# Clear all audit data (keeps auth tables)
docker exec pagepulser-db psql -U pagepulser -d pagepulser -c "
  TRUNCATE audit_jobs, audit_pages, audit_findings, crawl_queue CASCADE;
"
```

---

## Troubleshooting

### Port 5433 already in use
```bash
# Find what's using the port
lsof -i :5433

# Kill the process or change the port in docker-compose.yml
```

### Database connection refused
```bash
# Check if container is running
docker ps

# Check container health
docker inspect pagepulser-db | grep -A 5 "Health"

# Restart the container
docker compose restart
```

### Reset rate limiting
```bash
docker exec pagepulser-db psql -U pagepulser -d pagepulser -c \
  "DELETE FROM rate_limit_records;"
```

---

## Domain Management

### View Domains

```bash
# List all organization domains
docker exec pagepulser-db psql -U pagepulser -d pagepulser -c \
  "SELECT id, domain, verified, verification_method, verified_at FROM organization_domains;"
```

### Reset Domain Verification

Use this to test the domain verification flow by resetting a domain to unverified state:

```bash
# Reset verification for a specific domain
docker exec pagepulser-db psql -U pagepulser -d pagepulser -c \
  "UPDATE organization_domains SET verified = FALSE, verified_at = NULL, verification_method = NULL, verification_token = NULL, verification_attempts = 0 WHERE domain = 'example.com';"

# Reset ALL domains to unverified (use with caution)
docker exec pagepulser-db psql -U pagepulser -d pagepulser -c \
  "UPDATE organization_domains SET verified = FALSE, verified_at = NULL, verification_method = NULL, verification_token = NULL, verification_attempts = 0;"
```

### Delete a Domain

```bash
docker exec pagepulser-db psql -U pagepulser -d pagepulser -c \
  "DELETE FROM organization_domains WHERE domain = 'example.com';"
```




1. Rebrand [x]
2. UIUX plan [x]
3. restructure [x]
4. analytics [x]
5. integrate content analysis [x]
6. fix bugs []