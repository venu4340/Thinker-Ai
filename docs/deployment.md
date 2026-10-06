# Deployment Guide

---

## Prerequisites

- Docker & Docker Compose installed (for containerized deployment)
- Node.js 20+ and Python 3.11+ (for local development without Docker)
- PostgreSQL 16 (for production; SQLite is used for local dev by default)

---

## Option 1: Local Development (Recommended for Development)

### 1. Clone and set up environment
```bash
git clone <repository-url>
cd thinkflow-ai
cp .env.example backend/.env
```
Edit `backend/.env` and set:
- `AI_PROVIDER=simulation` (zero-cost, no API key needed for testing)
- Or set `AI_PROVIDER=openai` and populate `OPENAI_API_KEY`

### 2. Start Backend
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\Activate.ps1

# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`  
API docs: `http://localhost:8000/docs`

### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

### 4. Demo Login
- **Email**: `demo@thinkflow.ai`
- **Password**: `demo12345`
- Includes a fully populated demo project visible on the Dashboard.

---

## Option 2: Docker Compose (Full Stack)

```bash
# From root directory
docker compose up --build
```

Services:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

### Pass real AI provider keys to Docker:
```bash
OPENAI_API_KEY=sk-... docker compose up --build
```

---

## Option 3: Production Deployment

### Backend — Render / Railway / Fly.io
1. Set environment variables in the platform dashboard.
2. Set `DATABASE_URL` to a managed PostgreSQL connection string.
3. Deploy from `backend/` directory using the included `Dockerfile`.

### Frontend — Vercel / Netlify
1. Set the Vite environment variable:
   ```
   VITE_API_URL=https://your-backend-domain.com
   ```
2. Build command: `npm run build`
3. Publish directory: `dist`

### Environment Variables for Production
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Minimum 32-character secret |
| `AI_PROVIDER` | ✅ | `openai` / `gemini` / `anthropic` / `simulation` |
| `OPENAI_API_KEY` | If using OpenAI | GPT-4o API key |
| `GEMINI_API_KEY` | If using Gemini | Google AI API key |
| `ANTHROPIC_API_KEY` | If using Anthropic | Claude API key |
