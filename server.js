const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

// Load API keys from config
const config = require('./config.production.js');
const HARDCOVER_BEARER_TOKEN = config.CONFIG.HARDCOVER_BEARER_TOKEN;
const DOESTHEDOGDIE_API_KEY = config.CONFIG.DOESTHEDOGDIE_API_KEY;

// Hardcover proxy endpoint
app.post('/api/hardcover', async (req, res) => {
    try {
        console.log('Proxy: Receiving Hardcover request');
        const response = await fetch('https://hardcover.app/api/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${HARDCOVER_BEARER_TOKEN}`
            },
            body: JSON.stringify(req.body)
        });
        
        const text = await response.text();
        console.log('Proxy: Hardcover response status:', response.status);
        console.log('Proxy: Hardcover response preview:', text.substring(0, 200));
        
        try {
            const data = JSON.parse(text);
            res.json(data);
        } catch (parseError) {
            console.error('Failed to parse response as JSON:', parseError);
            res.status(500).json({ error: 'Invalid JSON response from Hardcover', rawResponse: text.substring(0, 200) });
        }
    } catch (error) {
        console.error('Hardcover proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch from Hardcover', details: error.message });
    }
});

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

// Serve static files from the current directory
app.use(express.static(__dirname));

// Catch-all for index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Lauren's List server running on port ${PORT}`);
    console.log(`Static files and API proxy available at http://localhost:${PORT}`);
});

