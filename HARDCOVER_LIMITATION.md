# Hardcover API Limitation

## Issue
Hardcover API (`hardcover.app/api/graphql`) is **not available** in this application due to Cloudflare bot protection.

## Why It Doesn't Work
- Hardcover's API endpoint is protected by Cloudflare
- Cloudflare requires JavaScript execution in a browser to complete challenges
- Server-side Node.js requests cannot execute JavaScript like a browser can
- The API returns a 403 Forbidden with a "Just a moment..." Cloudflare challenge page

## Attempted Solutions
1. ✅ Added browser-like headers (User-Agent, Accept, Origin, Referer) - **Failed**
2. ✅ Tried direct browser calls - **Failed** (CORS restrictions)
3. ✅ Server-side proxy with headers - **Failed** (Cloudflare detects and blocks)

## Current Status
- Hardcover has been **removed** from the application
- All Hardcover-related code has been cleaned up
- Console logs now indicate "Hardcover: ⚠️ Not available (blocked by Cloudflare protection)"

## Alternatives
The application still uses these working data sources:
- ✅ Google Books API
- ✅ Open Library
- ✅ DoesTheDogDie
- ✅ Goodreads (via scraping)
- ✅ Wikipedia
- ✅ The StoryGraph (via scraping)
- ✅ Web search for cancer-related terms

## Future Considerations
If Hardcover support is needed in the future, options would include:
1. Use a headless browser (Puppeteer/Playwright) - resource-intensive, may still be blocked
2. Contact Hardcover to request API access that bypasses Cloudflare
3. Use a browser extension that makes the calls client-side
4. Accept this limitation and rely on the other 6 data sources

