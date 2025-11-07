#!/bin/bash
# Deployment script for production branch (triggered by webhook)
# This script runs in the webhook container but operates on mounted volumes

set -e  # Exit on error

echo "🚀 Starting production deployment via webhook..."
echo "📅 $(date)"

# Navigate to project directory (mounted volume)
# Check if /app exists (running in container), otherwise use host path
if [ -d "/app" ]; then
    PROJECT_DIR="/app"
    cd /app
    echo "✅ Running in container, using /app"
else
    # Running on host - use host path
    PROJECT_DIR="/root/laurens-list"
    if [ -d "$PROJECT_DIR" ]; then
        cd "$PROJECT_DIR"
        echo "✅ Running on host, using $PROJECT_DIR"
    else
        echo "⚠️  $PROJECT_DIR not found, using current directory: $(pwd)"
        PROJECT_DIR="$(pwd)"
        # Try to find the project directory
        if [ -f "deploy-prod-webhook.sh" ]; then
            echo "✅ Found deploy-prod-webhook.sh in current directory"
        else
            echo "❌ ERROR: Cannot find project directory!"
            exit 1
        fi
    fi
fi

# Load environment variables if running on host (from /root/.env)
# When running in container, env vars are passed via process.env
if [ ! -d "/app" ] && [ -f "/root/.env" ]; then
    echo "📝 Loading environment variables from /root/.env..."
    set -a  # Automatically export all variables
    source /root/.env
    set +a  # Stop automatically exporting
    echo "✅ Environment variables loaded"
fi

echo "📥 Fetching latest changes from GitHub..."
git fetch origin

echo "🔄 Switching to main branch..."
git checkout main

echo "🔄 Stashing any local changes..."
git stash || true

# CRITICAL: Always do hard reset to ensure we have absolute latest code from main
# git pull can fail or not fully sync if there are conflicts or if server was on different branch
# Hard reset guarantees we have the exact state of origin/main
echo "🔄 Ensuring build context has absolute latest code from main..."
git reset --hard origin/main
echo "✅ Hard reset complete - build context guaranteed to have latest code from main"

# Get the current commit hash for unique image tagging
COMMIT_HASH=$(git rev-parse --short HEAD)
IMAGE_TAG="prod-${COMMIT_HASH}"
IMAGE_NAME="laurens-list-laurenslist:${IMAGE_TAG}"
echo "📦 Building image with unique tag: ${IMAGE_NAME}"

# CRITICAL: Update docker-compose.yml IMMEDIATELY after git reset --hard
# git reset --hard reverts docker-compose.yml, so we MUST update it right after
# This ensures the unique tag is set before any container operations
# We update it now (before build) so it's ready when we start the container
# This prevents Docker Compose from using 'latest' tag on restart
echo "📝 Updating docker-compose.yml with unique image tag (after git reset --hard)..."
# Always use /app path (mounted volume) - this is what Docker Compose reads
# Even if running on host, we need to update the file that Docker Compose will read
COMPOSE_FILE="/app/docker-compose.yml"
if [ ! -f "$COMPOSE_FILE" ] && [ -f "/root/laurens-list/docker-compose.yml" ]; then
    # Running on host - use host path
    COMPOSE_FILE="/root/laurens-list/docker-compose.yml"
fi
sed -i "s|image: laurens-list-laurenslist:.*|image: ${IMAGE_NAME}|g" "$COMPOSE_FILE"
# Verify the update worked
if grep -q "${IMAGE_NAME}" "$COMPOSE_FILE"; then
    echo "✅ docker-compose.yml updated with unique tag: ${IMAGE_NAME}"
else
    echo "❌ ERROR: Failed to update docker-compose.yml with unique tag!"
    echo "   File: $COMPOSE_FILE"
    echo "   Expected: ${IMAGE_NAME}"
    echo "   Actual content:"
    grep "image: laurens-list-laurenslist" "$COMPOSE_FILE" || echo "   (not found)"
    exit 1
fi

echo "🛑 Stopping and removing production container..."
# Use 'docker compose down' to force complete removal and config reload
# This ensures Docker Compose reads the updated docker-compose.yml
# Set project name explicitly to match the image name (laurens-list)
# Always use /app path (mounted volume) - this is what Docker Compose reads
COMPOSE_FILE="/app/docker-compose.yml"
if [ ! -f "$COMPOSE_FILE" ] && [ -f "/root/laurens-list/docker-compose.yml" ]; then
    # Running on host - use host path
    COMPOSE_FILE="/root/laurens-list/docker-compose.yml"
fi
# Use 'down' instead of 'stop' and 'rm' to force complete removal
docker compose -f "$COMPOSE_FILE" -p laurens-list down laurenslist || true
# Also explicitly remove the container if it still exists
docker compose -f "$COMPOSE_FILE" -p laurens-list rm -f laurenslist || true

echo "🗑️  Removing old cached images..."
# Remove ALL images with the prod tag pattern to prevent rollbacks
# This ensures Docker Compose can't use an old image when container restarts
docker images --format "{{.Repository}}:{{.Tag}}" | grep "laurens-list-laurenslist" | grep -v "dev" | xargs -r docker rmi 2>/dev/null || true
# CRITICAL: Also remove 'latest' tag if it exists - we don't use it anymore
docker rmi laurens-list-laurenslist:latest 2>/dev/null || true
# Remove any dangling images
docker images --filter "dangling=true" -q | xargs -r docker rmi 2>/dev/null || true
# Force remove any containers using old images
docker ps -a --filter "ancestor=laurens-list-laurenslist" -q | xargs -r docker rm -f 2>/dev/null || true

echo "🔨 Rebuilding production container..."
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

echo "🔨 Building Docker image with unique tag ONLY (no 'latest' tag)..."
# CRITICAL: Do NOT create 'latest' tag - only use unique tag
# This prevents Docker Compose from accidentally using an old 'latest' image
docker build \
  --no-cache \
  --build-arg TMDB_API_KEY="${TMDB_API_KEY:-YOUR_TMDB_API_KEY}" \
  --build-arg GOOGLE_BOOKS_API_KEY="${GOOGLE_BOOKS_API_KEY:-YOUR_GOOGLE_BOOKS_API_KEY}" \
  --build-arg DOESTHEDOGDIE_API_KEY="${DOESTHEDOGDIE_API_KEY:-YOUR_DTDD_API_KEY}" \
  --build-arg GIT_COMMIT="${COMMIT_HASH}" \
  --build-arg ENV_SUFFIX="prod" \
  -f "$PROJECT_DIR/Dockerfile" \
  -t "${IMAGE_NAME}" \
  "$PROJECT_DIR"

if [ $? -eq 0 ]; then
    echo "✅ Docker build completed successfully"
    # CRITICAL: Remove 'latest' tag if it was created (shouldn't be, but just in case)
    docker rmi laurens-list-laurenslist:latest 2>/dev/null || true
else
    echo "❌ Docker build failed!"
    exit 1
fi

echo "▶️  Starting production container with unique image tag..."
# docker-compose.yml was already updated above (after git pull)
# This ensures Docker Compose reads the unique tag, not 'latest'
# Use --no-build and --force-recreate to avoid build context validation
# The container was removed above, so this will create a new one using the existing image
# Set project name explicitly to match the image name (laurens-list)
# Use --pull never to ensure we use the image we just built (not a cached one)
# Always use /app path (mounted volume) - this is what Docker Compose reads
COMPOSE_FILE="/app/docker-compose.yml"
if [ ! -f "$COMPOSE_FILE" ] && [ -f "/root/laurens-list/docker-compose.yml" ]; then
    # Running on host - use host path
    COMPOSE_FILE="/root/laurens-list/docker-compose.yml"
fi
# CRITICAL: Verify docker-compose.yml still has the unique tag before starting container
# This prevents Docker Compose from using 'latest' if the file was reverted
if ! grep -q "${IMAGE_NAME}" "$COMPOSE_FILE"; then
    echo "❌ ERROR: docker-compose.yml was reverted! Expected unique tag: ${IMAGE_NAME}"
    echo "   Re-applying unique tag..."
    sed -i "s|image: laurens-list-laurenslist:.*|image: ${IMAGE_NAME}|g" "$COMPOSE_FILE"
    if ! grep -q "${IMAGE_NAME}" "$COMPOSE_FILE"; then
        echo "❌ FATAL: Failed to update docker-compose.yml with unique tag!"
        exit 1
    fi
    echo "✅ docker-compose.yml re-updated with unique tag"
fi

COMPOSE_IGNORE_ORPHANS=1 docker compose -f "$COMPOSE_FILE" -p laurens-list up -d --no-build --force-recreate --pull never laurenslist

# DO NOT restore docker-compose.yml to use 'latest'
# Keeping the unique tag ensures the container always uses the correct image, even after restarts
echo "📝 docker-compose.yml uses unique tag: ${IMAGE_NAME}"

echo "🔍 Verifying container is using the new image..."
# Wait a moment for container to start
sleep 2
# Check the image ID of the running container
CONTAINER_IMAGE_FULL=$(docker inspect --format='{{.Image}}' $(docker ps --filter "name=laurenslist" --filter "ancestor=laurens-list-laurenslist" --format "{{.ID}}" | head -1) 2>/dev/null || echo "")
NEW_IMAGE_ID_FULL=$(docker images --format "{{.ID}}" "${IMAGE_NAME}" | head -1)
# Extract short hash from full SHA256 (remove 'sha256:' prefix and take first 12 chars)
CONTAINER_IMAGE_SHORT=$(echo "$CONTAINER_IMAGE_FULL" | sed 's/sha256://' | cut -c1-12)
NEW_IMAGE_ID_SHORT=$(echo "$NEW_IMAGE_ID_FULL" | cut -c1-12)

if [ -n "$CONTAINER_IMAGE_FULL" ] && [ -n "$NEW_IMAGE_ID_FULL" ]; then
    echo "📊 Container image: $CONTAINER_IMAGE_FULL"
    echo "📊 New image: $NEW_IMAGE_ID_FULL"
    echo "📊 Container short hash: $CONTAINER_IMAGE_SHORT"
    echo "📊 New image short hash: $NEW_IMAGE_ID_SHORT"
    if [ "$CONTAINER_IMAGE_SHORT" = "$NEW_IMAGE_ID_SHORT" ]; then
        echo "✅ Container is using the new image (${IMAGE_TAG})!"
    else
        echo "⚠️  WARNING: Container might be using an old image!"
        echo "   Forcing container restart..."
        COMPOSE_FILE="/app/docker-compose.yml"
        if [ ! -f "$COMPOSE_FILE" ] && [ -f "/root/laurens-list/docker-compose.yml" ]; then
            COMPOSE_FILE="/root/laurens-list/docker-compose.yml"
        fi
        docker compose -f "$COMPOSE_FILE" -p laurens-list restart laurenslist
    fi
else
    echo "⚠️  Could not verify image - container may still be starting"
fi

echo "⏳ Waiting for container to start..."
sleep 3

echo "🔄 Restarting Traefik to ensure it picks up the new container..."
# Traefik should auto-discover containers, but restarting ensures it picks up changes
# This is especially important if Traefik was having routing issues
docker compose -f "$COMPOSE_FILE" -p laurens-list restart traefik || true
echo "✅ Traefik restarted"

echo "⏳ Waiting for Traefik to re-discover services..."
sleep 5

echo "📋 Checking container logs..."
CONTAINER_NAME=$(docker ps --format "{{.Names}}" | grep laurenslist | grep -v "dev" | head -1)
if [ -n "$CONTAINER_NAME" ]; then
    echo "📋 Container name: $CONTAINER_NAME"
    docker logs "$CONTAINER_NAME" --tail 20
else
    echo "⚠️  Container not found yet, checking all containers..."
    docker ps -a | grep laurenslist
fi

echo "✅ Production deployment complete!"
echo "🌐 Live at: https://laurenslist.org"
echo "📅 Completed at: $(date)"

