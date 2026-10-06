# ThinkFlow AI System Architecture

ThinkFlow AI is an AI-powered visual thinking, planning, and execution platform built to convert ambiguous ideas into actionable, dependency-mapped, editable execution roadmaps.

---

## 1. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                             React 19 + Vite                                 |  |
|  |                                                                             |  |
|  |  +--------------------+  +--------------------+  +-----------------------+  |  |
|  |  |  React Flow Canvas |  |  Gantt Timeline    |  |  5x5 Risk Matrix Ctr  |  |  |
|  |  +--------------------+  +--------------------+  +-----------------------+  |  |
|  |  +--------------------+  +--------------------+  +-----------------------+  |  |
|  |  |  Kanban Execution  |  |  ADR Decision Log  |  |  AI Challenge / Alts  |  |  |
|  |  +--------------------+  +--------------------+  +-----------------------+  |  |
|  +-----------------------------------------------------------------------------+  |
+----------------------------------------+------------------------------------------+
                                         | REST API (JSON + Bearer JWT)
                                         v
+-----------------------------------------------------------------------------------+
|                                 BACKEND TIER                                      |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                            FastAPI REST Engine                              |  |
|  |                                                                             |  |
|  |  [Auth / Security]  -->  [Project Router]  -->  [AI Generation Orchestrator] |  |
|  |  [Task / Risk CRUD] -->  [Version History] -->  [Document RAG Ingestion]    |  |
|  +-----------------------------------------------------------------------------+  |
|                                        |                                          |
|            +---------------------------+---------------------------+              |
|            |                                                       |              |
|            v                                                       v              |
|  +--------------------+                               +-------------------------+ |
|  | Database Layer     |                               | AI Provider Abstraction | |
|  | SQLAlchemy 2.0     |                               | (Pydantic Schema Output)| |
|  | Async Engine       |                               +-------------------------+ |
|  +---------+----------+                               | OpenAI (GPT-4o)         | |
|            |                                          | Google Gemini           | |
|            |                                          | Anthropic Claude        | |
|            |                                          | Built-in Simulation     | |
|            |                                          +-------------------------+ |
+------------|-------------------------------------------------------+--------------+
             |
             v
+-----------------------------------------------------------------------------------+
|                                 DATA TIER                                         |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | PostgreSQL 16 (Production) / SQLite + aiosqlite (Dev)                       |  |
|  | - users, projects, phases, tasks, dependencies, risks, milestones,          |  |
|  |   resources, decisions, documents, chunks, versions, activity_logs          |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Component Breakdown

### Frontend (`frontend/`)
- **React 19 & TypeScript**: Component-driven architecture using functional components and custom hooks (`useAuth`, `useProject`).
- **React Flow (`@xyflow/react`)**: Interactive node graph editor with custom node renderers (`IdeaNode`, `ObjectiveNode`, `PhaseNode`, `TaskNode`, `RiskNode`, `DecisionNode`, `MilestoneNode`, `ResourceNode`) and automatic DAG layout using Dagre.
- **Tailwind CSS v4**: Theme tokens with high-contrast dark mode, glassmorphism (`backdrop-blur-md`), and glowing accent indicators.
- **Framer Motion**: Micro-interactions, slide-out drawer drawers, and animated phase progress bars.

### Backend (`backend/app/`)
- **FastAPI**: Asynchronous web server handling route dispatching, request validation, and OpenAPI documentation generation.
- **AI Orchestration (`app/ai/`)**: Multi-provider LLM connector conforming to a standardized `AIProvider` base interface with automated fallback, JSON repair, and strict Pydantic v2 validation.
- **RAG Engine (`app/ai/rag_engine.py`)**: Document text extraction, semantic chunking, cosine similarity vector search, and context augmentation for grounding project generation.
- **SQLAlchemy 2.0 Async (`app/models/models.py`)**: Relational database persistence with clean foreign keys, cascading deletes, and indexed search queries.
