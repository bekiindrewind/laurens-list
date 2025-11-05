# Webhook Setup Instructions (Dev-Only)

This document describes the **actual working setup** for automated deployment via GitHub webhooks. This setup took over an hour to get working due to various configuration issues that are now documented here.

## Overview

The webhook system consists of:
- **GitHub Webhook**: Sends push events to your server
- **Webhook Listener**: Express.js service that receives webhooks and validates them
- **Deployment Script**: Bash script that pulls code, rebuilds containers, and restarts services
- **Docker Compose**: Manages the webhook listener container and networking

## Prerequisites

Before starting, ensure you have:
- ✅ Docker and Docker Compose installed on your server
- ✅ Traefik reverse proxy configured and running
- ✅ Git repository cloned to `/root/laurens-list` on your server
- ✅ DNS access to create A records (for `webhook.laurenslist.org`)

## Step 1: Generate Webhook Secret

On your local machine or server, generate a random secret:

```bash
openssl rand -hex 32
```

**PowerShell (Windows) alternative:**
```powershell
-join ((1..32) | ForEach-Object {'{0:X}' -f (Get-Random -Max 256)})
```

Copy the output (it will be a 64-character hex string).

## Step 2: Set Up DNS Record

Create a DNS A record for the webhook subdomain:

- **Subdomain**: `webhook`
- **Domain**: `laurenslist.org`
- **Type**: A
- **Value**: Your server's IP address (e.g., `168.231.71.211`)

**Note**: This is the same IP as your main domain. Dev and prod can share the same IP - Traefik routes based on the `Host` header.

Wait for DNS propagation (usually 5-10 minutes). Verify with:
```bash
nslookup webhook.laurenslist.org
```

## Step 3: Add Secret to Server Environment

SSH into your server and add the secret:

```bash
# SSH into server
ssh user@your-server

# Add to .env file (create if it doesn't exist)
# Check for existing WEBHOOK_SECRET first
grep WEBHOOK_SECRET /root/.env || echo "WEBHOOK_SECRET=your_secret_here" >> /root/.env

# If it already exists, remove duplicates first:
sed -i '/^WEBHOOK_SECRET=/d' /root/.env
echo "WEBHOOK_SECRET=your_secret_here" >> /root/.env

# Verify it was added
grep WEBHOOK_SECRET /root/.env
```

**Important**: The `.env` file is loaded by Docker Compose. If you modify it after containers are running, you may need to recreate the container.

## Step 4: Verify Files Are on Server

Ensure these files exist in your repository and are committed to the `dev` branch:

- `webhook-listener.js` - Express.js webhook receiver
- `deploy-dev-webhook.sh` - Deployment script
- `Dockerfile.webhook` - Docker image for webhook listener
- `docker-compose.yml` - Updated with webhook-listener service

On your server:
```bash
cd /root/laurens-list
git checkout dev
git pull origin dev
ls -la webhook-listener.js deploy-dev-webhook.sh Dockerfile.webhook
```

If files are missing, commit and push them from your local machine first.

## Step 5: Make Deployment Script Executable

On your server:

```bash
cd /root/laurens-list
chmod +x deploy-dev-webhook.sh
ls -la deploy-dev-webhook.sh  # Should show -rwxr-xr-x
```

## Step 6: Build and Start Webhook Listener

```bash
cd /root
docker compose -f /root/laurens-list/docker-compose.yml build webhook-listener
docker compose -f /root/laurens-list/docker-compose.yml up -d webhook-listener
```

Check logs:
```bash
docker logs laurens-list-webhook-listener-1 -f
```

**Note**: Container name format is `laurens-list-webhook-listener-1` (project name prefix), not `root-webhook-listener-1`.

You should see:
```
🚀 Webhook listener running on port 3000
📡 Waiting for GitHub webhooks...
🌐 Webhook endpoint: https://webhook.laurenslist.org
🔒 Production (main) branch is protected - manual deployment only
```

If you see errors, check the troubleshooting section below.

## Step 7: Verify Traefik Configuration

The webhook listener should be accessible via Traefik. Check that Traefik discovered it:

```bash
# Check Traefik dashboard (if enabled) or check logs
docker logs root-traefik-1 --tail 50 | grep webhook

# Test health endpoint
curl https://webhook.laurenslist.org/health
# Should return: {"status":"ok","service":"webhook-listener"}
```

## Step 8: Configure GitHub Webhook

1. Go to your GitHub repository: `https://github.com/bekiindrewind/laurens-list`
2. Click **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL**: `https://webhook.laurenslist.org`
   - **Content type**: `application/json`
   - **Secret**: Paste your webhook secret (from Step 1)
   - **Which events**: Select "Just the push event"
   - **Active**: ✅ Checked
4. Click **Add webhook**

**Note**: GitHub doesn't have a branch filter in the webhook settings. The webhook listener code filters for `dev` branch only.

## Step 9: Test the Webhook

1. Make a small change in your dev branch (locally)
2. Commit and push:
   ```bash
   git checkout dev
   git add .
   git commit -m "Test webhook deployment"
   git push origin dev
   ```
3. Check GitHub webhook status:
   - Go to Settings → Webhooks → Your webhook
   - Click "Recent Deliveries"
   - Latest delivery should show "202 Accepted" (green) - this means webhook was accepted and deployment is running
   - **Note**: If you see "200 OK" or "202 Accepted", the webhook is working correctly
4. Check webhook listener logs:
   ```bash
   docker logs laurens-list-webhook-listener-1 -f
   ```
   You should see:
   ```
   📦 Webhook received: push on branch dev
   🚀 Starting dev deployment...
   ```

5. Watch deployment script output in the logs

## Step 10: Verify Deployment

1. Check dev site: `https://dev.laurenslist.org`
2. Your changes should be live!
3. Check container logs:
   ```bash
   docker logs root-laurenslist-dev-1 --tail 20
   ```

## Troubleshooting

### Issue: "Cannot find module 'express'"

**Symptom**: Webhook listener crashes with `Error: Cannot find module 'express'`

**Cause**: Volume mount `/root/laurens-list:/app` overwrites `node_modules` inside the container.

**Solution**: Use a named volume for `node_modules`:
```yaml
volumes:
  - /root/laurens-list:/app
  - webhook_node_modules:/app/node_modules  # This preserves node_modules
```

**Fix**: Update `docker-compose.yml` to include the named volume, then:
```bash
docker compose rm -f webhook-listener
docker compose up -d webhook-listener
```

---

### Issue: "WEBHOOK_SECRET environment variable not set"

**Symptom**: Webhook listener exits with `ERROR: WEBHOOK_SECRET environment variable not set!`

**Cause**: Environment variable not loaded from `.env` file.

**Solution**:
1. Check `.env` file exists and has `WEBHOOK_SECRET`:
   ```bash
   cat /root/.env | grep WEBHOOK_SECRET
   ```

2. Remove duplicate entries:
   ```bash
   sed -i '/^WEBHOOK_SECRET=/d' /root/.env
   echo "WEBHOOK_SECRET=your_secret_here" >> /root/.env
   ```

3. Recreate container (not just restart):
   ```bash
   docker compose rm -f webhook-listener
   docker compose up -d webhook-listener
   ```

4. **Fallback**: Hardcode in `docker-compose.yml`:
   ```yaml
   environment:
     - WEBHOOK_SECRET=${WEBHOOK_SECRET:-your_secret_here}
   ```

---

### Issue: GitHub webhook delivery times out

**Symptom**: GitHub shows "We couldn't deliver this payload: timed out"

**Cause**: Traefik can't reach the webhook listener container (different Docker networks).

**Solution**: Ensure all services are on the same Docker network:
```yaml
networks:
  default:
    external: true
    name: root_default  # All services must use this network
```

**Fix**: Add `networks: - default` to all services in `docker-compose.yml`, then:
```bash
docker compose down webhook-listener
docker compose up -d webhook-listener
```

**Verify**: Check Traefik can see the service:
```bash
docker logs root-traefik-1 --tail 50 | grep webhook
```

---

### Issue: "git: command not found" in deployment script

**Symptom**: Deployment script fails with `git: command not found`

**Cause**: Git CLI not installed in webhook container.

**Solution**: Install git in `Dockerfile.webhook`:
```dockerfile
RUN apt-get update && apt-get install -y bash git
```

**Fix**: Rebuild the container:
```bash
docker compose build webhook-listener
docker compose up -d webhook-listener
```

---

### Issue: "docker: command not found" in deployment script

**Symptom**: Deployment script fails with `docker: command not found`

**Cause**: Docker CLI not installed in webhook container.

**Solution**: Install Docker CLI in `Dockerfile.webhook`:
```dockerfile
RUN apt-get install -y docker-ce-cli docker-compose-plugin
```

**Also ensure**: Docker socket is mounted:
```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
```

**Fix**: Rebuild the container:
```bash
docker compose build webhook-listener
docker compose up -d webhook-listener
```

---

### Issue: "no configuration file provided: not found"

**Symptom**: `docker compose` command fails with "no configuration file provided"

**Cause**: `docker compose` looks for `docker-compose.yml` in current directory, but paths are relative to host.

**Solution**: Use explicit file path in deployment script:
```bash
docker compose -f /app/docker-compose.yml stop laurenslist-dev
```

**Also**: Use `docker build` directly instead of `docker compose build`:
```bash
docker build -f /app/Dockerfile -t laurens-list-laurenslist-dev:latest /app
```

---

### Issue: "Your local changes to the following files would be overwritten by merge"

**Symptom**: `git pull` fails with merge conflict

**Cause**: Local changes in the repository (from previous manual edits).

**Solution**: Stash local changes before pulling:
```bash
git stash || true  # Stash or ignore if nothing to stash
git pull origin dev
```

**Fix**: Add `git stash || true` to `deploy-dev-webhook.sh` before `git pull`.

---

### Issue: "unable to prepare context: path not found"

**Symptom**: `docker compose build` fails with "unable to prepare context: path /root/laurens-list not found"

**Cause**: When running `docker compose` from inside a container, paths are resolved relative to the host, but the build context path doesn't exist from the container's perspective.

**Solution**: Use `docker build` directly with the mounted volume path:
```bash
docker build -f /app/Dockerfile -t laurens-list-laurenslist-dev:latest /app
```

**Fix**: Change `deploy-dev-webhook.sh` to use `docker build` instead of `docker compose build`.

---

### Issue: Webhook returns 500 error

**Symptom**: GitHub shows webhook delivery failed with 500 error

**Possible causes**:
1. **Missing rawBody**: Webhook listener needs raw request body for signature verification
   - **Fix**: Ensure `express.json({ verify: ... })` middleware is configured correctly

2. **Invalid signature**: Secret mismatch between GitHub and server
   - **Fix**: Verify `WEBHOOK_SECRET` matches in both places

3. **Deployment script error**: Script fails during execution
   - **Fix**: Check webhook listener logs for detailed error messages

**Debug**:
```bash
docker logs laurens-list-webhook-listener-1 -f
# Watch for specific error messages
```

---

### Issue: Traefik routing to wrong domain

**Symptom**: Traefik tries to get SSL certificate for wrong domain (e.g., `dev.laurenslist.org` instead of `webhook.laurenslist.org`)

**Cause**: Traefik infers domain from labels or routing rules.

**Solution**: Explicitly set Traefik rule in `docker-compose.yml`:
```yaml
labels:
  - "traefik.http.routers.webhook.rule=Host(`webhook.laurenslist.org`)"
```

**Fix**: Update `docker-compose.yml` with correct `Host` rule, then:
```bash
docker compose up -d webhook-listener
```

---

### Issue: DNS not resolving

**Symptom**: `nslookup webhook.laurenslist.org` returns "can't find webhook.laurenslist.org"

**Cause**: DNS record not created or not propagated yet.

**Solution**:
1. Create DNS A record: `webhook.laurenslist.org` → `168.231.71.211`
2. Wait 5-10 minutes for propagation
3. Verify: `nslookup webhook.laurenslist.org`

---

### Issue: Webhook listener not receiving requests

**Symptom**: GitHub webhook shows delivery, but webhook listener logs show nothing

**Possible causes**:
1. Traefik not routing to webhook listener
   - **Fix**: Check Traefik logs: `docker logs root-traefik-1 --tail 50`
   - Verify labels are correct in `docker-compose.yml`

2. Wrong endpoint URL in GitHub
   - **Fix**: Ensure URL is `https://webhook.laurenslist.org` (not `/webhook` path)

3. Container not running
   - **Fix**: `docker ps | grep webhook-listener`

---

## Architecture Notes

### How It Works

1. **GitHub Push**: You push to `dev` branch
2. **GitHub Webhook**: GitHub sends POST request to `https://webhook.laurenslist.org`
3. **Traefik Routing**: Traefik receives request, routes to `webhook-listener` container (port 3000)
4. **Signature Verification**: Webhook listener verifies GitHub signature using `WEBHOOK_SECRET`
5. **Branch Check**: Listener checks if branch is `dev` (rejects `main` and others)
6. **Immediate Response**: Webhook listener responds immediately with `202 Accepted` to prevent GitHub timeouts
   - GitHub times out after ~10 seconds, but deployment takes 16-36 seconds
   - Responding immediately prevents timeout while deployment continues
7. **Async Deployment**: Deployment script runs asynchronously in the background:
   - Pulls latest code from GitHub
   - Rebuilds Docker image
   - Restarts `laurenslist-dev` container
8. **Done**: Dev site is updated automatically

**Key Design**: The webhook responds immediately (202 Accepted) and runs deployment asynchronously to prevent GitHub timeouts while ensuring deployments complete successfully.

### Key Files

- **`webhook-listener.js`**: Express.js server that receives and validates webhooks
- **`deploy-dev-webhook.sh`**: Bash script that performs the actual deployment
- **`Dockerfile.webhook`**: Docker image with Node.js, git, and Docker CLI
- **`docker-compose.yml`**: Defines `webhook-listener` service with Traefik labels

### Network Configuration

All services must be on the same Docker network (`root_default`) for Traefik to route properly:
- `traefik` service
- `laurenslist` service (prod)
- `laurenslist-dev` service (dev)
- `webhook-listener` service

### Volume Mounts

- `/root/laurens-list:/app`: Git repository (read-write)
- `/var/run/docker.sock:/var/run/docker.sock:ro`: Docker socket (for deployment script)
- `webhook_node_modules:/app/node_modules`: Named volume to preserve `node_modules`

### Environment Variables

- `WEBHOOK_SECRET`: Loaded from `/root/.env` file
- `TMDB_API_KEY`, `GOOGLE_BOOKS_API_KEY`, `DOESTHEDOGDIE_API_KEY`: Passed to deployment script for Docker build

## Security Notes

- ✅ **Production is protected** - Only dev branch deploys via webhook
- ✅ **Main branch ignored** - Production deployments must be manual
- ✅ **Signature verification** - Webhooks are cryptographically verified using HMAC-SHA256
- ✅ **HTTPS required** - Webhook endpoint uses HTTPS (Traefik SSL termination)
- ✅ **Branch filtering** - Webhook listener explicitly checks branch name
- ✅ **Manual override** - Can always SSH in and deploy manually if webhook fails

## Production Deployment

Production remains **manual** (SSH deployment). This is intentional for safety.

To deploy production:
```bash
cd /root/laurens-list
git checkout main
git pull origin main
cd /root
docker compose stop laurenslist
docker compose build laurenslist --no-cache
docker compose up -d laurenslist
```

## Time Estimate

**Initial setup**: ~1-2 hours (with troubleshooting)
**Subsequent setups** (e.g., for production): ~30-45 minutes (can copy most configuration)

**Why it took so long**: Multiple configuration issues that required debugging:
- Docker network configuration
- Volume mount issues
- Environment variable loading
- Missing CLI tools in container
- Docker build context paths
- Traefik routing configuration
- DNS setup

All of these issues are now documented in this troubleshooting section.
