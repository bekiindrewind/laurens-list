# Dev vs Prod Configuration Comparison

**Date:** November 7, 2025  
**Issue:** Dev works consistently, Prod works the first time you search for something, then appears to rollback to an older image.

This document compares every aspect of Dev and Prod configurations to identify differences that could cause the rollback issue.

---

## 1. GitHub Webhook Configurations

### Dev Webhook
- **URL:** `https://webhook.laurenslist.org`
- **Secret:** `WEBHOOK_SECRET` (from `/root/.env`)
- **Events:** "Just the push event"
- **Branch Filter:** `dev` branch only
- **Active:** ✅ Checked

### Prod Webhook
- **URL:** `https://webhook-prod.laurenslist.org`
- **Secret:** `WEBHOOK_SECRET_PROD` (from `/root/.env`)
- **Events:** "Just the push event"
- **Branch Filter:** `main` branch only
- **Active:** ✅ Checked

**Differences:**
- ✅ Different URLs (expected)
- ✅ Different secrets (expected)
- ✅ Different branch filters (expected)

---

## 2. Webhook Listener Files

### `webhook-listener.js` (Dev)
- **Environment Variable:** `WEBHOOK_SECRET`
- **Branch Check:** `if (branch !== 'dev')`
- **Deployment Script:** `/app/deploy-dev-webhook.sh`
- **Log Message:** "🚀 Webhook listener running on port 3000"
- **Endpoint Log:** "🌐 Webhook endpoint: https://webhook.laurenslist.org"

### `webhook-listener-prod.js` (Prod)
- **Environment Variable:** `WEBHOOK_SECRET_PROD`
- **Branch Check:** `if (branch !== 'main')`
- **Deployment Script:** `/app/deploy-prod-webhook.sh`
- **Log Message:** "🚀 Production webhook listener running on port 3000"
- **Endpoint Log:** "🌐 Webhook endpoint: https://webhook-prod.laurenslist.org"

**Differences:**
- ✅ Different environment variables (expected)
- ✅ Different branch checks (expected)
- ✅ Different deployment scripts (expected)
- ✅ Different log messages (cosmetic)

**Code Structure:** Identical except for the differences above.

---

## 3. Deployment Scripts

### `deploy-dev-webhook.sh` (Dev)

**Key Characteristics:**
1. **Simple approach:** Uses `git pull origin dev` (not `git reset --hard`)
2. **No git protection:** Does NOT use `git update-index --assume-unchanged`
3. **Simple docker-compose.yml update:** Single `sed` command after build
4. **Always uses `/app` path:** No environment detection
5. **Creates `latest` tag:** Builds with both unique tag AND `latest` tag
6. **No Traefik restart:** Does NOT restart Traefik after deployment
7. **No build context verification:** Only checks `SCRIPT_VERSION`, not specific code features
8. **Simple container removal:** Uses `stop` and `rm`, not `down`

**Critical Code Sections:**
```bash
# Line 29: Simple git pull
git pull origin dev

# Line 91: Creates BOTH unique tag AND latest tag
-t "${IMAGE_NAME}" \
-t laurens-list-laurenslist-dev:latest \

# Line 105: Simple sed update AFTER build
sed -i "s|image: laurens-list-laurenslist-dev:.*|image: ${IMAGE_NAME}|g" /app/docker-compose.yml

# Line 111: Uses --no-build --force-recreate
COMPOSE_IGNORE_ORPHANS=1 docker compose -f /app/docker-compose.yml -p laurens-list up -d --no-build --force-recreate --pull never laurenslist-dev
```

### `deploy-prod-webhook.sh` (Prod)

**Key Characteristics:**
1. **Complex approach:** Uses `git reset --hard origin/main` (not `git pull`)
2. **Git protection:** Uses `git update-index --assume-unchanged` to protect `docker-compose.yml`
3. **Complex docker-compose.yml update:** Updates BOTH container and host paths, with verification
4. **Environment detection:** Detects if running in container or on host, uses `PROJECT_DIR` variable
5. **NO `latest` tag:** Only builds with unique tag, explicitly removes `latest` if it exists
6. **Traefik restart:** Restarts Traefik after deployment (lines 266-270)
7. **Build context verification:** Checks for specific code features ("Book confidence:", "My Oxford Year")
8. **Complex container removal:** Uses `down` instead of `stop` and `rm`

**Critical Code Sections:**
```bash
# Line 54-68: Git protection logic
echo "🔒 Protecting docker-compose.yml from git revert..."
HOST_COMPOSE_FILE="/root/laurens-list/docker-compose.yml"
if [ -f "$HOST_COMPOSE_FILE" ]; then
    git update-index --no-assume-unchanged "$HOST_COMPOSE_FILE" 2>/dev/null || true
    git update-index --assume-unchanged "$HOST_COMPOSE_FILE" 2>/dev/null || true
fi

# Line 75: Hard reset instead of pull
git reset --hard origin/main

# Line 87-101: Build context verification
if ! grep -q "Book confidence:" "$PROJECT_DIR/script.js" 2>/dev/null; then
    echo "❌ ERROR: Build context missing confidence display code!"
    git fetch origin
    git reset --hard origin/main
fi

# Line 109-135: Complex docker-compose.yml update (BEFORE build)
COMPOSE_FILE="/app/docker-compose.yml"
if [ ! -f "$COMPOSE_FILE" ] && [ -f "/root/laurens-list/docker-compose.yml" ]; then
    COMPOSE_FILE="/root/laurens-list/docker-compose.yml"
fi
sed -i "s|image: laurens-list-laurenslist:.*|image: ${IMAGE_NAME}|g" "$COMPOSE_FILE"
# Also update host path if different
HOST_COMPOSE_FILE="/root/laurens-list/docker-compose.yml"
if [ -f "$HOST_COMPOSE_FILE" ] && [ "$COMPOSE_FILE" != "$HOST_COMPOSE_FILE" ]; then
    sed -i "s|image: laurens-list-laurenslist:.*|image: ${IMAGE_NAME}|g" "$HOST_COMPOSE_FILE"
fi

# Line 148: Uses 'down' instead of 'stop' and 'rm'
docker compose -f "$COMPOSE_FILE" -p laurens-list down laurenslist || true

# Line 178-190: NO latest tag, only unique tag
docker build \
  --no-cache \
  ...
  -t "${IMAGE_NAME}" \
  "$PROJECT_DIR"

# Line 194: Explicitly removes latest tag
docker rmi laurens-list-laurenslist:latest 2>/dev/null || true

# Line 216-225: Verifies docker-compose.yml still has unique tag BEFORE starting
if ! grep -q "${IMAGE_NAME}" "$COMPOSE_FILE"; then
    echo "❌ ERROR: docker-compose.yml was reverted!"
    sed -i "s|image: laurens-list-laurenslist:.*|image: ${IMAGE_NAME}|g" "$COMPOSE_FILE"
fi

# Line 227: Uses --no-build --force-recreate
COMPOSE_IGNORE_ORPHANS=1 docker compose -f "$COMPOSE_FILE" -p laurens-list up -d --no-build --force-recreate --pull never laurenslist

# Line 266-270: Traefik restart
echo "🔄 Restarting Traefik to ensure it picks up the new container..."
docker compose -f "$COMPOSE_FILE" -p laurens-list restart traefik || true
```

**Major Differences:**

| Aspect | Dev | Prod |
|--------|-----|------|
| **Git Operation** | `git pull origin dev` | `git reset --hard origin/main` |
| **Git Protection** | ❌ None | ✅ `git update-index --assume-unchanged` |
| **Environment Detection** | ❌ Always uses `/app` | ✅ Detects container vs host |
| **docker-compose.yml Update** | After build, single `sed` | Before build, updates both paths with verification |
| **Image Tagging** | Unique tag + `latest` | Only unique tag, removes `latest` |
| **Container Removal** | `stop` + `rm` | `down` |
| **Traefik Restart** | ❌ No | ✅ Yes |
| **Build Context Verification** | Only `SCRIPT_VERSION` | Checks specific code features |
| **Path Handling** | Always `/app` | Uses `PROJECT_DIR` variable |

---

## 4. Docker Compose Configuration

### `laurenslist-dev` Service (Dev)
```yaml
laurenslist-dev:
  image: laurens-list-laurenslist-dev:latest
  restart: always
  networks:
    - default
  labels:
    - "traefik.http.routers.laurenslist-dev.rule=Host(`dev.laurenslist.org`)"
  environment:
    - NODE_ENV=development
    - DOESTHEDOGDIE_API_KEY=${DOESTHEDOGDIE_API_KEY:-}
```

### `laurenslist` Service (Prod)
```yaml
laurenslist:
  image: laurens-list-laurenslist:latest
  restart: always
  networks:
    - default
  labels:
    - "traefik.http.routers.laurenslist.rule=Host(`laurenslist.org`) || Host(`www.laurenslist.org`) || Host(`srv1010721.hstgr.cloud`)"
  environment:
    - DOESTHEDOGDIE_API_KEY=${DOESTHEDOGDIE_API_KEY:-}
```

**Differences:**
- ✅ Different image names (expected)
- ✅ Different Traefik host rules (expected)
- ✅ Dev has `NODE_ENV=development`, Prod doesn't have `NODE_ENV` set
- ⚠️ **Both use `latest` tag initially** - but deployment scripts update this differently

**Critical Issue:**
- Dev deployment script creates BOTH unique tag AND `latest` tag, then updates `docker-compose.yml` to use unique tag
- Prod deployment script creates ONLY unique tag, removes `latest`, and updates `docker-compose.yml` to use unique tag
- **BUT:** If `docker-compose.yml` gets reverted or if container restarts before the update, Prod might use `latest` tag which doesn't exist or is old

---

## 5. Dockerfile Differences

### `Dockerfile.webhook` (Dev)
- Copies `webhook-listener.js`
- Copies `deploy-dev-webhook.sh`
- Makes `deploy-dev-webhook.sh` executable

### `Dockerfile.webhook.prod` (Prod)
- Copies `webhook-listener-prod.js`
- Copies `deploy-prod-webhook.sh`
- Makes `deploy-prod-webhook.sh` executable

**Differences:**
- ✅ Different files copied (expected)
- ✅ Otherwise identical

---

## 6. Traefik Configuration

### Dev Traefik Labels
```yaml
- "traefik.http.routers.laurenslist-dev.rule=Host(`dev.laurenslist.org`)"
- "traefik.http.routers.laurenslist-dev.tls=true"
- "traefik.http.routers.laurenslist-dev.entrypoints=web,websecure"
- "traefik.http.routers.laurenslist-dev.tls.certresolver=mytlschallenge"
- "traefik.http.services.laurenslist-dev.loadbalancer.server.port=8080"
```

### Prod Traefik Labels
```yaml
- "traefik.http.routers.laurenslist.rule=Host(`laurenslist.org`) || Host(`www.laurenslist.org`) || Host(`srv1010721.hstgr.cloud`)"
- "traefik.http.routers.laurenslist.tls=true"
- "traefik.http.routers.laurenslist.entrypoints=web,websecure"
- "traefik.http.routers.laurenslist.tls.certresolver=mytlschallenge"
- "traefik.http.services.laurenslist.loadbalancer.server.port=8080"
```

**Differences:**
- ✅ Different host rules (expected)
- ✅ Prod has multiple host rules (expected)
- ⚠️ **Prod deployment script restarts Traefik, Dev doesn't**

---

## 7. Container Restart Behavior

### Dev
- **Restart Policy:** `restart: always`
- **Traefik Restart:** ❌ No restart after deployment
- **Container Removal:** `stop` + `rm` (gentle)
- **Image Tagging:** Creates both unique tag AND `latest` tag

### Prod
- **Restart Policy:** `restart: always`
- **Traefik Restart:** ✅ Restarts Traefik after deployment
- **Container Removal:** `down` (aggressive, forces config reload)
- **Image Tagging:** Only unique tag, removes `latest`

**Potential Issue:**
- Prod's `down` command might be causing issues with Traefik routing
- Traefik restart might be interfering with container startup
- If `docker-compose.yml` gets reverted, Prod has no `latest` tag to fall back to

---

## 8. Image Tagging Strategy

### Dev
1. Builds image with BOTH tags: `dev-COMMIT_HASH` AND `latest`
2. Updates `docker-compose.yml` to use unique tag
3. If `docker-compose.yml` reverts, `latest` tag still exists and points to recent build

### Prod
1. Builds image with ONLY unique tag: `prod-COMMIT_HASH`
2. Explicitly removes `latest` tag if it exists
3. Updates `docker-compose.yml` to use unique tag
4. If `docker-compose.yml` reverts, there's NO `latest` tag to use, so Docker Compose might use an old cached image

**Critical Issue:**
- If `docker-compose.yml` gets reverted (by `git reset --hard` or other means), Prod has no `latest` tag to fall back to
- Docker Compose might use an old cached image or fail to start
- Dev has `latest` tag as a fallback, so it's more resilient

---

## 9. Git Operations

### Dev
- Uses `git pull origin dev` (gentle, preserves local changes)
- No git protection for `docker-compose.yml`
- Simple approach

### Prod
- Uses `git reset --hard origin/main` (aggressive, discards all local changes)
- Uses `git update-index --assume-unchanged` to protect `docker-compose.yml`
- Complex approach with multiple verification steps

**Potential Issue:**
- `git reset --hard` might be reverting `docker-compose.yml` despite protection
- The protection might not be working correctly
- Dev's simpler approach might be more reliable

---

## 10. Path Handling

### Dev
- Always uses `/app` path (mounted volume)
- No environment detection
- Simple and consistent

### Prod
- Detects if running in container (`/app`) or on host (`/root/laurens-list`)
- Uses `PROJECT_DIR` variable
- Updates both container and host paths
- Complex and error-prone

**Potential Issue:**
- Path detection might fail
- Updating both paths might cause inconsistencies
- Dev's simpler approach is more reliable

---

## 11. Build Context Verification

### Dev
- Only checks `SCRIPT_VERSION` matches commit hash
- Simple check

### Prod
- Checks `SCRIPT_VERSION` matches commit hash
- Also checks for specific code features ("Book confidence:", "My Oxford Year")
- More thorough but might be too strict

**Potential Issue:**
- Prod's verification might be failing incorrectly
- Might be forcing unnecessary rebuilds

---

## 12. Container Startup Sequence

### Dev
1. Stop container
2. Remove container
3. Build image (with both tags)
4. Update `docker-compose.yml`
5. Start container with `--no-build --force-recreate`
6. Verify image matches
7. Done

### Prod
1. Protect `docker-compose.yml` from git
2. Hard reset git
3. Verify build context
4. Update `docker-compose.yml` (BEFORE build)
5. Stop container with `down`
6. Remove old images (including `latest`)
7. Build image (only unique tag)
8. Verify `docker-compose.yml` still has unique tag
9. Start container with `--no-build --force-recreate`
10. Verify image matches
11. Restart Traefik
12. Wait for Traefik
13. Done

**Potential Issue:**
- Prod's sequence is much more complex
- More opportunities for failure
- Traefik restart might be causing issues

---

## Summary of Critical Differences

### 🔴 **HIGH RISK DIFFERENCES:**

1. **Image Tagging:**
   - Dev: Creates both unique tag AND `latest` tag (fallback exists)
   - Prod: Only unique tag, removes `latest` (no fallback if `docker-compose.yml` reverts)

2. **docker-compose.yml Update Timing:**
   - Dev: Updates AFTER build
   - Prod: Updates BEFORE build (might get reverted by `git reset --hard`)

3. **Git Operations:**
   - Dev: `git pull` (gentle)
   - Prod: `git reset --hard` (aggressive, might revert `docker-compose.yml`)

4. **Container Removal:**
   - Dev: `stop` + `rm` (gentle)
   - Prod: `down` (aggressive, might cause issues)

5. **Traefik Restart:**
   - Dev: No restart
   - Prod: Restarts Traefik (might interfere with container startup)

### 🟡 **MEDIUM RISK DIFFERENCES:**

6. **Path Handling:**
   - Dev: Always `/app` (simple)
   - Prod: Environment detection with `PROJECT_DIR` (complex)

7. **Build Context Verification:**
   - Dev: Simple `SCRIPT_VERSION` check
   - Prod: Multiple code feature checks (might be too strict)

8. **Git Protection:**
   - Dev: None
   - Prod: `git update-index --assume-unchanged` (might not work correctly)

---

## Recommended Fixes

Based on this comparison, the most likely causes of Prod's rollback issue are:

1. **`docker-compose.yml` getting reverted** - Prod updates it before build, but `git reset --hard` might revert it
2. **No `latest` tag fallback** - If `docker-compose.yml` reverts, Prod has no `latest` tag to use
3. **Traefik restart interfering** - Restarting Traefik might cause routing issues
4. **Complex path handling** - Environment detection might fail

**Recommended Solution:**
Make Prod's deployment script match Dev's simpler, proven approach:
- Use `git pull` instead of `git reset --hard`
- Create both unique tag AND `latest` tag
- Update `docker-compose.yml` AFTER build
- Remove Traefik restart
- Simplify path handling to always use `/app`
- Remove git protection (Dev doesn't need it)

---

## ✅ **ROOT CAUSE FOUND AND RESOLVED**

**Date:** November 7, 2025

**Actual Root Cause:** An old container `root-laurenslist-1` was still running with:
- Same Traefik router name (`laurenslist`) as the new container
- Same Traefik host rule (`laurenslist.org`) as the new container
- Started on November 5, 2025 (2 days old)
- Using old image `root-laurenslist`

**Why This Caused The Rollback:**
- Traefik saw TWO containers with the same router name and host rule
- Traefik was routing traffic to the old container instead of the new one
- Users saw old code because they were hitting the old container

**Fix Applied:**
```bash
docker stop root-laurenslist-1
docker rm root-laurenslist-1
```

**Status:** Issue resolved. Traefik now routes only to the new `laurens-list-laurenslist-1` container.

---

## Next Steps (For Future Prevention)

1. ✅ **DONE:** Removed old container causing rollback
2. Ensure deployment scripts remove old containers before starting new ones
3. Use unique Traefik router names to prevent conflicts
4. Consider simplifying Prod deployment script to match Dev's approach (for consistency)

