"""
Pydantic models for User domain objects.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    """Payload for user registration."""
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    """Payload for user login."""
    username: str
    password: str


class UserResponse(BaseModel):
    """Serialised user returned to the client (no password)."""
    id: str
    username: str
    email: str


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str
