# Netlify Environment Variables Setup

## 🔧 **Add Environment Variables in Netlify**

1. **Go to your Netlify dashboard**
2. **Click on your site** (Lauren's List)
3. **Go to Site settings** → **Environment variables**
4. **Add these 4 variables**:

### Required Environment Variables:

| Variable Name | Description |
|---------------|-------------|
| `TMDB_API_KEY` | The Movie Database API key |
| `GOOGLE_BOOKS_API_KEY` | Google Books API key |
| `HARDCOVER_BEARER_TOKEN` | Hardcover API Bearer token |
| `DOESTHEDOGDIE_API_KEY` | DoesTheDogDie API key |

## 🚀 **Redeploy**

After adding the environment variables:
1. **Go to Deploys** tab in Netlify
2. **Click "Trigger deploy"** → **"Deploy site"**
3. **Wait for build to complete**

## ✅ **Expected Results**

Once deployed, your site should:
- ✅ Load without 404 errors
- ✅ Use real API keys (not demo mode)
- ✅ Show all 5 APIs working in console
- ✅ Provide comprehensive cancer detection

## 🔍 **Verification**

Check the browser console for:
- `✅ API keys loaded from build process (deployed)`
- All APIs showing "✅ Found" instead of "❌ No results"
- Real data from Hardcover, DoesTheDogDie, and Goodreads
