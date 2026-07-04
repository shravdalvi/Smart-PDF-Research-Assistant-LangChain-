"""
PDF management routes — upload, list, delete, and AI generation endpoints.
All business logic lives in PDFController.
"""

from typing import List

from fastapi import APIRouter, Depends, UploadFile, File

from controllers.pdf_controller import PDFController
from models.pdf import PDFResponse
from utils.auth_utils import get_current_user

router = APIRouter()


@router.post("/upload", response_model=PDFResponse, summary="Upload and process a PDF")
async def upload_pdf(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Upload a PDF file. The backend will:
    1. Save the file to the `uploads/` directory.
    2. Extract text with LangChain PyPDFLoader.
    3. Chunk and embed the text with Gemini Embeddings.
    4. Persist embeddings to a dedicated ChromaDB collection.
    5. Store file metadata in MongoDB.
    """
    return await PDFController.upload_pdf(file, current_user)


@router.get("/", response_model=List[PDFResponse], summary="List user's uploaded PDFs")
async def get_user_pdfs(current_user: dict = Depends(get_current_user)):
    """Return all PDFs uploaded by the authenticated user."""
    return await PDFController.get_user_pdfs(current_user)


@router.delete("/{pdf_id}", summary="Delete a PDF")
async def delete_pdf(pdf_id: str, current_user: dict = Depends(get_current_user)):
    """Permanently delete a PDF record from MongoDB (file stays on disk)."""
    return await PDFController.delete_pdf(pdf_id, current_user)


@router.get("/{pdf_id}/summary", summary="Generate a document summary")
async def get_summary(pdf_id: str, current_user: dict = Depends(get_current_user)):
    """Use Gemini to generate a concise summary of the PDF's content."""
    return await PDFController.get_summary(pdf_id, current_user)


@router.get("/{pdf_id}/interview-questions", summary="Generate interview questions")
async def get_interview_questions(pdf_id: str, current_user: dict = Depends(get_current_user)):
    """Generate 5 interview questions with answers based on the PDF content."""
    return await PDFController.get_interview_questions(pdf_id, current_user)


@router.get("/{pdf_id}/quiz-questions", summary="Generate quiz questions")
async def get_quiz_questions(pdf_id: str, current_user: dict = Depends(get_current_user)):
    """Generate 5 multiple-choice quiz questions based on the PDF content."""
    return await PDFController.get_quiz_questions(pdf_id, current_user)
