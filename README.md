# 🧠 Smart PDF Research Assistant

> A full-stack AI-powered PDF Q&A system built with **React**, **FastAPI**, **MongoDB**, **ChromaDB**, **LangChain**, and **Google Gemini**.

---

## 🛑 The Problem Statement

Researchers, students, and professionals often struggle to extract specific information, summaries, and actionable insights from lengthy, dense, and complex PDF documents. Manually reading, annotating, and parsing through hundreds of pages is a time-consuming, inefficient process that stifles productivity. Furthermore, synthesizing knowledge across *multiple* documents simultaneously is nearly impossible without specialized tools.

## 💡 The Solution

To solve this, I developed the **Smart PDF Research Assistant**—an intelligent, agentic document analysis platform. This application leverages advanced **Retrieval-Augmented Generation (RAG)** to transform static PDFs into interactive knowledge bases. 

Instead of reading a document manually, users can "chat" with their PDFs, instantly generate summaries, automatically create study quizzes, and extract interview questions. By combining **LangChain**, **Google Gemini**, and **ChromaDB**, the system deeply understands document semantics, allowing users to cross-reference multiple PDFs at once and trace every AI-generated answer back to the exact source page and paragraph.

---

## 🤖 AI Agents in Detail

The system is powered by a suite of specialized AI Agents (orchestrated via LangChain and Gemini) designed to handle specific cognitive tasks based on the document context.

| Agent Name | Functionality & Detail |
|---|---|
| **🗣️ RAG Q&A Agent** | Handles interactive conversational queries. It embeds the user's question, performs a similarity search in ChromaDB, retrieves the top-K most relevant document chunks, and synthesizes a precise answer using Gemini 1.5 Flash. It provides exact source page numbers and extracted paragraphs to prevent hallucinations. |
| **📝 Summarization Agent** | Designed for rapid comprehension. It retrieves representative chunks of a document and prompts the LLM to generate a comprehensive, concise, and structured overview of the entire PDF file. |
| **🎯 Interview Question Agent** | Acts as an automated recruiter or examiner. It scans the document's technical or factual context and formulates 5 challenging, high-level interview questions along with their detailed answers. |
| **🎓 Quiz Generation Agent** | Acts as a study assistant. It digests the PDF content and generates a 5-question multiple-choice quiz. Each question includes 4 plausible options (A-D) and explicitly identifies the correct answer. |
| **🌐 Global Search Agent** | The most powerful agent in the system. It breaks the boundaries of single documents by performing cross-collection semantic vector searches across *all* of a user's uploaded PDFs simultaneously, synthesizing a single unified answer from multiple disparate sources. |

---

## 🏗️ Step-by-Step: How the Project is Made

The architecture follows a clean, decoupled, and scalable full-stack approach. Here is how the project was structured and built step-by-step:

### Phase 1: The Foundation (Data Layer)
1. **MongoDB Setup**: Configured a NoSQL database to persistently store user credentials (hashed), PDF metadata, session tokens, and a complete history of all chat Q&As.
2. **ChromaDB Setup**: Initialized a local vector database to store document embeddings. Each uploaded PDF gets its own dedicated ChromaDB collection for isolated, high-speed retrieval.

### Phase 2: The Brain (AI & RAG Pipeline)
1. **Document Ingestion**: Implemented LangChain's `PyPDFLoader` to parse uploaded PDFs.
2. **Text Chunking**: Used `RecursiveCharacterTextSplitter` (1000 chars, 200 overlap) to break pages into semantic chunks.
3. **Embeddings**: Passed chunks through `GoogleGenerativeAIEmbeddings` to convert text into vector representations and stored them in ChromaDB.
4. **RetrievalQA Chains**: Built LangChain pipelines to retrieve context and feed it to the `ChatGoogleGenerativeAI` (Gemini Flash) model based on custom prompt templates for Q&A, Summaries, Quizzes, and Interviews.

### Phase 3: The Backend (FastAPI Layer)
1. **RESTful Routes**: Created thin, asynchronous routing endpoints using FastAPI for Authentication (`/api/auth`), PDF Management (`/api/pdf`), and Chat (`/api/chat`).
2. **Controllers & Services**: Separated business logic into controllers (DB operations) and services (the `rag_service.py` singleton) to maintain clean code architecture.
3. **Security**: Integrated robust JWT authentication and session tracking.

### Phase 4: The Frontend (React & Tailwind)
1. **User Interface**: Built a highly responsive, modern dashboard using React and Tailwind CSS v4.
2. **State Management**: Implemented React Context (`AuthContext`, `ThemeContext`) to handle global state like user sessions and dark/light mode toggles.
3. **Interactive Components**: Developed a drag-and-drop PDF uploader, a ChatGPT-style markdown-rendering chat interface, and expandable accordions to view raw source text.

---

## ✨ Features Summary

### Frontend Features
| Feature | Details |
|---|---|
| **Auth Pages** | Animated Login & Signup with JWT |
| **Dashboard** | Sidebar + main panel layout |
| **PDF Management** | List, select, and delete uploaded PDFs securely |
| **Upload** | Drag-and-drop with progress states |
| **Chat Interface** | ChatGPT-style Q&A with markdown rendering |
| **Source Tracking** | Every answer shows exact pages and raw text extracts |
| **One-Click Tools** | Instantly generate Summaries, Interview Qs, and Quizzes |
| **Global Search** | Ask questions across *all* uploaded PDFs |
| **Dark/Light Mode** | Persisted UI preference |

### Backend Features
| Feature | Details |
|---|---|
| **JWT Auth** | Register, login, and secure access tokens |
| **FastAPI Engine** | High-performance async Python backend |
| **LangChain RAG** | PyPDFLoader → TextSplitter → Gemini → ChromaDB → RetrievalQA |
| **Persistent Storage** | ChromaDB collections saved to disk; Chat histories in MongoDB |
| **Global Cross-Search** | Vector search mapped across multiple user collections |
| **Structured Logging** | Comprehensive logging with timestamps across all layers |

---

## ⚙️ How to Start the Project (Step-by-Step Details)

Follow these exact steps to get both the backend AI engine and the frontend UI running on your local machine.

### Prerequisites
Before you begin, ensure you have the following installed:
- **Python 3.10+** (For the FastAPI AI backend)
- **Node.js 18+** (For the React frontend)
- **MongoDB** (Running locally on `mongodb://localhost:27017` or an Atlas Cloud URI)
- **Google Gemini API Key** → [Get your free API key here](https://aistudio.google.com/app/apikey)

---

### Step 1: Configure and Start the Backend

The backend manages the database, authenticates users, and communicates with Google Gemini.

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a Python virtual environment:**
   ```bash
   # On macOS/Linux
   python -m venv venv
   source venv/bin/activate
   
   # On Windows
   python -m venv venv
   venv\Scripts\activate
   ```

3. **Install the required Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables:**
   - Copy the example environment file:
     ```bash
     cp .env.example .env
     ```
   - Open the `.env` file in a text editor and add your secure keys. It should look like this:
     ```env
     MONGO_URI=mongodb://localhost:27017
     DATABASE_NAME=smart_pdf_assistant
     JWT_SECRET=replace-with-a-strong-random-secret
     JWT_ALGORITHM=HS256
     ACCESS_TOKEN_EXPIRE_MINUTES=10080
     GEMINI_API_KEY=your-google-gemini-api-key-here
     ```

5. **Run the FastAPI Server:**
   ```bash
   uvicorn main:app --reload
   ```
   *The backend is now running at `http://localhost:8000`. You can view the interactive Swagger API documentation at `http://localhost:8000/docs`.*

---

### Step 2: Configure and Start the Frontend

The frontend provides the interactive user dashboard.

1. **Open a new terminal window** (leave the backend running) and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the Vite development server:**
   ```bash
   npm run dev
   ```
   *The frontend is now running at `http://localhost:5173`.*

---

### Step 3: Use the Application

1. Open your web browser and go to **`http://localhost:5173`**.
2. Create a new account using the **Sign Up** page.
3. Log in to access the main Dashboard.
4. Drag and drop a PDF file into the sidebar to upload it.
5. Wait for the LangChain pipeline to process the file.
6. Select the file and start asking questions, or click the buttons to generate summaries, quizzes, and interview questions!

---

## 🗄️ Database Schemas (MongoDB)

| Collection | Description | Stored Fields |
|---|---|---|
| `users` | User accounts and credentials | `username`, `email`, `password` (hashed), `created_at` |
| `pdfs` | Metadata for uploaded documents | `filename`, `upload_date`, `total_pages`, `user_id` |
| `chats` | History of all AI Q&A interactions | `question`, `answer`, `timestamp`, `pdf_id`, `user_id`, `source_pages`, `source_paragraphs` |
| `sessions` | Active login sessions | `user_id`, `token`, `login_time`, `is_active` |