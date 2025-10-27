import os
import secrets
import smtplib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from models import User, UserRole, AuthProvider, PasswordResetToken, UserSession
import logging

logger = logging.getLogger(__name__)

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Password hashing - using pbkdf2_sha256 as it's more compatible
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# Email configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@businessintelligence.com")

class AuthService:
    def __init__(self):
        self.secret_key = SECRET_KEY
        self.algorithm = ALGORITHM
        self.access_token_expire_minutes = ACCESS_TOKEN_EXPIRE_MINUTES
        self.refresh_token_expire_days = REFRESH_TOKEN_EXPIRE_DAYS

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        """Hash a password."""
        return pwd_context.hash(password)

    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token."""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def create_refresh_token(self, data: Dict[str, Any]) -> str:
        """Create a JWT refresh token."""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def verify_token(self, token: str, token_type: str = "access") -> Optional[Dict[str, Any]]:
        """Verify and decode a JWT token."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            if payload.get("type") != token_type:
                return None
            return payload
        except JWTError:
            return None

    def authenticate_user(self, db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate a user with email and password."""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return None
        if not user.hashed_password:
            return None
        if not self.verify_password(password, user.hashed_password):
            return None
        return user

    def get_user_by_email(self, db: Session, email: str) -> Optional[User]:
        """Get user by email."""
        return db.query(User).filter(User.email == email).first()

    def get_user_by_id(self, db: Session, user_id: int) -> Optional[User]:
        """Get user by ID."""
        return db.query(User).filter(User.id == user_id).first()

    def create_user(self, db: Session, email: str, password: str, full_name: str = None, 
                   username: str = None, auth_provider: AuthProvider = AuthProvider.EMAIL,
                   provider_id: str = None) -> User:
        """Create a new user."""
        hashed_password = self.get_password_hash(password) if password else None
        
        user = User(
            email=email,
            username=username,
            full_name=full_name,
            hashed_password=hashed_password,
            auth_provider=auth_provider,
            provider_id=provider_id,
            is_verified=auth_provider != AuthProvider.EMAIL  # Social logins are pre-verified
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def create_user_session(self, db: Session, user_id: int) -> Dict[str, str]:
        """Create a new user session with access and refresh tokens."""
        # Generate session tokens
        session_token = secrets.token_urlsafe(32)
        refresh_token = secrets.token_urlsafe(32)
        
        # Create session record
        session = UserSession(
            user_id=user_id,
            session_token=session_token,
            refresh_token=refresh_token,
            expires_at=datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        )
        
        db.add(session)
        db.commit()
        
        # Create JWT tokens
        token_data = {"sub": str(user_id), "session_token": session_token}
        access_token = self.create_access_token(token_data)
        refresh_jwt = self.create_refresh_token(token_data)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_jwt,
            "token_type": "bearer"
        }

    def refresh_access_token(self, db: Session, refresh_token: str) -> Optional[Dict[str, str]]:
        """Refresh an access token using a refresh token."""
        payload = self.verify_token(refresh_token, "refresh")
        if not payload:
            return None
        
        user_id = int(payload.get("sub"))
        session_token = payload.get("session_token")
        
        # Verify session exists and is active
        session = db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.session_token == session_token,
            UserSession.is_active == True,
            UserSession.expires_at > datetime.utcnow()
        ).first()
        
        if not session:
            return None
        
        # Update last activity
        session.last_activity = datetime.utcnow()
        db.commit()
        
        # Create new access token
        token_data = {"sub": str(user_id), "session_token": session_token}
        access_token = self.create_access_token(token_data)
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }

    def logout_user(self, db: Session, user_id: int, session_token: str = None):
        """Logout a user by deactivating their session."""
        query = db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.is_active == True
        )
        
        if session_token:
            query = query.filter(UserSession.session_token == session_token)
        
        sessions = query.all()
        for session in sessions:
            session.is_active = False
        
        db.commit()

    def create_password_reset_token(self, db: Session, email: str) -> Optional[str]:
        """Create a password reset token for a user."""
        user = self.get_user_by_email(db, email)
        if not user:
            return None
        
        # Deactivate any existing reset tokens
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.is_used == False
        ).update({"is_used": True})
        
        # Create new reset token
        token = secrets.token_urlsafe(32)
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(hours=1)  # 1 hour expiry
        )
        
        db.add(reset_token)
        db.commit()
        
        return token

    def reset_password(self, db: Session, token: str, new_password: str) -> bool:
        """Reset a user's password using a reset token."""
        reset_token = db.query(PasswordResetToken).filter(
            PasswordResetToken.token == token,
            PasswordResetToken.is_used == False,
            PasswordResetToken.expires_at > datetime.utcnow()
        ).first()
        
        if not reset_token:
            return False
        
        # Update user password
        user = self.get_user_by_id(db, reset_token.user_id)
        if not user:
            return False
        
        user.hashed_password = self.get_password_hash(new_password)
        reset_token.is_used = True
        
        db.commit()
        return True

    def send_password_reset_email(self, email: str, reset_token: str) -> bool:
        """Send password reset email."""
        if not SMTP_USERNAME or not SMTP_PASSWORD:
            logger.warning("SMTP credentials not configured. Skipping email send.")
            return False
        
        try:
            reset_url = f"http://localhost:3001/reset-password?token={reset_token}"
            
            msg = MIMEMultipart()
            msg['From'] = FROM_EMAIL
            msg['To'] = email
            msg['Subject'] = "Password Reset - Business Intelligence Platform"
            
            body = f"""
            Hi there,
            
            You requested a password reset for your Business Intelligence Platform account.
            
            Click the link below to reset your password:
            {reset_url}
            
            This link will expire in 1 hour.
            
            If you didn't request this reset, please ignore this email.
            
            Best regards,
            Business Intelligence Team
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            text = msg.as_string()
            server.sendmail(FROM_EMAIL, email, text)
            server.quit()
            
            return True
        except Exception as e:
            logger.error(f"Failed to send password reset email: {e}")
            return False

    def verify_user_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify a user token and return user info."""
        payload = self.verify_token(token, "access")
        if not payload:
            return None
        
        return {
            "user_id": payload.get("sub"),
            "session_token": payload.get("session_token")
        }

# Global auth service instance
auth_service = AuthService()
