# Contributing to ThinkFlow AI

Thank you for your interest in contributing to **ThinkFlow AI**! This document provides guidelines and steps for setting up your local environment and submitting changes.

---

## 🛠️ Development Setup

### Prerequisites
- **Node.js**: v18+ (Node 20+ recommended)
- **Python**: v3.11+ (Python 3.12/3.14 supported)
- **npm** or **pnpm**
- **Docker & Docker Compose** (optional, for containerized workflows)

---

## 🚀 Running Locally

### 1. Backend Setup
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
The API documentation is available at `http://localhost:8000/docs`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The application will be accessible at `http://localhost:5173`.

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Typecheck & Build
```bash
cd frontend
npm run build
```

---

## 📐 Coding Standards

- **Backend**:
  - Code formatted with standard PEP 8 conventions.
  - Strict type hints on all functions and API route parameters.
  - Async SQLAlchemy sessions with explicit commit/refresh lifecycle.
  - AI responses validated strictly via Pydantic v2 schemas.

- **Frontend**:
  - React 19 + TypeScript with strict typing.
  - Modular component structure with atomic design patterns.
  - Tailwind CSS v4 styling adhering to unified dark theme design tokens.
  - Custom React Flow nodes for visualization canvas.

---

## 🌿 Pull Request Process

1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feature/my-new-feature
   ```
2. Ensure backend tests pass and frontend builds cleanly.
3. Commit with concise, descriptive commit messages.
4. Push to your fork and submit a Pull Request with a summary of changes.
