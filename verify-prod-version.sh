#!/bin/bash
# Verification script to check if production container is running latest version

cd /root/laurens-list

echo "=== Production Container Version Verification ==="
echo ""

# Check current branch and commit
echo "📋 Git Status:"
git checkout main 2>/dev/null || true
CURRENT_COMMIT=$(git rev-parse --short HEAD)
CURRENT_BRANCH=$(git branch --show-current)
echo "   Branch: ${CURRENT_BRANCH}"
echo "   Commit: ${CURRENT_COMMIT}"
echo ""

# Check docker-compose.yml image tag
echo "📋 docker-compose.yml Configuration:"
COMPOSE_IMAGE=$(grep "image:" docker-compose.yml | grep laurenslist | grep -v "dev" | awk '{print $2}' | head -1)
if [ -z "$COMPOSE_IMAGE" ]; then
    echo "   ❌ ERROR: Could not find laurenslist image in docker-compose.yml"
else
    echo "   Image: ${COMPOSE_IMAGE}"
    # Extract tag from image name
    COMPOSE_TAG=$(echo "$COMPOSE_IMAGE" | cut -d: -f2)
    echo "   Tag: ${COMPOSE_TAG}"
fi
echo ""

# Check running container
echo "📋 Running Container:"
CONTAINER_NAME=$(docker ps --format "{{.Names}}" | grep laurenslist | grep -v "dev" | head -1)
if [ -z "$CONTAINER_NAME" ]; then
    echo "   ❌ ERROR: Production container not running!"
    echo "   Checking all containers..."
    docker ps -a | grep laurenslist
    exit 1
fi
echo "   Container name: ${CONTAINER_NAME}"

CONTAINER_IMAGE=$(docker ps --filter "name=${CONTAINER_NAME}" --format "{{.Image}}" | head -1)
echo "   Image: ${CONTAINER_IMAGE}"

# Extract tag from container image
CONTAINER_TAG=$(echo "$CONTAINER_IMAGE" | cut -d: -f2)
echo "   Tag: ${CONTAINER_TAG}"
echo ""

# Check SCRIPT_VERSION in container
echo "📋 Container SCRIPT_VERSION:"
CONTAINER_VERSION=$(docker exec "${CONTAINER_NAME}" cat /app/script.js 2>/dev/null | grep "SCRIPT_VERSION" | grep -oP "'\K[^']+" | head -1)
if [ -z "$CONTAINER_VERSION" ]; then
    echo "   ⚠️  WARNING: Could not read SCRIPT_VERSION from container"
else
    echo "   SCRIPT_VERSION: ${CONTAINER_VERSION}"
    # Extract commit hash from SCRIPT_VERSION (format: commit-prod)
    CONTAINER_COMMIT=$(echo "$CONTAINER_VERSION" | cut -d- -f1)
    echo "   Container commit: ${CONTAINER_COMMIT}"
fi
echo ""

# Verification results
echo "=== Verification Results ==="
echo ""

# Check if docker-compose.yml and container match
if [ "$COMPOSE_IMAGE" = "$CONTAINER_IMAGE" ]; then
    echo "✅ docker-compose.yml and container image MATCH"
else
    echo "❌ MISMATCH: docker-compose.yml and container use different images!"
    echo "   docker-compose.yml: ${COMPOSE_IMAGE}"
    echo "   Container: ${CONTAINER_IMAGE}"
fi

# Check if container tag matches current commit
if [ "$CONTAINER_TAG" = "prod-${CURRENT_COMMIT}" ]; then
    echo "✅ Container tag matches current commit (prod-${CURRENT_COMMIT})"
else
    echo "⚠️  Container tag does NOT match current commit"
    echo "   Current commit: ${CURRENT_COMMIT}"
    echo "   Container tag: ${CONTAINER_TAG}"
    echo "   Expected: prod-${CURRENT_COMMIT}"
fi

# Check if SCRIPT_VERSION matches current commit
if [ -n "$CONTAINER_COMMIT" ] && [ "$CONTAINER_COMMIT" = "$CURRENT_COMMIT" ]; then
    echo "✅ Container SCRIPT_VERSION matches current commit (${CURRENT_COMMIT})"
else
    if [ -n "$CONTAINER_COMMIT" ]; then
        echo "⚠️  Container SCRIPT_VERSION does NOT match current commit"
        echo "   Current commit: ${CURRENT_COMMIT}"
        echo "   Container commit: ${CONTAINER_COMMIT}"
    fi
fi

echo ""
echo "=== Summary ==="
if [ "$COMPOSE_IMAGE" = "$CONTAINER_IMAGE" ] && [ "$CONTAINER_TAG" = "prod-${CURRENT_COMMIT}" ] && [ "$CONTAINER_COMMIT" = "$CURRENT_COMMIT" ]; then
    echo "✅ Production container is running the latest version!"
else
    echo "⚠️  Production container may NOT be running the latest version"
    echo "   Run deployment to update: ./deploy-prod-webhook.sh"
fi


