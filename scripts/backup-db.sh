#!/bin/bash
set -e

# Kritano — Database backup
# Usage: bash scripts/backup-db.sh
# Schedule: crontab -e → 0 3 * * * /home/deploy/kritano/scripts/backup-db.sh >> /home/deploy/kritano/logs/backup.log 2>&1

BACKUP_DIR="/home/deploy/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="kritano_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

# Source .env for DATABASE_URL
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [ -f "$APP_DIR/server/.env" ]; then
  export $(grep -E '^DATABASE_URL=' "$APP_DIR/server/.env" | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL not set. Check server/.env"
  exit 1
fi

pg_dump "$DATABASE_URL" | gzip > "${BACKUP_DIR}/${FILENAME}"

# Keep only last 14 days
find "${BACKUP_DIR}" -name "kritano_*.sql.gz" -mtime +14 -delete

echo "$(date): Backup complete: ${FILENAME} ($(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1))"
