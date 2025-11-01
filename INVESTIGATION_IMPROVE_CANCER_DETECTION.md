# Investigation: Improving Cancer Content Detection

## Problem Statement

"My Oxford Year" (movie) was marked as **safe** by the system, but when searching Google for "my oxford year movie cancer", there are many results indicating the movie contains cancer content.

**Goal**: Understand why this was missed and investigate natural ways to catch this in the future, rather than just adding it to a known list.

---

## Current Detection Methods

### 1. **Web Search Analysis** (`searchWebForCancerContent`)
**Status**: ❌ **NOT ACTUALLY SEARCHING**

**Current Implementation**:
- Does NOT perform actual web search due to CORS restrictions
- Only checks if title contains cancer keywords (e.g., "cancer", "leukemia" in title)
- Only checks if title matches known patterns (e.g., "Fault in Our Stars")

**Problem**: "My Oxford Year" has no cancer keywords in its title, so it passes this check.

**Code Location**: `script.js` lines 2249-2328

### 2. **Wikipedia Plot Summary Analysis**
**Status**: ✅ Collects data, ❓ May not detect implied cancer content

**Current Implementation**:
- Searches Wikipedia for movie page
- Extracts plot summary (`extract` field)
- Checks for exact cancer term matches in text

**Potential Issue**: 
- If Wikipedia mentions "battles illness", "terminal diagnosis", "battles disease" but doesn't explicitly say "cancer", we miss it
- The plot summary might describe cancer-related themes without using exact cancer terminology

**Code Location**: `script.js` lines 1830-1965 (Wikipedia search), 2782-2812 (term analysis)

### 3. **TMDB Overview Analysis**
**Status**: ✅ Collects data, ❓ May not detect implied cancer content

**Current Implementation**:
- Gets movie overview from TMDB
- Checks for exact cancer term matches

**Potential Issue**: 
- TMDB overviews are often brief and may not mention cancer explicitly
- May describe themes without specific terminology

**Code Location**: `script.js` lines 2467-2570 (TMDB search)

### 4. **DoesTheDogDie**
**Status**: ✅ Works for some content

**Current Implementation**:
- Searches DoesTheDogDie API
- Checks for cancer-specific terms (not generic "death", "dying")

**Potential Issue**: May not have entry for all cancer-themed movies

### 5. **IMDb Cancer Movies List**
**Status**: ✅ Works if movie is in curated list

**Current Implementation**:
- Scrapes IMDb Cancer Movies list
- Checks if title matches

**Potential Issue**: Only catches movies that someone manually added to the list

### 6. **Wikipedia Cancer Category**
**Status**: ✅ Works if movie is categorized

**Current Implementation**:
- Checks Wikipedia category for cancer-related films

**Potential Issue**: May not catch all cancer-themed movies

---

## Why "My Oxford Year" Was Missed

Based on the analysis:

1. **Web Search**: Not actually searching - only checks title keywords ❌
2. **Wikipedia**: May have found the page but plot summary might not contain exact cancer terms ❌
3. **TMDB**: Overview likely doesn't mention cancer explicitly ❌
4. **DoesTheDogDie**: May not have entry or doesn't have cancer-specific terms ✅/❌
5. **IMDb Cancer List**: Not in curated list ❌
6. **Wikipedia Category**: May not be categorized ❌

---

## Proposed Solutions

### Solution 1: Real Web Search via Server Proxy ⭐ **RECOMMENDED**

**Implementation**:
- Create server-side endpoint `/api/websearch` that uses Google Custom Search API or SerpApi
- Search for `"{title}" cancer` or `"{title}" movie cancer`
- Parse results to detect if multiple results mention cancer content
- Return confidence score based on number of results

**Pros**:
- Actually searches the web (what user expects)
- Can catch content that Google knows about but our other sources don't
- More natural detection (if people are searching "{title} cancer", that's a signal)

**Cons**:
- Requires API key for Google Custom Search or SerpApi
- API costs (usually free tier available)
- May be slower than current checks

**Code Changes**:
- `server.js`: Add `/api/websearch` endpoint
- `script.js`: Update `searchWebForCancerContent` to call proxy instead of pattern matching

### Solution 2: Enhanced Semantic Analysis

**Implementation**:
- Expand `CANCER_TERMS` to include implied cancer phrases:
  - "battles illness"
  - "terminal diagnosis"
  - "medical condition"
  - "life-threatening disease"
  - "serious illness"
  - etc.
- Use more sophisticated pattern matching (e.g., regex for "diagnosed with [disease]", "fights [disease]")

**Pros**:
- No external API needed
- Can catch implied cancer content in Wikipedia/TMDB summaries
- Works with existing data sources

**Cons**:
- May have false positives (not all "battles illness" = cancer)
- Requires careful curation of terms

**Code Changes**:
- `script.js`: Expand `CANCER_TERMS` array
- Add phrase matching logic

### Solution 3: Wikipedia Full Page Content Analysis

**Implementation**:
- Instead of just using Wikipedia summary, fetch full page content
- Parse the full article for cancer-related sections
- Check for infobox entries about "themes" or "subject matter"

**Pros**:
- Wikipedia often has more detailed information than summaries
- Can find cancer mentions in full plot sections

**Cons**:
- Larger data to parse
- May require HTML parsing (more complex)

**Code Changes**:
- `script.js`: Fetch full Wikipedia page via API
- Parse HTML or use Wikipedia API to get sections

### Solution 4: Hybrid Approach (Recommended)

**Combine Solutions 1 + 2**:
1. First, enhance semantic analysis to catch implied cancer content in existing sources
2. Add real web search as a secondary check for cases where other sources don't mention cancer

**Benefits**:
- Fast pattern matching for obvious cases
- Web search for edge cases like "My Oxford Year"
- Best of both worlds

---

## Test Cases

### Current Failure Case
- **Title**: "My Oxford Year"
- **Type**: Movie
- **Result**: ✅ Safe (INCORRECT)
- **Expected**: ❌ Not Recommended

### Test Cases to Validate Fixes

1. **"The Fault in Our Stars"** - Should catch (has "cancer" in plot)
2. **"Me Before You"** - Should catch (implied terminal illness)
3. **"My Oxford Year"** - Should catch (web search would find it)
4. **"The Notebook"** - Should catch if we improve semantic analysis
5. **"Five Feet Apart"** - Should catch (implied serious illness)

---

## Implementation Plan

### Phase 1: Enhanced Semantic Analysis (Quick Win)
- [ ] Expand `CANCER_TERMS` with implied cancer phrases
- [ ] Add phrase pattern matching
- [ ] Test with "My Oxford Year" Wikipedia summary

### Phase 2: Real Web Search (More Complex)
- [ ] Research Google Custom Search API or SerpApi
- [ ] Set up API key
- [ ] Implement server-side proxy endpoint
- [ ] Update client-side `searchWebForCancerContent` to use proxy
- [ ] Add rate limiting
- [ ] Test with "My Oxford Year"

### Phase 3: Validation
- [ ] Test with known cancer movies (should still catch)
- [ ] Test with non-cancer movies (should not false positive)
- [ ] Test with edge cases like "My Oxford Year"

---

## Next Steps

1. **Investigate**: Check what Wikipedia and TMDB actually say about "My Oxford Year"
   - What does the Wikipedia plot summary contain?
   - What does the TMDB overview say?
   - Would enhanced semantic analysis catch it?

2. **Research**: Look into Google Custom Search API or SerpApi
   - Pricing/free tier
   - Setup requirements
   - Example implementations

3. **Implement**: Start with Solution 2 (Enhanced Semantic Analysis) as it's simpler, then add Solution 1 (Real Web Search) if needed

---

## Notes

- The goal is **natural detection**, not manual list maintenance
- We want to catch content that **people would naturally associate with cancer**
- If Google search results show "{title} cancer", that's a strong signal
- Wikipedia and TMDB summaries may use euphemisms ("battles illness") instead of explicit terms

