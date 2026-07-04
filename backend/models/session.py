"""
Pydantic model for user login sessions stored in MongoDB.
"""

from pydantic import BaseModel
from datetime import datetime


class UserSession(BaseModel):
    """Represents a user session created on login."""
    user_id: str
    token: str
    login_time: datetime
    is_active: bool = True
