# Troubleshooting: No Recommendations on Frontend

## Quick Diagnostic Steps

### 1. Check Browser Console

Open your deployed site on Netlify and check the browser console (F12 or Right-click → Inspect → Console tab):

**Look for:**
- Errors related to API calls
- Messages like "Failed to fetch recommendations"
- CORS errors
- Network errors

**What to look for:**
```
✅ Good: "Search response:", "Found recommendations: X"
❌ Bad: "Failed to fetch", "Network error", "CORS error"
```

### 2. Check Network Tab

In browser DevTools → Network tab:
- Filter by "Fetch/XHR"
- Try searching/loading recommendations
- Check if API calls are being made
- Check the URL being called
- Check response status (200 = good, 400/500 = error)

**Expected API call:**
- URL should be: `https://your-backend.onrender.com/search` (NOT localhost)
- Status should be: `200 OK`
- Response should have JSON data

### 3. Verify Netlify Environment Variable

1. Go to Netlify Dashboard → Your Site
2. **Site settings** → **Environment variables**
3. Check if `REACT_APP_API_URL` exists
4. Check the value:
   - ✅ Should be: `https://your-backend-service-name.onrender.com`
   - ❌ Should NOT be: `http://localhost:8000`
   - ❌ Should NOT be empty

**Important**: After changing environment variables, you MUST redeploy:
- Go to **Deploys** tab
- Click **Trigger deploy** → **Deploy site**

### 4. Verify Backend is Running

Test if your backend is accessible:

1. Visit your backend URL directly:
   ```
   https://your-backend-service-name.onrender.com/health
   ```
   - Should return: `{"status":"healthy"}` or similar

2. Test the search endpoint:
   ```bash
   curl -X POST https://your-backend-service-name.onrender.com/search \
     -H "Content-Type: application/json" \
     -d '{"query":"show best areas","business_type":"restaurant","filters":{}}'
   ```
   - Should return JSON with recommendations

### 5. Check CORS Configuration

If you see CORS errors in the browser console, check:

1. Backend `main.py` CORS settings should include your Netlify domain:
   ```python
   cors_origins = [
       "https://your-netlify-site.netlify.app",
       "https://mapallthings.com",  # If using custom domain
   ]
   ```

2. Verify the regex pattern includes your domain:
   ```python
   allow_origin_regex=r"https://.*\.(netlify|render|vercel|railway)\.(app|com)"
   ```

### 6. Common Issues & Fixes

#### Issue: "Failed to fetch" or Network Error
**Cause**: Backend URL is wrong or backend is down
**Fix**: 
- Verify `REACT_APP_API_URL` in Netlify environment variables
- Check if backend is running (visit `/health` endpoint)
- Redeploy Netlify after changing environment variables

#### Issue: CORS Error
**Cause**: Backend CORS not configured for Netlify domain
**Fix**:
- Update backend CORS settings to include your Netlify domain
- Redeploy backend on Render

#### Issue: Empty Results (no error)
**Cause**: Backend is returning empty array or wrong response format
**Fix**:
- Check backend logs on Render dashboard
- Verify backend is returning data in expected format:
  ```json
  {
    "success": true,
    "data": {
      "recommendations": [...]
    }
  }
  ```

#### Issue: Environment Variable Not Applied
**Cause**: Netlify hasn't rebuilt after environment variable change
**Fix**:
- Change environment variable
- Go to **Deploys** tab
- Click **Trigger deploy** → **Deploy site**
- Wait for build to complete

### 7. Quick Test Checklist

1. ✅ Backend health check: `https://your-backend.onrender.com/health` returns OK
2. ✅ Backend search endpoint works: `POST /search` returns recommendations
3. ✅ Netlify env var `REACT_APP_API_URL` is set to backend URL
4. ✅ Netlify site has been redeployed after env var change
5. ✅ Browser console shows no errors
6. ✅ Network tab shows API calls to correct backend URL
7. ✅ Network tab shows `200 OK` responses

### 8. Debug Mode

Add temporary console logging to see what's happening:

In `BusinessIntegration.jsx`, the code already logs:
- `console.log('Search response:', data);`
- `console.log('Found recommendations:', recs.length);`
- `console.error('Failed to fetch recommendations', e);`

Check these in the browser console to see what's happening.

### 9. Test the API Directly

Use curl or Postman to test the backend:

```bash
# Test health
curl https://your-backend.onrender.com/health

# Test search
curl -X POST https://your-backend.onrender.com/search \
  -H "Content-Type: application/json" \
  -H "Origin: https://your-netlify-site.netlify.app" \
  -d '{
    "query": "show best areas",
    "business_type": "restaurant",
    "filters": {}
  }'
```

If this works but the frontend doesn't, the issue is likely:
- Environment variable not set correctly
- CORS issue
- Frontend not using the correct URL


