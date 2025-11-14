# DuckDuckGo Search Implementation - Questions

Please answer these questions inline to guide the implementation:

## 1. API/Library Preference

**Question:** Which approach should we use for DuckDuckGo search?

- [ ] **Option A:** DuckDuckGo Instant Answer API (official, but limited results)
- [ ] **Option B:** Use a library like `duckduckgo-search` (more results, unofficial)
- [ ] **Option C:** Scrape DuckDuckGo HTML directly (most flexible, but fragile)

**Your Answer:**
Let's start with Option A, but if results aren't great maybe we try OPtion B or a combination of both.
---

## 2. Search Query Format

**Question:** What search query format should we use?

- [ ] **Option A:** `"{title}" cancer` (simple)
- [ ] **Option B:** `"{title}" movie cancer` (more specific)
- [ ] **Option C:** Try both and combine results (most thorough)
- [ ] **Option D:** Other format: _______________

**Your Answer:**
OPtion C
---

## 3. Integration Approach

**Question:** How should this integrate with the existing code?

- [ ] **Option A:** Replace the current `searchWebForCancerContent()` entirely
- [ ] **Option B:** Add as a new function and call it from the existing one
- [ ] **Option C:** Keep current pattern matching as a fallback if DuckDuckGo fails
- [ ] **Option D:** Other approach: _______________

**Your Answer:**
Option C - I want this to be an additional search and not change existing functionality. If Duckduckgo fails I want the search to still run through all of the existing processes.
---

## 4. Result Parsing & Confidence Scoring

**Question:** How should we determine if cancer content exists and assign confidence?

**What signals indicate cancer content?**
- [ ] Title mentions cancer
- [ ] Snippet/description mentions cancer
- [ ] Number of results mentioning cancer
- [ ] Source quality (Wikipedia, IMDb, etc.)
- [ ] Other: _______________

**Confidence thresholds:**
- High confidence (90%+): _______________
- Medium confidence (70-89%): _______________
- Low confidence (50-69%): _______________

**Your Answer:**
I want it to be flagged as Not Recommended if any of the following:

The title mentions cancer 
snippet/description mentions cancer or terminal illness (we can re-use the list of semantic search terms we are already using for this) - if this is unclear ask for more information or search the code-base. We search for more than just the word "cancer" and I want to use that in this search as well.
high number of results matching cancer

Those confidence thresholds above look good. 90%+ is high confidence, 70-89% is mediaum, and below 70 is low.
---

## 5. Error Handling & Performance

**Question:** How should we handle errors and optimize performance?

**If DuckDuckGo fails:**
- [ ] Fall back to current pattern matching
- [ ] Return null/undefined
- [ ] Retry with different query format
- [ ] Other: _______________

**Caching:**
- [ ] Cache results to reduce API calls (how long? _______________)
- [ ] No caching (always fresh results)
- [ ] Cache only successful results

**Rate limiting:**
- [ ] Add rate limiting to prevent abuse
- [ ] No rate limiting needed
- [ ] Other: _______________

**Your Answer:**
if duckduckgo fails, fall back to current pattern matching, but not in the log that duckduckgo failed.

Don't cache results.

add rate limiting.
---

## 6. Server Endpoint

**Question:** How should we structure the server-side endpoint?

- [ ] **Option A:** Create `/api/duckduckgo-search` similar to `/api/doesthedogdie`
- [ ] **Option B:** Integrate into existing endpoint
- [ ] **Option C:** Other: _______________

**Endpoint parameters:**
- Query parameter name: `q` (like existing endpoints) or `title` or other: _______________
- Response format: JSON with `{ found: boolean, reason: string, confidence: number }` or other: _______________

**Your Answer:**
What do you recommend? I want to keep this piece somewhat separate so that it doesn't break exsting code structure. so if that means doing Option A, let's do that.

For endpoint parameters I don't have a preference. whatever you think works best.
---

## 7. Testing Strategy

**Question:** What test cases should we validate?

**Test cases to verify:**
- [ ] **Guardians of the Galaxy** (2014) - Should catch (mother dies of cancer)
- [ ] **Guardians of the Galaxy Vol. 2** (2017) - Should catch (continues cancer theme)
- [ ] **My Oxford Year** - Should catch (already identified issue)
- [ ] **The Fault in Our Stars** - Should still catch (baseline test - should not break)
- [ ] **Non-cancer movies** - Should not false positive (e.g., _______________)
- [ ] **Other test cases:** _______________

**Your Answer:**
let's etst with all of your recommendations above -Guardians of the Galaxy, Guardians of the Galaxy Vol. 2, My Oxford Year, The Fault in Our Stars, and non-cancer movies to test for false positives. 
---

## 8. Additional Considerations

**Question:** Any other requirements or considerations?

**Your Answer:**
I DO NOT want this new functionality to break existing functionality. I want this to be just one additional search that can be used to catch unsafe content. I don't want it to interfere with functionality that already exists.
---

## Notes

- This document is temporary and will be used to create the implementation guide
- Delete this file after the implementation guide is created

