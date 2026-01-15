#!/bin/sh

echo "=== Starting Backend Server ==="

# Chờ database sẵn sàng
echo "Waiting for database to be ready..."
sleep 5

# Chạy migration
echo "Running database migrations..."
npx prisma migrate deploy || npx prisma migrate dev --name init || echo "Migration failed or already applied"

# Generate Prisma client (đảm bảo)
echo "Generating Prisma client..."
npx prisma generate

# Start server
echo "Starting server..."
node server.js

