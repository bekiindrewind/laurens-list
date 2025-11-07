#!/bin/bash
# Deployment script for dev branch (triggered by webhook)
# This script runs in the webhook container but operates on mounted volumes

set -e  # Exit on error

echo "🚀 Starting dev deployment via webhook..."
echo "📅 $(date)"

# Environment variables are already loaded by docker-compose via env_file
# The webhook container loads them from /root/.env on the host via env_file in docker-compose.yml
# They're available in process.env and passed to this script via exec()
# So we don't need to source the file - just check if they're set
echo "📋 Checking environment variables..."

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

echo "🗑️  Removing old cached image and all dangling images..."
# Remove the old image to force a complete rebuild
# This prevents Docker from using cached layers even with --no-cache
# Also remove any dangling images that might be used by restart policy
docker rmi laurens-list-laurenslist-dev:latest 2>/dev/null || echo "⚠️  Image not found (will build new one)"
# Remove any dangling images that might be tagged with the same name
docker images --filter "dangling=true" -q | xargs -r docker rmi 2>/dev/null || true
# Force remove any containers using the old image
docker ps -a --filter "ancestor=laurens-list-laurenslist-dev:latest" -q | xargs -r docker rm -f 2>/dev/null || true

echo "🔨 Rebuilding dev container..."
# Use docker build directly via socket to avoid path resolution issues
# Build context is /app (mounted volume) which maps to /root/laurens-list on host
# Tag matches the image name in docker-compose.yml
# Use --no-cache to ensure we get the latest code (especially important for COPY . . step)

# Check if environment variables are set
if [ -z "$TMDB_API_KEY" ] || [ -z "$GOOGLE_BOOKS_API_KEY" ] || [ -z "$DOESTHEDOGDIE_API_KEY" ]; then
    echo "⚠️  Warning: Some API keys are not set!"
    echo "   TMDB_API_KEY: ${TMDB_API_KEY:+SET}${TMDB_API_KEY:-NOT SET}"
    echo "   GOOGLE_BOOKS_API_KEY: ${GOOGLE_BOOKS_API_KEY:+SET}${GOOGLE_BOOKS_API_KEY:-NOT SET}"
    echo "   DOESTHEDOGDIE_API_KEY: ${DOESTHEDOGDIE_API_KEY:+SET}${DOESTHEDOGDIE_API_KEY:-NOT SET}"
    echo "   This will cause the build to fail or use empty API keys!"
fi

echo "🔨 Building Docker image..."
docker build \
  --no-cache \
  --build-arg TMDB_API_KEY="${TMDB_API_KEY:-YOUR_TMDB_API_KEY}" \
  --build-arg GOOGLE_BOOKS_API_KEY="${GOOGLE_BOOKS_API_KEY:-YOUR_GOOGLE_BOOKS_API_KEY}" \
  --build-arg DOESTHEDOGDIE_API_KEY="${DOESTHEDOGDIE_API_KEY:-YOUR_DTDD_API_KEY}" \
  -f /app/Dockerfile \
  -t laurens-list-laurenslist-dev:latest \
  /app

if [ $? -eq 0 ]; then
    echo "✅ Docker build completed successfully"
else
    echo "❌ Docker build failed!"
    exit 1
fi

echo "▶️  Starting dev container..."
# Use --no-build and --force-recreate to avoid build context validation
# The container was removed above, so this will create a new one using the existing image
# Set project name explicitly to match the image name (laurens-list)
# Use --pull never to ensure we use the image we just built (not a cached one)
COMPOSE_IGNORE_ORPHANS=1 docker compose -f /app/docker-compose.yml -p laurens-list up -d --no-build --force-recreate --pull never laurenslist-dev

echo "🔍 Verifying container is using the new image..."
# Wait a moment for container to start
sleep 2
# Check the image ID of the running container
CONTAINER_IMAGE=$(docker inspect --format='{{.Image}}' $(docker ps --filter "name=laurenslist-dev" --format "{{.ID}}" | head -1) 2>/dev/null || echo "")
NEW_IMAGE_ID=$(docker images --format "{{.ID}}" laurens-list-laurenslist-dev:latest | head -1)
if [ -n "$CONTAINER_IMAGE" ] && [ -n "$NEW_IMAGE_ID" ]; then
    echo "📊 Container image ID: $CONTAINER_IMAGE"
    echo "📊 New image ID: $NEW_IMAGE_ID"
    if [ "$CONTAINER_IMAGE" = "$NEW_IMAGE_ID" ]; then
        echo "✅ Container is using the new image!"
    else
        echo "⚠️  WARNING: Container might be using an old image!"
        echo "   Forcing container restart..."
        docker compose -f /app/docker-compose.yml -p laurens-list restart laurenslist-dev
    fi
fi

if [ $? -eq 0 ]; then
    echo "✅ Container started successfully"
else
    echo "❌ Failed to start container!"
    exit 1
fi

echo "⏳ Waiting for container to start..."
sleep 5

echo "📋 Checking container logs..."
CONTAINER_NAME=$(docker ps --format "{{.Names}}" | grep laurenslist-dev | head -1)
if [ -n "$CONTAINER_NAME" ]; then
    echo "📋 Container name: $CONTAINER_NAME"
    docker logs "$CONTAINER_NAME" --tail 20
else
    echo "⚠️  Container not found yet, checking all containers..."
    docker ps -a | grep laurenslist
fi

echo "✅ Dev deployment complete!"
echo "🌐 Test at: https://dev.laurenslist.org"
echo "📅 Completed at: $(date)"

