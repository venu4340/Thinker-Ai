# RAG (Retrieval-Augmented Generation) Architecture

ThinkFlow AI supports document-grounded planning via a built-in RAG pipeline that allows users to upload requirements documents, research papers, or specifications and generate plans directly from them.

---

## RAG Pipeline Flow

```
User Uploads Document
       |
       v
+---------------------+
| Text Extraction     |  <- PDF (pdfplumber), TXT, DOCX (python-docx), Markdown
+---------------------+
       |
       v
+---------------------+
| Chunking            |  <- Fixed-size sliding window: 512 tokens,
|                     |     50-token overlap for context continuity
+---------------------+
       |
       v
+---------------------+
| Embedding Model     |  <- Provider-specific embeddings (OpenAI text-embedding-3-small,
|                     |     Gemini embedding-001, or built-in hash-based simulation)
+---------------------+
       |
       v
+---------------------+
| Vector Storage      |  <- Stored in `document_chunks` table as JSON float arrays
|                     |     Production: PostgreSQL + pgvector extension
+---------------------+

----- At Generation Time -----

Project Context + User Query
       |
       v
+---------------------+
| Query Embedding     |  <- Encode user query with same embedding model
+---------------------+
       |
       v
+---------------------+
| Similarity Search   |  <- Cosine similarity against stored chunk embeddings
| (Top-K retrieval)   |     Returns top 5 most relevant chunks
+---------------------+
       |
       v
+---------------------+
| Context Augmentation|  <- Inject retrieved chunks into planner prompt
+---------------------+
       |
       v
+---------------------+
| LLM Generation      |  <- Grounded plan generation using document context
+---------------------+
```

---

## Vector Database Configuration

| Mode | Configuration |
|---|---|
| **Development** | SQLite + JSON float array cosine similarity (built-in) |
| **Production** | PostgreSQL + pgvector extension (`vector` column type) |

### Enabling pgvector (Production)
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## Security Considerations

- Uploaded document content is **treated as untrusted data**.
- Text is extracted, chunked, and stored — **never executed**.
- Document content is injected into prompts with clear system-level boundaries to prevent prompt injection attacks.
- Maximum file size enforced at API gateway level (default: 10 MB).
- Accepted file types validated by MIME type and extension whitelist: `.pdf`, `.txt`, `.docx`, `.md`.
