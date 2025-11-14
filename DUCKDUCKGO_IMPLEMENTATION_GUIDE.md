# DuckDuckGo Search Implementation Guide

## Overview

This guide provides step-by-step instructions for integrating DuckDuckGo search functionality to detect cancer-related content in movies and books. The implementation adds a new search method that complements existing detection methods without breaking current functionality.

## Goals

- ✅ Add real web search capability (currently `searchWebForCancerContent()` only does pattern matching)
- ✅ Catch movies like Guardians of the Galaxy where Google summaries mention cancer but Wikipedia doesn't
- ✅ Use existing `CANCER_TERMS` list for semantic analysis
- ✅ Maintain existing functionality - this is an **additional** search, not a replacement
- ✅ Fallback to existing pattern matching if DuckDuckGo fails

---

## Architecture Overview

### Current Flow
```
User Search → Other API Searches (TMDB, Wikipedia, IMDb, DoesTheDogDie) → 
  searchWebForCancerContent() → Pattern Matching Only → Return Result
```

### New Flow
```
User Search → Other API Searches (TMDB, Wikipedia, IMDb, DoesTheDogDie) → 
  searchWebForCancerContent() → 
    ├─ Try DuckDuckGo Search (NEW)
    │   ├─ Success → Parse & Analyze → Return Result
    │   └─ Failure → Fallback to Pattern Matching (EXISTING)
    └─ Pattern Matching (EXISTING - always runs as fallback)
```

**Important**: Web search (including DuckDuckGo) runs **AFTER** all other API searches, not before.

---

## Implementation Steps

### Step 1: Research DuckDuckGo API Options

#### Option A: DuckDuckGo Instant Answer API (Primary)
- **Endpoint**: `https://api.duckduckgo.com/`
- **Parameters**:
  - `q`: Search query
  - `format`: `json`
  - `no_redirect`: `1`
  - `no_html`: `1`
- **Response Fields**:
  - `AbstractText`: Main result text
  - `RelatedTopics`: Array of related topics
  - `Results`: Array of search results
  - `Heading`: Result heading

**Pros:**
- Official API
- No API key required
- Free to use

**Cons:**
- Limited results (may not return many results)
- May not have full search result snippets

#### Option B: DuckDuckGo HTML Search (Only if explicitly requested)
- **Endpoint**: `https://html.duckduckgo.com/html/`
- **Parameters**:
  - `q`: Search query
- **Response**: HTML page with search results
- **Parsing**: Extract result titles and snippets from HTML

**Pros:**
- More comprehensive results
- Full search result snippets

**Cons:**
- Requires HTML parsing (fragile)
- May violate ToS (check DuckDuckGo's terms)

**Note**: Option B will NOT be automatically implemented. Only implement if explicitly requested after testing Option A.

---

### Step 2: Create Server-Side Endpoint

**File**: `server.js`

**Location**: Add after the `/api/doesthedogdie` endpoint (around line 126)

**Implementation**:

```javascript
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
            query: query
        });
        // Don't expose error details to client (security) - return generic error
        res.status(500).json({ error: 'Failed to fetch from DuckDuckGo' });
    }
});
```

**Key Points**:
- ✅ Uses existing `apiLimiter` for rate limiting (20 requests per 15 minutes)
- ✅ Uses existing `sanitizeServerInput()` for input validation
- ✅ Tries both query formats: `"{title} cancer"` and `"{title} movie cancer"`
- ✅ Combines results from both queries
- ✅ Returns structured JSON response
- ✅ Error handling that doesn't expose internal details

---

### Step 3: Create Client-Side DuckDuckGo Search Function

**File**: `script.js`

**Location**: Add new function after `searchWebForCancerContent()` (around line 2837)

**Implementation**:

```javascript
    async searchDuckDuckGoForCancerContent(query, type) {
        console.log(`🦆 Searching DuckDuckGo for cancer-related content: "${query}" (${type})`);
        
        // Check if we're running from file:// protocol (CORS will block this)
        if (window.location.protocol === 'file:') {
            console.log(`  ⚠️ CORS blocked: Running from file:// protocol`);
            return null;
        }
        
        try {
            const url = `/api/duckduckgo-search?q=${encodeURIComponent(query)}`;
            
            console.log(`  🔍 Fetching from DuckDuckGo via proxy...`);
            console.log(`  🔗 URL: ${url}`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                // If rate limited or server error, log to console for debugging, then fallback
                if (response.status === 429) {
                    console.error(`  🦆 DuckDuckGo: Rate limited (status ${response.status})`);
                } else {
                    console.error(`  🦆 DuckDuckGo: API request failed with status ${response.status}`);
                }
                // Return null to trigger fallback to pattern matching (no error shown to user)
                return null;
            }
            
            const data = await response.json();
            console.log(`  📊 DuckDuckGo response:`, data);
            
            if (!data.success || !data.combinedText || data.combinedText.length === 0) {
                console.log(`  🦆 DuckDuckGo: No results found`);
                return null;
            }
            
            // Analyze combined text for cancer-related terms
            const combinedText = data.combinedText.toLowerCase();
            
            // Check for cancer terms using existing CANCER_TERMS list
            const foundTerms = CANCER_TERMS.filter(term => 
                combinedText.includes(term.toLowerCase())
            );
            
            // Check if title mentions cancer
            const titleMentionsCancer = CANCER_TERMS.some(term => 
                query.toLowerCase().includes(term.toLowerCase())
            );
            
            // Count number of results mentioning cancer
            const resultsWithCancer = data.results.filter(result => {
                const resultText = result.text.toLowerCase();
                return CANCER_TERMS.some(term => resultText.includes(term.toLowerCase()));
            }).length;
            
            // Determine if cancer content exists
            const found = foundTerms.length > 0 || titleMentionsCancer || resultsWithCancer > 0;
            
            if (!found) {
                console.log(`  🦆 DuckDuckGo: No cancer content detected`);
                return {
                    found: false,
                    reason: 'No cancer-related terms found in DuckDuckGo search results',
                    confidence: 60
                };
            }
            
            // Calculate confidence based on signals
            let confidence = 60; // Base confidence
            
            if (titleMentionsCancer) {
                confidence = 95; // High confidence if title mentions cancer
            } else if (foundTerms.length >= 3) {
                confidence = 90; // High confidence if 3+ cancer terms found
            } else if (foundTerms.length >= 2 || resultsWithCancer >= 2) {
                confidence = 80; // Medium-high confidence if 2+ terms or 2+ results
            } else if (foundTerms.length === 1 || resultsWithCancer === 1) {
                confidence = 70; // Medium confidence if 1 term or 1 result
            }
            
            // Build reason string
            const reasons = [];
            if (titleMentionsCancer) {
                reasons.push('Title mentions cancer-related terms');
            }
            if (foundTerms.length > 0) {
                reasons.push(`Found ${foundTerms.length} cancer-related term(s): ${foundTerms.slice(0, 3).join(', ')}`);
            }
            if (resultsWithCancer > 0) {
                reasons.push(`${resultsWithCancer} search result(s) mention cancer`);
            }
            
            console.log(`  🎯 DuckDuckGo: Cancer content detected with ${confidence}% confidence`);
            console.log(`  📝 Reasons: ${reasons.join('; ')}`);
            
            return {
                found: true,
                reason: reasons.join('; '),
                confidence: confidence,
                foundTerms: foundTerms,
                resultsCount: resultsWithCancer
            };
            
        } catch (error) {
            // Log error to console for debugging (not shown to user)
            console.error('🦆 DuckDuckGo search error:', error);
            console.error('  Error details:', {
                message: error.message,
                stack: error.stack,
                query: query
            });
            // Return null to trigger fallback to pattern matching (silent fallback for user)
            return null;
        }
    }
```

**Key Points**:
- ✅ Uses existing `CANCER_TERMS` list for semantic analysis
- ✅ Checks title, snippets, and result count
- ✅ Calculates confidence based on signals (90%+ high, 70-89% medium, below 70% low)
- ✅ Returns null on error (triggers fallback)
- ✅ **Logs all errors to console for debugging** (using `console.error()`)
- ✅ **No errors shown to user** - silent fallback to pattern matching
- ✅ Logs detailed information for debugging (success cases and errors)

---

### Step 4: Integrate DuckDuckGo Search into Existing Flow

**File**: `script.js`

**Location**: Modify `searchWebForCancerContent()` function (around line 2765)

**Current Implementation**:
```javascript
async searchWebForCancerContent(query, type) {
    // ... pattern matching only ...
}
```

**New Implementation**:
```javascript
async searchWebForCancerContent(query, type) {
    console.log(`🌐 Searching web for cancer-related content: "${query}" (${type})`);
    
    // Check if we're running from file:// protocol (CORS will block this)
    if (window.location.protocol === 'file:') {
        console.log(`  ⚠️ CORS blocked: Running from file:// protocol`);
        return null;
    }
    
    try {
        // NEW: Try DuckDuckGo search first
        const duckDuckGoResult = await this.searchDuckDuckGoForCancerContent(query, type);
        
        if (duckDuckGoResult && duckDuckGoResult.found) {
            // DuckDuckGo found cancer content - return result
            console.log(`  ✅ DuckDuckGo search found cancer content`);
            return duckDuckGoResult;
        }
        
        // DuckDuckGo didn't find cancer content or failed - fallback to pattern matching
        console.log(`  🔄 Falling back to pattern matching...`);
        
        // EXISTING PATTERN MATCHING CODE (keep as-is)
        const queryLower = query.toLowerCase();
        
        // Check if the title contains cancer-related keywords (quick check)
        const cancerKeywords = [
            'cancer', 'leukemia', 'melanoma', 'oncology', 'tumor', 'tumour',
            'chemotherapy', 'chemo', 'radiation', 'terminal', 'illness',
            'sick', 'disease', 'medical', 'hospital', 'treatment',
            'survivor', 'battle', 'fight', 'journey', 'story',
            'terminal illness', 'terminal disease', 'end stage', 'advanced stage',
            'life expectancy', 'prognosis', 'months to live', 'weeks to live',
            'dying', 'death', 'mortality', 'fatal', 'incurable', 'untreatable',
            'hospice', 'end of life', 'final days', 'last days', 'deathbed',
            'chronic illness', 'serious illness', 'life-threatening', 'critical condition',
            'progressive disease', 'degenerative disease', 'fatal disease'
        ];
        
        const hasCancerKeywords = cancerKeywords.some(keyword => 
            queryLower.includes(keyword)
        );
        
        if (hasCancerKeywords) {
            console.log(`  🎯 Title contains cancer-related keywords`);
            return {
                found: true,
                reason: 'Title contains cancer-related keywords',
                confidence: 85
            };
        }
        
        // Check against common cancer-themed title patterns
        const cancerPatterns = [
            'fault in our stars', 'walk to remember', 'me before you',
            'sister\'s keeper', 'bucket list', 'big sick', 'lovely bones',
            'time traveler\'s wife', 'book thief', 'kite runner',
            'curious incident', 'life of pi', 'midnight library',
            'seven husbands', 'invisible life', 'art of racing'
        ];
        
        const matchesPattern = cancerPatterns.some(pattern => 
            queryLower.includes(pattern)
        );
        
        if (matchesPattern) {
            console.log(`  🎯 Title matches known cancer-themed pattern`);
            return {
                found: true,
                reason: 'Title matches known cancer-themed pattern',
                confidence: 90
            };
        }
        
        console.log(`  🌐 Web search: No obvious cancer content detected`);
        return {
            found: false,
            reason: 'No cancer-related keywords or patterns found',
            confidence: 60
        };
        
    } catch (error) {
        console.error('Web search error:', error);
        return null;
    }
}
```

**Key Points**:
- ✅ Tries DuckDuckGo first **within the web search function** (not first overall - web search runs after other APIs)
- ✅ Falls back to existing pattern matching if DuckDuckGo fails or finds nothing
- ✅ **Does NOT break existing functionality** - pattern matching always runs as fallback
- ✅ Returns same response format as before (backward compatible)

---

### Step 5: Move Web Search to Run After Other API Searches

**File**: `script.js`

**Location**: `searchMovie()` function (around line 2968)

**Current Code** (lines ~3006-3019):
```javascript
// Check Wikipedia cancer category for additional context
const wikipediaCancerCheck = await this.checkWikipediaCancerCategory(movie.title);

// Also search Wikipedia for detailed plot information
const wikipediaMovieInfo = await this.searchWikipediaMovie(movie.title);

// Search web for cancer-related content
const webSearchResult = await this.searchWebForCancerContent(movie.title, 'movie');  // ← Currently here

// Search IMDb Cancer Movies list
const imdbCancerResult = await this.searchIMDbCancerList(movie.title, exactMatch);

// Search DoesTheDogDie for movie content warnings
const dtddMovieResult = await this.searchDoesTheDogDie(movie.title, exactMatch, 'movie');
```

**Updated Code** (move web search to the end):
```javascript
// Check Wikipedia cancer category for additional context
const wikipediaCancerCheck = await this.checkWikipediaCancerCategory(movie.title);

// Also search Wikipedia for detailed plot information
const wikipediaMovieInfo = await this.searchWikipediaMovie(movie.title);

// Search IMDb Cancer Movies list
const imdbCancerResult = await this.searchIMDbCancerList(movie.title, exactMatch);

// Search DoesTheDogDie for movie content warnings
const dtddMovieResult = await this.searchDoesTheDogDie(movie.title, exactMatch, 'movie');

// Search web for cancer-related content (AFTER all other API searches)
const webSearchResult = await this.searchWebForCancerContent(movie.title, 'movie');  // ← Moved here
```

**Change Required**: Simply move the `webSearchResult` line to after `dtddMovieResult`. This ensures DuckDuckGo runs after all other API searches.

**Note**: This is a **simple reordering** - just moving one line of code. No massive code changes required.

---

### Step 6: Update Book Search (Optional - Currently Parallel)

**File**: `script.js`

**Location**: `searchBook()` function (around line 400+)

**Current Code**:
```javascript
const searchPromises = [
    this.withTimeout(this.searchGoogleBooks(query, exactMatch), timeoutMs, 'Google Books'),
    this.withTimeout(this.searchOpenLibrary(query, exactMatch), timeoutMs, 'Open Library'),
    this.withTimeout(this.searchDoesTheDogDie(query, exactMatch, 'book'), timeoutMs, 'DoesTheDogDie'),
    this.withTimeout(this.searchGoodreads(query, exactMatch), timeoutMs, 'Goodreads'),
    this.withTimeout(this.searchWikipedia(query, exactMatch), timeoutMs, 'Wikipedia'),
    this.withTimeout(this.searchStoryGraph(query, exactMatch), timeoutMs, 'StoryGraph'),
    this.withTimeout(this.searchWebForCancerContent(query, 'book'), timeoutMs, 'Web Search'),  // ← Currently in parallel
    this.withTimeout(this.searchTriggerWarningDatabase(query, exactMatch), timeoutMs, 'Trigger Warning Database')
];
```

**Options**:
1. **Keep parallel** (current behavior) - Web search runs at same time as other searches
2. **Make sequential** - Run web search after other searches complete (similar to movies)

**Recommendation**: For consistency with movies, you may want to make book search sequential too, but it's optional since parallel execution is also fine.

**If making sequential**:
```javascript
// Run other searches in parallel first
const [googleBooksData, openLibraryData, dtddData, goodreadsData, wikipediaData, storyGraphData, triggerWarningData] = await Promise.allSettled([
    this.withTimeout(this.searchGoogleBooks(query, exactMatch), timeoutMs, 'Google Books'),
    this.withTimeout(this.searchOpenLibrary(query, exactMatch), timeoutMs, 'Open Library'),
    this.withTimeout(this.searchDoesTheDogDie(query, exactMatch, 'book'), timeoutMs, 'DoesTheDogDie'),
    this.withTimeout(this.searchGoodreads(query, exactMatch), timeoutMs, 'Goodreads'),
    this.withTimeout(this.searchWikipedia(query, exactMatch), timeoutMs, 'Wikipedia'),
    this.withTimeout(this.searchStoryGraph(query, exactMatch), timeoutMs, 'StoryGraph'),
    this.withTimeout(this.searchTriggerWarningDatabase(query, exactMatch), timeoutMs, 'Trigger Warning Database')
]);

// Then run web search after other searches complete
const webSearchData = await this.withTimeout(this.searchWebForCancerContent(query, 'book'), timeoutMs, 'Web Search');
```

**Note**: This is optional - the parallel approach also works fine.

---

## Testing Strategy

### Test Cases

#### 1. Guardians of the Galaxy (2014)
- **Expected**: Should catch (mother dies of cancer)
- **Test**: Search for "Guardians of the Galaxy"
- **Verify**: Returns `found: true` with confidence >= 70%

#### 2. Guardians of the Galaxy Vol. 2 (2017)
- **Expected**: Should catch (continues cancer theme)
- **Test**: Search for "Guardians of the Galaxy Vol. 2"
- **Verify**: Returns `found: true` with confidence >= 70%

#### 3. My Oxford Year
- **Expected**: Should catch (already identified issue)
- **Test**: Search for "My Oxford Year"
- **Verify**: Returns `found: true` with confidence >= 70%

#### 4. The Fault in Our Stars
- **Expected**: Should still catch (baseline test - should not break)
- **Test**: Search for "The Fault in Our Stars"
- **Verify**: Returns `found: true` with confidence >= 70%

#### 5. Non-cancer Movies (False Positive Test)
- **Expected**: Should NOT catch
- **Test**: Search for "Inception", "The Matrix", "Interstellar"
- **Verify**: Returns `found: false` or confidence < 50%

### Manual Testing Steps

1. **Start the server**:
   ```bash
   node server.js
   ```

2. **Open browser console** and navigate to the website

3. **Test each case**:
   - Search for each test movie
   - Check console logs for DuckDuckGo search results
   - Verify final result (Safe vs Not Recommended)

4. **Check server logs**:
   - Verify DuckDuckGo API calls are being made
   - Check for any errors

5. **Test error handling**:
   - Stop server temporarily
   - Verify fallback to pattern matching works
   - Restart server and verify DuckDuckGo works again

### Automated Testing (Optional)

Create a test file `test-duckduckgo.js`:

```javascript
const fetch = require('node-fetch');

async function testDuckDuckGoSearch(title) {
    const url = `http://localhost:8080/api/duckduckgo-search?q=${encodeURIComponent(title)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`\nTest: ${title}`);
    console.log(`Success: ${data.success}`);
    console.log(`Results: ${data.results.length}`);
    console.log(`Combined Text Length: ${data.combinedText.length}`);
    
    // Check for cancer terms
    const cancerTerms = ['cancer', 'terminal', 'illness', 'tumor'];
    const foundTerms = cancerTerms.filter(term => 
        data.combinedText.toLowerCase().includes(term)
    );
    console.log(`Found Cancer Terms: ${foundTerms.join(', ') || 'none'}`);
}

// Run tests
(async () => {
    await testDuckDuckGoSearch('Guardians of the Galaxy');
    await testDuckDuckGoSearch('The Fault in Our Stars');
    await testDuckDuckGoSearch('Inception');
})();
```

---

## Error Handling

### Server-Side Errors

1. **DuckDuckGo API Failure**:
   - Logs full error details to console using `console.error()` (message, stack, query)
   - Returns `{ success: false, results: [] }`
   - Client will fallback to pattern matching
   - **No error details exposed to client** (security)

2. **Rate Limiting**:
   - Handled by `apiLimiter` middleware
   - Returns HTTP 429 status
   - Client logs error to console and falls back to pattern matching

3. **Invalid Query**:
   - Logs error to console for debugging
   - Returns HTTP 400 with generic error message
   - Client will fallback to pattern matching

**Note**: All server-side errors are logged to the server console with full details for debugging, but only generic error messages are returned to the client for security.

### Client-Side Errors

1. **Network Error**:
   - Logs error to console for debugging: `console.error('🦆 DuckDuckGo search error:', error)`
   - Returns `null`
   - Triggers fallback to pattern matching
   - **No error shown to user in UI** (silent fallback)

2. **Rate Limited**:
   - Logs error to console for debugging: `console.error('🦆 DuckDuckGo: Rate limited (status 429)')`
   - Returns `null`
   - Triggers fallback to pattern matching
   - **No error shown to user in UI** (silent fallback)

3. **Parse Error**:
   - Logs error to console for debugging with full details (message, stack, query)
   - Returns `null`
   - Triggers fallback to pattern matching
   - **No error shown to user in UI** (silent fallback)

**Note**: All errors are logged to the browser console using `console.error()` for debugging purposes, but the user experience remains seamless with automatic fallback to pattern matching.

---

## Performance Considerations

### Rate Limiting
- **Server**: 20 requests per 15 minutes per IP (existing `apiLimiter`)
- **DuckDuckGo API**: No official rate limit, but be respectful
- **Recommendation**: Current rate limiting is sufficient

### Caching
- **Decision**: No caching (as requested)
- **Reason**: Always want fresh results
- **Impact**: Each search makes API call (acceptable given rate limiting)

### Timeout
- **Recommendation**: Add 5-second timeout to DuckDuckGo fetch
- **Implementation**: Use `AbortController` or `Promise.race()`

```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

const response = await fetch(url, {
    signal: controller.signal,
    // ... other options
});

clearTimeout(timeoutId);
```

---

## Security Considerations

### Input Sanitization
- ✅ Uses existing `sanitizeServerInput()` function
- ✅ Limits query length to 200 characters
- ✅ Removes HTML tags and script content
- ✅ Removes control characters

### Rate Limiting
- ✅ Uses existing `apiLimiter` middleware
- ✅ Prevents abuse and DoS attacks
- ✅ Returns clear error messages

### Error Messages
- ✅ Generic error messages (don't expose internal details)
- ✅ Logs detailed errors to server console only

### CORS
- ✅ Server-side proxy handles CORS
- ✅ Client makes requests to same origin

---

## Monitoring & Debugging

### Server Logs
- Log all DuckDuckGo API requests
- Log response status and preview
- Log errors with full details

### Client Logs
- Log DuckDuckGo search attempts
- Log results and confidence scores
- Log fallback to pattern matching

### Debug Information
- Add to existing debug section in UI
- Show DuckDuckGo search results
- Show confidence calculation details

---

## Rollback Plan

If DuckDuckGo integration causes issues:

1. **Quick Fix**: Comment out DuckDuckGo call in `searchWebForCancerContent()`
2. **Revert**: `git revert` the commit
3. **Disable Endpoint**: Remove or comment out `/api/duckduckgo-search` endpoint

**Note**: Since DuckDuckGo is a fallback, existing functionality will continue to work even if DuckDuckGo fails.

---

## Future Enhancements

### Option B Implementation (If Option A Insufficient)

If DuckDuckGo Instant Answer API doesn't provide enough results:

1. **Add HTML Search Fallback**:
   - Parse DuckDuckGo HTML search results
   - Extract result titles and snippets
   - Combine with Instant Answer API results

2. **Library Alternative**:
   - Research `duckduckgo-search` npm package
   - Evaluate if it provides better results
   - Consider as alternative to HTML parsing

### Enhanced Confidence Scoring

- Add source quality weighting (Wikipedia > IMDb > random blog)
- Consider result position (first result more important)
- Factor in result count more heavily

### Caching (If Needed Later)

- Add Redis or in-memory cache
- Cache successful results for 24 hours
- Cache key: `duckduckgo:${query}`
- Invalidate on new search

---

## Checklist

### Implementation
- [ ] Add `/api/duckduckgo-search` endpoint to `server.js`
- [ ] Create `searchDuckDuckGoForCancerContent()` function in `script.js`
- [ ] Integrate DuckDuckGo search into `searchWebForCancerContent()`
- [ ] **Move web search to run AFTER other API searches** (Step 5 - simple reordering)
- [ ] (Optional) Update book search to run web search sequentially
- [ ] Test with all test cases
- [ ] Verify fallback to pattern matching works
- [ ] Check error handling (network errors, rate limits)
- [ ] Verify no existing functionality is broken

### Testing
- [ ] Test Guardians of the Galaxy (2014)
- [ ] Test Guardians of the Galaxy Vol. 2 (2017)
- [ ] Test My Oxford Year
- [ ] Test The Fault in Our Stars (baseline)
- [ ] Test non-cancer movies (false positive check)
- [ ] Test error scenarios (server down, rate limited)
- [ ] Test fallback to pattern matching

### Documentation
- [ ] Update `ARCHITECTURE.md` with new endpoint
- [ ] Update `README.md` if needed
- [ ] Add comments to code
- [ ] Document any gotchas or limitations

---

## Questions or Issues?

If you encounter issues during implementation:

1. **Check server logs** for DuckDuckGo API responses
2. **Check browser console** for client-side errors
3. **Verify rate limiting** isn't blocking requests
4. **Test with simple queries** first (e.g., "cancer")
5. **Verify network connectivity** to DuckDuckGo API

---

## Summary

This implementation adds DuckDuckGo search as an **additional** detection method that:
- ✅ Complements existing pattern matching
- ✅ Falls back gracefully if DuckDuckGo fails
- ✅ Uses existing `CANCER_TERMS` for semantic analysis
- ✅ Maintains backward compatibility
- ✅ Doesn't break existing functionality
- ✅ **Logs all errors to console for debugging** (both client and server)
- ✅ **No errors shown to users** - seamless fallback experience

**Error Logging Strategy**:
- **Server-side**: All errors logged to server console with full details (message, stack, query)
- **Client-side**: All errors logged to browser console with full details (message, stack, query)
- **User Experience**: Silent fallback to pattern matching - no error messages shown in UI
- **Debugging**: Developers can check console logs (browser or server) to diagnose issues

The integration is transparent to existing code - `searchWebForCancerContent()` now tries DuckDuckGo first, then falls back to pattern matching if needed.

