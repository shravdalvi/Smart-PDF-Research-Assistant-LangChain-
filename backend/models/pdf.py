"""
Pydantic models for the PDF domain.
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PDFModel(BaseModel):
    """Internal representation of an uploaded PDF document."""
    id: Optional[str] = None
    filename: str
    upload_date: datetime
    total_pages: int
    user_id: str


class PDFResponse(BaseModel):
    """Serialised PDF document returned to the client."""
    id: str
    filename: str
    upload_date: datetime
    total_pages: int
    user_id: str
