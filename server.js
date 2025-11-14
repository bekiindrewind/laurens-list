const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 8080;

// Trust proxy (Traefik) for accurate IP detection in rate limiting
app.set('trust proxy', true);

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

try {
    const config = require('./config.production.js');
    if (config && config.CONFIG && config.CONFIG.DOESTHEDOGDIE_API_KEY) {
        DOESTHEDOGDIE_API_KEY = config.CONFIG.DOESTHEDOGDIE_API_KEY;
    }
} catch (error) {
    // config.production.js doesn't exist or can't be loaded - use environment variables
    console.log('⚠️ config.production.js not found, using environment variables for API keys');
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

// DuckDuckGo search proxy endpoint
// SECURITY: Apply rate limiting to prevent abuse
app.get('/api/duckduckgo-search', apiLimiter, async (req, res) => {
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
        
        // Try both query formats: "{title} cancer" and "{title} movie cancer"
        const queries = [
            `${query} cancer`,
            `${query} movie cancer`
        ];
        
        const results = [];
        
        for (const searchQuery of queries) {
            try {
                const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&format=json&no_redirect=1&no_html=1`;
                
                console.log('Proxy: Fetching from DuckDuckGo:', url);
                
                const response = await fetch(url, {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                if (!response.ok) {
                    console.error(`Proxy: DuckDuckGo response status: ${response.status} for query "${searchQuery}"`);
                    continue; // Try next query format
                }
                
                const data = await response.json();
                
                // Extract all text content from response
                const textContent = [
                    data.AbstractText || '',
                    data.Heading || '',
                    ...(data.RelatedTopics || []).map(topic => topic.Text || ''),
                    ...(data.Results || []).map(result => result.Text || '')
                ].filter(text => text.length > 0).join(' ').toLowerCase();
                
                if (textContent.length > 0) {
                    results.push({
                        query: searchQuery,
                        text: textContent,
                        abstractText: data.AbstractText || '',
                        relatedTopics: data.RelatedTopics || [],
                        results: data.Results || []
                    });
                }
            } catch (queryError) {
                // Log error to console for debugging
                console.error(`DuckDuckGo query error for "${searchQuery}":`, queryError);
                console.error(`  Error details:`, {
                    message: queryError.message,
                    stack: queryError.stack,
                    query: searchQuery
                });
                // Continue to next query format
                continue;
            }
        }
        
        // Return combined results
        res.json({
            success: results.length > 0,
            results: results,
            combinedText: results.map(r => r.text).join(' ')
        });
        
    } catch (error) {
        // Log full error details to console for debugging
        console.error('DuckDuckGo proxy error:', error);
        console.error('  Error details:', {
            message: error.message,
            stack: error.stack,
            query: rawQuery || 'unknown'
        });
        // Don't expose error details to client (security) - return generic error
        res.status(500).json({ error: 'Failed to fetch from DuckDuckGo' });
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
// SECURITY: Block .md files and other documentation from being served
app.use((req, res, next) => {
    // Block markdown files and documentation files
    if (req.path.endsWith('.md') || 
        req.path.includes('/ARCHITECTURE') || 
        req.path.includes('/TEMPLATE') ||
        req.path.includes('/README.md') ||
        req.path.includes('/DEV_TO_PROD') ||
        req.path.includes('/SECURITY.md') ||
        req.path.includes('/TESTING') ||
        req.path.includes('/HARDCOVER') ||
        req.path.includes('/INVESTIGATION') ||
        req.path.includes('/NETLIFY') ||
        req.path.includes('/TROUBLESHOOT') ||
        req.path.includes('/VERIFY') ||
        req.path.includes('/VPS')) {
        return res.status(404).send('Not Found');
    }
    next();
});

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

// CRITICAL: Add error handlers to prevent crashes that cause container restarts
// If the app crashes, Docker's 'restart: always' policy will restart it
// If docker-compose.yml was reverted to use 'latest' tag, it would use an old image
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    console.error('Stack:', error.stack);
    // Don't exit - keep the server running
    // This prevents Docker from restarting the container
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
    // Don't exit - keep the server running
    // This prevents Docker from restarting the container
});

// Start server
app.listen(PORT, () => {
    console.log(`Lauren's List server running on port ${PORT}`);
    console.log(`Static files and API proxy available at http://localhost:${PORT}`);
});

