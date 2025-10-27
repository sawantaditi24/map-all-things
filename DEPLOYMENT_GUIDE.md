# Deployment Guide: LA 2028 Olympics + Business Intelligence

## 🚀 Deployment Overview

This guide will help you deploy your integrated project:
- **Backend**: Railway (Python FastAPI)
- **Frontend**: Netlify (React)

## 📋 Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
3. **GitHub Repository**: Your code is already at `https://github.com/sawantaditi24/map-all-things`

## 🔧 Backend Deployment (Railway)

### Step 1: Connect Railway to GitHub
1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository: `sawantaditi24/map-all-things`
5. Select the folder: `my-map-app/socal-business-intelligence/backend`

### Step 2: Configure Environment Variables
In Railway dashboard, go to Variables tab and add:

```
OPENAI_API_KEY=your_openai_api_key
GOOGLE_PLACES_API_KEY=your_google_places_key
MAPBOX_ACCESS_TOKEN=your_mapbox_token
DATABASE_URL=postgresql://username:password@host:port/database
```

**Note**: Railway will provide a PostgreSQL database URL automatically.

### Step 3: Deploy
1. Railway will automatically detect Python and install dependencies
2. The app will start using `python main.py`
3. Railway will provide a URL like: `https://your-app-name.railway.app`

## 🌐 Frontend Deployment (Netlify)

### Step 1: Connect Netlify to GitHub
1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "New site from Git"
3. Choose GitHub and select your repository
4. Configure build settings:
   - **Base directory**: `my-map-app`
   - **Build command**: `npm run build`
   - **Publish directory**: `build`

### Step 2: Configure Environment Variables
In Netlify dashboard, go to Site settings > Environment variables:

```
REACT_APP_API_URL=https://your-railway-app.railway.app
REACT_APP_MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

### Step 3: Deploy
1. Netlify will build and deploy automatically
2. You'll get a URL like: `https://your-site-name.netlify.app`

## 🔄 Update Frontend API URL

After Railway deployment, update the frontend to use the Railway backend:

1. **In Netlify Environment Variables**:
   ```
   REACT_APP_API_URL=https://your-railway-app.railway.app
   ```

2. **Or update the code** (if needed):
   ```javascript
   const apiUrl = process.env.REACT_APP_API_URL || 'https://your-railway-app.railway.app';
   ```

## 🧪 Testing Deployment

### Backend Health Check
Visit: `https://your-railway-app.railway.app/health`
Should return: `{"status": "healthy", "service": "business-intelligence-api"}`

### Frontend Test
Visit: `https://your-site-name.netlify.app`
- Test the Business Intelligence tab
- Try searching for locations
- Verify map loads correctly

## 🔧 Troubleshooting

### Backend Issues
- Check Railway logs for errors
- Verify all environment variables are set
- Ensure database connection is working

### Frontend Issues
- Check Netlify build logs
- Verify API URL is correct
- Check browser console for CORS errors

### CORS Issues
If you get CORS errors, the backend already includes Railway domains in the allowed origins.

## 📊 Monitoring

### Railway
- Monitor CPU, memory usage
- Check deployment logs
- Monitor database performance

### Netlify
- Monitor build times
- Check site analytics
- Monitor form submissions

## 🔄 Updates

To update your deployment:
1. Push changes to GitHub
2. Railway and Netlify will automatically redeploy
3. Test the changes on the live sites

## 📝 Notes

- Railway provides a free tier with generous limits
- Netlify provides free hosting with automatic deployments
- Both platforms support custom domains if needed
- Database is automatically managed by Railway

## 🎯 Final URLs

After deployment, you'll have:
- **Backend API**: `https://your-app-name.railway.app`
- **Frontend**: `https://your-site-name.netlify.app`

Share these URLs with your professor to showcase the integrated project!
