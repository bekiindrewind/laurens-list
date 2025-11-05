# Verify Dev Site is Working

## Quick Verification

```bash
# 1. Check container is running
docker ps | grep laurenslist-dev

# 2. Test internal connection
curl -I http://localhost:8080

# 3. Test via Traefik
curl -I https://dev.laurenslist.org

# 4. Check recent logs
docker logs root-laurenslist-dev-1 --tail 20
```

## Important Note

The server is using **environment variables** for API keys since `config.production.js` doesn't exist. 

**Make sure** `DOESTHEDOGDIE_API_KEY` is set in:
- Environment variables in docker-compose.yml (for dev), OR
- The file exists on the VPS (outside Git)

If the DoesTheDogDie API doesn't work, you may need to:
1. Add environment variables to `docker-compose.yml` for `laurenslist-dev`, OR
2. Create `config.production.js` on the VPS manually (it won't be committed to Git)

