# Architecture Quick Reference

A condensed guide for understanding and reusing this architecture.

## System Overview

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTPS
┌──────▼──────────────┐
│      Traefik        │ (Reverse Proxy + SSL)
└──────┬──────────────┘
       │ HTTP
┌──────▼──────────────┐
│  Node.js/Express    │ (Port 8080)
│  - Static Files     │
│  - API Proxy        │
│  - Rate Limiting    │
└──────┬──────────────┘
       │
┌──────▼─────────────────────┐
│    External APIs            │
│  - Google Books             │
│  - TMDB                     │
│  - DoesTheDogDie (proxy)     │
│  - Open Library             │
│  - Wikipedia                │
└─────────────────────────────┘
```

## Key Components

### Frontend (Client-Side)
- **File**: `script.js` - Main application logic
- **File**: `index.html` - HTML structure
- **File**: `styles.css` - Styling
- **Pattern**: Parallel API calls with `Promise.allSettled()`

### Backend (Server-Side)
- **File**: `server.js` - Express server
- **Port**: 8080
- **Responsibilities**:
  - Static file serving
  - API proxy (`/api/doesthedogdie`, `/api/triggerwarning`)
  - Rate limiting (20 req/15min per IP)
  - Input sanitization

### Infrastructure
- **Docker**: Containerization
- **Traefik**: Reverse proxy, SSL termination
- **Docker Compose**: Multi-container orchestration
- **Webhook Listeners**: Automated deployment services (dev and production)

## Deployment Architecture

### Automated Deployment (Dev)
```
GitHub → Webhook POST → Webhook Listener (202 Accepted) → Async Deployment → Git Pull → Docker Build → Container → Traefik → Users
```

**Note**: Webhook responds immediately with `202 Accepted` to prevent GitHub timeouts, then runs deployment asynchronously (takes 16-36 seconds).

**Rollback Prevention**: Uses unique image tags (commit hash-based) instead of `latest`:
- Each deployment gets unique tag: `dev-{commit-hash}`
- `docker-compose.yml` permanently pinned to unique tag
- Prevents rollbacks when container restarts

### Automated Deployment (Production)
```
GitHub → Webhook POST → Production Webhook Listener (202 Accepted) → Async Deployment → Git Pull → Docker Build → Container → Traefik → Users
```

**Note**: Production webhook uses separate secret (`WEBHOOK_SECRET_PROD`) and separate endpoint (`webhook-prod.laurenslist.org`).

**Environments**:
- **Production**: `main` branch → `laurenslist` container → `laurenslist.org` (automated via webhook)
- **Development**: `dev` branch → `laurenslist-dev` container → `dev.laurenslist.org` (automated via webhook)
- **Dev Webhook Listener**: `webhook-listener` container → `webhook.laurenslist.org` (receives dev branch webhooks)
- **Production Webhook Listener**: `webhook-listener-prod` container → `webhook-prod.laurenslist.org` (receives main branch webhooks)

## Data Flow

1. **User Search** → Browser validates input
2. **Parallel API Calls** → 8 sources (books) or 5 sources (movies)
3. **Data Aggregation** → Collect results from all sources
4. **Content Analysis** → Term detection, semantic analysis
5. **Confidence Scoring** → Calculate safety status
6. **UI Rendering** → Display results

## API Integration Patterns

### Pattern 1: Direct Client Call
```javascript
// For APIs that allow CORS
const response = await fetch(`https://api.example.com?q=${query}`);
```

### Pattern 2: Server Proxy
```javascript
// Client
const response = await fetch(`/api/proxy?q=${query}`);

// Server
app.get('/api/proxy', apiLimiter, async (req, res) => {
    const response = await fetch(`https://api.example.com?q=${req.query.q}`, {
        headers: { 'X-API-KEY': API_KEY }
    });
    res.json(await response.json());
});
```

## Reusability Checklist

To adapt this for another project:

- [ ] **Replace Content Analysis**
  - Update term lists in `script.js`
  - Modify `analyzeContent()` method
  - Update known content database

- [ ] **Update API Sources**
  - Replace book/movie APIs if needed
  - Add/remove API sources
  - Update proxy endpoints in `server.js`

- [ ] **Customize UI**
  - Update `styles.css` (colors, branding)
  - Update `index.html` (site name, description)
  - Replace favicon files

- [ ] **Configure Deployment**
  - Update `docker-compose.yml` (domain names)
  - Update Traefik labels
  - Set environment variables

- [ ] **Update API Keys**
  - Add new API keys to Docker build args
  - Update `Dockerfile` if needed
  - Update `.env` file on server

- [ ] **Set Up Automated Deployment (Optional)**
  - Create `webhook-listener.js` (or copy from template) - for dev
  - Create `webhook-listener-prod.js` (or copy from template) - for production
  - Create `deploy-dev-webhook.sh` (or copy from template)
  - Create `deploy-prod-webhook.sh` (or copy from template)
  - Create `Dockerfile.webhook` (or copy from template) - for dev
  - Create `Dockerfile.webhook.prod` (or copy from template) - for production
  - Update `docker-compose.yml` with webhook services
  - Configure GitHub webhooks (separate for dev and production)
  - Set up DNS A records for webhook subdomains
  - See `WEBHOOK_SETUP_INSTRUCTIONS.md` for dev setup
  - See `PRODUCTION_WEBHOOK_SETUP.md` for production setup

## Key Files

| File | Purpose |
|------|---------|
| `index.html` | Frontend HTML structure |
| `styles.css` | Frontend styling |
| `script.js` | Frontend application logic |
| `server.js` | Backend Express server |
| `Dockerfile` | Container definition |
| `Dockerfile.webhook` | Webhook listener container |
| `docker-compose.yml` | Multi-container config |
| `webhook-listener.js` | Dev webhook receiver service |
| `webhook-listener-prod.js` | Production webhook receiver service |
| `deploy-dev-webhook.sh` | Dev automated deployment script |
| `deploy-prod-webhook.sh` | Production automated deployment script |
| `Dockerfile.webhook.prod` | Production webhook container |
| `package.json` | Node.js dependencies |

## Security Features

- ✅ API keys injected at build time (not in Git)
- ✅ Server-side input sanitization
- ✅ Rate limiting (20 req/15min per IP)
- ✅ HTTPS enforced via Traefik
- ✅ CORS handled via server proxy

## Quick Commands

### Local Development
```bash
npm install
node server.js
# Visit http://localhost:8080
```

### Deploy to Dev (Automated)
```bash
# Just push to dev branch - webhook handles deployment automatically
git checkout dev
git add .
git commit -m "Your changes"
git push origin dev
# Webhook automatically deploys to dev.laurenslist.org
```

### Deploy to Dev (Manual - if webhook fails)
```bash
cd /root/laurens-list
git checkout dev && git pull origin dev
cd /root
docker compose build laurenslist-dev --no-cache
docker compose up -d laurenslist-dev
```

### Deploy to Production (Automated)
```bash
# Just push to main branch - webhook handles deployment automatically
git checkout main
git add .
git commit -m "Your changes"
git push origin main
# Webhook automatically deploys to laurenslist.org
```

### Deploy to Production (Manual - if webhook fails)
```bash
cd /root/laurens-list
git checkout main && git pull origin main
cd /root
docker compose build laurenslist --no-cache
docker compose up -d laurenslist
```

## Technology Stack

**Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)  
**Backend**: Node.js 18, Express.js 5  
**Infrastructure**: Docker, Docker Compose, Traefik  
**APIs**: Google Books, TMDB, DoesTheDogDie, Open Library, Wikipedia, etc.

---

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md)

