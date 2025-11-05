# Template Reuse Guide

This guide helps you adapt this architecture for other content warning websites or similar multi-source aggregation applications.

## Overview

This architecture is designed to be reusable for:
- Content warning websites (trigger warnings, content ratings)
- Multi-source data aggregation applications
- API aggregation services
- Content analysis tools

## Step-by-Step Adaptation

### Step 1: Replace Content Analysis Logic

**Location**: `script.js`

**Current Implementation**:
- Cancer-specific term detection
- Cancer-themed content database
- Semantic analysis for cancer themes

**Replace With**:
```javascript
// Example: Mental health triggers
const MENTAL_HEALTH_TERMS = [
    'suicide', 'self-harm', 'depression', 'anxiety',
    'eating disorder', 'PTSD', 'trauma', 'panic attack',
    'mental breakdown', 'psychiatric', 'therapy'
];

const MENTAL_HEALTH_CONTENT = {
    books: ['book1', 'book2', ...],
    movies: ['movie1', 'movie2', ...]
};
```

**Files to Modify**:
- `script.js`: Lines 22-73 (term lists)
- `script.js`: Lines 75-100 (known content database)
- `script.js`: `analyzeContent()` method (analysis logic)

### Step 2: Update API Sources

**Add New API Source**:

```javascript
// In LaurensList class
async searchNewSource(query, exactMatch = false) {
    try {
        const url = `https://api.newsource.com/search?q=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${NEW_API_KEY}`,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return this.parseNewSourceData(data);
    } catch (error) {
        console.error('NewSource API error:', error);
        return null;
    }
}

parseNewSourceData(data) {
    // Parse API response format
    return {
        title: data.title,
        description: data.description,
        // ... map your API response
    };
}
```

**Add to Search Flow**:

```javascript
// In searchBook() or searchMovie()
const searchPromises = [
    // ... existing sources
    this.withTimeout(this.searchNewSource(query), timeoutMs, 'NewSource'),
];
```

**If API Requires Proxy** (due to CORS or API key):

**Add to `server.js`**:
```javascript
app.get('/api/newsource', apiLimiter, async (req, res) => {
    try {
        const query = sanitizeServerInput(req.query.q);
        const url = `https://api.newsource.com/search?q=${encodeURIComponent(query)}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${process.env.NEW_API_KEY}`,
                'Accept': 'application/json'
            }
        });
        
        res.json(await response.json());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

**Update `docker-compose.yml`**:
```yaml
laurenslist:
  build:
    args:
      NEW_API_KEY: ${NEW_API_KEY:-YOUR_NEW_API_KEY}
  environment:
    - NEW_API_KEY=${NEW_API_KEY:-}
```

**Update `Dockerfile`**:
```dockerfile
ARG NEW_API_KEY=YOUR_NEW_API_KEY
# No need to inject in script.js if using server proxy
```

### Step 3: Customize UI/Theming

**Update Site Name and Branding**:

**File**: `index.html`
```html
<!-- Replace these -->
<title>Your Site Name</title>
<h1>Your Site Name</h1>
<p class="subtitle">Your site description</p>
```

**Update Color Scheme**:

**File**: `styles.css`
```css
/* Replace gradient colors */
body {
    background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}

/* Update button colors */
button {
    background: #your-button-color;
}
```

**Replace Favicon**:
- Replace `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`
- Update `apple-touch-icon.png`
- Update `android-chrome-*.png`
- Update `site.webmanifest`

### Step 4: Configure Deployment

**Update Domain Names**:

**File**: `docker-compose.yml`
```yaml
laurenslist:
  labels:
    - "traefik.http.routers.yoursite.rule=Host(`yoursite.org`) || Host(`www.yoursite.org`)"
    
laurenslist-dev:
  labels:
    - "traefik.http.routers.yoursite-dev.rule=Host(`dev.yoursite.org`)"
```

**Update Service Names** (optional):
```yaml
services:
  yoursite:        # Instead of laurenslist
    # ...
  yoursite-dev:    # Instead of laurenslist-dev
    # ...
```

### Step 5: Update Environment Variables

**Create `.env` file on server**:
```bash
# API Keys
TMDB_API_KEY=your_key
GOOGLE_BOOKS_API_KEY=your_key
DOESTHEDOGDIE_API_KEY=your_key
NEW_API_KEY=your_key  # If you added new APIs

# Traefik/SSL
SSL_EMAIL=your@email.com
DOMAIN_NAME=yoursite.org
SUBDOMAIN=your-subdomain
```

**Update `docker-compose.yml`**:
```yaml
services:
  yoursite:
    build:
      args:
        TMDB_API_KEY: ${TMDB_API_KEY:-YOUR_TMDB_API_KEY}
        # ... other keys
    environment:
      - DOESTHEDOGDIE_API_KEY=${DOESTHEDOGDIE_API_KEY:-}
      # ... other env vars
```

### Step 6: Update Analysis Confidence Scoring

**File**: `script.js`

**Current Implementation**:
```javascript
// 95% confidence: Found in curated lists
// 80% confidence: Terms detected
// 90% confidence: No content detected
```

**Customize**:
```javascript
calculateConfidence(triggers, sources) {
    let confidence = 0;
    
    // Weight different sources
    if (triggers.foundInCuratedList) confidence += 95;
    if (triggers.termsDetected) confidence += 80;
    if (triggers.semanticMatch) confidence += 75;
    
    // Average if multiple signals
    const signalCount = [triggers.foundInCuratedList, triggers.termsDetected, triggers.semanticMatch].filter(Boolean).length;
    return signalCount > 0 ? Math.round(confidence / signalCount) : 90;
}
```

## Template Checklist

Use this checklist when adapting the template:

### Content Analysis
- [ ] Replace term lists with your domain terms
- [ ] Update known content database
- [ ] Modify `analyzeContent()` method
- [ ] Update confidence scoring algorithm

### API Integration
- [ ] Add/remove API sources as needed
- [ ] Update API keys in build config
- [ ] Add server proxy endpoints if needed
- [ ] Update error handling for new APIs

### UI/UX
- [ ] Update site name and branding
- [ ] Update color scheme
- [ ] Replace favicon files
- [ ] Update site description and help text
- [ ] Update feedback email/link

### Deployment
- [ ] Update domain names in docker-compose.yml
- [ ] Update service names (optional)
- [ ] Set environment variables
- [ ] Update Traefik labels
- [ ] Test deployment workflow

### Documentation
- [ ] Update README.md
- [ ] Update API documentation
- [ ] Update deployment guides
- [ ] Remove/adjust example-specific content

## Example: Mental Health Trigger Warning Site

### Step 1: Content Analysis
```javascript
const MENTAL_HEALTH_TERMS = [
    'suicide', 'self-harm', 'depression', 'anxiety',
    'eating disorder', 'PTSD', 'trauma', 'panic attack',
    'mental breakdown', 'psychiatric', 'therapy', 'medication',
    'hospitalization', 'mental health crisis'
];
```

### Step 2: Keep Same APIs
- Google Books API (book search)
- TMDB API (movie search)
- Wikipedia (content analysis)
- Add new API: Mental Health Trigger Warning Database (if exists)

### Step 3: Update UI
- Change site name to "Mental Health Trigger Warnings"
- Update colors to mental health awareness colors
- Update description text

### Step 4: Deploy
- Update domain: `mentalhealthtriggers.org`
- Update docker-compose.yml
- Deploy as normal

## Common Patterns

### Pattern 1: Adding a New API Source

1. **Client-Side** (if CORS allowed):
   ```javascript
   async searchNewAPI(query) {
       const url = `https://api.example.com/search?q=${query}`;
       const response = await fetch(url);
       return await response.json();
   }
   ```

2. **Server Proxy** (if CORS blocked):
   ```javascript
   // server.js
   app.get('/api/newapi', apiLimiter, async (req, res) => {
       const query = sanitizeServerInput(req.query.q);
       const response = await fetch(`https://api.example.com/search?q=${query}`, {
           headers: { 'Authorization': `Bearer ${API_KEY}` }
       });
       res.json(await response.json());
   });
   ```

### Pattern 2: Changing Analysis Logic

```javascript
analyzeContent(data) {
    // Your custom analysis
    const triggers = this.detectYourTriggers(data);
    const confidence = this.calculateYourConfidence(triggers);
    
    return {
        status: confidence > 80 ? 'not-recommended' : 'safe',
        confidence,
        analysis: this.generateAnalysis(triggers)
    };
}
```

### Pattern 3: Customizing UI

```javascript
// In displayResults()
if (result.status === 'not-recommended') {
    // Your custom UI for not-recommended
} else {
    // Your custom UI for safe
}
```

## Testing Your Adaptation

1. **Local Testing**:
   ```bash
   npm install
   node server.js
   # Visit http://localhost:8080
   ```

2. **Dev Environment Testing**:
   - Deploy to dev branch
   - Test on dev.yoursite.org
   - Verify all APIs working
   - Check content analysis accuracy

3. **Production Deployment**:
   - Merge to main branch
   - Deploy to production
   - Monitor logs
   - Test real user scenarios

## Troubleshooting

### API Not Working
- Check API key is set correctly
- Check CORS settings (may need server proxy)
- Check rate limits
- Check API documentation

### Content Analysis Not Accurate
- Review term lists (too broad/narrow?)
- Check confidence scoring algorithm
- Verify known content database
- Test with sample queries

### Deployment Issues
- Check Docker build logs
- Verify environment variables
- Check Traefik routing
- Verify SSL certificates

## Resources

- [Full Architecture Documentation](./ARCHITECTURE.md)
- [Quick Reference Guide](./ARCHITECTURE_QUICK_REFERENCE.md)
- [Deployment Guide](./DEV_TO_PROD_DEPLOYMENT.md)

---

*Last Updated: January 2025*

