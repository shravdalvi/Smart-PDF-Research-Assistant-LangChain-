"""
RAG (Retrieval-Augmented Generation) service.

Uses:
  - LangChain's PyPDFLoader to load PDF pages
  - RecursiveCharacterTextSplitter to chunk text
  - GoogleGenerativeAIEmbeddings (Gemini) to embed chunks
  - ChromaDB (langchain-chroma) as the persistent vector store
  - ChatGoogleGenerativeAI (Gemini Flash) as the LLM
  - RetrievalQA chain for Q&A with source attribution
"""

import os
from typing import List, Tuple

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_chroma import Chroma
from langchain_classic.chains import RetrievalQA
from langchain_core.prompts import PromptTemplate

from config.settings import settings
from utils.logger import logger

# Type alias for the three-tuple returned by ask/search helpers
RAGResult = Tuple[str, List[int], List[str]]


class RAGService:
    """Encapsulates all PDF processing and RAG query logic."""

    CHROMA_DIR = "../chroma_db"
    CHUNK_SIZE = 1000
    CHUNK_OVERLAP = 200
    TOP_K = 5  # number of chunks retrieved per query

    def __init__(self):
        self._api_key = settings.GEMINI_API_KEY
        if not self._api_key:
            logger.warning(
                "GEMINI_API_KEY is not set — RAG features will fail at runtime. "
                "Set it in backend/.env before uploading PDFs."
            )
        self._embeddings = None
        self._llm = None
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.CHUNK_SIZE,
            chunk_overlap=self.CHUNK_OVERLAP,
        )

    @property
    def embeddings(self):
        """Lazily initialised Gemini embeddings client."""
        if self._embeddings is None:
            self._embeddings = GoogleGenerativeAIEmbeddings(
                model="models/embedding-001",
                google_api_key=self._api_key,
            )
        return self._embeddings

    @property
    def llm(self):
        """Lazily initialised Gemini Flash LLM client."""
        if self._llm is None:
            self._llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=self._api_key,
                temperature=0.3,
            )
        return self._llm

    # ── PDF ingestion ─────────────────────────────────────────────────────────

    def process_pdf(self, file_path: str, collection_name: str) -> int:
        """
        Load, chunk, embed and store a PDF in ChromaDB.

        Args:
            file_path: Absolute path to the saved PDF file.
            collection_name: ChromaDB collection name (e.g. "pdf_<mongo_id>").

        Returns:
            Total number of pages in the document.
        """
        try:
            loader = PyPDFLoader(file_path)
            documents = loader.load()

            # Normalise to 1-based page numbers
            for doc in documents:
                if "page" in doc.metadata:
                    doc.metadata["page"] = doc.metadata["page"] + 1

            chunks = self.text_splitter.split_documents(documents)

            Chroma.from_documents(
                documents=chunks,
                embedding=self.embeddings,
                persist_directory=self.CHROMA_DIR,
                collection_name=collection_name,
            )
            logger.info("Ingested %d pages (%d chunks) into collection '%s'.",
                        len(documents), len(chunks), collection_name)
            return len(documents)

        except Exception as exc:
            logger.error("process_pdf failed for '%s': %s", file_path, exc)
            raise

    # ── Vector-store helpers ──────────────────────────────────────────────────

    def _get_vectorstore(self, collection_name: str) -> Chroma:
        return Chroma(
            persist_directory=self.CHROMA_DIR,
            embedding_function=self.embeddings,
            collection_name=collection_name,
        )

    def _build_qa_chain(self, collection_name: str, prompt: PromptTemplate) -> RetrievalQA:
        """Build a RetrievalQA chain for the given collection and prompt."""
        vs = self._get_vectorstore(collection_name)
        retriever = vs.as_retriever(search_kwargs={"k": self.TOP_K})
        return RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=retriever,
            return_source_documents=True,
            chain_type_kwargs={"prompt": prompt},
        )

    # ── Public RAG methods ────────────────────────────────────────────────────

    def ask_question(self, question: str, pdf_id: str) -> RAGResult:
        """
        Answer a question using the specified PDF's ChromaDB collection.

        Returns:
            (answer_text, source_page_numbers, source_paragraphs)
        """
        try:
            prompt = PromptTemplate(
                input_variables=["context", "question"],
                template=(
                    "Use the following context to answer the question.\n"
                    "If you don't know, say so — do not fabricate an answer.\n\n"
                    "Context:\n{context}\n\n"
                    "Question: {question}\n"
                    "Answer:"
                ),
            )
            chain = self._build_qa_chain(f"pdf_{pdf_id}", prompt)
            result = chain({"query": question})

            answer = result["result"]
            source_docs = result["source_documents"]
            source_pages = sorted(set(
                doc.metadata["page"] for doc in source_docs if "page" in doc.metadata
            ))
            source_paragraphs = [doc.page_content for doc in source_docs]

            return answer, source_pages, source_paragraphs

        except Exception as exc:
            logger.error("ask_question failed (pdf_id=%s): %s", pdf_id, exc)
            raise

    def _generate_from_pdf(self, pdf_id: str, task_prompt_template: str) -> str:
        """
        Generic helper that runs a generation task over a PDF's stored chunks.

        The template must contain {context} and {question} placeholders.
        A generic retrieval query is used to pull representative chunks.
        """
        try:
            prompt = PromptTemplate(
                input_variables=["context", "question"],
                template=task_prompt_template,
            )
            chain = self._build_qa_chain(f"pdf_{pdf_id}", prompt)
            result = chain({"query": "Provide a comprehensive overview of this document."})
            return result["result"]
        except Exception as exc:
            logger.error("_generate_from_pdf failed (pdf_id=%s): %s", pdf_id, exc)
            raise

    def generate_summary(self, pdf_id: str) -> str:
        """Generate a concise summary of the PDF."""
        return self._generate_from_pdf(pdf_id, (
            "Use the context below to write a concise but comprehensive summary.\n\n"
            "Context:\n{context}\n\n"
            "Summary:"
        ))

    def generate_interview_questions(self, pdf_id: str) -> str:
        """Generate 5 interview Q&A pairs from the PDF content."""
        return self._generate_from_pdf(pdf_id, (
            "Based on the context below, generate 5 challenging interview questions "
            "with detailed answers.\n\n"
            "Context:\n{context}\n\n"
            "Interview Questions and Answers:"
        ))

    def generate_quiz_questions(self, pdf_id: str) -> str:
        """Generate 5 multiple-choice quiz questions from the PDF content."""
        return self._generate_from_pdf(pdf_id, (
            "Based on the context below, generate 5 multiple-choice quiz questions. "
            "Each question should have 4 options (A–D) and indicate the correct answer.\n\n"
            "Context:\n{context}\n\n"
            "Quiz Questions:"
        ))

    def search_all_pdfs(self, question: str, pdf_ids: List[str]) -> RAGResult:
        """
        Perform a semantic search across *all* of the user's PDF collections
        and synthesise a single answer.

        Returns:
            (answer_text, source_page_numbers, source_paragraphs)
        """
        combined_docs = []
        try:
            for pid in pdf_ids:
                try:
                    vs = self._get_vectorstore(f"pdf_{pid}")
                    docs = vs.similarity_search(question, k=2)
                    combined_docs.extend(docs)
                except Exception as inner_exc:
                    # A missing collection (e.g. old PDF) should not abort the whole search
                    logger.warning("Skipping collection pdf_%s: %s", pid, inner_exc)

            if not combined_docs:
                return "No relevant content found across your uploaded PDFs.", [], []

            context = "\n\n".join(doc.page_content for doc in combined_docs)
            prompt_text = (
                f"Context from multiple documents:\n{context}\n\n"
                f"Question: {question}\n"
                f"Answer:"
            )
            response = self.llm.invoke(prompt_text).content

            source_pages = sorted(set(
                doc.metadata["page"] for doc in combined_docs if "page" in doc.metadata
            ))
            source_paragraphs = [doc.page_content for doc in combined_docs]

            return response, source_pages, source_paragraphs

        except Exception as exc:
            logger.error("search_all_pdfs failed: %s", exc)
            raise


# Singleton — imported by controllers
rag_service = RAGService()
