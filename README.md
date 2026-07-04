# 🧠 Smart PDF Research Assistant

> A full-stack AI-powered PDF Q&A system built with **React**, **FastAPI**, **MongoDB**, **ChromaDB**, **LangChain**, and **Google Gemini**.

---

## ✨ Features

### Frontend
| Feature | Details |
|---|---|
| **Auth pages** | Animated Login & Signup with JWT |
| **Dashboard** | Sidebar + main panel layout |
| **PDF Sidebar** | List, select, and delete uploaded PDFs |
| **Upload** | Drag-and-drop with progress states |
| **Chat Interface** | ChatGPT-style Q&A with markdown rendering |
| **Source Pages** | Every answer shows the pages it came from |
| **Source Text** | Expandable accordion with raw PDF extracts |
| **Document Summary** | One-click AI summary in the chat |
| **Interview Questions** | One-click AI interview Q&A generation |
| **Quiz Questions** | One-click multiple-choice quiz generation |
| **Export Chat** | Download full conversation as `.txt` |
| **Global Search** | Ask questions across *all* uploaded PDFs |
| **Dark / Light mode** | Persisted preference, toggle in sidebar |
| **Mobile responsive** | Collapsible sidebar, fluid layout |

### Backend
| Feature | Details |
|---|---|
| **JWT Auth** | Register, login, 7-day access tokens |
| **Sessions** | Login events stored in MongoDB |
| **PDF Upload** | Saved to `uploads/`, indexed in MongoDB |
| **LangChain RAG** | PyPDFLoader → RecursiveCharacterTextSplitter → Gemini Embeddings → ChromaDB → RetrievalQA |
| **ChromaDB** | One collection per PDF, persistent on disk |
| **Chat History** | Every Q&A saved to MongoDB with source pages + paragraphs |
| **Summary** | Gemini-generated document summary |
| **Interview Qs** | Gemini-generated interview questions |
| **Quiz Qs** | Gemini-generated multiple-choice quiz |
| **Global Search** | Cross-collection vector search across all user PDFs |
| **Export** | Chat history exported as formatted plain text |
| **Logging** | Structured logger with timestamps across all layers |
| **Proper errors** | HTTP status codes + detailed messages throughout |

---

## 🏗 Architecture

```
Smart-PDF-Research-Assistant-LangChain-/
│
├── backend/                        # FastAPI application
│   ├── main.py                     # App entry point (lifespan, CORS, routers)
│   ├── .env.example                # Copy to .env and fill in your keys
│   ├── requirements.txt
│   │
│   ├── config/
│   │   ├── settings.py             # Pydantic Settings (env vars)
│   │   └── db.py                   # Motor async MongoDB connection
│   │
│   ├── models/                     # Pydantic request/response schemas
│   │   ├── user.py
│   │   ├── pdf.py
│   │   ├── chat.py
│   │   └── session.py
│   │
│   ├── routes/                     # Thin HTTP handlers (FastAPI APIRouter)
│   │   ├── auth.py
│   │   ├── pdf.py
│   │   └── chat.py
│   │
│   ├── controllers/                # Business logic, DB calls
│   │   ├── auth_controller.py
│   │   ├── pdf_controller.py
│   │   └── chat_controller.py
│   │
│   ├── services/
│   │   └── rag_service.py          # LangChain + ChromaDB + Gemini pipeline
│   │
│   └── utils/
│       ├── auth_utils.py           # JWT helpers + get_current_user dependency
│       └── logger.py               # Centralised structured logger
│
├── frontend/                       # React + Vite + Tailwind v4
│   └── src/
│       ├── context/
│       │   ├── AuthContext.jsx     # JWT state, login/logout/register
│       │   └── ThemeContext.jsx    # dark/light toggle
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Signup.jsx
│       │   └── Dashboard.jsx
│       └── components/
│           ├── Sidebar.jsx         # PDF list, upload trigger, theme, logout
│           ├── PdfUploader.jsx     # Drag-and-drop uploader with states
│           └── ChatInterface.jsx   # Full chat UI with toolbar
│
├── uploads/                        # PDF files stored here (created at runtime)
├── chroma_db/                      # ChromaDB persistence (created at runtime)
└── README.md
```

---

## 🗄 MongoDB Collections

| Collection | Fields |
|---|---|
| `users` | `username`, `email`, `password` (hashed), `created_at` |
| `pdfs` | `filename`, `upload_date`, `total_pages`, `user_id` |
| `chats` | `question`, `answer`, `timestamp`, `pdf_id`, `user_id`, `source_pages`, `source_paragraphs` |
| `sessions` | `user_id`, `token`, `login_time`, `is_active` |

---

## ⚙️ Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas URI)
- Google Gemini API key → [get one here](https://aistudio.google.com/app/apikey)

### 1. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=<your-key>
```

**`backend/.env`**
```env
MONGO_URI=mongodb://localhost:27017
DATABASE_NAME=smart_pdf_assistant
JWT_SECRET=replace-with-a-strong-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
GEMINI_API_KEY=your-google-gemini-api-key-here
```

```bash
# Start the API server
uvicorn main:app --reload
# → http://localhost:8000
# → API docs: http://localhost:8000/docs
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## 🔌 API Reference

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get JWT token |
| GET | `/api/auth/me` | Current user profile |

### PDF
| Method | Path | Description |
|---|---|---|
| POST | `/api/pdf/upload` | Upload & process PDF |
| GET | `/api/pdf/` | List user's PDFs |
| DELETE | `/api/pdf/{id}` | Delete a PDF |
| GET | `/api/pdf/{id}/summary` | AI document summary |
| GET | `/api/pdf/{id}/interview-questions` | AI interview Q&A |
| GET | `/api/pdf/{id}/quiz-questions` | AI multiple-choice quiz |

### Chat
| Method | Path | Description |
|---|---|---|
| POST | `/api/chat/ask` | Ask a question (single PDF or all) |
| GET | `/api/chat/history/{pdf_id}` | Fetch chat history |
| GET | `/api/chat/export/{pdf_id}` | Export chat as plain text |

> Interactive Swagger docs available at **http://localhost:8000/docs**

---

## 🛠 LangChain Pipeline

```
PDF File
  ↓ PyPDFLoader
Pages (with metadata)
  ↓ RecursiveCharacterTextSplitter (1 000 chars, 200 overlap)
Chunks
  ↓ GoogleGenerativeAIEmbeddings (models/embedding-001)
Vectors
  ↓ Chroma.from_documents (persist_directory=../chroma_db)
ChromaDB Collection (one per PDF)
  ↓ similarity_search (k=5) on question
Top-K Chunks → RetrievalQA (stuff chain) → ChatGoogleGenerativeAI (gemini-1.5-flash)
Answer + Source Documents (pages + paragraph text)
```

---

## 🚀 Quick Start (both servers)

```bash
# Terminal 1 — Backend
cd backend && source venv/bin/activate && uvicorn main:app --reload

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Then open **http://localhost:5173**, register an account, upload a PDF, and start chatting!