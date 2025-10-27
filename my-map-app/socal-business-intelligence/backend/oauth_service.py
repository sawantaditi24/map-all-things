import os
import requests
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from models import User, AuthProvider
from auth_service import auth_service
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Google OAuth2 Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:3001/auth/google/callback")

class GoogleOAuthService:
    def __init__(self):
        self.client_id = GOOGLE_CLIENT_ID
        self.client_secret = GOOGLE_CLIENT_SECRET
        self.redirect_uri = GOOGLE_REDIRECT_URI

    def get_authorization_url(self) -> str:
        """Generate Google OAuth2 authorization URL."""
        if not self.client_id:
            raise ValueError("Google Client ID not configured")
        
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": "openid email profile",
            "response_type": "code",
            "access_type": "offline",
            "prompt": "consent"
        }
        
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"https://accounts.google.com/o/oauth2/v2/auth?{query_string}"

    def exchange_code_for_token(self, code: str) -> Optional[Dict[str, Any]]:
        """Exchange authorization code for access token."""
        if not self.client_secret:
            logger.error("Google Client Secret not configured")
            return None
        
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": self.redirect_uri
        }
        
        try:
            response = requests.post(token_url, data=data)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"Failed to exchange code for token: {e}")
            return None

    def get_user_info(self, access_token: str) -> Optional[Dict[str, Any]]:
        """Get user information from Google using access token."""
        user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        try:
            response = requests.get(user_info_url, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"Failed to get user info from Google: {e}")
            return None

    def authenticate_or_create_user(self, db: Session, google_user_info: Dict[str, Any]) -> Optional[User]:
        """Authenticate existing user or create new user from Google info."""
        email = google_user_info.get("email")
        if not email:
            logger.error("No email found in Google user info")
            return None
        
        # Check if user already exists
        user = auth_service.get_user_by_email(db, email)
        
        if user:
            # Update last login
            user.last_login = datetime.utcnow()
            db.commit()
            return user
        
        # Create new user
        full_name = google_user_info.get("name", "")
        profile_picture = google_user_info.get("picture", "")
        provider_id = google_user_info.get("id", "")
        
        # Generate username from email
        username = email.split("@")[0]
        
        # Ensure username is unique
        counter = 1
        original_username = username
        while db.query(User).filter(User.username == username).first():
            username = f"{original_username}{counter}"
            counter += 1
        
        user = auth_service.create_user(
            db=db,
            email=email,
            password=None,  # No password for social login
            full_name=full_name,
            username=username,
            auth_provider=AuthProvider.GOOGLE,
            provider_id=provider_id
        )
        
        # Update profile picture
        user.profile_picture = profile_picture
        db.commit()
        
        return user

    def handle_google_callback(self, db: Session, code: str) -> Optional[Dict[str, Any]]:
        """Handle Google OAuth2 callback and return user session."""
        # Exchange code for token
        token_data = self.exchange_code_for_token(code)
        if not token_data:
            return None
        
        access_token = token_data.get("access_token")
        if not access_token:
            return None
        
        # Get user info
        user_info = self.get_user_info(access_token)
        if not user_info:
            return None
        
        # Authenticate or create user
        user = self.authenticate_or_create_user(db, user_info)
        if not user:
            return None
        
        # Create session
        session_data = auth_service.create_user_session(db, user.id)
        if not session_data:
            return None
        
        return {
            **session_data,
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name,
                "profile_picture": user.profile_picture,
                "role": user.role.value,
                "is_active": user.is_active,
                "is_verified": user.is_verified,
                "created_at": user.created_at
            }
        }

# Global OAuth service instance
google_oauth_service = GoogleOAuthService()
