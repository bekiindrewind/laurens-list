# WEBHOOK_SECRET - Explanation

## What is WEBHOOK_SECRET?

The `WEBHOOK_SECRET` is a **secret string (password) that you create** to verify that webhooks are actually coming from GitHub and not from someone else trying to trigger your deployments.

## Where Does It Come From?

**You create it yourself!** It's not provided by GitHub. You generate a random secret string.

### How to Generate a Secret

You can create a secure random string using any of these methods:

**Option 1: Using OpenSSL (on Linux/Mac)**
```bash
openssl rand -hex 32
# Output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**Option 2: Using Node.js (on any system)**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**Option 3: Using Python**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
# Output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**Option 4: Online Generator**
- Visit: https://www.lastpass.com/features/password-generator
- Generate a 64-character random password
- Copy it

**Option 5: Manual (Less Secure)**
- Just make up a long random string: `MySuperSecretWebhookKey2024!@#$`

## Where Does It Go?

You need to store the secret in **TWO places**:

### 1. GitHub (Webhook Configuration)

When you set up a webhook in GitHub:

1. Go to your repository: `https://github.com/bekiindrewind/laurens-list`
2. Click **Settings** → **Webhooks** → **Add webhook**
3. In the **Secret** field, paste your secret
4. GitHub will use this secret to sign all webhook payloads

**Location in GitHub:**
```
Repository → Settings → Webhooks → [Webhook Name] → Secret field
```

### 2. Your Server (Webhook Listener)

Your webhook listener service needs to know the secret to verify incoming webhooks:

**Option A: Environment Variable** (Recommended)
```bash
# On your server, create/update .env file
WEBHOOK_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**Option B: Docker Environment Variable**
In your `docker-compose.yml`:
```yaml
services:
  webhook-listener:
    environment:
      - WEBHOOK_SECRET=${WEBHOOK_SECRET}
```

**Option C: Direct in Code** (Not Recommended for Production)
```javascript
const WEBHOOK_SECRET = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6';
```

## How It Works

### Step 1: GitHub Signs the Webhook

When GitHub sends a webhook:
1. GitHub takes the webhook payload (the data about your push)
2. GitHub creates a signature using your `WEBHOOK_SECRET`
3. GitHub sends the webhook with the signature in the `X-Hub-Signature-256` header

### Step 2: Your Server Verifies

Your webhook listener receives the webhook:
1. Takes the payload
2. Creates a signature using the same `WEBHOOK_SECRET`
3. Compares your signature with GitHub's signature
4. If they match → webhook is legitimate ✅
5. If they don't match → reject (might be an attacker) ❌

### Example Code Flow

```javascript
// Your webhook listener receives:
const payload = req.body;  // The webhook data
const signature = req.headers['x-hub-signature-256'];  // GitHub's signature

// You create your own signature:
const yourSecret = process.env.WEBHOOK_SECRET;
const hash = crypto
    .createHmac('sha256', yourSecret)
    .update(JSON.stringify(payload))
    .digest('hex');
const yourSignature = `sha256=${hash}`;

// Compare signatures:
if (signature === yourSignature) {
    // ✅ Webhook is legitimate, proceed with deployment
} else {
    // ❌ Signatures don't match, reject webhook
    return res.status(401).send('Unauthorized');
}
```

## Why Is This Important?

**Security!** Without the secret:
- Anyone could send fake webhooks to your server
- Attackers could trigger deployments
- Your server could be compromised

**With the secret:**
- Only GitHub (with the correct secret) can trigger deployments
- Webhooks are cryptographically verified
- Much more secure

## Complete Setup Flow

### Step 1: Generate Secret (On Your Computer)
```bash
openssl rand -hex 32
# Save this output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### Step 2: Add to GitHub (In Browser)
1. Go to GitHub repository
2. Settings → Webhooks → Add webhook
3. Paste secret in "Secret" field
4. Save webhook

### Step 3: Add to Server (Via SSH)
```bash
# SSH into your server
ssh user@your-server

# Add to environment variables
echo 'WEBHOOK_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6' >> /root/.env

# Or add to docker-compose.yml environment section
```

### Step 4: Use in Webhook Listener
```javascript
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
// Use it to verify webhook signatures
```

## Important Notes

1. **Keep it secret!** Don't commit it to Git
2. **Same secret everywhere** - GitHub and server must use the same secret
3. **Long and random** - Use at least 32 characters
4. **Different secrets for different environments** - Dev and prod can use different secrets
5. **Store securely** - Use environment variables, not hardcoded

## Example: Different Secrets for Dev and Prod

You might want separate secrets:

**Dev Webhook Secret:**
```bash
# Generate
openssl rand -hex 32
# Result: dev_secret_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**Prod Webhook Secret:**
```bash
# Generate
openssl rand -hex 32
# Result: prod_secret_z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4
```

**In GitHub:**
- Dev webhook: Use `dev_secret_...`
- Prod webhook: Use `prod_secret_...`

**On Server:**
```bash
# .env file
DEV_WEBHOOK_SECRET=dev_secret_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
PROD_WEBHOOK_SECRET=prod_secret_z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4
```

## Summary

**Where does WEBHOOK_SECRET come from?**
- You create it yourself using a random string generator

**Where does it go?**
1. **GitHub**: In the webhook configuration (Settings → Webhooks → Secret field)
2. **Your Server**: In environment variables or config file (for your webhook listener)

**Why?**
- Security - verifies webhooks are actually from GitHub

**Best Practice:**
- Generate with: `openssl rand -hex 32`
- Store in environment variables (not in code)
- Use different secrets for dev/prod
- Never commit to Git

---

*This is just an explanation - no implementation yet.*

