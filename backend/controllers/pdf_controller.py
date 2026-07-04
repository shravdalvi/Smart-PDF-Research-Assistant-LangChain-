"""
PDF controller — upload, list, delete, and AI generation business logic.
Routes stay thin; all DB + RAG calls live here.
"""

import os
import shutil
from datetime import datetime

from bson import ObjectId
from fastapi import HTTPException, UploadFile

from config.db import get_database
from models.pdf import PDFResponse
from services.rag_service import rag_service
from utils.logger import logger

UPLOAD_DIR = "../uploads"


class PDFController:
    """Manages PDF lifecycle: ingestion, retrieval, deletion, and AI tasks."""

    @staticmethod
    async def upload_pdf(file: UploadFile, current_user: dict) -> PDFResponse:
        """
        Save the PDF to disk, process it through RAG, and persist metadata to MongoDB.

        Steps:
        1. Validate file extension.
        2. Save file to UPLOAD_DIR.
        3. Insert placeholder document in MongoDB to obtain an ObjectId.
        4. Call rag_service.process_pdf to embed into ChromaDB.
        5. Update total_pages in MongoDB.
        """
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

        db = get_database()
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        # Namespace by user to avoid filename collisions
        safe_name = f"{current_user['id']}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, safe_name)

        with open(file_path, "wb") as buf:
            shutil.copyfileobj(file.file, buf)

        pdf_doc = {
            "filename": file.filename,
            "upload_date": datetime.utcnow(),
            "total_pages": 0,
            "user_id": current_user["id"],
        }
        result = await db.pdfs.insert_one(pdf_doc)
        pdf_id = str(result.inserted_id)

        try:
            total_pages = rag_service.process_pdf(file_path, collection_name=f"pdf_{pdf_id}")
            await db.pdfs.update_one(
                {"_id": result.inserted_id},
                {"$set": {"total_pages": total_pages}},
            )
            logger.info("PDF uploaded by user %s: %s (%d pages)",
                        current_user["id"], file.filename, total_pages)

            return PDFResponse(
                id=pdf_id,
                filename=file.filename,
                upload_date=pdf_doc["upload_date"],
                total_pages=total_pages,
                user_id=current_user["id"],
            )

        except Exception as exc:
            # Roll back DB record and uploaded file on any processing error
            await db.pdfs.delete_one({"_id": result.inserted_id})
            if os.path.exists(file_path):
                os.remove(file_path)
            logger.error("PDF processing failed for '%s': %s", file.filename, exc)
            raise HTTPException(status_code=500, detail=f"Failed to process PDF: {exc}")

    @staticmethod
    async def get_user_pdfs(current_user: dict) -> list[PDFResponse]:
        """Return all PDFs owned by the authenticated user."""
        db = get_database()
        pdfs = await db.pdfs.find({"user_id": current_user["id"]}).to_list(200)
        return [
            PDFResponse(
                id=str(p["_id"]),
                filename=p["filename"],
                upload_date=p["upload_date"],
                total_pages=p["total_pages"],
                user_id=p["user_id"],
            )
            for p in pdfs
        ]

    @staticmethod
    async def delete_pdf(pdf_id: str, current_user: dict) -> dict:
        """
        Delete a PDF's MongoDB record.
        The uploaded file and ChromaDB collection are retained (safe deletion).
        """
        db = get_database()
        pdf = await db.pdfs.find_one(
            {"_id": ObjectId(pdf_id), "user_id": current_user["id"]}
        )
        if not pdf:
            raise HTTPException(status_code=404, detail="PDF not found or access denied.")

        await db.pdfs.delete_one({"_id": ObjectId(pdf_id)})
        logger.info("PDF deleted: %s by user %s", pdf_id, current_user["id"])
        return {"message": "PDF deleted successfully."}

    # ── AI generation helpers ─────────────────────────────────────────────────

    @staticmethod
    async def _require_pdf(pdf_id: str, current_user: dict):
        db = get_database()
        if not await db.pdfs.find_one(
            {"_id": ObjectId(pdf_id), "user_id": current_user["id"]}
        ):
            raise HTTPException(status_code=404, detail="PDF not found or access denied.")

    @staticmethod
    async def get_summary(pdf_id: str, current_user: dict) -> dict:
        """Generate a document summary using Gemini via RAG."""
        await PDFController._require_pdf(pdf_id, current_user)
        summary = rag_service.generate_summary(pdf_id)
        return {"summary": summary}

    @staticmethod
    async def get_interview_questions(pdf_id: str, current_user: dict) -> dict:
        """Generate interview questions using Gemini via RAG."""
        await PDFController._require_pdf(pdf_id, current_user)
        questions = rag_service.generate_interview_questions(pdf_id)
        return {"questions": questions}

    @staticmethod
    async def get_quiz_questions(pdf_id: str, current_user: dict) -> dict:
        """Generate multiple-choice quiz questions using Gemini via RAG."""
        await PDFController._require_pdf(pdf_id, current_user)
        quiz = rag_service.generate_quiz_questions(pdf_id)
        return {"quiz": quiz}
