#!/bin/bash
# Deployment script for production branch (triggered by webhook)
# This script runs in the webhook container but operates on mounted volumes

set -e  # Exit on error

echo "🚀 Starting production deployment via webhook..."
echo "📅 $(date)"

# Navigate to project directory (mounted volume)
# Check if /app exists, otherwise use current directory
if [ -d "/app" ]; then
    cd /app
else
    echo "⚠️  /app not found, using current directory: $(pwd)"
    # Try to find the project directory
    if [ -f "deploy-prod-webhook.sh" ]; then
        echo "✅ Found deploy-prod-webhook.sh in current directory"
    else
        echo "❌ ERROR: Cannot find project directory!"
        exit 1
    fi
fi

echo "📥 Fetching latest changes from GitHub..."
git fetch origin

echo "🔄 Switching to main branch..."
git checkout main

echo "🔄 Stashing any local changes..."
git stash || true

echo "⬇️  Pulling latest changes..."
git pull origin main

# IMPORTANT: After git pull, docker-compose.yml will have 'latest' tag
# We'll update it AFTER building the image with the unique tag
# This ensures the file persists even if git tries to revert it

# Get the current commit hash for unique image tagging
COMMIT_HASH=$(git rev-parse --short HEAD)
IMAGE_TAG="prod-${COMMIT_HASH}"
IMAGE_NAME="laurens-list-laurenslist:${IMAGE_TAG}"
echo "📦 Building image with unique tag: ${IMAGE_NAME}"

# Verify we have the latest code by checking script.js SCRIPT_VERSION
# This ensures the build context has the latest files
echo "🔍 Verifying build context has latest code..."
EXPECTED_VERSION="${COMMIT_HASH}-prod"
ACTUAL_VERSION=$(grep -oP "const SCRIPT_VERSION = '\K[^']+" /app/script.js 2>/dev/null || echo "")
if [ -n "$ACTUAL_VERSION" ] && [ "$ACTUAL_VERSION" != "$EXPECTED_VERSION" ]; then
    echo "⚠️  WARNING: script.js has SCRIPT_VERSION='$ACTUAL_VERSION' but current commit is '$COMMIT_HASH'"
    echo "   This means the build context might have old code!"
    echo "   Forcing hard reset to ensure we have latest code..."
    git fetch origin
    git reset --hard origin/main
    echo "✅ Hard reset complete - build context should now have latest code"
fi

echo "🛑 Stopping and removing production container..."
# Stop and remove the container to avoid build context validation issues
# Set project name explicitly to match the image name (laurens-list)
docker compose -f /app/docker-compose.yml -p laurens-list stop laurenslist || true
docker compose -f /app/docker-compose.yml -p laurens-list rm -f laurenslist || true

echo "🗑️  Removing old cached images..."
# Remove ALL images with the prod tag pattern to prevent rollbacks
# This ensures Docker Compose can't use an old image when container restarts
docker images --format "{{.Repository}}:{{.Tag}}" | grep "laurens-list-laurenslist" | grep -v "dev" | xargs -r docker rmi 2>/dev/null || true
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

echo "🔨 Building Docker image with unique tag..."
docker build \
  --no-cache \
  --build-arg TMDB_API_KEY="${TMDB_API_KEY:-YOUR_TMDB_API_KEY}" \
  --build-arg GOOGLE_BOOKS_API_KEY="${GOOGLE_BOOKS_API_KEY:-YOUR_GOOGLE_BOOKS_API_KEY}" \
  --build-arg DOESTHEDOGDIE_API_KEY="${DOESTHEDOGDIE_API_KEY:-YOUR_DTDD_API_KEY}" \
  --build-arg GIT_COMMIT="${COMMIT_HASH}" \
  --build-arg ENV_SUFFIX="prod" \
  -f /app/Dockerfile \
  -t "${IMAGE_NAME}" \
  -t laurens-list-laurenslist:latest \
  /app

if [ $? -eq 0 ]; then
    echo "✅ Docker build completed successfully"
else
    echo "❌ Docker build failed!"
    exit 1
fi

echo "▶️  Starting production container with unique image tag..."
# Permanently update docker-compose.yml to use the unique image tag
# This prevents Docker Compose from using a cached 'latest' reference when container restarts
# We keep the unique tag in docker-compose.yml so restarts always use the correct image
# Update BOTH the mounted volume (/app) and the host file (/root/laurens-list) to ensure persistence
sed -i "s|image: laurens-list-laurenslist:.*|image: ${IMAGE_NAME}|g" /app/docker-compose.yml
# Also update the host file directly (in case the mount point is different)
if [ -f "/root/laurens-list/docker-compose.yml" ]; then
    sed -i "s|image: laurens-list-laurenslist:.*|image: ${IMAGE_NAME}|g" /root/laurens-list/docker-compose.yml
    echo "✅ Updated docker-compose.yml on host: /root/laurens-list/docker-compose.yml"
fi
# Verify the update worked
UPDATED_TAG=$(grep "image: laurens-list-laurenslist:" /app/docker-compose.yml | grep -oP "image: \K[^ ]+" | head -1)
if [ "$UPDATED_TAG" != "${IMAGE_NAME}" ]; then
    echo "⚠️  WARNING: docker-compose.yml update may have failed!"
    echo "   Expected: ${IMAGE_NAME}"
    echo "   Found: ${UPDATED_TAG}"
    echo "   Attempting manual update with more specific pattern..."
    # Try a more aggressive update - match the exact line format
    sed -i "s|\(image: \)laurens-list-laurenslist:.*|\1${IMAGE_NAME}|g" /app/docker-compose.yml
    if [ -f "/root/laurens-list/docker-compose.yml" ]; then
        sed -i "s|\(image: \)laurens-list-laurenslist:.*|\1${IMAGE_NAME}|g" /root/laurens-list/docker-compose.yml
    fi
    # Verify again
    UPDATED_TAG=$(grep "image: laurens-list-laurenslist:" /app/docker-compose.yml | grep -oP "image: \K[^ ]+" | head -1)
    if [ "$UPDATED_TAG" != "${IMAGE_NAME}" ]; then
        echo "❌ ERROR: Failed to update docker-compose.yml after multiple attempts!"
        echo "   This is critical for rollback prevention!"
        echo "   Manual intervention required - update docker-compose.yml to use: ${IMAGE_NAME}"
        exit 1
    else
        echo "✅ Successfully updated docker-compose.yml on second attempt"
    fi
else
    echo "✅ Verified docker-compose.yml updated successfully to: ${IMAGE_NAME}"
fi

# Use --no-build and --force-recreate to avoid build context validation
# The container was removed above, so this will create a new one using the existing image
# Set project name explicitly to match the image name (laurens-list)
# Use --pull never to ensure we use the image we just built (not a cached one)
COMPOSE_IGNORE_ORPHANS=1 docker compose -f /app/docker-compose.yml -p laurens-list up -d --no-build --force-recreate --pull never laurenslist

# DO NOT restore docker-compose.yml to use 'latest'
# Keeping the unique tag ensures the container always uses the correct image, even after restarts
echo "📝 docker-compose.yml now uses unique tag: ${IMAGE_NAME}"

# Final verification: Check that docker-compose.yml has the correct tag
FINAL_CHECK=$(grep "image: laurens-list-laurenslist:" /app/docker-compose.yml | head -1)
echo "📋 Final docker-compose.yml image line: ${FINAL_CHECK}"
if echo "$FINAL_CHECK" | grep -q "${IMAGE_NAME}"; then
    echo "✅ docker-compose.yml correctly pinned to unique tag"
else
    echo "❌ CRITICAL: docker-compose.yml does NOT have the unique tag!"
    echo "   This will cause rollbacks on container restart!"
    echo "   Current line: ${FINAL_CHECK}"
    echo "   Expected: image: ${IMAGE_NAME}"
    echo "   Deployment will continue, but rollback protection is compromised!"
fi

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
        docker compose -f /app/docker-compose.yml -p laurens-list restart laurenslist
    fi
else
    echo "⚠️  Could not verify image - container may still be starting"
fi

echo "⏳ Waiting for container to start..."
sleep 3

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

