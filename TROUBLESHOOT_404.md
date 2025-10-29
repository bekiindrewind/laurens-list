# Troubleshooting 404 Error on VPS

Run these commands on your VPS to diagnose the issue:

## 1. Check if container is running
```bash
docker ps | grep laurenslist
```

Should show the container. If empty, the container crashed.

## 2. Check container logs
```bash
docker logs root-laurenslist-1 --tail 100
```

Look for:
- ❌ Error messages
- ✅ "Lauren's List server running on port 8080"
- Node.js errors (missing modules, syntax errors, etc.)

## 3. Check if you're on the right branch
```bash
cd /root/laurens-list
git branch
```

Should show `* experiment/cors-proxy`. If it shows `main`, switch:
```bash
git checkout experiment/cors-proxy
```

## 4. Verify server.js exists
```bash
cd /root/laurens-list
ls -la server.js
```

Should show the file exists.

## 5. Check if Node.js dependencies are installed
```bash
cd /root/laurens-list
ls -la node_modules/
```

If `node_modules` doesn't exist or is empty, dependencies weren't installed during Docker build.

## 6. Rebuild with verbose output
```bash
cd /root
docker compose build laurenslist --no-cache
docker compose up laurenslist
```

This will show the build process and any errors. Don't use `-d` so you can see the output.

## Common Issues:

### Issue: "Cannot find module 'express'"
**Fix:** Make sure `package.json` has express and node-fetch dependencies, and Dockerfile runs `npm install`.

### Issue: "config.production.js not found"
**Fix:** Make sure `config.production.js` exists in `/root/laurens-list/`

### Issue: Server starts but 404 still shows
**Fix:** Check Traefik routing:
```bash
docker logs root-traefik-1 --tail 50
```

### Issue: Container exits immediately
**Fix:** Check exit code:
```bash
docker ps -a | grep laurenslist
```
Then check logs for why it exited.

## Quick Rollback (if needed)
```bash
cd /root/laurens-list
git checkout main
cd /root
docker compose stop laurenslist
docker compose build laurenslist
docker compose up -d laurenslist
```

