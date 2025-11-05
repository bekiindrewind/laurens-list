#!/bin/bash
# Deployment script for dev branch (triggered by webhook)
# This script runs in the webhook container but operates on mounted volumes

set -e  # Exit on error

echo "🚀 Starting dev deployment via webhook..."
echo "📅 $(date)"

# Navigate to project directory (mounted volume)
cd /app

echo "📥 Fetching latest changes from GitHub..."
git fetch origin

echo "🔄 Switching to dev branch..."
git checkout dev

echo "🔄 Stashing any local changes..."
git stash || true

echo "⬇️  Pulling latest changes..."
git pull origin dev

echo "🛑 Stopping dev container..."
# Use docker compose from host system via docker socket
docker compose -f /app/docker-compose.yml stop laurenslist-dev || true

echo "🔨 Rebuilding dev container (no cache)..."
# Use docker build directly via socket to avoid path resolution issues
# Build context is /root/laurens-list on host, but we use /app (mounted volume) from container
# The Docker daemon will resolve /root/laurens-list on the host
docker build \
  --build-arg TMDB_API_KEY="${TMDB_API_KEY:-YOUR_TMDB_API_KEY}" \
  --build-arg GOOGLE_BOOKS_API_KEY="${GOOGLE_BOOKS_API_KEY:-YOUR_GOOGLE_BOOKS_API_KEY}" \
  --build-arg DOESTHEDOGDIE_API_KEY="${DOESTHEDOGDIE_API_KEY:-YOUR_DTDD_API_KEY}" \
  -f /app/Dockerfile \
  -t laurens-list-laurenslist-dev \
  /app

echo "▶️  Starting dev container..."
docker compose -f /app/docker-compose.yml up -d laurenslist-dev

echo "⏳ Waiting for container to start..."
sleep 5

echo "📋 Checking container logs..."
docker logs root-laurenslist-dev-1 --tail 20 || echo "⚠️  Container not found yet"

echo "✅ Dev deployment complete!"
echo "🌐 Test at: https://dev.laurenslist.org"
echo "📅 Completed at: $(date)"

