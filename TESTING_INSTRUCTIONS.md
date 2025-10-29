# Testing the Experimental CORS Proxy Branch

## Overview
This experimental branch (`experiment/cors-proxy`) tests a server-side proxy to bypass CORS for Hardcover and DoesTheDogDie APIs.

## Testing on Your VPS (Without Affecting Production)

### Step 1: Save Current Production State
Your production site on `main` branch will continue running. We'll test the experimental branch separately.

### Step 2: Test the Experimental Branch

SSH into your VPS and run:

```bash
# Navigate to the project directory
cd /root/laurens-list

# Fetch the latest changes
git fetch origin

# Checkout the experimental branch
git checkout experiment/cors-proxy

# Make sure config.production.js has your API keys
# (It should already, but verify)
cat config.production.js

# Stop the current production container (temporarily)
cd /root
docker compose stop laurenslist

# Build the new experimental version
docker compose build laurenslist

# Start it
docker compose up -d laurenslist

# Check the logs to see if it's working
docker logs root-laurenslist-1 -f
```

### Step 3: Test the Site
Visit `https://srv1010721.hstgr.cloud` and try searching for a book that would use Hardcover or DoesTheDogDie APIs.

Check the browser console (F12) to see if:
- ✅ No CORS errors appear
- ✅ DoesTheDogDie and Hardcover API calls succeed
- ✅ Results are returned properly

### Step 4: Check Server Logs
The server logs will show proxy activity:
```bash
docker logs root-laurenslist-1 -f
```

Look for:
- "Proxy: Fetching from DoesTheDogDie..."
- "Proxy: Fetching from Hardcover..."
- Any error messages

### Step 5: Rollback if Needed

If the experiment doesn't work, easily rollback to production:

```bash
cd /root/laurens-list
git checkout main
cd /root
docker compose stop laurenslist
docker compose build laurenslist
docker compose up -d laurenslist
```

## Testing Locally (Optional)

If you want to test locally first:

```bash
# Make sure you're on the experimental branch
git checkout experiment/cors-proxy

# Install dependencies
npm install

# Make sure config.js has your API keys
# Then run the server
node server.js

# Visit http://localhost:8080
```

## What Changed?

- **server.js**: New Node.js Express server that proxies API requests
- **Dockerfile**: Changed from Python to Node.js
- **script.js**: Updated to use `/api/hardcover` and `/api/doesthedogdie` endpoints instead of direct API calls

## If It Works

Once you've tested and confirmed it works, you can merge this branch into `main`:
```bash
git checkout main
git merge experiment/cors-proxy
git push origin main
```

## If It Doesn't Work

Simply delete the branch:
```bash
git checkout main
git branch -D experiment/cors-proxy
git push origin --delete experiment/cors-proxy  # if you pushed it
```

Production will continue running on `main` branch unchanged.

