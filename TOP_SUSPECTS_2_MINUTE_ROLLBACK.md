# Top Suspects: 2-Minute Rollback Issue

**Symptom:** Code changes work initially (for ~2 minutes), then revert to older code.

**Analysis:** This specific timing suggests a post-deployment issue where something happens after deployment completes that causes Docker Compose to reload configuration and use an old image tag.

---

## 🔴 **TOP SUSPECT #1: docker-compose.yml Getting Reverted After Deployment**

**Why This Is The Most Likely Cause:**

1. **Timing matches:** Prod updates `docker-compose.yml` BEFORE build (line 109-135), then does `git reset --hard` (line 75)
2. **Git protection might fail:** The `git update-index --assume-unchanged` protection (line 54-68) might not be working correctly
3. **Container restart reads reverted file:** When container restarts (due to `restart: always`), Docker Compose reads `docker-compose.yml` again - if it was reverted, it uses the old image tag
4. **No latest tag fallback:** Prod removes `latest` tag, so if `docker-compose.yml` reverts to `latest`, there's no fallback

**Evidence:**
- Prod updates `docker-compose.yml` BEFORE `git reset --hard`
- `git reset --hard` discards ALL local changes (including docker-compose.yml updates)
- Git protection might not work if applied to wrong path or if git index is reset
- Dev updates `docker-compose.yml` AFTER build, so it's not affected by git operations

**Why 2 Minutes?**
- Container might restart after ~2 minutes (due to `restart: always` or a crash)
- When container restarts, Docker Compose reads `docker-compose.yml` again
- If `docker-compose.yml` was reverted, it uses the old image tag

**Fix Priority:** 🔴 **CRITICAL**

---

## 🔴 **TOP SUSPECT #2: Traefik Restart Causing Docker Compose Config Reload**

**Why This Is Likely:**

1. **Prod restarts Traefik:** Line 266-270 restarts Traefik after deployment
2. **Traefik restart might trigger Docker Compose reload:** When Traefik restarts, Docker Compose might reload `docker-compose.yml` to re-discover services
3. **If docker-compose.yml was reverted:** Docker Compose would read the old image tag
4. **Timing matches:** Traefik restart happens after deployment, which could be ~2 minutes later

**Evidence:**
- Prod explicitly restarts Traefik (Dev doesn't)
- Traefik restart might cause Docker Compose to reload configuration
- If `docker-compose.yml` was reverted, Docker Compose would use the old image tag

**Why 2 Minutes?**
- Traefik restart happens after deployment completes
- Docker Compose might reload config during Traefik restart
- If `docker-compose.yml` was reverted, it uses the old image tag

**Fix Priority:** 🔴 **HIGH**

---

## 🔴 **TOP SUSPECT #3: No Latest Tag Fallback**

**Why This Is Likely:**

1. **Prod removes latest tag:** Line 157 explicitly removes `latest` tag
2. **Prod doesn't create latest tag:** Line 178-190 only builds with unique tag
3. **If docker-compose.yml reverts to latest:** Docker Compose can't find `latest` tag, might use old cached image
4. **Dev has latest tag:** Dev creates both unique tag AND `latest` tag (line 91), so it has a fallback

**Evidence:**
- Prod explicitly removes `latest` tag: `docker rmi laurens-list-laurenslist:latest`
- Prod only builds with unique tag: `-t "${IMAGE_NAME}"` (no `-t latest`)
- Dev builds with both tags: `-t "${IMAGE_NAME}" -t laurens-list-laurenslist-dev:latest`
- If `docker-compose.yml` reverts to `latest`, Prod has no fallback

**Why 2 Minutes?**
- If `docker-compose.yml` reverts to `latest` tag
- Docker Compose tries to use `latest` tag
- Since `latest` doesn't exist, Docker Compose might use an old cached image
- This could happen when container restarts or Docker Compose reloads config

**Fix Priority:** 🔴 **HIGH**

---

## 🟡 **SUSPECT #4: Container Restart Reading Reverted docker-compose.yml**

**Why This Could Be The Cause:**

1. **Container has restart: always:** Both Dev and Prod have `restart: always`
2. **Container might restart after ~2 minutes:** Due to a crash, health check failure, or resource issue
3. **Docker Compose reads docker-compose.yml on restart:** When container restarts, Docker Compose reads `docker-compose.yml` to determine which image to use
4. **If docker-compose.yml was reverted:** Docker Compose uses the old image tag

**Evidence:**
- Both Dev and Prod have `restart: always`
- Container restarts would cause Docker Compose to reload config
- If `docker-compose.yml` was reverted, it would use the old image tag

**Why 2 Minutes?**
- Container might restart after ~2 minutes (crash, health check, resource issue)
- On restart, Docker Compose reads `docker-compose.yml` again
- If it was reverted, it uses the old image tag

**Fix Priority:** 🟡 **MEDIUM** (This is a symptom, not the root cause - the root cause is docker-compose.yml getting reverted)

---

## 🟡 **SUSPECT #5: Git Reset --hard Reverting docker-compose.yml**

**Why This Could Be The Cause:**

1. **Prod uses git reset --hard:** Line 75 does `git reset --hard origin/main`
2. **This discards ALL local changes:** Including `docker-compose.yml` updates
3. **Git protection might not work:** The `git update-index --assume-unchanged` protection might not be working correctly
4. **Timing issue:** If `git reset --hard` happens AFTER deployment completes, it would revert `docker-compose.yml`

**Evidence:**
- Prod uses `git reset --hard` (aggressive, discards all changes)
- Dev uses `git pull` (gentle, preserves local changes)
- Git protection might not work if applied to wrong path or if git index is reset
- If `git reset --hard` happens after deployment, it would revert `docker-compose.yml`

**Why 2 Minutes?**
- If `git reset --hard` happens after deployment completes
- It would revert `docker-compose.yml` to the old image tag
- When container restarts or Docker Compose reloads, it uses the old image tag

**Fix Priority:** 🟡 **MEDIUM** (This is related to Suspect #1 - it's the mechanism that causes docker-compose.yml to revert)

---

## 🟡 **SUSPECT #6: Complex Path Handling Causing Inconsistencies**

**Why This Could Be The Cause:**

1. **Prod updates both paths:** Line 118-123 updates both container path (`/app/docker-compose.yml`) and host path (`/root/laurens-list/docker-compose.yml`)
2. **Docker Compose might read wrong path:** Docker Compose might read from host path, but script updates container path
3. **Inconsistency:** If paths are out of sync, Docker Compose might use the wrong image tag

**Evidence:**
- Prod updates both container and host paths
- Dev only updates container path (`/app/docker-compose.yml`)
- If paths are out of sync, Docker Compose might read the wrong file

**Why 2 Minutes?**
- If Docker Compose reads from host path but script updates container path
- When Docker Compose reloads config, it would use the old image tag from host path

**Fix Priority:** 🟡 **MEDIUM** (This could contribute to the issue, but is less likely to be the primary cause)

---

## 🔴 **ACTUAL ROOT CAUSE FOUND: Old Container Still Running**

**Date Found:** November 7, 2025

**The actual root cause was:**

An old container `root-laurenslist-1` was still running with:
- **Same Traefik router name:** `laurenslist` (same as new container)
- **Same Traefik host rule:** `laurenslist.org` (same as new container)
- **Started:** November 5, 2025 (2 days old)
- **Image:** `root-laurenslist` (old image)

**Why This Caused The Rollback:**

1. Traefik saw TWO containers with the same router name (`laurenslist`) and host rule (`laurenslist.org`)
2. Traefik was routing traffic to the old `root-laurenslist-1` container instead of (or in addition to) the new `laurens-list-laurenslist-1` container
3. The old container had old code, so users saw old behavior
4. The timing (2-4 minutes) might have been when Traefik re-evaluated routing or when load balancing switched between containers

**The Fix:**

```bash
docker stop root-laurenslist-1
docker rm root-laurenslist-1
```

**After removing the old container:**
- Only the new `laurens-list-laurenslist-1` container is running
- Traefik routes only to the new container with latest code
- Rollback issue should be resolved

**Why Dev doesn't have this issue:**
- Dev doesn't have an old container with conflicting Traefik labels
- Dev's container has a unique router name (`laurenslist-dev`)

---

## ✅ **ROOT CAUSE RESOLVED**

**Actual Root Cause:** Old container `root-laurenslist-1` was still running with conflicting Traefik labels, causing Traefik to route traffic to the old container instead of the new one.

**Fix Applied:** Removed the old container (`docker stop root-laurenslist-1 && docker rm root-laurenslist-1`)

**Status:** Issue should now be resolved. Traefik routes only to the new `laurens-list-laurenslist-1` container with latest code.

---

## Recommended Fix Priority (For Future Prevention)

1. **🔴 CRITICAL:** Ensure old containers are removed during deployment
2. **🔴 CRITICAL:** Use unique Traefik router names to prevent conflicts
3. **🟡 MEDIUM:** Simplify git operations - Use `git pull` instead of `git reset --hard`
4. **🟡 MEDIUM:** Simplify path handling - Always use `/app` path like Dev
5. **🟡 MEDIUM:** Create `latest` tag as fallback - Build with both unique tag AND `latest` tag

**Note:** The deployment script simplification (matching Dev's approach) is still recommended for consistency and reliability, but the immediate rollback issue was caused by the old container.

