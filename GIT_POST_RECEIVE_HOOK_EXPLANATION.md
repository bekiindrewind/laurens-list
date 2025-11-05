# Git Post-Receive Hook - Explanation

## What is a Git Post-Receive Hook?

A Git hook is a script that runs automatically at certain points in Git's workflow. A **post-receive hook** runs on the server after you push code to a Git repository.

## How It Would Work for Your Site

### Current Workflow (Manual)
1. Make changes locally
2. Commit and push to GitHub
3. **SSH into server**
4. **Run git pull**
5. **Rebuild Docker container**
6. **Restart container**

### With Post-Receive Hook (Automated)
1. Make changes locally
2. Commit and push to GitHub
3. **Server automatically pulls and deploys** (no SSH needed!)

## How It Works

### Step 1: Set Up a Bare Repository on Server

You create a "bare" Git repository on your server that acts as a deploy target:
- This repository is separate from your working directory
- It receives pushes from GitHub (via webhook or polling)
- The post-receive hook runs when code is pushed to it

### Step 2: Post-Receive Hook Script

The hook script runs automatically after code is received:
- Clones/pulls code to your working directory (`/root/laurens-list`)
- Rebuilds Docker containers
- Restarts services
- Logs the deployment

### Step 3: Connect GitHub to Server

You have two options:

**Option A: GitHub Webhook** (Recommended)
- GitHub sends a webhook to your server when you push
- Server receives webhook, triggers git pull
- Post-receive hook runs deployment

**Option B: Server Polls GitHub** (Simpler)
- Server periodically checks GitHub for new commits
- If new commits found, pulls and deploys
- Less elegant but simpler setup

## Detailed Workflow

### With GitHub Webhook (Option A)

```
1. You push to GitHub
   ↓
2. GitHub sends webhook to your server
   ↓
3. Server receives webhook, pulls from GitHub
   ↓
4. Post-receive hook runs automatically
   ↓
5. Hook script deploys (docker build, restart)
   ↓
6. Done!
```

### With Polling (Option B)

```
1. You push to GitHub
   ↓
2. Server's cron job checks GitHub (every 5 minutes)
   ↓
3. If new commits found, pulls from GitHub
   ↓
4. Post-receive hook runs automatically
   ↓
5. Hook script deploys (docker build, restart)
   ↓
6. Done!
```

## Setup Requirements

### 1. Bare Repository on Server

Create a bare Git repository on your server:
```bash
# On server
mkdir -p /root/git/laurens-list.git
cd /root/git/laurens-list.git
git init --bare
```

### 2. Post-Receive Hook Script

Create a hook script in the bare repository:
```bash
# On server: /root/git/laurens-list.git/hooks/post-receive
#!/bin/bash
cd /root/laurens-list
git pull origin dev  # or main for production
cd /root
docker compose stop laurenslist-dev
docker compose build laurenslist-dev --no-cache
docker compose up -d laurenslist-dev
```

### 3. Webhook Listener (Option A)

If using GitHub webhooks, you need a webhook listener service:
- Simple Node.js/Express server that listens for GitHub webhooks
- Verifies webhook signature (security)
- Triggers git pull when webhook received

### 4. Cron Job (Option B)

If using polling, set up a cron job:
```bash
# Check every 5 minutes
*/5 * * * * cd /root/laurens-list && git fetch && git pull origin dev
```

## Detailed Example: Post-Receive Hook Script

Here's what a complete post-receive hook might look like:

```bash
#!/bin/bash
# /root/git/laurens-list.git/hooks/post-receive

set -e  # Exit on error

echo "🚀 Deployment triggered by post-receive hook"

# Determine which branch was pushed
while read oldrev newrev refname; do
    branch=$(git rev-parse --symbolic --abbrev-ref $refname)
    
    if [ "$branch" = "dev" ]; then
        echo "📦 Deploying to dev environment..."
        
        # Pull latest code
        cd /root/laurens-list
        git pull origin dev
        
        # Rebuild and restart dev container
        cd /root
        docker compose stop laurenslist-dev
        docker compose build laurenslist-dev --no-cache
        docker compose up -d laurenslist-dev
        
        echo "✅ Dev deployment complete!"
        
    elif [ "$branch" = "main" ]; then
        echo "📦 Deploying to production environment..."
        
        # Pull latest code
        cd /root/laurens-list
        git pull origin main
        
        # Rebuild and restart production container
        cd /root
        docker compose stop laurenslist
        docker compose build laurenslist --no-cache
        docker compose up -d laurenslist
        
        echo "✅ Production deployment complete!"
    fi
done
```

## Detailed Example: Webhook Listener (Option A)

A simple webhook listener in Node.js:

```javascript
// /root/webhook-listener/server.js
const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');

const app = express();
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

app.use(express.json());

app.post('/webhook', (req, res) => {
    // Verify webhook signature (GitHub sends this)
    const signature = req.headers['x-hub-signature-256'];
    const payload = JSON.stringify(req.body);
    const hash = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');
    
    if (signature !== `sha256=${hash}`) {
        return res.status(401).send('Unauthorized');
    }
    
    // Check if it's a push to dev or main
    const branch = req.body.ref?.replace('refs/heads/', '');
    
    if (branch === 'dev' || branch === 'main') {
        // Trigger git pull
        exec('cd /root/git/laurens-list.git && git pull', (error, stdout, stderr) => {
            if (error) {
                console.error('Git pull error:', error);
                return res.status(500).send('Deployment failed');
            }
            console.log('Deployment triggered for branch:', branch);
            res.status(200).send('Deployment triggered');
        });
    } else {
        res.status(200).send('Branch ignored');
    }
});

app.listen(3000, () => {
    console.log('Webhook listener running on port 3000');
});
```

## Comparison: Webhook vs Polling

| Feature | Webhook (Option A) | Polling (Option B) |
|---------|-------------------|-------------------|
| **Speed** | Immediate | Up to 5 min delay |
| **Setup** | More complex | Simpler |
| **Reliability** | Requires webhook endpoint | Requires cron job |
| **Security** | Signature verification | Less secure |
| **Server Load** | Event-driven (efficient) | Constant polling |

## Benefits

### ✅ Advantages
- **No SSH required** (after initial setup)
- **Automatic deployment** when you push
- **Simpler than GitHub Actions** (no external service)
- **Runs on your server** (no external dependencies)
- **No GitHub Actions minutes** used
- **Full control** over deployment process

### ⚠️ Considerations
- **Initial SSH setup** required (one-time)
- **Security**: Need to secure webhook endpoint
- **Reliability**: Depends on your server being up
- **Debugging**: Need to check server logs
- **Branch handling**: Need to detect which branch was pushed

## Security Considerations

### Webhook Security (Option A)
- **Signature verification**: GitHub signs webhooks with a secret
- **HTTPS only**: Webhook endpoint should use HTTPS
- **IP whitelisting**: Restrict webhook endpoint to GitHub IPs
- **Secret management**: Store webhook secret securely

### Polling Security (Option B)
- **SSH key**: Use SSH keys for git pull (not passwords)
- **Read-only access**: Limit git user permissions
- **Firewall**: Restrict access to git repository

## Setup Complexity

### Webhook Setup (Option A)
1. Create bare repository (5 minutes)
2. Create post-receive hook (10 minutes)
3. Set up webhook listener service (20 minutes)
4. Configure GitHub webhook (5 minutes)
5. **Total: ~40 minutes**

### Polling Setup (Option B)
1. Create post-receive hook (10 minutes)
2. Set up cron job (5 minutes)
3. Test deployment (5 minutes)
4. **Total: ~20 minutes**

## When to Use Post-Receive Hook

### Good For:
- ✅ Want automatic deployment
- ✅ Want to avoid GitHub Actions
- ✅ Want simpler setup than GitHub Actions
- ✅ Prefer server-side control
- ✅ Don't need deployment history/UI

### Maybe Not For:
- ❌ Need deployment history/audit trail
- ❌ Want deployment notifications
- ❌ Want deployment UI/dashboard
- ❌ Prefer cloud-based CI/CD

## Comparison: All Options

| Feature | Manual SSH | GitHub Actions | Post-Receive Hook |
|---------|-----------|----------------|-------------------|
| **Setup Time** | 0 minutes | ~30 minutes | ~20-40 minutes |
| **SSH Required** | Every time | Never (after setup) | Never (after setup) |
| **Automation** | No | Yes | Yes |
| **History** | No | Yes | Limited |
| **Notifications** | No | Yes | No (unless you add) |
| **Complexity** | Low | Medium | Low-Medium |
| **External Deps** | No | GitHub Actions | No |
| **Cost** | Free | Free (limited) | Free |

## Recommended Approach

For your use case, I'd recommend:

**Option B (Polling)** if you want:
- Simplest setup
- Automatic deployment
- No webhook endpoint needed

**Option A (Webhook)** if you want:
- Immediate deployment (no delay)
- More professional setup
- Better security

**GitHub Actions** if you want:
- Deployment history/audit trail
- Notifications
- Cloud-based (no server dependency)

## Next Steps (If You Want to Proceed)

If you want to set up post-receive hooks, I would need to:

1. **Create hook script** for your specific deployment
2. **Guide you through** setting up the bare repository (or webhook listener)
3. **Help configure** GitHub webhook (if Option A)
4. **Test** with a dev deployment first

But I won't do anything until you ask me to proceed! 😊

---

*This is just an explanation - no implementation yet.*

