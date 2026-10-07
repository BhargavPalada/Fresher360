#!/bin/sh
set -e

echo "==> Running database migrations..."
alembic upgrade head

if [ -n "$SEED_ADMIN_PASSWORD" ] && [ -n "$SEED_USER_PASSWORD" ]; then
    echo "==> Running database seed..."
    python scripts/seed.py || echo "Seed completed or skipped."
fi

PORT="${PORT:-8000}"
echo "==> Starting Uvicorn on port $PORT..."
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
