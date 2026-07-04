# Smart_PDF_Research_Assistant

Smart PDF Research Assistant is an AI-powered research tool designed to let users have natural-language conversations with their PDF documents instead of reading them manually. Combining Retrieval-Augmented Generation (RAG), vector search, and large language models, it enables users to ask questions, generate summaries, and create study material directly from uploaded PDFs. By grounding every answer in the actual document and citing the exact source page, it empowers researchers, students, legal professionals, and business analysts to extract knowledge faster and with full source verification.

## Table of Contents
- [Overview and Architecture](#overview-and-architecture)
- [Installation](#installation)
- [Setup](#setup)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Tech Stack](#tech-stack)

## Overview and Architecture

1. **Overview:**

   In response to the challenges researchers, students, legal professionals, and business analysts face when reading and extracting information from lengthy PDF documents, we propose the development of an AI-powered PDF Research Assistant. This assistant leverages Retrieval-Augmented Generation (RAG), vector embeddings, and large language models (LLMs) to make dense documents instantly searchable, summarizable, and queryable in natural language.

   **Key Features:**

   - Natural-Language Q&A: Users can ask questions about their uploaded PDF in plain language and receive accurate, human-like answers instead of relying on manual reading or keyword search.
   - Source-Cited Answers: Every answer returned by the assistant is backed by the exact page number and raw text from the document, eliminating AI hallucinations and building user trust.
   - Document Processing Pipeline: Uploaded PDFs are automatically parsed, split into chunks, and converted into vector embeddings so they can be searched semantically rather than by exact keyword match.
   - Semantic Search: The assistant uses cosine similarity over vector embeddings to retrieve the most relevant chunks of a document for any given question, understanding meaning rather than just matching words.
   - Global Search: Users can ask a single question and receive an answer synthesized across all of their uploaded PDFs simultaneously, instead of searching one document at a time.
   - Educational Augmentation: The assistant can automatically generate multiple-choice quizzes and interview questions based on the content of an uploaded document.
   - Secure Multi-User Access: Authentication is handled through JSON Web Tokens (JWT), with passwords hashed using bcrypt, and strict data isolation ensures users can never access another user's documents.
   - Chat History and Source Verification: All chat interactions are stored, and an expandable "Sources" panel lets users click and verify exactly which paragraphs the AI used to generate its answer.

2. **Architecture:**

   Architecture Diagram

   <!-- Add architecture diagram image here -->

   | Component            | Functionality                                                                          |
   |-----------------------|-----------------------------------------------------------------------------------------|
   | React Frontend        | - Handles PDF upload and chat UI. <br> - Displays source citations and chat history.     |
   | FastAPI Backend       | - Validates requests and handles authentication (JWT). <br> - Routes data between services. |
   | LangChain Orchestration | - Loads and parses PDFs. <br> - Splits text into chunks. <br> - Builds prompts for the LLM. |
   | MongoDB                | - Stores user accounts, PDF metadata, and chat history.                                 |
   | ChromaDB (Vector Store) | - Stores per-document text-chunk embeddings. <br> - Performs semantic similarity search. |
   | Google Gemini API      | - Generates text embeddings (Embedding-001). <br> - Generates the final answer (Gemini 1.5 Flash). |
   | End                    | - Returns the answer, source page numbers, and cited text to the user.                  |

## Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/<your-username>/Smart_PDF_Research_Assistant.git
   ```

2. **Install dependencies for the frontend:**

   ```sh
   cd frontend

   npm install
   ```

3. **Install dependencies for the backend:**

   ```sh
   cd backend

   pip install -r requirements.txt
   ```

## Setup

1. **Run the frontend:**

   - After installation, navigate to the frontend directory.
   - Run the following command to start the frontend:

     ```sh
     npm run dev
     ```
     Open your web browser and go to http://localhost:5173 to access the application.

2. **Run the backend:**

   - After installation, navigate to the backend directory.
   - Locate the `.env.example` file.
   - Rename `.env.example` to `.env`.
   - Open the `.env` file in a text editor and fill in the required values for the environment variables:

     ```
     MONGO_URI=mongodb://localhost:27017
     DATABASE_NAME=smart_pdf_assistant
     JWT_SECRET=your-very-secure-secret
     JWT_ALGORITHM=HS256
     ACCESS_TOKEN_EXPIRE_MINUTES=10080
     GEMINI_API_KEY=your-gemini-api-key-here
     ```

   - Run the following command to start the backend:

     ```sh
     uvicorn main:app --reload
     ```

## Usage

## Test Users:
### Normal User
- username: user
- email: user@example.com
- password: pass

### Admin
- username: admin
- email: admin@example.com
- password: pass

## Demo:
- Video link -

<!-- Add demo video / screenshots here -->

- Images

<!-- Add screenshots here -->

## API Documentation

- Link:

## Tech Stack
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54) ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E) ![Markdown](https://img.shields.io/badge/markdown-%23000000.svg?style=for-the-badge&logo=markdown&logoColor=white) ![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white) ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white) ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white) ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi) ![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
### Additional :
- LangChain
- ChromaDB
- Google Gemini (Gemini 1.5 Flash / Embedding-001)
## Demonstration Video
- Video link -