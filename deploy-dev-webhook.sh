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

echo "🛑 Stopping and removing dev container..."
# Stop and remove the container to avoid build context validation issues
# Set project name explicitly to match the image name (laurens-list)
docker compose -f /app/docker-compose.yml -p laurens-list stop laurenslist-dev || true
docker compose -f /app/docker-compose.yml -p laurens-list rm -f laurenslist-dev || true

echo "🔨 Rebuilding dev container..."
# Use docker build directly via socket to avoid path resolution issues
# Build context is /app (mounted volume) which maps to /root/laurens-list on host
# Tag matches the image name in docker-compose.yml
docker build \
  --build-arg TMDB_API_KEY="${TMDB_API_KEY:-YOUR_TMDB_API_KEY}" \
  --build-arg GOOGLE_BOOKS_API_KEY="${GOOGLE_BOOKS_API_KEY:-YOUR_GOOGLE_BOOKS_API_KEY}" \
  --build-arg DOESTHEDOGDIE_API_KEY="${DOESTHEDOGDIE_API_KEY:-YOUR_DTDD_API_KEY}" \
  -f /app/Dockerfile \
  -t laurens-list-laurenslist-dev:latest \
  /app

echo "▶️  Starting dev container..."
# Use --no-build and --force-recreate to avoid build context validation
# The container was removed above, so this will create a new one using the existing image
# Set project name explicitly to match the image name (laurens-list)
COMPOSE_IGNORE_ORPHANS=1 docker compose -f /app/docker-compose.yml -p laurens-list up -d --no-build --force-recreate laurenslist-dev

echo "⏳ Waiting for container to start..."
sleep 5

echo "📋 Checking container logs..."
docker logs root-laurenslist-dev-1 --tail 20 || echo "⚠️  Container not found yet"

echo "✅ Dev deployment complete!"
echo "🌐 Test at: https://dev.laurenslist.org"
echo "📅 Completed at: $(date)"

