# Dev to Production Deployment Guide

This guide explains how to use the dev/staging environment (`dev.laurenslist.org`) to test features before deploying to production (`laurenslist.org`).

## Overview

- **Production**: `https://laurenslist.org` → `main` branch → `laurenslist` container
- **Dev**: `https://dev.laurenslist.org` → any branch → `laurenslist-dev` container

---

## Complete Development Cycle

### Step 1: Create and Develop a Feature Branch

**On your local machine:**

```bash
# Create a new branch for your feature
git checkout -b experiment/my-new-feature

# Make your changes (edit files, etc.)
# Test locally if possible

# Commit your changes
git add .
git commit -m "Add new feature: description"

# Push to GitHub
git push origin experiment/my-new-feature
```

### Step 2: Deploy to Dev Environment for Testing

**SSH into your VPS and run:**

```bash
# Navigate to project directory
cd /root/laurens-list

# Fetch latest branches from GitHub
git fetch origin

# Checkout your experiment branch
git checkout experiment/my-new-feature

# Pull latest changes (in case you pushed more)
git pull origin experiment/my-new-feature

# Rebuild and restart the DEV container (not production!)
cd /root
docker compose stop laurenslist-dev
docker compose build laurenslist-dev --no-cache
docker compose up -d laurenslist-dev

# Wait a few seconds for it to start
sleep 5

# Check logs to verify it started
docker logs root-laurenslist-dev-1 --tail 20
```

### Step 3: Test on Dev Environment

1. Open `https://dev.laurenslist.org` in your browser
2. Test your new feature thoroughly
3. Check the browser console (F12) for any errors
4. Verify all functionality works as expected

**If something is broken:**

```bash
# View logs to debug
docker logs root-laurenslist-dev-1 -f

# Make fixes locally, commit, push, then rebuild dev
cd /root/laurens-list
git pull origin experiment/my-new-feature
cd /root
docker compose build laurenslist-dev --no-cache
docker compose up -d laurenslist-dev
```

### Step 4: Deploy to Production (After Testing)

**On your local machine:**

```bash
# Switch to main branch
git checkout main

# Merge your tested feature
git merge experiment/my-new-feature

# Push to GitHub
git push origin main
```

**On your VPS:**

```bash
# Navigate to project directory
cd /root/laurens-list

# Switch to main branch
git checkout main

# Pull the merged changes
git pull origin main

# Rebuild and restart PRODUCTION container (not dev!)
cd /root
docker compose stop laurenslist
docker compose build laurenslist --no-cache
docker compose up -d laurenslist

# Verify production is working
docker logs root-laurenslist-1 --tail 20

# Test production site
curl -I https://laurenslist.org
```

---

## Example: Testing Trigger Warning Database Feature

**Deploy to Dev:**

```bash
# On VPS
cd /root/laurens-list
git checkout experiment/trigger-warning-database
git pull origin experiment/trigger-warning-database
cd /root
docker compose build laurenslist-dev --no-cache
docker compose up -d laurenslist-dev
```

**Test:**
- Visit `https://dev.laurenslist.org`
- Search for a book like "The Fault in Our Stars"
- Check if Trigger Warning Database search is working
- Check console logs for Trigger Warning Database API calls

**If it works and you're ready for production:**

```bash
# On local machine
git checkout main
git merge experiment/trigger-warning-database
git push origin main

# On VPS
cd /root/laurens-list
git checkout main
git pull origin main
cd /root
docker compose build laurenslist --no-cache
docker compose up -d laurenslist
```

---

## Quick Reference Commands

### Update Dev with a Specific Branch

```bash
cd /root/laurens-list && \
git checkout <branch-name> && \
git pull origin <branch-name> && \
cd /root && \
docker compose build laurenslist-dev --no-cache && \
docker compose up -d laurenslist-dev
```

### Update Production from Main

```bash
cd /root/laurens-list && \
git checkout main && \
git pull origin main && \
cd /root && \
docker compose build laurenslist --no-cache && \
docker compose up -d laurenslist
```

### View Dev Logs

```bash
docker logs root-laurenslist-dev-1 -f
```

### View Production Logs

```bash
docker logs root-laurenslist-1 -f
```

### Check What's Running

```bash
docker ps | grep laurenslist
```

### Restart Dev Container (No Rebuild)

```bash
docker compose restart laurenslist-dev
```

### Restart Production Container (No Rebuild)

```bash
docker compose restart laurenslist
```

---

## Important Rules

### 1. Always Test on Dev First

- ✅ **DO**: Deploy to `dev.laurenslist.org` first, test thoroughly, then deploy to production
- ❌ **DON'T**: Deploy experiment branches directly to production

### 2. Use Separate Containers

- `laurenslist-dev` → dev environment (for testing)
- `laurenslist` → production environment (for live site)
- Never deploy experiment branches directly to production

### 3. Production = Main Branch Only

- Production should always be on `main` branch
- Merge tested branches into `main` before deploying to production
- Only deploy production after successful testing on dev

### 4. Keep Environments Separate

- **Production**: `main` branch → `laurenslist` container → `laurenslist.org`
- **Dev**: any branch → `laurenslist-dev` container → `dev.laurenslist.org`

---

## Workflow Diagram

```
Local Machine                    VPS Dev              VPS Production
     │                              │                      │
     ├─ Create branch               │                      │
     ├─ Make changes                │                      │
     ├─ Commit & push               │                      │
     │   ──────────────────────────>│                      │
     │                              ├─ Checkout branch     │
     │                              ├─ Build dev container │
     │                              ├─ Test on dev.laurenslist.org
     │                              │                      │
     │  [After testing]             │                      │
     ├─ Merge to main                │                      │
     ├─ Push main                   │                      │
     │   ────────────────────────────┼───────────────────>│
     │                              │                      ├─ Checkout main
     │                              │                      ├─ Build prod container
     │                              │                      └─ Live on laurenslist.org
```

---

## Emergency Rollback

If something goes wrong in production, you can quickly rollback:

### Option 1: Revert to Previous Commit

```bash
# On VPS
cd /root/laurens-list

# Switch to main and go back one commit
git checkout main
git reset --hard HEAD~1

# Rebuild production
cd /root
docker compose build laurenslist --no-cache
docker compose up -d laurenslist
```

### Option 2: Revert to Specific Commit

```bash
# On VPS
cd /root/laurens-list

# View commit history
git log --oneline

# Checkout a specific working commit
git checkout <commit-hash>

# Rebuild production
cd /root
docker compose build laurenslist --no-cache
docker compose up -d laurenslist
```

### Option 3: Switch to Known Good Branch

```bash
# On VPS
cd /root/laurens-list

# Checkout a known working branch (e.g., a backup branch)
git checkout backup/stable-version
git pull origin backup/stable-version

# Rebuild production
cd /root
docker compose build laurenslist --no-cache
docker compose up -d laurenslist
```

---

## Troubleshooting

### Dev Site Not Updating

```bash
# Make sure you're rebuilding the dev container, not just restarting
cd /root
docker compose stop laurenslist-dev
docker compose build laurenslist-dev --no-cache
docker compose up -d laurenslist-dev
```

### Production Site Not Updating

```bash
# Make sure you're on main branch and have latest changes
cd /root/laurens-list
git checkout main
git pull origin main
cd /root
docker compose build laurenslist --no-cache
docker compose up -d laurenslist
```

### Container Won't Start

```bash
# Check logs for errors
docker logs root-laurenslist-dev-1 --tail 100
docker logs root-laurenslist-1 --tail 100

# Check if container exists
docker ps -a | grep laurenslist

# Rebuild from scratch
docker compose stop laurenslist-dev
docker compose rm -f laurenslist-dev
docker compose build laurenslist-dev --no-cache
docker compose up -d laurenslist-dev
```

### SSL Certificate Issues

```bash
# Check Traefik logs for certificate generation
docker logs root-traefik-1 -f

# Wait for Let's Encrypt to issue certificate (usually 1-2 minutes)
# Test after a few minutes:
curl -I https://dev.laurenslist.org
```

---

## Best Practices

1. **Always test on dev first** - Never deploy untested code to production
2. **Use descriptive branch names** - `experiment/trigger-warning-database` is clearer than `experiment/test1`
3. **Commit often** - Small, logical commits are easier to debug and rollback
4. **Write clear commit messages** - Describe what changed and why
5. **Keep dev and prod in sync** - Both should use the same base code from `main`
6. **Monitor logs** - Check logs after deployments to catch issues early
7. **Have a rollback plan** - Know how to revert if something goes wrong

---

## Common Scenarios

### Scenario 1: Testing a New Feature

1. Create feature branch locally
2. Make changes and commit
3. Push to GitHub
4. Deploy to dev on VPS
5. Test on `dev.laurenslist.org`
6. Fix issues if needed (repeat steps 3-5)
7. When ready, merge to main and deploy to production

### Scenario 2: Hotfix in Production

1. Create hotfix branch from main
2. Make urgent fix
3. Test quickly on dev (if time permits)
4. Merge to main immediately
4. Deploy to production
5. Create proper fix branch later if needed

### Scenario 3: Multiple Features in Development

1. Each feature gets its own branch
2. Deploy feature A to dev, test it
3. Switch dev to feature B, test it
4. When ready, merge features to main one at a time
5. Deploy to production after each merge

---

## Notes

- Dev and production share the same code directory (`/root/laurens-list`) but use different containers
- Each container has its own build, so they can run different branches/code simultaneously
- SSL certificates are automatically generated by Let's Encrypt for both domains
- Changes to dev don't affect production - they're completely isolated
- Both environments can run simultaneously on the same VPS

---

## Quick Checklist

### Before Deploying to Dev:
- [ ] Changes committed and pushed to GitHub
- [ ] Branch name is clear and descriptive
- [ ] Ready to test the feature

### Before Deploying to Production:
- [ ] Feature tested on dev environment
- [ ] All functionality works as expected
- [ ] No errors in browser console
- [ ] Branch merged into main
- [ ] Changes pushed to GitHub

### After Deploying to Production:
- [ ] Verify site loads correctly
- [ ] Test key functionality
- [ ] Check logs for errors
- [ ] Monitor for a few minutes

---

*Last updated: November 1, 2025*

