# Debug: "My Oxford Year" Investigation

## What Data Do We Actually Get?

### Step 1: Check Wikipedia Summary

**API Call**: `https://en.wikipedia.org/api/rest_v1/page/summary/My_Oxford_Year`

**Expected**: Plot summary that may contain cancer/illness content

**Questions**:
- Does it mention cancer explicitly?
- Does it mention "illness", "disease", "terminal", "sick"?
- Does it describe cancer themes without using the word "cancer"?

### Step 2: Check TMDB Overview

**API Call**: Search TMDB for "My Oxford Year", then get details

**Expected**: Movie overview that may contain cancer content

**Questions**:
- Does overview mention cancer?
- Does it mention illness/disease themes?
- Is overview too brief to include cancer content?

### Step 3: Check DoesTheDogDie

**API Call**: `/api/doesthedogdie?q=My%20Oxford%20Year`

**Expected**: DoesTheDogDie results

**Questions**:
- Is movie in DoesTheDogDie database?
- What trigger warnings does it have?
- Does it mention cancer-specific terms?

### Step 4: Manual Google Search

**Search**: "my oxford year movie cancer"

**Expected**: Multiple results discussing cancer content

**Questions**:
- What do these results say?
- Why didn't our "web search" catch this?

---

## Investigation Commands

### Test Wikipedia Summary Locally
```javascript
// In browser console on dev.laurenslist.org
const response = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/My_Oxford_Year');
const data = await response.json();
console.log('Wikipedia Summary:', data.extract);
```

### Test TMDB Search Locally
```javascript
// In browser console (replace YOUR_KEY with actual key)
const response = await fetch('https://api.themoviedb.org/3/search/movie?api_key=YOUR_KEY&query=My%20Oxford%20Year');
const data = await response.json();
console.log('TMDB Results:', data.results[0]?.overview);
```

### Test DoesTheDogDie Locally
```javascript
// In browser console on dev.laurenslist.org
const response = await fetch('/api/doesthedogdie?q=My%20Oxford%20Year');
const data = await response.json();
console.log('DoesTheDogDie:', data);
```

---

## Expected Findings

Based on the problem description:

1. **Wikipedia**: Probably has plot summary that mentions cancer, but we're not detecting it properly
2. **TMDB**: Overview likely doesn't mention cancer (too brief)
3. **DoesTheDogDie**: May have entry but doesn't use cancer-specific terms
4. **Web Search**: We're not actually searching, so we miss it entirely

---

## Action Items After Investigation

1. If Wikipedia has cancer content but we're not detecting it:
   - Improve semantic analysis to catch implied cancer content
   - Expand `CANCER_TERMS` with phrases like "battles illness", "terminal diagnosis"

2. If TMDB doesn't mention cancer:
   - Need Wikipedia to catch it (see #1)
   - Or implement real web search

3. If DoesTheDogDie has it but doesn't use cancer terms:
   - May need to adjust `CANCER_SPECIFIC_TERMS` logic
   - Or use DoesTheDogDie "content warnings" field more effectively

4. Always: Implement real web search to catch what other sources miss

