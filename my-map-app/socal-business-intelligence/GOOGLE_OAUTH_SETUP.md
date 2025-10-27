# Google OAuth2 Setup Instructions

## 🚀 Quick Setup Guide

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (or Google Identity API)

### 2. Configure OAuth Consent Screen

1. Navigate to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type
3. Fill in the required information:
   - **App name**: SoCal Business Intelligence
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
5. Add test users (your email) for development

### 3. Create OAuth2 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Set **Authorized redirect URIs**:
   - `http://localhost:3000/auth/google/callback` (for development)
   - `https://yourdomain.com/auth/google/callback` (for production)
5. Copy the **Client ID** and **Client Secret**

### 4. Configure Environment Variables

Update your `.env` file in the backend directory:

```bash
# Google OAuth2
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

### 5. Test the Integration

1. Start the backend server:
   ```bash
   cd backend
   source venv/bin/activate
   python main.py
   ```

2. Start the frontend server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Visit `http://localhost:3000`
4. Click "Sign In" and then "Continue with Google"
5. Complete the OAuth flow

## 🔧 Troubleshooting

### Common Issues:

1. **"Google Client ID not configured"**
   - Make sure `GOOGLE_CLIENT_ID` is set in your `.env` file
   - Restart the backend server after updating `.env`

2. **"Redirect URI mismatch"**
   - Ensure the redirect URI in Google Console matches exactly
   - Check for trailing slashes and http vs https

3. **"Popup blocked"**
   - Allow popups for localhost:3000
   - Try using a different browser

4. **"Invalid client"**
   - Double-check your Client ID and Secret
   - Ensure the OAuth consent screen is properly configured

## 📝 Production Deployment

For production deployment:

1. Update the redirect URI in Google Console to your production domain
2. Update the `GOOGLE_REDIRECT_URI` in your production environment
3. Ensure your domain is added to authorized origins in Google Console
4. Complete the OAuth consent screen verification process

## 🔒 Security Notes

- Never commit your `.env` file to version control
- Use environment variables in production
- Regularly rotate your OAuth credentials
- Monitor OAuth usage in Google Cloud Console
