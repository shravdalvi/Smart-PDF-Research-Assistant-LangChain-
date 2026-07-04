"""
Smart PDF Research Assistant — FastAPI Backend

Startup entry point. Registers routers, CORS middleware,
MongoDB lifecycle hooks, and creates required directories.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from config.db import connect_to_mongo, close_mongo_connection
from routes import auth, pdf, chat
from utils.logger import logger
import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown."""
    # ── startup ─────────────────────────────────────────────────────────────
    await connect_to_mongo()
    os.makedirs("../uploads", exist_ok=True)
    os.makedirs("../chroma_db", exist_ok=True)
    logger.info("Application startup complete.")
    yield
    # ── shutdown ─────────────────────────────────────────────────────────────
    await close_mongo_connection()
    logger.info("Application shut down.")


app = FastAPI(
    title="Smart PDF Research Assistant API",
    description="RAG-powered PDF Q&A system using Google Gemini, LangChain, ChromaDB & MongoDB.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(pdf.router,  prefix="/api/pdf",  tags=["PDF Management"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat & RAG"])


@app.get("/", tags=["Health"])
def health_check():
    """Health-check endpoint."""
    return {"status": "ok", "message": "Smart PDF Research Assistant API is running."}
