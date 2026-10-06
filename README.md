<div align="center">

# 🧠 ThinkFlow AI

### AI-Powered Visual Thinking, Planning & Execution Platform

*Transform ambiguous ideas into structured, editable, dependency-mapped visual execution plans.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

---

</div>

## 🚀 What is ThinkFlow AI?

ThinkFlow AI solves a universal problem: **people have ideas but don't know how to convert them into structured execution plans.**

Input a vague idea in any domain:
> *"I want to build an AI-powered food delivery platform"*

And ThinkFlow AI produces a complete, interactive visual roadmap:

```
IDEA → OBJECTIVES → PHASES → TASKS → DEPENDENCIES → RISKS → TIMELINE → MILESTONES → METRICS
```

Every element is **editable**, **dependency-linked**, and **AI-assistable** — not a static infographic.

---

## ✨ Feature Highlights

| Feature | Description |
|---|---|
| 🎨 **Visual Node Canvas** | React Flow-powered drag-and-drop graph with 8 custom node types, auto-layout, minimap, and zoom |
| 🤖 **AI Plan Generation** | Converts free-text ideas into validated, structured JSON execution plans |
| 🔴 **Red-Team Reviewer** | "Challenge My Plan" uses adversarial AI to expose assumptions and failure points |
| 🗺️ **Multi-Strategy Generator** | Generate 3 strategic approaches (Low-cost, Fastest, Scalable) and compare them |
| 📊 **Gantt Timeline** | Visual timeline with dependency-aware task scheduling |
| ⚠️ **Risk Matrix Center** | Interactive 5×5 probability/impact heat-map with AI risk discovery |
| 🃏 **Kanban Execution Board** | Drag-and-drop task management with `todo → in_progress → completed → blocked` states |
| 📋 **ADR Decision Log** | Architectural Decision Records to capture the *why* behind key choices |
| 📄 **Document RAG** | Upload PDFs/DOCX → extract → chunk → embed → generate plans grounded in your own documents |
| 📜 **Version History** | Every major AI change creates a restorable snapshot |
| 📤 **Export** | Export to PDF, Markdown, CSV, or JSON project report |
| 🎯 **Demo Mode** | Works immediately with zero API key — built-in simulation engine generates realistic plans |
| 🔒 **JWT Auth** | Secure registration, login, and per-project authorization |

---

## 🏗️ Architecture

```
React 19 + Vite (Frontend)
        ↓  REST API (JWT)
FastAPI + SQLAlchemy 2.0 (Backend)
        ↓
AI Orchestrator (Provider Abstraction)
        ↓
OpenAI / Gemini / Anthropic / Simulation
        ↓
Pydantic v2 Schema Validation
        ↓
PostgreSQL / SQLite (Database)
        ↓
React Flow Visualization
```

For detailed architecture documentation, see [`docs/architecture.md`](docs/architecture.md).

---

## 🛠️ Tech Stack

### Frontend
- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4** — Dark-mode design system with glassmorphism
- **@xyflow/react** (React Flow v12) — Interactive node graph canvas
- **Framer Motion** — Micro-animations and transitions
- **Lucide React** — Icon library

### Backend
- **Python 3.11+** + **FastAPI** + **Pydantic v2**
- **SQLAlchemy 2.0** (async) — ORM with PostgreSQL + SQLite support
- **PyJWT** + **Bcrypt** — Authentication & password security
- **aiosqlite** / **asyncpg** — Async database drivers

### AI
- **Modular provider abstraction**: OpenAI, Google Gemini, Anthropic Claude
- **Built-in Simulation Engine** — Zero-cost offline plan generation
- **RAG pipeline**: Document chunking, cosine similarity vector search, context-augmented generation

### DevOps
- **Docker** + **Docker Compose** — Full-stack containerization
- **PostgreSQL 16** — Production database
- **Nginx** — Frontend production web server

---

## ⚡ Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+

### 1. Clone the repository
```bash
git clone <repository-url>
cd thinkflow-ai
```

### 2. Set up the backend
```bash
cd backend

# Create virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt

# Copy environment file
cp ../.env.example .env
# Edit .env if needed (AI_PROVIDER=simulation works with no API keys)

# Start the server (database auto-initializes with demo data)
uvicorn app.main:app --reload --port 8000
```

### 3. Set up the frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Open the application
- **App**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs

### 5. Demo Login
```
Email:    demo@thinkflow.ai
Password: demo12345
```
The demo account includes a fully-populated project with canvas, timeline, risks, and tasks ready to explore.

---

## 🔑 Environment Variables

Copy `.env.example` to `backend/.env` and configure:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | SQLite (local) | PostgreSQL connection string for production |
| `JWT_SECRET` | *(set this!)* | Min 32-character secret for token signing |
| `AI_PROVIDER` | `simulation` | `simulation`, `openai`, `gemini`, or `anthropic` |
| `OPENAI_API_KEY` | *(optional)* | Required only if `AI_PROVIDER=openai` |
| `GEMINI_API_KEY` | *(optional)* | Required only if `AI_PROVIDER=gemini` |
| `ANTHROPIC_API_KEY` | *(optional)* | Required only if `AI_PROVIDER=anthropic` |

---

## 🤖 AI Provider Setup

### Option A: Demo Mode (Recommended to start)
```env
AI_PROVIDER=simulation
```
No API key needed. The built-in domain-aware simulation engine generates rich, realistic plans instantly.

### Option B: OpenAI (Best quality)
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

### Option C: Google Gemini
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSy...
```

### Option D: Anthropic Claude
```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 🗄️ Database Setup

### SQLite (Default — Development)
No setup needed. The database file (`thinkflow.db`) is auto-created in the `backend/` directory on first startup.

### PostgreSQL (Production)
```bash
createdb thinkflow_ai
# Set DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/thinkflow_ai
# Tables are auto-created on startup via SQLAlchemy
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

Tests cover:
- ✅ AI schema validation (Pydantic v2)
- ✅ Simulation plan generation
- ✅ Authentication (register, login, JWT validation)
- ✅ Plan generation and critical review APIs
- ✅ Markdown export service

### Frontend Type Check
```bash
cd frontend
npm run build  # TypeScript compilation + Vite build
```

---

## 🐳 Docker Deployment

```bash
# Full stack with PostgreSQL
docker compose up --build

# With real AI provider:
OPENAI_API_KEY=sk-... docker compose up --build
```

Services:
| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

---

## 📁 Project Structure

```
thinkflow-ai/
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── prompts/          # Versioned prompt modules
│   │   │   ├── base.py           # AI provider interface
│   │   │   ├── orchestrator.py   # Provider selection & retry logic
│   │   │   ├── rag_engine.py     # Document RAG pipeline
│   │   │   ├── schemas.py        # Pydantic output schemas
│   │   │   └── *_provider.py     # OpenAI/Gemini/Anthropic/Simulation
│   │   ├── api/                  # FastAPI route handlers
│   │   ├── core/                 # Config, security, logging
│   │   ├── database/             # SQLAlchemy session & init
│   │   ├── models/               # ORM models
│   │   ├── schemas/              # Request/response Pydantic schemas
│   │   └── services/             # Business logic layer
│   ├── tests/                    # pytest test suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ai/               # AI modals (Challenge, Alternatives, Progress)
│   │   │   ├── canvas/           # React Flow nodes, toolbar, detail drawer
│   │   │   ├── decisions/        # ADR Decision Log view
│   │   │   ├── documents/        # Document uploader modal
│   │   │   ├── export/           # Export modal
│   │   │   ├── layout/           # Navbar, Sidebar, Command Palette
│   │   │   ├── resources/        # Resource center view
│   │   │   ├── risks/            # 5×5 Risk matrix
│   │   │   ├── tasks/            # Kanban board
│   │   │   ├── timeline/         # Gantt timeline
│   │   │   ├── ui/               # Button, Card, Badge, Dialog atoms
│   │   │   └── versions/         # Version history modal
│   │   ├── context/              # AuthContext, ProjectContext
│   │   ├── pages/                # Landing, Login, Register, Dashboard, Project
│   │   ├── services/             # api.ts HTTP client
│   │   └── types/                # TypeScript interfaces
│   └── package.json
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── ai-pipeline.md
│   ├── rag.md
│   ├── security.md
│   └── deployment.md
├── docker-compose.yml
├── .env.example
├── .gitignore
├── LICENSE
├── CONTRIBUTING.md
└── README.md
```

---

## 🗺️ Roadmap

- [ ] Real-time collaboration (WebSocket / CRDT)
- [ ] pgvector for production-grade semantic search
- [ ] AI voice input for idea capture
- [ ] Project sharing and public link generation
- [ ] Slack / Jira / Notion integrations
- [ ] Advanced Gantt with critical path highlighting
- [ ] Native mobile app (React Native)

---

## 📄 License

MIT — see [LICENSE](LICENSE).

---

<div align="center">

**Built with ❤️ as a serious full-stack AI engineering portfolio project.**

*From idea to execution plan — in seconds.*

</div>
