# Dev Site Troubleshooting

## Quick Diagnostics

If dev site returns 404, check these in order:

```bash
# 1. Check if dev container is running
docker ps | grep laurenslist-dev

# 2. Check dev container logs for errors
docker logs root-laurenslist-dev-1 --tail 50

# 3. Check if container exists (might have crashed)
docker ps -a | grep laurenslist-dev

# 4. Check Traefik routing for dev
docker logs root-traefik-1 --tail 50 | grep -i dev

# 5. Verify the dev service is registered with Traefik
docker inspect root-laurenslist-dev-1 | grep -i traefik

# 6. Test if container responds on internal port
docker exec root-laurenslist-dev-1 curl -I http://localhost:8080

# 7. Check Traefik access logs
docker logs root-traefik-1 --tail 100 | grep dev.laurenslist.org
```

## Common Fixes

### Container Not Running
```bash
# Restart the dev container
cd /root
docker compose up -d laurenslist-dev

# Check logs again
docker logs root-laurenslist-dev-1 --tail 50
```

### Container Crashed/Error
```bash
# Check what error occurred
docker logs root-laurenslist-dev-1 --tail 100

# Rebuild from scratch
cd /root
docker compose stop laurenslist-dev
docker compose rm -f laurenslist-dev
docker compose build laurenslist-dev --no-cache
docker compose up -d laurenslist-dev

# Wait and check logs
sleep 10
docker logs root-laurenslist-dev-1 --tail 50
```

### Traefik Not Routing
```bash
# Restart Traefik (usually not needed, but can help)
docker compose restart traefik

# Wait a moment
sleep 5

# Test again
curl -I https://dev.laurenslist.org
```

### Code/Server Error
```bash
# Check if server.js has syntax errors
cd /root/laurens-list
node -c server.js

# Test if server starts manually
node server.js
# (Press Ctrl+C to stop)

# Check if all files are present
ls -la server.js script.js package.json
```

