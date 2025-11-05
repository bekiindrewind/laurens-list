# Webhook Setup Instructions (Dev-Only)

## Step 1: Generate Webhook Secret

On your local machine or server, generate a random secret:

```bash
openssl rand -hex 32
```

Copy the output (it will be a 64-character string like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`)

## Step 2: Add Secret to Server Environment

SSH into your server and add the secret to your environment:

```bash
# SSH into server
ssh user@your-server

# Add to .env file (create if it doesn't exist)
echo "WEBHOOK_SECRET=your_secret_here" >> /root/.env

# Or export it directly (temporary, will be lost on reboot)
export WEBHOOK_SECRET=your_secret_here
```

## Step 3: Make Deployment Script Executable

On your server:

```bash
cd /root/laurens-list
chmod +x deploy-dev-webhook.sh
```

## Step 4: Start Webhook Listener

```bash
cd /root
docker compose up -d webhook-listener
```

Check logs:
```bash
docker logs root-webhook-listener-1 -f
```

You should see: `🚀 Webhook listener running on port 3000`

## Step 5: Configure GitHub Webhook

1. Go to your GitHub repository: `https://github.com/bekiindrewind/laurens-list`
2. Click **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL**: `https://webhook.laurenslist.org/webhook`
   - **Content type**: `application/json`
   - **Secret**: Paste your webhook secret (from Step 1)
   - **Which events**: Select "Just the push event"
   - **Branch**: Select "dev" branch only
4. Click **Add webhook**

## Step 6: Test the Webhook

1. Make a small change in your dev branch
2. Commit and push:
   ```bash
   git checkout dev
   git add .
   git commit -m "Test webhook deployment"
   git push origin dev
   ```
3. Check webhook logs:
   ```bash
   docker logs root-webhook-listener-1 -f
   ```
4. You should see deployment happening automatically!

## Step 7: Verify Deployment

1. Check dev site: `https://dev.laurenslist.org`
2. Your changes should be live!
3. Check container logs:
   ```bash
   docker logs root-laurenslist-dev-1 --tail 20
   ```

## Troubleshooting

### Webhook not triggering?
- Check GitHub webhook status (Settings → Webhooks → Recent Deliveries)
- Check webhook listener logs: `docker logs root-webhook-listener-1 -f`
- Verify WEBHOOK_SECRET is set correctly

### Deployment fails?
- Check deployment script is executable: `ls -la deploy-dev-webhook.sh`
- Check container logs: `docker logs root-laurenslist-dev-1 -f`
- Verify git repository permissions

### Signature verification fails?
- Make sure WEBHOOK_SECRET matches in GitHub and server
- Check webhook listener logs for signature errors

## Security Notes

- ✅ **Production is protected** - Only dev branch deploys via webhook
- ✅ **Main branch ignored** - Production deployments must be manual
- ✅ **Signature verification** - Webhooks are cryptographically verified
- ✅ **HTTPS required** - Webhook endpoint uses HTTPS

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

