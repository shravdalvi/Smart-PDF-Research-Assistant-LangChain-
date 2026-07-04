"""
Pydantic models for the Chat/RAG domain.
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class ChatMessage(BaseModel):
    """A single Q&A turn persisted to MongoDB and returned to the client."""
    question: str
    answer: str
    timestamp: datetime
    pdf_id: str          # ObjectId string or "all" for global search
    user_id: str
    source_pages: Optional[List[int]] = []
    source_paragraphs: Optional[List[str]] = []


class ChatRequest(BaseModel):
    """Payload sent by the client to ask a question."""
    question: str
    pdf_id: Optional[str] = None  # None → search across all user PDFs
