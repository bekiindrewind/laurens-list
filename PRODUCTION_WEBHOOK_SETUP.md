# Production Webhook Setup Instructions

This guide sets up automated deployment for the **production** environment (`main` branch) using GitHub webhooks. This setup applies all lessons learned from the dev webhook implementation.

**✅ Status**: Production webhook is fully operational and tested. Successfully deployed and verified on November 5, 2025.

## Prerequisites

- ✅ Dev webhook already working (optional but recommended for testing pattern)
- ✅ Docker and Docker Compose installed
- ✅ Traefik reverse proxy configured
- ✅ Git repository cloned to `/root/laurens-list` on server
- ✅ DNS access to create A records (for `webhook-prod.laurenslist.org`)

## Step 1: Generate Production Webhook Secret

Generate a **separate** secret for production (different from dev for extra security):

```bash
openssl rand -hex 32
```

**PowerShell (Windows) alternative:**
```powershell
-join ((1..32) | ForEach-Object {'{0:X}' -f (Get-Random -Max 256)})
```

Copy the output (64-character hex string).

## Step 2: Set Up DNS Record

Create a DNS A record for the production webhook subdomain:

- **Subdomain**: `webhook-prod`
- **Domain**: `laurenslist.org`
- **Type**: A
- **Value**: Your server's IP address (e.g., `168.231.71.211`)

**Note**: Same IP as main domain - Traefik routes by Host header.

Wait for DNS propagation (5-10 minutes). Verify:
```bash
nslookup webhook-prod.laurenslist.org
```

## Step 3: Add Production Secret to Server

SSH into your server:

```bash
# SSH into server
ssh user@your-server

# Add production webhook secret to .env file
# Check for existing WEBHOOK_SECRET_PROD first
grep WEBHOOK_SECRET_PROD /root/.env || echo "WEBHOOK_SECRET_PROD=your_production_secret_here" >> /root/.env

# If it already exists, remove duplicates first:
sed -i '/^WEBHOOK_SECRET_PROD=/d' /root/.env
echo "WEBHOOK_SECRET_PROD=your_production_secret_here" >> /root/.env

# Verify it was added
grep WEBHOOK_SECRET_PROD /root/.env
```

**Important**: Use a **different secret** than `WEBHOOK_SECRET` (dev) for extra security.

## Step 4: Verify Files Are on Server

Ensure production webhook files are committed to the `dev` branch and pulled:

- `webhook-listener-prod.js` - Production webhook receiver
- `deploy-prod-webhook.sh` - Production deployment script
- `Dockerfile.webhook.prod` - Production webhook container
- `docker-compose.yml` - Updated with `webhook-listener-prod` service

On your server:
```bash
cd /root/laurens-list
git checkout dev
git pull origin dev
ls -la webhook-listener-prod.js deploy-prod-webhook.sh Dockerfile.webhook.prod
```

## Step 5: Make Deployment Script Executable

```bash
cd /root/laurens-list
chmod +x deploy-prod-webhook.sh
ls -la deploy-prod-webhook.sh  # Should show -rwxr-xr-x
```

## Step 6: Build and Start Production Webhook Listener

```bash
cd /root
docker compose -f /root/laurens-list/docker-compose.yml build webhook-listener-prod
docker compose -f /root/laurens-list/docker-compose.yml up -d webhook-listener-prod
```

Check logs:
```bash
docker logs laurens-list-webhook-listener-prod-1 -f
```

You should see:
```
🚀 Production webhook listener running on port 3000
📡 Waiting for GitHub webhooks...
🌐 Webhook endpoint: https://webhook-prod.laurenslist.org
🔒 Only main branch deployments are accepted
```

**Note**: Container name format is `laurens-list-webhook-listener-prod-1` (project name prefix).

## Step 7: Verify Traefik Configuration

Check that Traefik discovered the production webhook service:

```bash
# Check Traefik logs
docker logs root-traefik-1 --tail 50 | grep webhook-prod

# Test health endpoint
curl https://webhook-prod.laurenslist.org/health
# Should return: {"status":"ok","service":"webhook-listener-prod"}
```

## Step 8: Configure GitHub Webhook (Production)

1. Go to your GitHub repository: `https://github.com/bekiindrewind/laurens-list`
2. Click **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL**: `https://webhook-prod.laurenslist.org`
   - **Content type**: `application/json`
   - **Secret**: Paste your **production** webhook secret (from Step 1) - **different from dev secret**
   - **Which events**: Select "Just the push event"
   - **Active**: ✅ Checked
4. Click **Add webhook**

**Important**: This is a **separate webhook** from the dev webhook. Use the production secret (`WEBHOOK_SECRET_PROD`).

## Step 9: Test the Production Webhook

**⚠️ WARNING**: This will deploy to production! Make sure you're ready.

1. Merge changes from `dev` to `main` branch (or make a small change directly to `main`)
2. Commit and push:
   ```bash
   git checkout main
   git add .
   git commit -m "Test production webhook deployment"
   git push origin main
   ```
3. Check GitHub webhook status:
   - Go to Settings → Webhooks → Your **production** webhook
   - Click "Recent Deliveries"
   - Latest delivery should show "202 Accepted" (green)
4. Check webhook listener logs:
   ```bash
   docker logs laurens-list-webhook-listener-prod-1 -f
   ```
   You should see:
   ```
   📦 Webhook received: push on branch main
   🚀 Starting production deployment...
   ```

5. Watch deployment script output in the logs
6. Check production site: `https://laurenslist.org` - changes should be live!

## Architecture Overview

### How Production Webhook Works

1. **GitHub Push**: You push to `main` branch
2. **GitHub Webhook**: GitHub sends POST to `https://webhook-prod.laurenslist.org`
3. **Traefik Routing**: Routes to `webhook-listener-prod` container (port 3000)
4. **Signature Verification**: Validates using `WEBHOOK_SECRET_PROD`
5. **Branch Check**: Only accepts `main` branch (rejects `dev` and others)
6. **Immediate Response**: Responds with `202 Accepted` immediately (prevents GitHub timeout)
7. **Async Deployment**: Runs `deploy-prod-webhook.sh` asynchronously:
   - Pulls latest code from GitHub (`main` branch)
   - Rebuilds Docker image
   - Restarts `laurenslist` container
   - Takes ~6-10 seconds to complete
8. **Done**: Production site updated automatically

**Verified Working**: Production webhook successfully deployed and tested on November 5, 2025. Deployment completes in ~6 seconds with zero downtime.

### Key Differences from Dev Webhook

| Feature | Dev Webhook | Production Webhook |
|---------|-------------|-------------------|
| **Branch** | `dev` | `main` |
| **Secret** | `WEBHOOK_SECRET` | `WEBHOOK_SECRET_PROD` |
| **URL** | `webhook.laurenslist.org` | `webhook-prod.laurenslist.org` |
| **Container** | `webhook-listener` | `webhook-listener-prod` |
| **Deploy Script** | `deploy-dev-webhook.sh` | `deploy-prod-webhook.sh` |
| **Target Container** | `laurenslist-dev` | `laurenslist` |
| **Target Site** | `dev.laurenslist.org` | `laurenslist.org` |

### Security Features

- ✅ **Separate webhook secret** - Production uses different secret than dev
- ✅ **Branch filtering** - Only `main` branch deploys automatically
- ✅ **Signature verification** - HMAC-SHA256 cryptographic verification
- ✅ **HTTPS required** - Traefik SSL termination
- ✅ **Async deployment** - Prevents GitHub timeouts

## Troubleshooting

### Issue: "WEBHOOK_SECRET_PROD environment variable not set"

**Symptom**: Production webhook listener exits with error or returns `401 Unauthorized` from GitHub

**Solution**:
1. Check `.env` file has `WEBHOOK_SECRET_PROD`:
   ```bash
   cat /root/.env | grep WEBHOOK_SECRET_PROD
   ```
2. Remove duplicates (if any):
   ```bash
   sed -i '/^WEBHOOK_SECRET_PROD=/d' /root/.env
   echo "WEBHOOK_SECRET_PROD=your_secret_here" >> /root/.env
   ```
3. **Recreate container** (not just restart - ensures env_file is re-evaluated):
   ```bash
   docker compose rm -f webhook-listener-prod
   docker compose up -d webhook-listener-prod
   ```

**Note**: The `env_file: - /root/.env` mechanism in `docker-compose.yml` loads secrets into the container. Ensure the container is recreated (not just restarted) after modifying `.env` to pick up changes. Secrets should **never** be hardcoded in `docker-compose.yml` for security.

### Issue: GitHub webhook delivery times out

**Symptom**: GitHub shows "We couldn't deliver this payload: timed out"

**Possible causes**:
1. Container not running - Check: `docker ps | grep webhook-listener-prod`
2. Traefik not routing - Check: `docker logs root-traefik-1 | grep webhook-prod`
3. Network configuration - Ensure all services on same network (`root_default`)

**Solution**: See `WEBHOOK_SETUP_INSTRUCTIONS.md` troubleshooting section (same issues apply).

### Issue: Wrong branch deployed

**Symptom**: Production webhook deploys dev branch or vice versa

**Cause**: Wrong webhook secret or wrong endpoint

**Solution**:
- Verify production webhook uses `WEBHOOK_SECRET_PROD` and URL `webhook-prod.laurenslist.org`
- Verify dev webhook uses `WEBHOOK_SECRET` and URL `webhook.laurenslist.org`
- Check webhook listener logs to see which branch was received

### Issue: Container name not found

**Symptom**: `docker logs root-webhook-listener-prod-1` fails

**Solution**: Use correct container name:
```bash
docker logs laurens-list-webhook-listener-prod-1 -f
```

Container names follow format: `{project-name}-{service-name}-{number}`

### Issue: "No such image: app-laurenslist:latest" or "unable to prepare context: path /root/laurens-list not found"

**Symptom**: Deployment fails with image not found or build context errors

**Cause**: Docker Compose is inferring project name from directory (`/app` → `app`) or trying to validate build context that doesn't exist inside container

**Solution**:
1. **Ensure `docker-compose.yml` has explicit `image:` field** for the service:
   ```yaml
   laurenslist:
     image: laurens-list-laurenslist:latest
     build:
       context: /root/laurens-list
       ...
   ```
2. **Use `-p laurens-list` flag** in all `docker compose` commands in deployment script
3. **Use `--no-build --force-recreate` flags** when starting container:
   ```bash
   docker compose -f /app/docker-compose.yml -p laurens-list up -d --no-build --force-recreate laurenslist
   ```
4. **Remove container before recreating** to avoid validation issues:
   ```bash
   docker compose -f /app/docker-compose.yml -p laurens-list rm -f laurenslist
   ```

**Note**: The deployment script already includes these fixes. If you encounter this error, ensure the latest version of `deploy-prod-webhook.sh` is on the server.

### Issue: Container rollback after restart

**Symptom**:
- Container was working correctly with latest code
- Container restarts (due to `restart: always` or server restart)
- After restart, container is serving old code
- `SCRIPT_VERSION` in browser console shows old commit hash

**Cause**:
- Docker Compose was using `latest` tag, which is mutable
- When container restarts, Docker Compose resolves `latest` to whatever image is available
- If an old `latest` image exists, Docker Compose uses it instead of the new one

**Solution - Rollback Prevention**:

The deployment script now uses **unique image tags** (commit hash-based) instead of `latest`:

1. **Unique Image Tags**: Each deployment gets a unique tag (e.g., `prod-c006ce1`)
2. **Pinned docker-compose.yml**: The unique tag is permanently stored in `docker-compose.yml`
3. **Build Context Verification**: Script verifies build context has latest code before building
4. **SCRIPT_VERSION Auto-Update**: `SCRIPT_VERSION` is updated during Docker build using `GIT_COMMIT` build arg

**How It Works**:

1. Deployment script gets current commit hash: `COMMIT_HASH=$(git rev-parse --short HEAD)`
2. Builds image with unique tag: `laurens-list-laurenslist:prod-${COMMIT_HASH}`
3. Updates `docker-compose.yml` to use unique tag permanently
4. Passes `GIT_COMMIT` build arg to Dockerfile
5. Dockerfile updates `SCRIPT_VERSION` during build using the commit hash

**Verification**:

After deployment, verify rollback protection is working:

```bash
cd /root/laurens-list

# Check docker-compose.yml uses unique tag (not 'latest')
grep "image:" docker-compose.yml | grep laurenslist
# Should show: image: laurens-list-laurenslist:prod-XXXXXXX

# Check container is using the unique tag
docker ps --filter "name=laurenslist" --format "{{.Image}}" | grep -v "dev"
# Should match the image tag in docker-compose.yml

# Check SCRIPT_VERSION matches current commit
CURRENT_COMMIT=$(git rev-parse --short HEAD)
CONTAINER_VERSION=$(docker exec laurens-list-laurenslist-1 cat /app/script.js | grep "SCRIPT_VERSION" | grep -oP "'\K[^']+" | head -1)
echo "Current commit: ${CURRENT_COMMIT}"
echo "Container SCRIPT_VERSION: ${CONTAINER_VERSION}"
# Should match: ${CURRENT_COMMIT}-prod (or similar)
```

**Why This Prevents Rollbacks**:

1. **Unique tags are immutable**: Once an image is tagged with `prod-c006ce1`, that tag always points to that specific image
2. **docker-compose.yml is pinned**: The unique tag is stored permanently, so restarts always use the correct image
3. **No `latest` tag confusion**: Docker Compose can't accidentally use an old `latest` image because `docker-compose.yml` doesn't reference `latest`
4. **Build context verification**: Script checks if build context has latest code and forces hard reset if needed
5. **SCRIPT_VERSION accuracy**: `SCRIPT_VERSION` is set during build using actual commit hash, not source code

**Prevention**:
- The deployment script automatically uses unique tags and pins `docker-compose.yml`
- No manual intervention needed - rollback protection is built-in
- Each deployment gets a new unique tag, old images are removed before building

## Quick Reference

### Container Names
- Dev webhook: `laurens-list-webhook-listener-1`
- Production webhook: `laurens-list-webhook-listener-prod-1`

### Check Logs
```bash
# Dev webhook
docker logs laurens-list-webhook-listener-1 -f

# Production webhook
docker logs laurens-list-webhook-listener-prod-1 -f
```

### Restart Services
```bash
# Dev webhook
docker compose -f /root/laurens-list/docker-compose.yml restart webhook-listener

# Production webhook
docker compose -f /root/laurens-list/docker-compose.yml restart webhook-listener-prod
```

### Rebuild Services
```bash
# Dev webhook
docker compose -f /root/laurens-list/docker-compose.yml build webhook-listener
docker compose -f /root/laurens-list/docker-compose.yml up -d webhook-listener

# Production webhook
docker compose -f /root/laurens-list/docker-compose.yml build webhook-listener-prod
docker compose -f /root/laurens-list/docker-compose.yml up -d webhook-listener-prod
```

## Best Practices

1. **Test in dev first** - Always test changes in dev before deploying to production
2. **Separate secrets** - Use different webhook secrets for dev and production
3. **Monitor logs** - Watch webhook logs during deployment
4. **Verify DNS** - Ensure DNS A record is created and propagated
5. **Check health endpoints** - Verify webhook is accessible before configuring GitHub
6. **Gradual rollout** - Start with dev webhook, then add production after testing

## Related Documentation

- `WEBHOOK_SETUP_INSTRUCTIONS.md` - Dev webhook setup (used as reference)
- `ARCHITECTURE.md` - System architecture overview
- `.cursorrules` - Webhook setup patterns and lessons learned

---

**Setup Time Estimate**: ~30-45 minutes (can copy most configuration from dev setup)

**Last Updated**: Based on working dev webhook implementation

