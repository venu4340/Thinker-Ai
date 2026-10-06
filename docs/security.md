# Security Architecture

ThinkFlow AI implements defense-in-depth across all layers.

---

## Authentication & Authorization

### JWT Authentication
- JSON Web Tokens signed with `HS256` algorithm using a configurable secret key.
- Access tokens expire in 24 hours (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`).
- Tokens are stored in `localStorage` on the frontend and sent via `Authorization: Bearer <token>` header.
- All sensitive API endpoints require a valid token verified by `get_current_user` dependency.

### Password Security
- Passwords hashed with **Bcrypt** (cost factor 12) before storage.
- Plain passwords are never logged or stored.
- Minimum password length enforced at the schema level (Pydantic validator).

### Authorization Checks
- Every project-scoped endpoint verifies the authenticated user is either the **project owner** or an **explicit project member**.
- Cross-user project access is rejected with `403 Forbidden`.

---

## Input Security

### SQL Injection Protection
- All database queries use SQLAlchemy ORM parameterized statements.
- Raw SQL strings are never constructed from user input.

### Prompt Injection Defense
- Uploaded document content is **never** injected directly as a system instruction.
- Document chunks are wrapped with clear delimiters marking them as untrusted external content.
- System prompts are always prepended with provider instructions that establish AI role context before user data.

### File Upload Security
- MIME type validation enforces allowed types: `application/pdf`, `text/plain`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/markdown`.
- Maximum file size enforced at 10 MB (configurable via `MAX_UPLOAD_SIZE_MB`).
- Filenames are sanitized and stored with UUID-prefixed paths to prevent path traversal.

---

## API Security

### Rate Limiting
- FastAPI `slowapi` middleware is configured with sensible per-IP rate limits for auth and AI generation endpoints.
- AI generation endpoints have conservative limits to prevent API cost abuse.

### CORS
- CORS origins are explicitly configured via the `BACKEND_CORS_ORIGINS` environment variable.
- Default allows only `localhost:5173` (frontend dev) and `localhost:3000`.
- Wildcard `*` origins are **never** permitted in production configuration.

---

## Environment Security

- **API keys** are read exclusively from environment variables (`.env` file or platform secrets).
- API keys are **never** forwarded to the frontend.
- The `/api/v1/` prefix scopes all API endpoints cleanly from static file serving.

---

## AI Safety

- AI-generated plans are **recommendations only** — no generated content automatically executes system commands.
- Generated task names and descriptions are rendered as text content, never as executable code or HTML.
- The critical reviewer ("Challenge My Plan") explicitly surfaces unrealistic assumptions and failure points, preventing overconfidence in AI outputs.
- All AI confidence indicators in the UI are clearly labeled as **AI estimates**, not facts.
