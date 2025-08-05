#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting Railway deployment..."

# Navigate to backend directory
cd apps/backend

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run database migrations
echo "🗄️ Running database migrations..."
npm run migrate

# Build the application
echo "🔨 Building application..."
npm run build

# Start the application
echo "🌟 Starting application..."
npm run start:prod 