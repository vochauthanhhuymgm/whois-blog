#!/bin/sh
set -e

# Ensure SQLite data directory exists
mkdir -p /app/data

# Run Prisma migrations if available
if [ -f "/app/node_modules/.bin/prisma" ]; then
  echo "Applying database migrations..."
  /app/node_modules/.bin/prisma migrate deploy
elif command -v npx > /dev/null 2>&1; then
  echo "Applying database migrations via npx..."
  npx prisma migrate deploy
fi

# Execute the container command
exec "$@"
