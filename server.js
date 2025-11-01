const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

// Debug middleware - log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Load API keys from config
const config = require('./config.production.js');
const DOESTHEDOGDIE_API_KEY = config.CONFIG.DOESTHEDOGDIE_API_KEY || process.env.DOESTHEDOGDIE_API_KEY;

// Note: Hardcover API removed - blocked by Cloudflare protection
// Server-side requests cannot bypass Cloudflare's JavaScript challenge

// DoesTheDogDie proxy endpoint
app.get('/api/doesthedogdie', async (req, res) => {
    try {
        const query = req.query.q;
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

// Trigger Warning Database proxy endpoint
app.get('/api/triggerwarning', async (req, res) => {
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

