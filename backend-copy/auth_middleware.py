from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from auth_service import auth_service
from database import get_db
import logging

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme
security = HTTPBearer()

class AuthMiddleware:
    def __init__(self):
        self.auth_service = auth_service

    async def get_current_user(
        self, 
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db)
    ):
        """Get current authenticated user from JWT token."""
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
        try:
            # Verify token
            payload = self.auth_service.verify_user_token(credentials.credentials)
            if payload is None:
                raise credentials_exception
            
            user_id = payload.get("user_id")
            session_token = payload.get("session_token")
            
            if user_id is None or session_token is None:
                raise credentials_exception
            
            # Get user from database
            user = self.auth_service.get_user_by_id(db, int(user_id))
            if user is None:
                raise credentials_exception
            
            # Check if user is active
            if not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Inactive user"
                )
            
            # Verify session is still active
            from models import UserSession
            from datetime import datetime
            
            session = db.query(UserSession).filter(
                UserSession.user_id == user.id,
                UserSession.session_token == session_token,
                UserSession.is_active == True,
                UserSession.expires_at > datetime.utcnow()
            ).first()
            
            if not session:
                raise credentials_exception
            
            # Update last activity
            session.last_activity = datetime.utcnow()
            db.commit()
            
            return user
            
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            raise credentials_exception

    async def get_current_active_user(self, current_user = Depends(get_current_user)):
        """Get current active user."""
        if not current_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user"
            )
        return current_user

    async def get_current_verified_user(self, current_user = Depends(get_current_active_user)):
        """Get current verified user."""
        if not current_user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified"
            )
        return current_user

    async def get_admin_user(self, current_user = Depends(get_current_active_user)):
        """Get admin user."""
        if current_user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        return current_user

    async def get_business_user(self, current_user = Depends(get_current_active_user)):
        """Get business user or admin."""
        if current_user.role.value not in ["business_user", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Business user access required"
            )
        return current_user

# Global auth middleware instance
auth_middleware = AuthMiddleware()

# Dependency functions for easy use in endpoints
async def get_current_user_dep(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    return await auth_middleware.get_current_user(credentials, db)

async def get_current_active_user_dep(current_user = Depends(get_current_user_dep)):
    return await auth_middleware.get_current_active_user(current_user)

async def get_current_verified_user_dep(current_user = Depends(get_current_active_user_dep)):
    return await auth_middleware.get_current_verified_user(current_user)

async def get_admin_user_dep(current_user = Depends(get_current_active_user_dep)):
    return await auth_middleware.get_admin_user(current_user)

async def get_business_user_dep(current_user = Depends(get_current_active_user_dep)):
    return await auth_middleware.get_business_user(current_user)

# Export the dependency functions
get_current_user = get_current_user_dep
get_current_active_user = get_current_active_user_dep
get_current_verified_user = get_current_verified_user_dep
get_admin_user = get_admin_user_dep
get_business_user = get_business_user_dep

# Optional authentication (doesn't raise error if no token)
async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
):
    """Get current user if authenticated, otherwise return None."""
    if not credentials:
        return None
    
    try:
        payload = auth_service.verify_user_token(credentials.credentials)
        if payload is None:
            return None
        
        user_id = payload.get("user_id")
        if user_id is None:
            return None
        
        user = auth_service.get_user_by_id(db, int(user_id))
        if user is None or not user.is_active:
            return None
        
        return user
    except Exception:
        return None
