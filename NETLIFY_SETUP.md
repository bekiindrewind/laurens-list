# Netlify Environment Variables Setup

## 🔧 **Step 2: Add Environment Variables in Netlify**

1. **Go to your Netlify dashboard**
2. **Click on your site** (Lauren's List)
3. **Go to Site settings** → **Environment variables**
4. **Add these variables**:

### Required Environment Variables:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `TMDB_API_KEY` | `58223110ff42b7ab06b12b3460897091` | The Movie Database API key |
| `GOOGLE_BOOKS_API_KEY` | `AIzaSyA364ogCHimNNjIbbCKv7Tnsxx6eQ35IKw` | Google Books API key |
| `HARDCOVER_BEARER_TOKEN` | `eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJIYXJkY292ZXIiLCJ2ZXJzaW9uIjoiOCIsImp0aSI6IjY3NzAxOTVjLWUxZTItNGM5NS1hNjUyLTgxOTI2MTIxYjIzZCIsImFwcGxpY2F0aW9uSWQiOjIsInN1YiI6IjUxNTk2IiwiYXVkIjoiMSIsImlkIjoiNTE1OTYiLCJsb2dnZWRJbiI6dHJ1ZSwiaWF0IjoxNzYxMjY2MzQyLCJleHAiOjE3OTI4MDIzNDIsImh0dHBzOi8vaGFzdXJhLmlvL2p3dC9jbGFpbXMiOnsieC1oYXN1cmEtYWxsb3dlZC1yb2xlcyI6WyJ1c2VyIl0sIngtaGFzdXJhLWRlZmF1bHRyb2xlIjoidXNlciIsIlgtaGFzdXJhLXVzZXItaWQiOiI1MTU5NiJ9LCJ1c2VyIjp7ImlkIjo1MTU5Nn19.j32_IEwRbU3qq4l7E3-7kvcvJminBFdRbousSM4z7I8` | Hardcover API Bearer token |
| `DOESTHEDOGDIE_API_KEY` | `fb1ce9d557e74a9544cf0385263efa30` | DoesTheDogDie API key |

## 🚀 **Step 3: Redeploy**

After adding the environment variables:
1. **Go to Deploys** tab in Netlify
2. **Click "Trigger deploy"** → **"Deploy site"**
3. **Wait for build to complete**

## ✅ **Step 4: Test**

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
