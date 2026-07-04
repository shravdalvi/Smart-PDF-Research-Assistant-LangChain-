"""
Chat / RAG routes — ask questions, view history, export chat.
All business logic lives in ChatController.
"""

from typing import List

from fastapi import APIRouter, Depends

from controllers.chat_controller import ChatController
from models.chat import ChatRequest, ChatMessage
from utils.auth_utils import get_current_user

router = APIRouter()


@router.post("/ask", response_model=ChatMessage, summary="Ask a question about a PDF")
async def ask_question(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Submit a question.
    - If `pdf_id` is provided, searches that PDF's ChromaDB collection.
    - If `pdf_id` is omitted or `"all"`, searches across all user PDFs.
    Returns the AI answer, source page numbers, and source text extracts.
    """
    return await ChatController.ask_question(request, current_user)


@router.get(
    "/history/{pdf_id}",
    response_model=List[ChatMessage],
    summary="Retrieve chat history for a PDF",
)
async def get_chat_history(pdf_id: str, current_user: dict = Depends(get_current_user)):
    """Return all previous Q&A turns for the given PDF (or "all" for global search history)."""
    return await ChatController.get_chat_history(pdf_id, current_user)


@router.get("/export/{pdf_id}", summary="Export chat history as plain text")
async def export_history(pdf_id: str, current_user: dict = Depends(get_current_user)):
    """Download the chat history for a PDF as a formatted plain-text string."""
    return await ChatController.export_history(pdf_id, current_user)
