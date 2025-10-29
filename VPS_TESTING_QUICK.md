# Quick Test & Rollback Instructions

## To Test the Experimental Branch

SSH into your VPS and run these commands:

```bash
# Navigate to the project
cd /root/laurens-list

# Fetch the latest changes
git fetch origin

# Switch to experimental branch
git checkout experiment/cors-proxy

# Verify config.production.js has your API keys (it should already)
cat config.production.js | grep DOESTHEDOGDIE_API_KEY

# Stop production (site will be down briefly)
cd /root
docker compose stop laurenslist

# Build experimental version
docker compose build laurenslist

# Start experimental version
docker compose up -d laurenslist

# Watch logs to see if it starts successfully
docker logs root-laurenslist-1 -f
# (Press Ctrl+C to exit logs)
```

## Testing the Site

1. Visit `https://srv1010721.hstgr.cloud`
2. Open browser console (F12)
3. Try searching for a book (e.g., "The Fault in Our Stars")
4. Check console for:
   - ✅ No CORS errors
   - ✅ DoesTheDogDie and Hardcover API calls working
   - ✅ Results returned successfully

## Check Server Logs

```bash
docker logs root-laurenslist-1 -f
```

Look for:
- "Lauren's List server running on port 8080"
- "Proxy: Fetching from DoesTheDogDie..."
- "Proxy: Fetching from Hardcover..."
- Any error messages

## If It Works ✨

Merge the experimental branch into main:

```bash
cd /root/laurens-list
git checkout main
git merge experiment/cors-proxy
git push origin main

# Rebuild production with the working code
cd /root
docker compose stop laurenslist
docker compose build laurenslist
docker compose up -d laurenslist
```

## If It Doesn't Work ❌

Quickly rollback to production:

```bash
cd /root/laurens-list
git checkout main

# Rebuild production
cd /root
docker compose stop laurenslist
docker compose build laurenslist
docker compose up -d laurenslist

# Verify production is back
docker logs root-laurenslist-1 -f
```

The site should be back to normal within 2-3 minutes.

