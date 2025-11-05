# GitHub Actions (CI/CD) - Explanation

## What is GitHub Actions?

GitHub Actions is a CI/CD (Continuous Integration/Continuous Deployment) platform built into GitHub. It allows you to automate workflows when you push code, create pull requests, or perform other repository actions.

## How It Would Work for Your Site

### Current Workflow (Manual)
1. Make changes locally
2. Commit and push to GitHub
3. **SSH into server**
4. **Run git pull**
5. **Rebuild Docker container**
6. **Restart container**

### With GitHub Actions (Automated)
1. Make changes locally
2. Commit and push to GitHub
3. **GitHub automatically deploys** (no SSH needed!)

## How It Works

### Step 1: GitHub Actions Runner
- GitHub provides "runners" (virtual machines) that execute your workflows
- These runners can SSH into your server and run commands
- You provide SSH credentials (stored securely as GitHub Secrets)

### Step 2: Workflow Trigger
- When you push to `dev` branch → Deploy to dev environment
- When you push to `main` branch → Deploy to production environment
- You can also trigger manually from GitHub UI

### Step 3: Automated Deployment
- GitHub Actions runner connects to your VPS via SSH
- Pulls latest code from GitHub
- Rebuilds Docker containers
- Restarts services
- Sends you a notification (success/failure)

## Workflow File Structure

You would create a file: `.github/workflows/deploy.yml`

This file defines:
- **When to run**: On push to `dev` or `main` branches
- **What to run**: SSH commands to deploy
- **Secrets**: SSH credentials, API keys (stored securely in GitHub)

## Example Workflow (Conceptual)

```yaml
name: Deploy

on:
  push:
    branches:
      - dev      # Deploy to dev when pushing to dev
      - main     # Deploy to prod when pushing to main

jobs:
  deploy-dev:
    if: github.ref == 'refs/heads/dev'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Dev Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.DEV_HOST }}
          username: ${{ secrets.DEV_USER }}
          key: ${{ secrets.DEV_SSH_KEY }}
          script: |
            cd /root/laurens-list
            git pull origin dev
            cd /root
            docker compose stop laurenslist-dev
            docker compose build laurenslist-dev --no-cache
            docker compose up -d laurenslist-dev

  deploy-prod:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Production Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /root/laurens-list
            git pull origin main
            cd /root
            docker compose stop laurenslist
            docker compose build laurenslist --no-cache
            docker compose up -d laurenslist
```

## What You Need to Set Up

### 1. GitHub Secrets
You store sensitive information in GitHub Secrets (Settings → Secrets):
- `DEV_HOST`: Your dev server IP/domain
- `DEV_USER`: SSH username (usually `root`)
- `DEV_SSH_KEY`: SSH private key for authentication
- `PROD_HOST`: Your production server IP/domain
- `PROD_USER`: SSH username
- `PROD_SSH_KEY`: SSH private key

### 2. SSH Key Setup
- Generate SSH key pair (or use existing)
- Public key on server (in `~/.ssh/authorized_keys`)
- Private key stored in GitHub Secrets

### 3. Workflow File
- Create `.github/workflows/deploy.yml` in your repository
- Define when to run and what commands to execute

## Benefits

### ✅ Advantages
- **No SSH required**: Just push to GitHub, deployment happens automatically
- **Consistent**: Same deployment process every time
- **Documented**: Deployment steps are in version control
- **Notifications**: Get notified of deployment status
- **History**: See all deployments in GitHub Actions tab
- **Rollback**: Easy to rerun previous deployments
- **Multiple environments**: Can deploy to dev and prod automatically

### ⚠️ Considerations
- **Security**: Need to manage SSH keys securely
- **Initial setup**: Requires configuring GitHub Secrets and workflow file
- **Debugging**: If deployment fails, need to check GitHub Actions logs
- **Dependencies**: Relies on GitHub Actions being available (rarely down)

## Security Best Practices

1. **SSH Keys**: Use dedicated SSH keys (not your personal keys)
2. **GitHub Secrets**: Never commit secrets to repository
3. **IP Restrictions**: Restrict SSH access to GitHub Actions IPs if possible
4. **Minimal Permissions**: SSH user should have minimal necessary permissions
5. **Key Rotation**: Periodically rotate SSH keys

## Cost

- **Free**: GitHub Actions provides 2,000 free minutes/month for private repos
- **Free**: Unlimited for public repositories
- **Your server**: No additional cost (uses your existing VPS)

For a single repository with infrequent deployments, you'll likely stay within free limits.

## When to Use GitHub Actions

### Good For:
- ✅ Frequent deployments
- ✅ Multiple developers
- ✅ Want automated deployments
- ✅ Want deployment history/audit trail
- ✅ Want deployment notifications

### Maybe Not Needed For:
- ❌ Very infrequent deployments (once per month)
- ❌ Single developer, simple workflow
- ❌ Prefer manual control over deployments
- ❌ Want to avoid external dependencies

## Alternative: Simple Setup

If you want something simpler than full GitHub Actions but still automated:

### Option: Git Post-Receive Hook (on server)
- Server-side hook runs automatically when you push
- No GitHub Actions needed
- Simpler setup
- Still requires SSH to set up initially

## Comparison

| Feature | Manual SSH | GitHub Actions |
|---------|-----------|----------------|
| Setup Time | 0 minutes | ~30 minutes |
| Deployment Time | ~2 minutes | ~2 minutes |
| Automation | No | Yes |
| History | No | Yes |
| Notifications | No | Yes |
| SSH Required | Yes | No (after setup) |
| Complexity | Low | Medium |

## Next Steps (If You Want to Proceed)

If you want to set up GitHub Actions, I would need to:

1. **Create workflow file** (`.github/workflows/deploy.yml`)
2. **Guide you through** setting up GitHub Secrets
3. **Help generate** SSH keys if needed
4. **Test** with a dev deployment first

But I won't do anything until you ask me to proceed! 😊

---

*This is just an explanation - no implementation yet.*

