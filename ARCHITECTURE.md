# Architecture Documentation

This document describes the architecture of Lauren's List - a reusable template for building content warning/trigger warning websites with multi-source data aggregation.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagrams](#architecture-diagrams)
3. [Component Architecture](#component-architecture)
4. [Deployment Architecture](#deployment-architecture)
5. [Data Flow](#data-flow)
6. [API Integration Patterns](#api-integration-patterns)
7. [Security Architecture](#security-architecture)
8. [Reusability Guide](#reusability-guide)

---

## System Overview

Lauren's List is a **Single Page Application (SPA)** with a **Node.js/Express backend** that aggregates data from multiple APIs to provide content warnings for books and movies.

### Key Characteristics

- **Frontend**: Vanilla JavaScript (no framework), HTML5, CSS3
- **Backend**: Node.js with Express.js
- **Containerization**: Docker
- **Reverse Proxy**: Traefik with automatic SSL
- **Deployment**: VPS with Docker Compose (supports dev/prod environments)
- **API Strategy**: Client-side direct calls + server-side proxy for CORS-sensitive APIs

---

## Architecture Diagrams

### System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
    end
    
    subgraph "Reverse Proxy Layer"
        Traefik[Traefik<br/>SSL Termination<br/>Routing]
    end
    
    subgraph "Application Layer"
        App[Node.js/Express App<br/>Port 8080]
        Static[Static Files<br/>HTML/CSS/JS]
    end
    
    subgraph "External APIs"
        GoogleBooks[Google Books API]
        TMDB[TMDB API]
        DTDD[DoesTheDogDie API]
        OpenLib[Open Library]
        Wiki[Wikipedia]
        Goodreads[Goodreads]
        StoryGraph[StoryGraph]
        TWD[Trigger Warning DB]
    end
    
    Browser -->|HTTPS| Traefik
    Traefik -->|HTTP| App
    App --> Static
    App -->|Proxy| DTDD
    App -->|Proxy| TWD
    Browser -->|Direct| GoogleBooks
    Browser -->|Direct| TMDB
    Browser -->|Direct| OpenLib
    Browser -->|Direct| Wiki
    Browser -->|Direct| Goodreads
    Browser -->|Direct| StoryGraph
```

### Deployment Architecture

```mermaid
graph TB
    subgraph "VPS Server"
        subgraph "Docker Compose"
            Traefik[Traefik Container<br/>Port 80/443]
            Prod[Production Container<br/>laurenslist<br/>Port 8080]
            Dev[Dev Container<br/>laurenslist-dev<br/>Port 8080]
        end
        
        subgraph "Git Repository"
            Code[/root/laurens-list<br/>Git Repo]
        end
    end
    
    subgraph "External"
        GitHub[GitHub Repository]
        Users[Users]
    end
    
    GitHub -->|git pull| Code
    Code -->|Build Context| Prod
    Code -->|Build Context| Dev
    Users -->|https://laurenslist.org| Traefik
    Users -->|https://dev.laurenslist.org| Traefik
    Traefik -->|Route| Prod
    Traefik -->|Route| Dev
```

### Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Server
    participant APIs
    
    User->>Browser: Enters search query
    Browser->>Browser: Validate input
    Browser->>Server: GET /api/doesthedogdie?q=title
    Server->>Server: Sanitize input
    Server->>Server: Rate limit check
    Server->>APIs: Fetch DoesTheDogDie
    APIs-->>Server: JSON response
    Server-->>Browser: Proxy response
    
    Browser->>APIs: Direct API calls (parallel)
    APIs-->>Browser: Google Books
    APIs-->>Browser: TMDB
    APIs-->>Browser: Open Library
    APIs-->>Browser: Wikipedia
    
    Browser->>Browser: Aggregate results
    Browser->>Browser: Analyze content
    Browser->>Browser: Generate confidence score
    Browser->>User: Display results
```

---

## Component Architecture

### Frontend Components

#### File Structure
```
frontend/
├── index.html          # Main HTML structure
├── styles.css          # All styling (CSS3)
└── script.js           # Application logic (vanilla JS)
```

#### Key Frontend Classes

**LaurensList Class** (`script.js`)
- **Purpose**: Main application controller
- **Responsibilities**:
  - Event handling (search, UI toggles)
  - API orchestration (parallel searches)
  - Data aggregation from multiple sources
  - Content analysis (term detection, semantic analysis)
  - UI rendering (results, analysis, errors)

**Key Methods**:
- `searchBook(query, exactMatch)` - Orchestrates book search across 8 sources
- `searchMovie(query, exactMatch)` - Orchestrates movie search across 5 sources
- `analyzeContent(data)` - Analyzes aggregated data for sensitive content
- `displayResults(data)` - Renders results to DOM

#### Frontend API Integration Pattern

```javascript
// Parallel API calls with timeout
const searchPromises = [
    this.withTimeout(this.searchGoogleBooks(query), 15000),
    this.withTimeout(this.searchOpenLibrary(query), 15000),
    this.withTimeout(this.searchWikipedia(query), 15000),
    // ... more sources
];

// Wait for all (success or failure)
const results = await Promise.allSettled(searchPromises);
```

### Backend Components

#### File Structure
```
backend/
├── server.js           # Express server
├── package.json        # Dependencies
└── Dockerfile          # Container definition
```

#### Server Architecture

**Express Server** (`server.js`)
- **Port**: 8080
- **Responsibilities**:
  - Static file serving (HTML, CSS, JS, images)
  - API proxy endpoints (CORS bypass)
  - Rate limiting (security)
  - Input sanitization (security)
  - SPA routing (catch-all to index.html)

**Key Endpoints**:
- `GET /` - Serves index.html
- `GET /api/doesthedogdie?q=query` - Proxies DoesTheDogDie API
- `GET /api/triggerwarning` - Proxies Trigger Warning Database
- `GET /*` - SPA routing (serves index.html for non-API routes)

**Security Features**:
- Rate limiting: 20 requests per 15 minutes per IP
- Input sanitization: Removes HTML, scripts, limits length
- CORS enabled for API endpoints
- No-cache headers for script.js (security)

---

## Deployment Architecture

### Docker Architecture

**Container Structure**:
```yaml
services:
  traefik:          # Reverse proxy, SSL termination
  laurenslist:      # Production app container
  laurenslist-dev:  # Development/staging container
```

**Build Process**:
1. Git checkout (branch determines environment)
2. Docker build with API keys injected via build args
3. Container runs `node server.js` on port 8080
4. Traefik routes traffic based on hostname

### Environment Separation

**Production**:
- Branch: `main`
- Domain: `laurenslist.org`, `www.laurenslist.org`
- Container: `laurenslist`
- Environment: `NODE_ENV=production` (implicit)

**Development**:
- Branch: `dev` (or any feature branch)
- Domain: `dev.laurenslist.org`
- Container: `laurenslist-dev`
- Environment: `NODE_ENV=development`

### Deployment Workflow

```mermaid
graph LR
    Local[Local Changes] -->|git commit| GitHub[GitHub]
    GitHub -->|git pull| VPS[VPS Server]
    VPS -->|docker build| Container[Container]
    Container -->|Traefik| Users[Users]
```

**Deployment Commands**:
```bash
# Dev deployment
cd /root/laurens-list
git checkout dev
git pull origin dev
cd /root
docker compose stop laurenslist-dev
docker compose build laurenslist-dev --no-cache
docker compose up -d laurenslist-dev

# Production deployment
cd /root/laurens-list
git checkout main
git pull origin main
cd /root
docker compose stop laurenslist
docker compose build laurenslist --no-cache
docker compose up -d laurenslist
```

---

## Data Flow

### Search Request Flow

1. **User Input** → Browser validates and sanitizes
2. **Parallel API Calls** → Multiple sources queried simultaneously
3. **Server Proxy** → CORS-protected APIs routed through backend
4. **Data Aggregation** → Results collected from all sources
5. **Content Analysis** → Term detection, semantic analysis, confidence scoring
6. **Result Rendering** → UI updates with safety status and analysis

### API Integration Strategy

**Client-Side Direct Calls** (No CORS issues):
- Google Books API
- TMDB API
- Open Library API
- Wikipedia API
- Goodreads (scraping)
- StoryGraph (scraping)

**Server-Side Proxy** (CORS protection):
- DoesTheDogDie API (requires API key)
- Trigger Warning Database (scraping)

**Why Proxy?**
- Some APIs require API keys (security - don't expose in client)
- CORS restrictions for certain domains
- Rate limiting enforcement
- Input sanitization before external calls

---

## API Integration Patterns

### Pattern 1: Direct Client-Side API Call

```javascript
async searchGoogleBooks(query) {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${GOOGLE_BOOKS_API_KEY}`;
    const response = await fetch(url);
    return await response.json();
}
```

**Use When**:
- API allows CORS
- No sensitive API keys (or public keys are acceptable)
- Rate limiting handled by API provider

### Pattern 2: Server-Side Proxy

**Client Side**:
```javascript
async searchDoesTheDogDie(query) {
    const response = await fetch(`/api/doesthedogdie?q=${encodeURIComponent(query)}`);
    return await response.json();
}
```

**Server Side**:
```javascript
app.get('/api/doesthedogdie', apiLimiter, async (req, res) => {
    const query = sanitizeServerInput(req.query.q);
    const response = await fetch(`https://api.example.com?q=${query}`, {
        headers: { 'X-API-KEY': DOESTHEDOGDIE_API_KEY }
    });
    res.json(await response.json());
});
```

**Use When**:
- API requires authentication (don't expose keys)
- CORS restrictions
- Need server-side rate limiting
- Need input sanitization

### Pattern 3: Web Scraping

```javascript
async searchGoodreads(query) {
    const url = `https://www.goodreads.com/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const html = await response.text();
    // Parse HTML with regex/DOM parsing
    return parseGoodreadsData(html);
}
```

**Use When**:
- No official API available
- Public data that's acceptable to scrape
- Parsing is straightforward

---

## Security Architecture

### Security Layers

1. **Input Sanitization**
   - Client-side: Basic validation
   - Server-side: HTML/script removal, length limits, character filtering

2. **Rate Limiting**
   - Server-side: 20 requests per 15 minutes per IP
   - Prevents abuse and DoS attacks

3. **API Key Management**
   - Build-time injection via Docker build args
   - Environment variables (not in Git)
   - No exposure in client-side code for sensitive keys

4. **HTTPS/TLS**
   - Traefik handles SSL certificates (Let's Encrypt)
   - Automatic HTTP → HTTPS redirect

5. **CORS Configuration**
   - Server-side proxy for sensitive APIs
   - CORS enabled for API endpoints

### Security Best Practices

- ✅ API keys never committed to Git
- ✅ Server-side input sanitization
- ✅ Rate limiting on API endpoints
- ✅ No-cache headers for script.js (prevents stale cached keys)
- ✅ Environment variable injection
- ✅ HTTPS enforced

---

## Reusability Guide

This architecture can be adapted for other content warning websites or similar multi-source aggregation applications.

### Template Adaptation Steps

#### 1. Define Your Domain

**Replace**:
- Content analysis logic (currently cancer-specific)
- Term lists (currently cancer-related terms)
- Known content database (currently cancer-themed works)

**Example**: For mental health triggers:
```javascript
const MENTAL_HEALTH_TERMS = [
    'suicide', 'self-harm', 'depression', 'anxiety',
    'eating disorder', 'PTSD', 'trauma'
];
```

#### 2. Update API Sources

**Replace**:
- Book search APIs (if needed)
- Movie search APIs (if needed)
- Content warning databases

**Example**: Add new API source:
```javascript
async searchNewSource(query) {
    const url = `https://api.newsource.com/search?q=${query}`;
    const response = await fetch(url);
    return await response.json();
}
```

#### 3. Customize Content Analysis

**Replace**:
- Detection logic in `analyzeContent()` method
- Confidence scoring algorithm
- Term matching patterns

**Example**: Custom analysis:
```javascript
analyzeContent(data) {
    const triggers = this.detectTriggers(data);
    const confidence = this.calculateConfidence(triggers);
    return {
        status: confidence > 80 ? 'not-recommended' : 'safe',
        confidence,
        triggers
    };
}
```

#### 4. Update UI/Theming

**Replace**:
- `styles.css` - Color scheme, branding
- `index.html` - Site name, description, branding
- Favicon and manifest files

#### 5. Configure Deployment

**Update**:
- `docker-compose.yml` - Domain names, service names
- Environment variables
- Traefik labels

**Example**:
```yaml
laurenslist:
  labels:
    - "traefik.http.routers.mysite.rule=Host(`mysite.org`)"
```

### Architecture Decisions

**Why Vanilla JavaScript?**
- No build step required
- Simple deployment
- Easy to understand and modify
- Fast page loads

**Why Express Backend?**
- Minimal overhead
- Simple API proxy pattern
- Easy to extend with more endpoints
- Good for static file serving

**Why Docker?**
- Consistent environments (dev/prod)
- Easy deployment
- Isolated containers
- Easy rollback

**Why Traefik?**
- Automatic SSL certificates
- Easy reverse proxy configuration
- Docker integration
- Multiple domain support

### Key Reusable Patterns

1. **Multi-Source Aggregation**: Parallel API calls with timeout
2. **Server-Side Proxy**: CORS bypass pattern
3. **Dual Environment**: Dev/prod separation
4. **Build-Time Config**: API key injection
5. **SPA Routing**: Catch-all to index.html
6. **Rate Limiting**: Security pattern
7. **Input Sanitization**: Security pattern

---

## Technology Stack Summary

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling (gradients, flexbox, animations)
- **Vanilla JavaScript (ES6+)**: No frameworks
- **Fetch API**: HTTP requests
- **Promise.allSettled()**: Parallel async operations

### Backend
- **Node.js 18**: Runtime
- **Express.js 5**: Web framework
- **CORS**: Cross-origin support
- **express-rate-limit**: Rate limiting
- **node-fetch**: HTTP client

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Traefik**: Reverse proxy, SSL termination
- **Let's Encrypt**: SSL certificates

### APIs Used
- **Google Books API**: Book search
- **TMDB API**: Movie search
- **DoesTheDogDie API**: Trigger warnings
- **Open Library API**: Book metadata
- **Wikipedia API**: Content summaries
- **Goodreads**: Book reviews (scraping)
- **StoryGraph**: Content warnings (scraping)
- **Trigger Warning Database**: Curated warnings (scraping)

---

## File Structure

```
laurens-list/
├── index.html              # Frontend HTML
├── styles.css              # Frontend CSS
├── script.js               # Frontend JavaScript
├── server.js               # Backend Express server
├── package.json            # Node.js dependencies
├── Dockerfile              # Container definition
├── docker-compose.yml      # Multi-container config
├── build.js                # Build script (API key injection)
├── .gitignore             # Git ignore rules
├── README.md              # User documentation
├── ARCHITECTURE.md        # This file
├── DEV_TO_PROD_DEPLOYMENT.md  # Deployment guide
└── config.example.js       # Config template (not in Git)
```

---

## Performance Considerations

### Optimization Strategies

1. **Parallel API Calls**: All sources queried simultaneously
2. **Timeout Handling**: 15-second timeout per source (prevents hanging)
3. **Promise.allSettled()**: Continues even if some sources fail
4. **Client-Side Caching**: Results cached in memory (not persistent)
5. **Static File Serving**: Express serves static files efficiently
6. **No Build Step**: Direct file serving (fast)

### Scalability

**Current Architecture**:
- Single container per environment
- Suitable for: Low to medium traffic (< 1000 req/min)

**Scaling Options**:
- **Horizontal Scaling**: Multiple containers behind Traefik load balancer
- **Caching Layer**: Redis for API response caching
- **CDN**: CloudFront/Cloudflare for static assets
- **Database**: Store results for faster repeated queries

---

## Monitoring & Logging

### Current Logging

**Server Logs**:
- Request logging (method, path)
- API proxy activity
- Error logging

**Client Logs**:
- Console logging for debugging
- API call tracking
- Error reporting

### Monitoring Recommendations

1. **Health Check Endpoint**: `/health` endpoint
2. **Metrics**: Request count, response times
3. **Error Tracking**: Sentry or similar
4. **Uptime Monitoring**: UptimeRobot or similar

---

## Future Enhancements

### Potential Improvements

1. **Database Integration**: Cache results, user preferences
2. **User Accounts**: Save search history, preferences
3. **API Response Caching**: Reduce external API calls
4. **Advanced Analytics**: Track search patterns
5. **Mobile App**: React Native wrapper
6. **Browser Extension**: Quick search from any page

---

*Last Updated: January 2025*

