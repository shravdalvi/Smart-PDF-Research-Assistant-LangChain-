"""
Chat controller — Q&A, history retrieval, and chat export logic.
Routes stay thin; all DB + RAG calls live here.
"""

from datetime import datetime

from bson import ObjectId
from fastapi import HTTPException

from config.db import get_database
from models.chat import ChatMessage, ChatRequest
from services.rag_service import rag_service
from utils.logger import logger


class ChatController:
    """Handles question answering, history fetching, and export."""

    @staticmethod
    async def ask_question(request: ChatRequest, current_user: dict) -> ChatMessage:
        """
        Ask a question against a specific PDF or all user PDFs.

        - pdf_id == None or "all"  → global search across all user PDFs.
        - pdf_id == <ObjectId str>  → single PDF search.

        Persists the Q&A turn to the `chats` MongoDB collection.
        """
        db = get_database()
        pdf_id = request.pdf_id

        if pdf_id and pdf_id != "all":
            # Single-PDF search
            pdf = await db.pdfs.find_one(
                {"_id": ObjectId(pdf_id), "user_id": current_user["id"]}
            )
            if not pdf:
                raise HTTPException(status_code=404, detail="PDF not found or access denied.")

            try:
                answer, source_pages, source_paragraphs = rag_service.ask_question(
                    request.question, pdf_id
                )
                stored_pdf_id = pdf_id
            except Exception as exc:
                logger.error("ask_question RAG error: %s", exc)
                raise HTTPException(status_code=500, detail=str(exc))

        else:
            # Global search across all user PDFs
            pdfs = await db.pdfs.find({"user_id": current_user["id"]}).to_list(200)
            if not pdfs:
                raise HTTPException(
                    status_code=400,
                    detail="No PDFs uploaded yet. Upload a PDF first.",
                )
            pdf_ids = [str(p["_id"]) for p in pdfs]

            try:
                answer, source_pages, source_paragraphs = rag_service.search_all_pdfs(
                    request.question, pdf_ids
                )
                stored_pdf_id = "all"
            except Exception as exc:
                logger.error("search_all_pdfs RAG error: %s", exc)
                raise HTTPException(status_code=500, detail=str(exc))

        chat_doc = {
            "question": request.question,
            "answer": answer,
            "timestamp": datetime.utcnow(),
            "pdf_id": stored_pdf_id,
            "user_id": current_user["id"],
            "source_pages": source_pages,
            "source_paragraphs": source_paragraphs,
        }
        await db.chats.insert_one({**chat_doc})  # spread so we don't mutate
        logger.info("Chat saved for user %s (pdf_id=%s).", current_user["id"], stored_pdf_id)

        return ChatMessage(**chat_doc)

    @staticmethod
    async def get_chat_history(pdf_id: str, current_user: dict) -> list[ChatMessage]:
        """
        Retrieve all chat turns for a given PDF (or "all" for global search history),
        sorted oldest-first.
        """
        db = get_database()
        cursor = db.chats.find(
            {"pdf_id": pdf_id, "user_id": current_user["id"]}
        ).sort("timestamp", 1)
        chats = await cursor.to_list(500)

        return [
            ChatMessage(
                question=c["question"],
                answer=c["answer"],
                timestamp=c["timestamp"],
                pdf_id=c["pdf_id"],
                user_id=c["user_id"],
                source_pages=c.get("source_pages", []),
                source_paragraphs=c.get("source_paragraphs", []),
            )
            for c in chats
        ]

    @staticmethod
    async def export_history(pdf_id: str, current_user: dict) -> dict:
        """
        Build a plain-text export of the chat history for a PDF.
        Returns {"export_text": "..."}.
        """
        history = await ChatController.get_chat_history(pdf_id, current_user)

        lines = [
            f"Chat History — PDF ID: {pdf_id}",
            "=" * 60,
            "",
        ]
        for i, chat in enumerate(history, start=1):
            ts = chat.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")
            lines += [
                f"[{i}] {ts}",
                f"Q: {chat.question}",
                f"A: {chat.answer}",
            ]
            if chat.source_pages:
                lines.append(f"   Source pages: {', '.join(map(str, chat.source_pages))}")
            lines += ["-" * 60, ""]

        return {"export_text": "\n".join(lines)}
