#!/bin/bash
set -e

# Kritano — Fresh server setup script
# Run as root on a new Ubuntu 22.04/24.04 Digital Ocean droplet
# Usage: curl -sL <raw-github-url>/scripts/setup.sh | bash
#    OR: git clone ... && cd kritano && bash scripts/setup.sh

echo "========================================="
echo "  Kritano — Server Setup"
echo "========================================="

# Check running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (or with sudo)"
  exit 1
fi

DEPLOY_USER="deploy"
APP_DIR="/home/$DEPLOY_USER/kritano"

# ── 1. System basics ──────────────────────────────────────

echo ""
echo "==> [1/8] System update & basics..."
apt update && apt upgrade -y
apt install -y build-essential curl git unzip

timedatectl set-timezone UTC

# Create deploy user if doesn't exist
if ! id "$DEPLOY_USER" &>/dev/null; then
  echo "==> Creating deploy user..."
  adduser --disabled-password --gecos "" $DEPLOY_USER
  usermod -aG sudo $DEPLOY_USER
  # Copy SSH keys from root
  mkdir -p /home/$DEPLOY_USER/.ssh
  cp /root/.ssh/authorized_keys /home/$DEPLOY_USER/.ssh/ 2>/dev/null || true
  chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
  chmod 700 /home/$DEPLOY_USER/.ssh
  chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys 2>/dev/null || true
  echo "$DEPLOY_USER ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/$DEPLOY_USER
fi

# ── 2. Node.js 22 LTS ────────────────────────────────────

echo ""
echo "==> [2/8] Installing Node.js 22..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt install -y nodejs
fi
echo "  Node: $(node -v)"
echo "  npm: $(npm -v)"

# ── 3. PM2 ────────────────────────────────────────────────

echo ""
echo "==> [3/8] Installing PM2..."
npm install -g pm2

# ── 4. PostgreSQL 16 ──────────────────────────────────────

echo ""
echo "==> [4/8] Installing PostgreSQL 16..."
if ! command -v psql &>/dev/null; then
  sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
  apt update
  apt install -y postgresql-16
fi

# Generate DB password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)

# Create database and user
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='kritano'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER kritano WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='kritano'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE kritano OWNER kritano;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE kritano TO kritano;"

echo "  DB password: $DB_PASSWORD (save this!)"

# ── 5. Redis ──────────────────────────────────────────────

echo ""
echo "==> [5/8] Installing Redis..."
apt install -y redis-server
systemctl enable redis-server
systemctl restart redis-server

# ── 6. Nginx + Certbot ───────────────────────────────────

echo ""
echo "==> [6/8] Installing Nginx & Certbot..."
apt install -y nginx certbot python3-certbot-nginx

# ── 7. Playwright dependencies ────────────────────────────

echo ""
echo "==> [7/8] Installing Playwright system deps..."
npx playwright install-deps chromium

# ── 8. Firewall ───────────────────────────────────────────

echo ""
echo "==> [8/8] Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
echo "y" | ufw enable

# ── Summary ───────────────────────────────────────────────

echo ""
echo "========================================="
echo "  Setup complete!"
echo "========================================="
echo ""
echo "  Deploy user: $DEPLOY_USER"
echo "  DB password:  $DB_PASSWORD"
echo "  DATABASE_URL: postgresql://kritano:${DB_PASSWORD}@localhost:5432/kritano"
echo ""
echo "  Next steps:"
echo "  1. SSH in as $DEPLOY_USER: ssh $DEPLOY_USER@$(hostname -I | awk '{print $1}')"
echo "  2. Clone the repo:  git clone <repo-url> $APP_DIR"
echo "  3. Run:             cd $APP_DIR && bash scripts/install.sh"
echo ""
echo "  Save the DB password above — you'll need it for .env"
echo "========================================="
