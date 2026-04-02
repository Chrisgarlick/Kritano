#!/bin/bash

# Kritano CLI helper
# Usage: ./kt <command>

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Default seed user config
SEED_EMAIL="${SEED_EMAIL:-cgarlick94@gmail.com}"
SEED_PASSWORD="${SEED_PASSWORD:-password123}"
SEED_FIRST_NAME="${SEED_FIRST_NAME:-Chris}"
SEED_LAST_NAME="${SEED_LAST_NAME:-Garlick}"

# Database connection
DB_CONTAINER="kritano-db"
DB_USER="kritano"
DB_NAME="kritano"

wait_for_db() {
    echo "Waiting for database to be ready..."
    until docker exec $DB_CONTAINER pg_isready -U $DB_USER -d $DB_NAME > /dev/null 2>&1; do
        sleep 1
    done
    # Extra pause to ensure container is fully ready for exec
    sleep 2
    echo "Database is ready."
}

seed_data() {
    echo "Seeding database..."
    cd "$SCRIPT_DIR/server" && SEED_EMAIL="$SEED_EMAIL" SEED_PASSWORD="$SEED_PASSWORD" SEED_FIRST_NAME="$SEED_FIRST_NAME" SEED_LAST_NAME="$SEED_LAST_NAME" npm run seed
    cd "$SCRIPT_DIR"
}

run_migrations() {
    echo "Running database migrations..."
    cd "$SCRIPT_DIR/server" && npm run migrate
    cd "$SCRIPT_DIR"
}

cmd_start() {
    echo "Starting Kritano..."
    docker compose up -d
    wait_for_db
    run_migrations
    seed_data
    echo ""
    echo "Kritano is ready!"
    echo "  Mailpit UI:  http://localhost:8025"
    echo "  Run 'npm run dev:all --prefix server' to start the dev servers."
}

cmd_stop() {
    echo "Stopping Kritano..."
    docker compose down
    echo "Stopped."
}

cmd_reset() {
    echo "Resetting Kritano (deleting all data)..."
    docker compose down -v
    echo "Reset complete. Run './kt start' to start fresh."
}

cmd_logs() {
    docker compose logs -f
}

cmd_db() {
    docker exec -it $DB_CONTAINER psql -U $DB_USER -d $DB_NAME
}

cmd_help() {
    echo "Kritano CLI"
    echo ""
    echo "Usage: ./kt <command>"
    echo ""
    echo "Commands:"
    echo "  start   Start database, Redis, Mailpit and seed user"
    echo "  stop    Stop all services"
    echo "  reset   Stop and delete all data"
    echo "  logs    Follow service logs"
    echo "  db      Open psql shell"
    echo "  help    Show this help"
    echo ""
    echo "Environment variables:"
    echo "  SEED_EMAIL      Seed user email (default: admin@example.com)"
    echo "  SEED_PASSWORD   Seed user password (default: password123)"
}

case "${1:-help}" in
    start) cmd_start ;;
    stop) cmd_stop ;;
    reset) cmd_reset ;;
    logs) cmd_logs ;;
    db) cmd_db ;;
    help|--help|-h) cmd_help ;;
    *)
        echo "Unknown command: $1"
        echo "Run './kt help' for usage."
        exit 1
        ;;
esac
