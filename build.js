const fs = require('fs');
const path = require('path');

console.log('🔧 Building Lauren\'s List...');

// Read the original script.js
const scriptPath = path.join(__dirname, 'script.js');
let scriptContent = fs.readFileSync(scriptPath, 'utf8');

// Replace placeholder API keys with environment variables
const replacements = {
    'YOUR_TMDB_API_KEY': process.env.TMDB_API_KEY || 'YOUR_TMDB_API_KEY',
    'YOUR_GOOGLE_BOOKS_API_KEY': process.env.GOOGLE_BOOKS_API_KEY || 'YOUR_GOOGLE_BOOKS_API_KEY',
    'YOUR_HARDCOVER_BEARER_TOKEN': process.env.HARDCOVER_BEARER_TOKEN || 'YOUR_HARDCOVER_BEARER_TOKEN',
    'YOUR_DTDD_API_KEY': process.env.DOESTHEDOGDIE_API_KEY || 'YOUR_DTDD_API_KEY'
};

// Apply replacements
Object.entries(replacements).forEach(([placeholder, value]) => {
    scriptContent = scriptContent.replace(new RegExp(placeholder, 'g'), value);
});

// Write the updated script
fs.writeFileSync(scriptPath, scriptContent);

console.log('✅ Build complete! API keys injected from environment variables.');
console.log('📊 Environment variables found:');
console.log(`  TMDB_API_KEY: ${process.env.TMDB_API_KEY ? '✅ Set' : '❌ Not set'}`);
console.log(`  GOOGLE_BOOKS_API_KEY: ${process.env.GOOGLE_BOOKS_API_KEY ? '✅ Set' : '❌ Not set'}`);
console.log(`  HARDCOVER_BEARER_TOKEN: ${process.env.HARDCOVER_BEARER_TOKEN ? '✅ Set' : '❌ Not set'}`);
console.log(`  DOESTHEDOGDIE_API_KEY: ${process.env.DOESTHEDOGDIE_API_KEY ? '✅ Set' : '❌ Not set'}`);
