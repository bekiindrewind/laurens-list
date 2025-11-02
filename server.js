const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

// SECURITY: Rate limiting for API endpoints to prevent abuse and DoS attacks
// Allow 20 requests per 15 minutes per IP for API endpoints
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: false, // Count successful requests
    skipFailedRequests: true // Don't count failed requests (4xx, 5xx errors)
});

// Debug middleware - log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Load API keys from config (if exists) or environment variables
// SECURITY: config.production.js is not in Git, so it may not exist
// Fall back to environment variables which are injected during Docker build
let DOESTHEDOGDIE_API_KEY = process.env.DOESTHEDOGDIE_API_KEY;
let GOOGLE_CUSTOM_SEARCH_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
let GOOGLE_CUSTOM_SEARCH_ENGINE_ID = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

try {
    const config = require('./config.production.js');
    if (config && config.CONFIG) {
        if (config.CONFIG.DOESTHEDOGDIE_API_KEY) {
            DOESTHEDOGDIE_API_KEY = config.CONFIG.DOESTHEDOGDIE_API_KEY;
        }
        if (config.CONFIG.GOOGLE_CUSTOM_SEARCH_API_KEY) {
            GOOGLE_CUSTOM_SEARCH_API_KEY = config.CONFIG.GOOGLE_CUSTOM_SEARCH_API_KEY;
        }
        if (config.CONFIG.GOOGLE_CUSTOM_SEARCH_ENGINE_ID) {
            GOOGLE_CUSTOM_SEARCH_ENGINE_ID = config.CONFIG.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;
        }
    }
} catch (error) {
    // config.production.js doesn't exist or can't be loaded - use environment variables
    console.log('⚠️ config.production.js not found, using environment variables for API keys');
}

// Log Google Custom Search availability
if (GOOGLE_CUSTOM_SEARCH_API_KEY && GOOGLE_CUSTOM_SEARCH_ENGINE_ID) {
    console.log('✅ Google Custom Search API configured');
} else {
    console.log('⚠️ Google Custom Search API not configured (optional)');
}

// Note: Hardcover API removed - blocked by Cloudflare protection
// Server-side requests cannot bypass Cloudflare's JavaScript challenge

/**
 * Sanitize user input on server-side to prevent injection attacks
 * @param {string} input - Raw input from query parameter
 * @returns {string|null} - Sanitized input or null if invalid
 */
function sanitizeServerInput(input) {
    if (!input || typeof input !== 'string') {
        return null;
    }
    
    // Remove HTML tags and script content
    let sanitized = input.replace(/<[^>]*>/g, '');
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
    
    // Limit length (max 200 characters)
    sanitized = sanitized.substring(0, 200);
    
    // Remove null bytes and control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
    
    // Trim and validate
    sanitized = sanitized.trim();
    
    if (!sanitized || sanitized.length === 0) {
        return null;
    }
    
    return sanitized;
}

// DoesTheDogDie proxy endpoint
// SECURITY: Apply rate limiting to prevent abuse
app.get('/api/doesthedogdie', apiLimiter, async (req, res) => {
    try {
        // SECURITY: Sanitize query parameter before using
        const rawQuery = req.query.q;
        if (!rawQuery) {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }
        
        const query = sanitizeServerInput(rawQuery);
        if (!query) {
            return res.status(400).json({ error: 'Invalid query parameter' });
        }
        
        const url = `https://www.doesthedogdie.com/dddsearch?q=${encodeURIComponent(query)}`;
        
        console.log('Proxy: Fetching from DoesTheDogDie:', url);
        
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'X-API-KEY': DOESTHEDOGDIE_API_KEY
            }
        });
        
        const text = await response.text();
        console.log('Proxy: DoesTheDogDie response status:', response.status);
        console.log('Proxy: DoesTheDogDie response preview:', text.substring(0, 200));
        
        try {
            const data = JSON.parse(text);
            res.json(data);
        } catch (parseError) {
            console.error('Failed to parse response as JSON:', parseError);
            res.status(500).json({ error: 'Invalid JSON response from DoesTheDogDie', rawResponse: text.substring(0, 200) });
        }
    } catch (error) {
        console.error('DoesTheDogDie proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch from DoesTheDogDie', details: error.message });
    }
});

// Google Custom Search API endpoint for searching web content
// SECURITY: Apply rate limiting to prevent abuse
app.get('/api/google-search', apiLimiter, async (req, res) => {
    try {
        // Check if API is configured
        if (!GOOGLE_CUSTOM_SEARCH_API_KEY || !GOOGLE_CUSTOM_SEARCH_ENGINE_ID) {
            return res.status(503).json({ 
                error: 'Google Custom Search API not configured',
                message: 'This feature requires Google Custom Search API key and Engine ID'
            });
        }
        
        // SECURITY: Sanitize query parameter before using
        const rawQuery = req.query.q;
        if (!rawQuery) {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }
        
        const query = sanitizeServerInput(rawQuery);
        if (!query) {
            return res.status(400).json({ error: 'Invalid query parameter' });
        }
        
        // Search for "{title} cancer" to find cancer-related content
        const searchQuery = `${query} cancer`;
        const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_CUSTOM_SEARCH_API_KEY}&cx=${GOOGLE_CUSTOM_SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchQuery)}&num=5`;
        
        console.log('Proxy: Fetching from Google Custom Search:', searchQuery);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error('Google Custom Search error:', response.status, response.statusText);
            return res.status(500).json({ 
                error: 'Failed to fetch from Google Custom Search',
                status: response.status
            });
        }
        
        const data = await response.json();
        console.log('Proxy: Google Custom Search response:', data);
        
        // Extract snippets and titles from search results
        const results = {
            found: false,
            snippets: [],
            titles: []
        };
        
        if (data.items && data.items.length > 0) {
            results.found = true;
            results.snippets = data.items.map(item => item.snippet || '').filter(s => s.length > 0);
            results.titles = data.items.map(item => item.title || '').filter(t => t.length > 0);
        }
        
        res.json(results);
    } catch (error) {
        console.error('Google Custom Search proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch from Google Custom Search', details: error.message });
    }
});

// Trigger Warning Database proxy endpoint
// SECURITY: Apply rate limiting to prevent abuse
app.get('/api/triggerwarning', apiLimiter, async (req, res) => {
    try {
        const url = 'https://triggerwarningdatabase.com/terminal-illnesses/';
        
        console.log('Proxy: Fetching Trigger Warning Database:', url);
        
        const response = await fetch(url, {
            headers: {
                'Accept': 'text/html',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        console.log('Proxy: Trigger Warning Database response status:', response.status);
        console.log('Proxy: Trigger Warning Database response length:', html.length);
        
        // Return the HTML for client-side parsing
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        console.error('Trigger Warning Database proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch from Trigger Warning Database', details: error.message });
    }
});

// Serve static files from the current directory (CSS, JS, images, favicons, etc.)
app.use(express.static(__dirname, {
    index: false, // Don't serve index.html automatically, let routes handle it
    setHeaders: (res, path) => {
        // Set proper content type for favicon files
        if (path.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        } else if (path.endsWith('.ico')) {
            res.setHeader('Content-Type', 'image/x-icon');
        } else if (path.endsWith('.webmanifest')) {
            res.setHeader('Content-Type', 'application/manifest+json');
        }
        
        // SECURITY: Disable caching for script.js to ensure API keys are always fresh
        // This prevents browsers from serving cached versions with placeholder keys
        if (path.endsWith('script.js')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// Explicit route for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Catch-all for all other routes (except API and static files) - must be last
app.get(/^(?!\/api)(?!.*\.(png|ico|jpg|jpeg|gif|svg|css|js|webmanifest|json|txt|pdf)$).*/, (req, res) => {
    // Serve index.html for all non-API routes that aren't static files (SPA routing)
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Lauren's List server running on port ${PORT}`);
    console.log(`Static files and API proxy available at http://localhost:${PORT}`);
});

