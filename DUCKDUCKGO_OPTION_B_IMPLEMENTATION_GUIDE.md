# DuckDuckGo Option B Implementation Guide

## Overview

This guide details the implementation of DuckDuckGo HTML search (Option B) to replace the Instant Answer API (Option A), which doesn't work for general web search queries like movie/book searches.

## Goals

- ✅ Remove Option A (Instant Answer API) - doesn't work for our use case
- ✅ Implement Option B (HTML search) - provides actual search results
- ✅ Parse HTML to extract titles, snippets, and URLs
- ✅ Analyze results for cancer-related terms
- ✅ Maintain existing fallback to pattern matching
- ✅ Keep same integration points (no changes to calling code)

---

## Why Replace Option A?

**Option A (Instant Answer API) Limitations:**
- Only returns results for Instant Answer queries (definitions, calculations, etc.)
- Returns empty results for general web searches like "Guardians of the Galaxy cancer"
- Not suitable for movie/book content detection

**Option B (HTML Search) Benefits:**
- Returns actual search results (titles, snippets, URLs)
- Works for any search query
- Provides comprehensive results we can analyze

---

## Implementation Steps

### Step 1: Remove Option A Code from Server

**File**: `server.js`

**Location**: `/api/duckduckgo-search` endpoint (around line 128)

**Current Code** (to be removed):
```javascript
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
        
        // Log the full response for debugging
        console.log(`Proxy: DuckDuckGo response for "${searchQuery}":`, JSON.stringify(data, null, 2).substring(0, 500));
        
        // Extract all text content from response
        const textContent = [
            data.AbstractText || '',
            data.Heading || '',
            ...(data.RelatedTopics || []).map(topic => topic.Text || ''),
            ...(data.Results || []).map(result => result.Text || '')
        ].filter(text => text.length > 0).join(' ').toLowerCase();
        
        console.log(`Proxy: Extracted text length: ${textContent.length} characters`);
        
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
```

**Replace with Option B (HTML Search)**:
```javascript
// Try both query formats: "{title} cancer" and "{title} movie cancer"
const queries = [
    `${query} cancer`,
    `${query} movie cancer`
];

const results = [];

for (const searchQuery of queries) {
    try {
        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
        
        console.log('Proxy: Fetching from DuckDuckGo HTML search:', url);
        
        const response = await fetch(url, {
            headers: {
                'Accept': 'text/html',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            console.error(`Proxy: DuckDuckGo HTML response status: ${response.status} for query "${searchQuery}"`);
            continue; // Try next query format
        }
        
        const html = await response.text();
        console.log(`Proxy: DuckDuckGo HTML response length: ${html.length} characters`);
        
        // Parse HTML to extract search results
        const parsedResults = parseDuckDuckGoHTML(html, searchQuery);
        
        if (parsedResults && parsedResults.length > 0) {
            results.push(...parsedResults);
        }
    } catch (queryError) {
        // Log error to console for debugging
        console.error(`DuckDuckGo HTML query error for "${searchQuery}":`, queryError);
        console.error(`  Error details:`, {
            message: queryError.message,
            stack: queryError.stack,
            query: searchQuery
        });
        // Continue to next query format
        continue;
    }
}
```

---

### Step 2: Add HTML Parser Function

**File**: `server.js`

**Location**: Add before the `/api/duckduckgo-search` endpoint (around line 127)

**Implementation**:
```javascript
/**
 * Parse DuckDuckGo HTML search results
 * Extracts titles, snippets, and URLs from HTML response
 * 
 * @param {string} html - HTML content from DuckDuckGo
 * @param {string} query - Original search query
 * @returns {Array} Array of parsed results with title, snippet, url, and text
 */
function parseDuckDuckGoHTML(html, query) {
    const results = [];
    
    try {
        // DuckDuckGo HTML structure (as of 2024):
        // Results are in <div class="result"> or <div class="web-result">
        // Title is in <a class="result__a"> or similar
        // Snippet is in <a class="result__snippet"> or <div class="result__snippet">
        
        // Pattern 1: Modern DuckDuckGo structure
        // Look for result containers
        const resultPattern = /<div[^>]*class="[^"]*result[^"]*"[^>]*>(.*?)<\/div>/gis;
        let match;
        
        while ((match = resultPattern.exec(html)) !== null) {
            const resultHtml = match[1];
            
            // Extract title (usually in <a> tag with class containing "result" and "a")
            const titleMatch = resultHtml.match(/<a[^>]*class="[^"]*result[^"]*a[^"]*"[^>]*>(.*?)<\/a>/is);
            const title = titleMatch ? cleanHtmlText(titleMatch[1]) : '';
            
            // Extract URL (href attribute of title link)
            const urlMatch = resultHtml.match(/<a[^>]*href="([^"]*)"[^>]*class="[^"]*result[^"]*a[^"]*"/is);
            const url = urlMatch ? urlMatch[1] : '';
            
            // Extract snippet (usually in <a> or <span> with class containing "snippet")
            const snippetMatch = resultHtml.match(/<(?:a|span|div)[^>]*class="[^"]*snippet[^"]*"[^>]*>(.*?)<\/(?:a|span|div)>/is);
            const snippet = snippetMatch ? cleanHtmlText(snippetMatch[1]) : '';
            
            // Only add if we have at least a title or snippet
            if (title || snippet) {
                const text = `${title} ${snippet}`.trim().toLowerCase();
                if (text.length > 0) {
                    results.push({
                        title: title,
                        snippet: snippet,
                        url: url,
                        text: text
                    });
                }
            }
        }
        
        // Pattern 2: Alternative structure (if Pattern 1 doesn't work)
        // Some DuckDuckGo pages use different HTML structure
        if (results.length === 0) {
            // Try alternative pattern: look for links with result classes
            const linkPattern = /<a[^>]*class="[^"]*result[^"]*"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gis;
            let linkMatch;
            
            while ((linkMatch = linkPattern.exec(html)) !== null && results.length < 20) {
                const url = linkMatch[1];
                const linkText = cleanHtmlText(linkMatch[2]);
                
                if (linkText && url && !url.startsWith('#')) {
                    // Try to find snippet near this link
                    const snippetPattern = new RegExp(
                        escapeRegex(linkMatch[0]) + '[\\s\\S]{0,500}?<[^>]*class="[^"]*snippet[^"]*"[^>]*>(.*?)<\/[^>]*>',
                        'is'
                    );
                    const snippetMatch = html.match(snippetPattern);
                    const snippet = snippetMatch ? cleanHtmlText(snippetMatch[1]) : '';
                    
                    results.push({
                        title: linkText,
                        snippet: snippet,
                        url: url,
                        text: `${linkText} ${snippet}`.trim().toLowerCase()
                    });
                }
            }
        }
        
        console.log(`Proxy: Parsed ${results.length} results from DuckDuckGo HTML`);
        
        return results;
        
    } catch (parseError) {
        console.error('Error parsing DuckDuckGo HTML:', parseError);
        console.error('  Error details:', {
            message: parseError.message,
            stack: parseError.stack,
            htmlLength: html.length
        });
        return [];
    }
}

/**
 * Clean HTML text by removing tags and decoding entities
 * 
 * @param {string} htmlText - HTML text to clean
 * @returns {string} Cleaned text
 */
function cleanHtmlText(htmlText) {
    if (!htmlText) return '';
    
    // Remove HTML tags
    let text = htmlText.replace(/<[^>]*>/g, '');
    
    // Decode HTML entities (basic ones)
    text = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
        .replace(/&#x([a-f\d]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
}

/**
 * Escape special regex characters
 * 
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
```

---

### Step 3: Update Server Response Format

**File**: `server.js`

**Location**: `/api/duckduckgo-search` endpoint return statement (around line 200)

**Current Code**:
```javascript
// Return combined results
res.json({
    success: results.length > 0,
    results: results,
    combinedText: results.map(r => r.text).join(' ')
});
```

**Updated Code** (same format, but results structure changed):
```javascript
// Combine all text from all results for analysis
const combinedText = results.map(r => r.text).join(' ');

// Return combined results (same format as before for client compatibility)
res.json({
    success: results.length > 0,
    results: results,
    combinedText: combinedText
});
```

**Note**: The response format stays the same, so no client-side changes needed!

---

### Step 4: Update Client-Side Parsing (If Needed)

**File**: `script.js`

**Location**: `searchDuckDuckGoForCancerContent()` function (around line 2765)

**Current Code** (checking for results):
```javascript
// Count number of results mentioning cancer
const resultsWithCancer = data.results.filter(result => {
    const resultText = result.text.toLowerCase();
    return CANCER_TERMS.some(term => resultText.includes(term.toLowerCase()));
}).length;
```

**Updated Code** (handle new result structure):
```javascript
// Count number of results mentioning cancer
// Results now have: { title, snippet, url, text }
const resultsWithCancer = data.results.filter(result => {
    const resultText = result.text || `${result.title || ''} ${result.snippet || ''}`.toLowerCase();
    return CANCER_TERMS.some(term => resultText.includes(term.toLowerCase()));
}).length;
```

**Note**: This is a minor change to handle the new result structure. The `text` field should already be there, but this adds a fallback.

---

## HTML Structure Analysis

### DuckDuckGo HTML Structure (Research Needed)

Before implementing, we should inspect actual DuckDuckGo HTML to understand the structure. However, here's a general approach:

**Common Patterns:**
1. **Result containers**: `<div class="result">` or `<div class="web-result">`
2. **Title links**: `<a class="result__a">` or `<a class="result-link">`
3. **Snippets**: `<a class="result__snippet">` or `<div class="result__snippet">`

**Testing Approach:**
1. Manually visit `https://html.duckduckgo.com/html/?q=test+cancer`
2. View page source
3. Identify the actual HTML structure
4. Update parser patterns accordingly

---

## Alternative: Use HTML Parser Library

**Option**: Use `cheerio` library for more reliable HTML parsing

**Pros:**
- More reliable than regex
- Handles malformed HTML
- CSS selector support
- Better maintenance

**Cons:**
- Adds dependency
- Slightly slower
- More code

**Implementation with cheerio**:
```javascript
const cheerio = require('cheerio');

function parseDuckDuckGoHTML(html, query) {
    const results = [];
    const $ = cheerio.load(html);
    
    // Find result containers
    $('.result, .web-result').each((i, elem) => {
        const $elem = $(elem);
        
        // Extract title
        const title = $elem.find('a.result__a, a.result-link').text().trim();
        
        // Extract URL
        const url = $elem.find('a.result__a, a.result-link').attr('href') || '';
        
        // Extract snippet
        const snippet = $elem.find('a.result__snippet, .result__snippet').text().trim();
        
        if (title || snippet) {
            const text = `${title} ${snippet}`.trim().toLowerCase();
            if (text.length > 0) {
                results.push({
                    title: title,
                    snippet: snippet,
                    url: url,
                    text: text
                });
            }
        }
    });
    
    return results;
}
```

**Recommendation**: Start with regex parsing (simpler, no dependencies). If it's unreliable, switch to `cheerio`.

---

## Testing Strategy

### Step 1: Test HTML Fetching
1. Manually test: `curl "https://html.duckduckgo.com/html/?q=Guardians%20of%20the%20Galaxy%20cancer"`
2. Verify HTML is returned
3. Check for rate limiting or blocking

### Step 2: Test HTML Parsing
1. Save sample HTML to file
2. Test parser function with sample HTML
3. Verify results are extracted correctly
4. Check for edge cases (missing fields, malformed HTML)

### Step 3: Test Full Integration
1. Deploy to dev
2. Search for "Guardians of the Galaxy"
3. Check server logs for parsed results
4. Verify client receives results
5. Check if cancer terms are detected

### Test Cases:
- **Guardians of the Galaxy** - Should find cancer mentions
- **The Fault in Our Stars** - Should find cancer mentions
- **Inception** - Should not find cancer (false positive test)
- **Empty results** - Should fallback to pattern matching

---

## Error Handling

### HTML Parsing Errors
- Log full error details
- Return empty array (triggers fallback)
- Don't expose errors to client

### Network Errors
- Log error details
- Try next query format
- Return empty results if all queries fail

### Rate Limiting
- DuckDuckGo may rate limit
- Log rate limit errors
- Fallback to pattern matching

---

## Legal Considerations

### Terms of Service
- **Action Required**: Review DuckDuckGo's Terms of Service
- Check if HTML scraping is allowed
- Verify rate limiting policies
- Ensure compliance

### Best Practices
- Use appropriate User-Agent
- Respect rate limits
- Don't scrape too frequently
- Use for legitimate purposes only

---

## Maintenance Considerations

### HTML Structure Changes
- DuckDuckGo may change HTML structure
- Parser may break
- Need to update patterns
- Consider using `cheerio` for more resilience

### Monitoring
- Log parsing success/failure rates
- Monitor for empty results
- Alert if parsing fails consistently

---

## Rollback Plan

If Option B causes issues:

1. **Quick Fix**: Comment out HTML parsing, return empty results (triggers pattern matching)
2. **Revert**: `git revert` the commit
3. **Disable Endpoint**: Remove or comment out `/api/duckduckgo-search` endpoint

**Note**: Since we have pattern matching fallback, existing functionality will continue to work.

---

## Implementation Checklist

### Server-Side
- [ ] Remove Option A (Instant Answer API) code
- [ ] Add `parseDuckDuckGoHTML()` function
- [ ] Add `cleanHtmlText()` helper function
- [ ] Add `escapeRegex()` helper function
- [ ] Update `/api/duckduckgo-search` endpoint to use HTML search
- [ ] Test HTML fetching
- [ ] Test HTML parsing with sample HTML
- [ ] Verify response format compatibility

### Client-Side
- [ ] Update result parsing (if needed) to handle new structure
- [ ] Test with actual search results
- [ ] Verify cancer term detection works

### Testing
- [ ] Test with "Guardians of the Galaxy"
- [ ] Test with "The Fault in Our Stars"
- [ ] Test with non-cancer movies (false positive check)
- [ ] Test error handling (network errors, parsing errors)
- [ ] Test fallback to pattern matching

### Documentation
- [ ] Update implementation guide
- [ ] Document HTML structure patterns
- [ ] Document any gotchas or limitations

---

## Alternative: Use HTML Parser Library

If regex parsing is unreliable, consider using `cheerio`:

### Installation
```bash
npm install cheerio
```

### Update server.js
```javascript
const cheerio = require('cheerio');

function parseDuckDuckGoHTML(html, query) {
    const results = [];
    const $ = cheerio.load(html);
    
    // Use CSS selectors to find results
    $('.result, .web-result').each((i, elem) => {
        // ... parsing logic
    });
    
    return results;
}
```

**Recommendation**: Start with regex, switch to `cheerio` if needed.

---

## Summary

This implementation:
- ✅ Removes Option A (Instant Answer API) - doesn't work for our use case
- ✅ Implements Option B (HTML search) - provides actual search results
- ✅ Maintains same response format - no client-side breaking changes
- ✅ Keeps fallback to pattern matching - robust error handling
- ✅ Adds comprehensive error logging - easy debugging

The key change is replacing the Instant Answer API call with HTML search and adding HTML parsing logic to extract results.

