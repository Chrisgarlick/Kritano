#!/bin/bash
set -e

# Kritano — Redeploy script
# Run as the deploy user to pull latest and restart
# Usage: bash scripts/deploy.sh

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

echo "========================================="
echo "  Kritano — Deploy"
echo "========================================="

echo "==> Pulling latest code..."
git pull origin main

echo "==> Installing dependencies..."
npm run install:all

# Build is done locally and committed to git (server can't handle the build)
# If you need to rebuild on server: npm run build

echo "==> Running migrations..."
cd server
npm run migrate
cd "$APP_DIR"

echo "==> Restarting services..."
pm2 restart all

echo "==> Waiting for startup..."
sleep 3

echo "==> Health check..."
curl -sf http://localhost:3001/health && echo " OK" || echo " WARNING: Health check failed!"

echo ""
echo "==> Deploy complete!"
pm2 status
