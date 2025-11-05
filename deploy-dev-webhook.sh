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

echo "⬇️  Pulling latest changes..."
git pull origin dev

echo "🛑 Stopping dev container..."
# Use docker compose from host system via docker socket
# docker-compose.yml is at /app/docker-compose.yml (mounted from /root/laurens-list)
# Project directory needs to match the host path where docker-compose.yml expects files
docker compose -f /app/docker-compose.yml --project-directory /root/laurens-list stop laurenslist-dev || true

echo "🔨 Rebuilding dev container (no cache)..."
docker compose -f /app/docker-compose.yml --project-directory /root/laurens-list build laurenslist-dev --no-cache

echo "▶️  Starting dev container..."
docker compose -f /app/docker-compose.yml --project-directory /root/laurens-list up -d laurenslist-dev

echo "⏳ Waiting for container to start..."
sleep 5

echo "📋 Checking container logs..."
docker logs root-laurenslist-dev-1 --tail 20 || echo "⚠️  Container not found yet"

echo "✅ Dev deployment complete!"
echo "🌐 Test at: https://dev.laurenslist.org"
echo "📅 Completed at: $(date)"

