#!/bin/bash

# Railway Start Script
# Runs migrations and seeds database before starting the server

echo "🚀 Starting Railway deployment..."

# Run migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Check if database is empty (no licenses)
LICENSE_COUNT=$(npx prisma db execute --stdin <<EOF
SELECT COUNT(*) FROM "License";
EOF
)

# Seed if database is empty
if [ "$LICENSE_COUNT" = "0" ]; then
  echo "🌱 Database is empty, seeding..."
  npm run prisma:seed
else
  echo "✅ Database already has data, skipping seed"
fi

# Start the server
echo "🎯 Starting server..."
node src/server.js
