from pydantic import BaseModel, EmailStr, validator
from typing import Optional, Dict, Any
from datetime import datetime
from models import UserRole

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    confirm_password: str
    
    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if len(v) > 72:
            raise ValueError('Password must be no more than 72 characters long')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    role: UserRole
    profile_picture: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    profile_picture: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str
    
    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v
    
    @validator('new_password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if len(v) > 72:
            raise ValueError('Password must be no more than 72 characters long')
        return v

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str
    confirm_password: str
    
    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v
    
    @validator('new_password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if len(v) > 72:
            raise ValueError('Password must be no more than 72 characters long')
        return v

# Authentication Schemas
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int

class TokenRefresh(BaseModel):
    refresh_token: str

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int
    user: UserResponse

class GoogleAuthResponse(BaseModel):
    authorization_url: str

class GoogleCallbackResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int
    user: UserResponse

# Search History Schemas
class SearchHistoryCreate(BaseModel):
    query: str
    business_type: str
    filters_used: Optional[Dict[str, Any]] = None

class SearchHistoryResponse(BaseModel):
    id: int
    query: str
    business_type: str
    filters_used: Optional[Dict[str, Any]] = None
    results_count: int
    search_timestamp: datetime
    
    class Config:
        from_attributes = True

# API Response Schemas
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

# Keep existing schemas
class SearchQuery(BaseModel):
    query: str
    business_type: str = "restaurant"
    filters: Optional[Dict[str, Any]] = None

class LocationRecommendation(BaseModel):
    area: str
    score: float
    reasons: list
    coordinates: list
    business_density: int
    population_density: int
    transport_score: int
    apartment_count: Optional[int] = None

class AdvancedSearchFilters(BaseModel):
    counties: Optional[list] = None
    population_density_min: Optional[int] = None
    population_density_max: Optional[int] = None
    business_density_min: Optional[int] = None
    business_density_max: Optional[int] = None
    transport_score_min: Optional[float] = None
    transport_score_max: Optional[float] = None
    apartment_count_min: Optional[int] = None
    apartment_count_max: Optional[int] = None

class AdvancedSearchRequest(BaseModel):
    search_query: SearchQuery
    filters: AdvancedSearchFilters
