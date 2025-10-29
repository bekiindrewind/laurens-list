const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(__dirname));

// API keys
const CONFIG = {
    HARDCOVER_BEARER_TOKEN: 'eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJIYXJkY292ZXIiLCJ2ZXJzaW9uIjoiOCIsImp0aSI6IjY3NzAxOTVjLWUxZTItNGM5NS1hNjUyLTgxOTI2MTIxYjIzZCIsImFwcGxpY2F0aW9uSWQiOjIsInN1YiI6IjUxNTk2IiwiYXVkIjoiMSIsImlkIjoiNTE1OTYiLCJsb2dnZWRJbiI6dHJ1ZSwiaWF0IjoxNzYxMjY2MzQyLCJleHAiOjE3OTI4MDIzNDIsImh0dHBzOi8vaGFzdXJhLmlvL2p3dC9jbGFpbXMiOnsieC1oYXN1cmEtYWxsb3dlZC1yb2xlcyI6WyJ1c2VyIl0sIngtaGFzdXJhLWRlZmF1bHQtcm9sZSI6InVzZXIiLCJ4LWhhc3VyYS1yb2xlIjoidXNlciIsIlgtaGFzdXJhLXVzZXItaWQiOiI1MTU5NiJ9LCJ1c2VyIjp7ImlkIjo1MTU5Nn19.j32_IEwRbU3qq4l7E3-7kvcvJminBFdRbousSM4z7I8',
    DOESTHEDOGDIE_API_KEY: 'fb1ce9d557e74a9544cf0385263efa30'
};

// Hardcover proxy endpoint
app.post('/api/hardcover', async (req, res) => {
    try {
        const response = await fetch('https://hardcover.app/api/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.HARDCOVER_BEARER_TOKEN}`
            },
            body: JSON.stringify(req.body)
        });
        
        const text = await response.text();
        console.log('Hardcover response status:', response.status);
        console.log('Hardcover response text:', text.substring(0, 200));
        
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
        const apiKey = CONFIG.DOESTHEDOGDIE_API_KEY;
        
        const url = `https://www.doesthedogdie.com/api/search?q=${encodeURIComponent(query)}&api_key=${apiKey}`;
        console.log('Fetching from DoesTheDogDie:', url);
        
        const response = await fetch(url);
        const text = await response.text();
        
        console.log('DoesTheDogDie response status:', response.status);
        console.log('DoesTheDogDie response text:', text.substring(0, 200));
        
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

// Start server
app.listen(PORT, () => {
    console.log(`Lauren's List server running on port ${PORT}`);
    console.log(`Static files and API proxy available at http://localhost:${PORT}`);
});

