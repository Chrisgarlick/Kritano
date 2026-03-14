# Local Email Testing with Mailpit

Mailpit captures all outgoing emails from the app and provides a web UI to view them. No emails are actually delivered externally.

## Setup

### 1. Start Mailpit

Mailpit runs as a Docker container alongside Postgres and Redis:

```bash
docker compose up -d mailpit
```

Or start everything at once:

```bash
docker compose up -d
```

### 2. Configure Environment

In `server/.env`, ensure the SMTP variables are set and Resend is commented out:

```env
# Email — SMTP (Mailpit)
SMTP_HOST=localhost
SMTP_PORT=1025

# Comment out Resend so SMTP takes priority
# RESEND_API_KEY=re_xxxxx

EMAIL_FROM=PagePulser <noreply@pagepulser.com>
```

When `SMTP_HOST` is set, all emails route through Mailpit instead of Resend. If neither is configured, emails are logged to the server console.

### 3. Restart the Server

```bash
cd server
npm run dev
```

You should see this in the server logs on startup:

```
📧 SMTP transport configured → localhost:1025
```

## Usage

### Mailpit Web UI

Open [http://localhost:8025](http://localhost:8025) in your browser. All captured emails appear here with:

- Full HTML rendering
- Plain text view
- Raw source / headers
- Attachment support
- Search and filtering

### Emails You Can Test

| Action | Trigger |
|--------|---------|
| **Email verification** | Register a new account |
| **Password reset** | Click "Forgot password" on the login page |
| **Audit completed** | Run an audit and wait for it to finish |
| **Audit failed** | Run an audit against an unreachable URL |
| **Campaign emails** | Send a campaign from the admin email panel |

### Testing a Quick Email

1. Open the app at `http://localhost:3000`
2. Register a new account (or click "Forgot password")
3. Open Mailpit at `http://localhost:8025`
4. The verification/reset email should appear within seconds
5. Click the link in Mailpit to complete the flow

## Transport Priority

The email system checks transports in this order:

1. **SMTP** — Used when `SMTP_HOST` is set (Mailpit for dev, or any SMTP server)
2. **Resend** — Used when `RESEND_API_KEY` is set and `SMTP_HOST` is not
3. **Console** — Fallback when neither is configured (logs to terminal)

## Switching Back to Resend

To use Resend (e.g. staging/production), comment out the SMTP vars and uncomment the API key:

```env
# SMTP_HOST=localhost
# SMTP_PORT=1025

RESEND_API_KEY=re_your_api_key_here
```

## Docker Reference

Mailpit is defined in `docker-compose.yml`:

| Service | Container | Port | Purpose |
|---------|-----------|------|---------|
| mailpit | pagepulser-mailpit | `1025` | SMTP server (receives emails) |
| mailpit | pagepulser-mailpit | `8025` | Web UI (view emails) |

### Commands

```bash
# Start Mailpit
docker compose up -d mailpit

# Stop Mailpit
docker compose stop mailpit

# View logs
docker compose logs mailpit

# Restart
docker compose restart mailpit
```

## Troubleshooting

**Emails not appearing in Mailpit**

- Check the server logs for `📧 SMTP transport configured` on startup
- If you see `No email transport configured`, the `SMTP_HOST` env var isn't being read — restart the server
- Verify Mailpit is running: `docker ps --filter name=pagepulser-mailpit`

**Port conflicts**

- If port `1025` or `8025` is already in use, change the left side of the port mapping in `docker-compose.yml` (e.g. `2025:1025`) and update `SMTP_PORT` in `.env` to match

**Connection refused errors**

- Ensure Mailpit is running: `docker compose up -d mailpit`
- Check it's healthy: `docker ps` should show `(healthy)` status
