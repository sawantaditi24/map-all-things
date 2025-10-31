# Render.com Backend Deployment Guide

## Prerequisites
1. Render.com account (free tier available)
2. GitHub repository connected to Render
3. Environment variables ready

## Step-by-Step Deployment

### 1. Create a Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `sawantaditi24/map-all-things`
4. Configure the service:
   - **Name**: `socal-business-intelligence-backend` (or any name you prefer)
   - **Region**: Choose closest to your users (e.g., `Oregon (US West)`)
   - **Branch**: `main`
   - **Root Directory**: `my-map-app/socal-business-intelligence/backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python run.py`

### 2. Configure Environment Variables

In the Render dashboard, go to **Environment** tab and add:

```
# Database (Render will provide PostgreSQL URL - add it here after creating database)
DATABASE_URL=postgresql://user:password@hostname:5432/dbname

# API Keys
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here

# Authentication & Security
SECRET_KEY=generate-a-strong-secret-key-here-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Google OAuth2
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-backend-url.onrender.com/auth/google/callback

# Email Configuration (optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=noreply@businessintelligence.com

# Redis (optional - can skip if not using Redis)
REDIS_URL=redis://localhost:6379

# CORS - Add your frontend URL
ALLOWED_ORIGINS=https://your-frontend-url.netlify.app,https://mapallthings.com

# Port (Render sets this automatically, but good to have)
PORT=8000
```

### 3. Create PostgreSQL Database (Required)

1. In Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `socal-business-intelligence-db`
   - **Database**: `business_intelligence`
   - **User**: (auto-generated)
   - **Region**: Same as your web service
   - **Plan**: Free tier (or paid)
3. After creation, copy the **Internal Database URL**
4. Update `DATABASE_URL` in your web service environment variables

### 4. Update Database Configuration

**Important**: Your backend currently uses SQLite. For production on Render, you need to:

1. Update `database.py` to use PostgreSQL when `DATABASE_URL` contains `postgresql://`
2. The code should automatically handle this if using SQLAlchemy

### 5. Update CORS Settings

In `main.py`, ensure CORS includes your Render backend URL:

```python
allow_origins=[
    "http://localhost:3000",
    "http://localhost:3005",
    "https://*.netlify.app",
    "https://socal-business-intelligence.netlify.app",
    "https://mapallthings.com",
    "https://*.render.com",  # Add this
]
```

### 6. Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repo
   - Install dependencies
   - Build the service
   - Start the service
3. Monitor the logs for any errors

### 7. Get Your Backend URL

After deployment, your backend URL will be:
```
https://socal-business-intelligence-backend.onrender.com
```

(Replace with your actual service name)

### 8. Update Frontend Environment Variables

Update your Netlify frontend environment variables:

```
REACT_APP_API_URL=https://your-backend-url.onrender.com
```

## Troubleshooting

### Common Issues:

1. **Database connection errors**:
   - Ensure `DATABASE_URL` uses PostgreSQL URL from Render
   - Check if database is in same region as web service

2. **Port binding errors**:
   - Render sets `PORT` automatically
   - Your `run.py` should read `os.environ.get("PORT", 8000)`

3. **Build errors**:
   - Check Python version compatibility (3.11)
   - Ensure all dependencies are in `requirements.txt`

4. **CORS errors**:
   - Add frontend URL to `ALLOWED_ORIGINS`
   - Update `CORSMiddleware` in `main.py`

## Alternative: Fly.io (Docker-based)

If you prefer Docker deployment:

1. Go to [Fly.io](https://fly.io)
2. Install Fly CLI
3. Run: `fly launch` in backend directory
4. Follow prompts
5. Deploy: `fly deploy`

**Pros**: 
- Docker-based (more control)
- Good free tier
- Global edge network

**Cons**:
- Requires Docker knowledge
- CLI setup needed

## Alternative: Railway (Second Try)

If you want to retry Railway:

1. Go to [Railway](https://railway.app)
2. Create new project
3. Add service from GitHub
4. Set **Root Directory**: `my-map-app/socal-business-intelligence/backend`
5. Add environment variables
6. Railway will auto-detect Python and deploy

**Note**: Railway has had reliability issues, but might work better now.

