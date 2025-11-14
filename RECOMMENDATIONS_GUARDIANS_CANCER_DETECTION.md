# Recommendations: Catching Movies with Cancer Content Not in Wikipedia/TMDB

## Problem Statement

**Guardians of the Galaxy** (1 & 2) and similar movies are being marked as "Safe" despite containing cancer-related plot points. The issue is:

- ✅ **Google search AI summaries** mention cancer (e.g., "Peter Quill's mother dies of cancer")
- ❌ **Wikipedia plot summaries** don't explicitly mention "cancer" (may say "dies of illness" or "terminal illness")
- ❌ **TMDB overviews** are often too brief and don't mention cancer explicitly
- ❌ **Current web search** (`searchWebForCancerContent`) doesn't actually search - only checks title keywords

## Current Detection Gaps

### 1. **Web Search is Not Actually Searching** ❌
- Current `searchWebForCancerContent()` only checks if title contains cancer keywords
- Does NOT perform actual web search due to CORS restrictions
- Cannot access Google search results or AI summaries

### 2. **Wikipedia/TMDB May Use Euphemisms** ❌
- May say "dies of illness" instead of "dies of cancer"
- May say "terminal illness" without specifying cancer
- May say "battles disease" without mentioning cancer type
- Current term matching requires exact "cancer" mentions

### 3. **DoesTheDogDie May Not Have Entry** ❌
- Not all movies are in DoesTheDogDie database
- Even if present, may not have cancer-specific warnings

### 4. **Curated Lists Are Incomplete** ❌
- IMDb Cancer Movies list requires manual curation
- Wikipedia Cancer Category requires manual categorization
- Will miss movies not yet added to these lists

---

## Recommended Solutions

### Solution 1: Real Web Search via Server Proxy ⭐ **HIGHEST PRIORITY**

**Why This Solves the Problem:**
- Google search results and AI summaries often mention cancer even when Wikipedia doesn't
- If people are searching "{title} cancer", that's a strong signal
- Can catch content that other sources miss

**Implementation Approach:**
1. **Use Google Custom Search API or SerpApi**
   - Google Custom Search API: Free tier (100 queries/day)
   - SerpApi: Paid but more reliable, better parsing
   - Alternative: DuckDuckGo API (free, no API key needed)

2. **Create Server-Side Endpoint** (`/api/websearch`)
   - Add to `server.js` (similar to existing `/api/doesthedogdie`)
   - Search for: `"{title}" cancer` or `"{title}" movie cancer`
   - Parse results to detect cancer mentions
   - Return confidence score based on:
     - Number of results mentioning cancer
     - Prominence of cancer mentions (title, snippet, etc.)
     - Quality of sources (Wikipedia, IMDb, review sites)

3. **Update Client-Side Function**
   - Modify `searchWebForCancerContent()` in `script.js`
   - Call `/api/websearch` instead of pattern matching
   - Use results to determine if cancer content exists

**Pros:**
- ✅ Actually searches the web (what users expect)
- ✅ Can catch content Google knows about but other sources don't
- ✅ Natural detection (if people search "{title} cancer", that's a signal)
- ✅ Works for edge cases like Guardians of the Galaxy

**Cons:**
- ⚠️ Requires API key (Google Custom Search or SerpApi)
- ⚠️ API costs (usually free tier available)
- ⚠️ May be slower than current checks (add timeout)
- ⚠️ Rate limiting needed (already have infrastructure)

**Estimated Implementation Time:** 2-3 hours

---

### Solution 2: Enhanced Wikipedia Full Page Analysis

**Why This Helps:**
- Wikipedia full pages often have more detail than summaries
- May mention cancer in character sections, plot details, or themes
- Current implementation only uses summary/extract

**Implementation Approach:**
1. **Fetch Full Wikipedia Page Content**
   - Use Wikipedia API to get full page text (not just extract)
   - Parse all sections: Plot, Characters, Themes, Reception

2. **Search Full Content for Cancer Terms**
   - Check entire page text, not just summary
   - Look for cancer mentions in character descriptions
   - Check "Themes" or "Plot" sections more thoroughly

3. **Improve Wikipedia Search Logic**
   - Current `searchWikipediaMovie()` may not find the right page
   - Try multiple search strategies:
     - Direct page: `{title}_(film)`
     - Search API with disambiguation
     - Check for "(film)" suffix variations

**Pros:**
- ✅ No external API needed (uses existing Wikipedia API)
- ✅ Can find cancer mentions in full page content
- ✅ Works with existing data source

**Cons:**
- ⚠️ May still miss if Wikipedia doesn't mention cancer explicitly
- ⚠️ More data to parse (slower)
- ⚠️ Won't help if Wikipedia truly doesn't mention cancer

**Estimated Implementation Time:** 1-2 hours

---

### Solution 3: Google AI Overview/Summary API

**Why This Solves the Problem:**
- Google AI summaries often mention cancer even when Wikipedia doesn't
- User specifically mentioned "Google search AI summary reveals cancer"
- This is the exact source that has the information

**Implementation Approach:**
1. **Research Available APIs:**
   - Google Search API (if available)
   - SerpApi (has AI summary extraction)
   - Google Generative AI API (for summaries)
   - Alternative: Scrape Google search results (not recommended, fragile)

2. **Extract AI Summary from Search Results:**
   - Search for `"{title}" movie`
   - Extract AI-generated summary/overview
   - Parse for cancer mentions

3. **Use as Additional Data Source:**
   - Combine with other sources
   - High confidence if AI summary explicitly mentions cancer
   - Lower confidence if only implied

**Pros:**
- ✅ Directly addresses user's observation (Google AI summaries have the info)
- ✅ Can catch content that Wikipedia/TMDB miss
- ✅ Natural language understanding (AI summaries are comprehensive)

**Cons:**
- ⚠️ May require paid API (SerpApi)
- ⚠️ Google doesn't have official "AI summary" API
- ⚠️ May need to scrape (fragile, against ToS)
- ⚠️ AI summaries may change over time

**Estimated Implementation Time:** 3-4 hours (research + implementation)

---

### Solution 4: User Reporting System

**Why This Helps:**
- Users are already reporting these cases (Guardians of the Galaxy)
- Can build a database of user-reported cancer content
- Complements automated detection

**Implementation Approach:**
1. **Add "Report Missing Cancer Content" Button**
   - On results page, if marked "Safe"
   - Allow users to report if cancer content exists
   - Collect: Title, Type (movie/book), Reason

2. **Store Reports in Database**
   - Simple JSON file or database
   - Track: Title, Type, Report Count, Confidence

3. **Use Reports in Detection Logic**
   - If multiple users report same title, flag as "Not Recommended"
   - Show: "Reported by X users as containing cancer content"
   - Manual review process for high-report titles

**Pros:**
- ✅ Leverages user knowledge
- ✅ Can catch edge cases automated systems miss
- ✅ Builds community-driven database

**Cons:**
- ⚠️ Requires moderation (prevent abuse)
- ⚠️ Not immediate (needs multiple reports)
- ⚠️ Requires database/storage infrastructure

**Estimated Implementation Time:** 4-6 hours (UI + backend + moderation)

---

### Solution 5: Enhanced Semantic Analysis of Existing Sources

**Why This Helps:**
- Wikipedia/TMDB may say "terminal illness" or "dies of illness" without "cancer"
- Current system requires exact "cancer" term matches
- Can catch implied cancer content

**Implementation Approach:**
1. **Expand Cancer Term Detection:**
   - Already have `CANCER_TERMS` array with implied phrases
   - Add more context-aware patterns:
     - "mother dies of" + "illness" → likely cancer
     - "terminal" + "diagnosis" → likely cancer
     - "battles" + "disease" + character death → likely cancer

2. **Improve Pattern Matching:**
   - Current: Simple `includes()` checks
   - Enhanced: Multi-word phrase matching with context
   - Example: "mother dies of terminal illness" → flag as cancer

3. **Confidence Scoring:**
   - High confidence: Explicit "cancer" mention
   - Medium confidence: "terminal illness" + death
   - Low confidence: Just "illness" mention

**Pros:**
- ✅ No external API needed
- ✅ Works with existing data sources
- ✅ Can catch implied cancer content

**Cons:**
- ⚠️ May have false positives
   - Not all "terminal illness" = cancer
   - Not all "mother dies of illness" = cancer
- ⚠️ Requires careful curation of patterns
- ⚠️ Still won't help if Wikipedia truly doesn't mention illness at all

**Estimated Implementation Time:** 1-2 hours (already partially implemented)

---

## Recommended Implementation Order

### Phase 1: Quick Win (1-2 hours)
1. **Enhanced Wikipedia Full Page Analysis** (Solution 2)
   - May catch Guardians of the Galaxy if Wikipedia mentions it in full page
   - Low risk, uses existing infrastructure

### Phase 2: High Impact (2-3 hours)
2. **Real Web Search via Server Proxy** (Solution 1)
   - Highest priority - directly addresses the problem
   - Can catch content that Google knows about
   - Requires API key setup

### Phase 3: Long-term (4-6 hours)
3. **User Reporting System** (Solution 4)
   - Complements automated detection
   - Builds community database
   - Requires more infrastructure

### Phase 4: Research & Evaluate (3-4 hours)
4. **Google AI Summary API** (Solution 3)
   - Research available options
   - Evaluate cost/benefit
   - Implement if viable

---

## Specific Recommendations for Guardians of the Galaxy

### Immediate Actions (No Code Changes):
1. **Add to Known Cancer Content List**
   - Add "Guardians of the Galaxy" (2014) to `CANCER_THEMED_CONTENT.movies`
   - Add "Guardians of the Galaxy Vol. 2" (2017) to `CANCER_THEMED_CONTENT.movies`
   - Reason: "Peter Quill's mother dies of cancer"

### Long-term Solution:
2. **Implement Real Web Search** (Solution 1)
   - This will catch future cases like this automatically
   - No need to manually add every movie

---

## Testing Strategy

### Test Cases:
1. **Guardians of the Galaxy** (2014) - Should catch (mother dies of cancer)
2. **Guardians of the Galaxy Vol. 2** (2017) - Should catch (continues cancer theme)
3. **My Oxford Year** - Should catch (already identified issue)
4. **The Fault in Our Stars** - Should still catch (baseline test)
5. **Non-cancer movies** - Should not false positive

### Validation:
- Test with real Google search results
- Verify Wikipedia full page analysis finds mentions
- Check that user reports are captured correctly

---

## Cost Considerations

### Free Options:
- **DuckDuckGo API**: Free, no API key needed
- **Google Custom Search API**: Free tier (100 queries/day)
- **Wikipedia API**: Free, unlimited

### Paid Options:
- **SerpApi**: ~$50/month for 5,000 searches
- **Google Generative AI API**: Pay-per-use

### Recommendation:
- Start with **Google Custom Search API** (free tier)
- Upgrade to **SerpApi** if free tier is insufficient
- Consider **DuckDuckGo** as free alternative

---

## Next Steps

1. **Research**: Investigate Google Custom Search API vs SerpApi vs DuckDuckGo
2. **Decide**: Choose web search API based on cost/features
3. **Implement**: Start with Solution 1 (Real Web Search) - highest impact
4. **Test**: Validate with Guardians of the Galaxy and other edge cases
5. **Iterate**: Add Solution 2 (Enhanced Wikipedia) if needed

---

## Notes

- The goal is **natural detection**, not manual list maintenance
- We want to catch content that **people would naturally associate with cancer**
- If Google search results show "{title} cancer", that's a strong signal
- Wikipedia and TMDB summaries may use euphemisms ("battles illness") instead of explicit terms
- User reports are valuable but should complement, not replace, automated detection

