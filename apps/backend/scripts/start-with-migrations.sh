#!/bin/bash

echo "🚀 Starting application with migrations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    exit 1
fi

echo "📊 Database URL configured"

# Run migrations
echo "🔄 Running database migrations..."
pnpm migrate

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Migrations failed"
    exit 1
fi

# Wait a moment for migrations to settle
echo "⏳ Waiting for migrations to settle..."
sleep 2

# Start the application
echo "🚀 Starting application..."
NODE_OPTIONS="--max-old-space-size=2048" node dist/src/main.js 