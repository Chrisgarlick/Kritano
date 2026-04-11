#!/bin/bash
set -e

# Kritano — App install script
# Run as the deploy user AFTER setup.sh and git clone
# Usage: cd /home/deploy/kritano && bash scripts/install.sh

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

echo "========================================="
echo "  Kritano — App Install"
echo "========================================="

# ── 1. Dependencies ───────────────────────────────────────

echo ""
echo "==> [1/5] Installing npm dependencies..."
npm run install:all

# ── 2. Playwright browsers ───────────────────────────────

echo ""
echo "==> [2/5] Installing Playwright browsers..."
cd server
npx playwright install chromium
cd "$APP_DIR"

# ── 3. Build ──────────────────────────────────────────────

echo ""
echo "==> [3/5] Building server & client..."
npm run build

# Verify builds
if [ ! -f server/dist/index.js ]; then
  echo "ERROR: Server build failed (server/dist/index.js not found)"
  exit 1
fi
if [ ! -f client/dist/index.html ]; then
  echo "ERROR: Client build failed (client/dist/index.html not found)"
  exit 1
fi
echo "  Builds verified."

# ── 4. Directories ────────────────────────────────────────

echo ""
echo "==> [4/5] Creating directories..."
mkdir -p logs
mkdir -p server/uploads/blog/{original,thumbnails,webp}

# ── 5. Environment file ──────────────────────────────────

echo ""
echo "==> [5/5] Environment setup..."
if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  chmod 600 server/.env

  # Generate JWT secret
  JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
  sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" server/.env

  echo "  Created server/.env from template"
  echo "  JWT_SECRET auto-generated"
  echo ""
  echo "  !! IMPORTANT: Edit server/.env with your values:"
  echo "     nano server/.env"
  echo ""
  echo "  Required:"
  echo "    - DATABASE_URL (from setup.sh output)"
  echo "    - RESEND_API_KEY"
  echo "    - APP_URL (your domain)"
  echo "    - STRIPE keys (when ready)"
else
  echo "  server/.env already exists, skipping."
fi

echo ""
echo "========================================="
echo "  Install complete!"
echo "========================================="
echo ""
echo "  Next steps:"
echo "  1. Edit server/.env:     nano server/.env"
echo "  2. Run migrations:       cd server && npm run migrate && npm run seed"
echo "  3. Set up Nginx:         sudo cp scripts/nginx.conf /etc/nginx/sites-available/kritano"
echo "                           sudo ln -sf /etc/nginx/sites-available/kritano /etc/nginx/sites-enabled/"
echo "                           sudo rm -f /etc/nginx/sites-enabled/default"
echo "                           sudo nginx -t && sudo systemctl reload nginx"
echo "  4. Get SSL:              sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com"
echo "  5. Start app:            pm2 start ecosystem.config.cjs && pm2 save && pm2 startup"
echo "========================================="
