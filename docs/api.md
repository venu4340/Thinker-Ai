# ThinkFlow AI API Specification

All endpoints are hosted under `/api/v1` and require JSON request and response bodies unless otherwise specified. Authentication is handled via `Bearer <JWT_TOKEN>` in the `Authorization` header.

Interactive Swagger/OpenAPI documentation is available live at `http://localhost:8000/docs`.

---

## 1. Authentication Endpoints (`/api/v1/auth`)

### `POST /api/v1/auth/register`
Creates a new user account.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123",
    "full_name": "Alex Mercer"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "user": {
      "id": "uuid-v4",
      "email": "user@example.com",
      "full_name": "Alex Mercer"
    }
  }
  ```

### `POST /api/v1/auth/login`
Authenticates a user and issues a JWT token.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }
  ```
- **Response**: `200 OK` (Same schema as register)

### `GET /api/v1/auth/me`
Fetches the currently authenticated user's profile.
- **Response**: `200 OK`

---

## 2. Project Management Endpoints (`/api/v1/projects`)

### `GET /api/v1/projects`
Lists all projects owned by or shared with the authenticated user.
- **Query Params**:
  - `category` (optional, string)
  - `search` (optional, string)
- **Response**: `200 OK` (Array of `ProjectSummaryResponse`)

### `POST /api/v1/projects`
Creates a new project.
- **Request Body**:
  ```json
  {
    "title": "Autonomous Drone Fleet",
    "description": "Develop automated path planning for inspection drones.",
    "category": "Software",
    "goal": "Conduct automated 30-minute roof inspections",
    "budget": "$50,000",
    "timeline_limit": "6 months",
    "team_size": "4 engineers",
    "tech_stack": "ROS 2, Python, C++, React"
  }
  ```
- **Response**: `201 Created`

### `GET /api/v1/projects/{project_id}`
Retrieves complete relational project data (phases, tasks, dependencies, risks, milestones, resources, decisions, documents, versions).
- **Response**: `200 OK` (`ProjectDetailResponse`)

### `PUT /api/v1/projects/{project_id}`
Updates project metadata or React Flow canvas coordinates (`canvas_layout`).
- **Response**: `200 OK`

### `DELETE /api/v1/projects/{project_id}`
Deletes a project and all associated child entities.
- **Response**: `204 No Content`

### `GET /api/v1/projects/{project_id}/export`
Exports project data into structured formats.
- **Query Params**: `format` (`markdown`, `csv`, `json`, `html`)
- **Response**: `200 OK` (File download stream or formatted text)

---

## 3. AI Planning & Intelligence Endpoints (`/api/v1/ai`)

### `POST /api/v1/ai/{project_id}/generate`
Runs the primary AI planning pipeline. Breaks the project's idea and constraints into structured phases, tasks, dependencies, risks, milestones, and success metrics.
- **Response**: `200 OK` (`ProjectPlanSchema`)

### `POST /api/v1/ai/{project_id}/refine`
Applies targeted AI refinements to an existing project plan.
- **Request Body**:
  ```json
  {
    "action": "find_risks", // "make_detailed" | "simplify" | "find_risks" | "optimize_timeline" | "find_dependencies"
    "custom_instruction": "Focus on regulatory approval bottlenecks"
  }
  ```
- **Response**: `200 OK`

### `POST /api/v1/ai/{project_id}/challenge`
**Red-team reviewer**. Adversarially evaluates the project plan to find unstated assumptions, missing critical steps, security risks, and feasibility concerns.
- **Response**: `200 OK`
  ```json
  {
    "overall_health": "moderate_risk",
    "summary": "High reliance on third-party hardware without supply chain mitigation.",
    "issues": [
      {
        "issue": "Missing battery cold-weather performance validation",
        "why_it_matters": "Battery degradation reduces flight duration below required 30 minutes in winter.",
        "evidence": "No testing phase task allocated for environmental thermal stress testing.",
        "suggested_mitigation": "Add environmental chamber stress test in Phase 2.",
        "severity": "high"
      }
    ],
    "assumptions_found": ["Hardware components have <2 week shipping turnaround."],
    "missing_requirements": ["FAA Part 107 waiver compliance checklist."]
  }
  ```

### `POST /api/v1/ai/{project_id}/approaches`
Generates 3 distinct architectural/strategic approaches for user comparison.
- **Response**: `200 OK`
  ```json
  {
    "approaches": [
      {
        "title": "Low-Cost MVP",
        "summary": "Off-the-shelf drone hardware with open-source ground station.",
        "cost_estimate": "$15,000",
        "time_estimate": "3 months",
        "complexity": "low",
        "pros": ["Low initial capital", "Fast to market"],
        "cons": ["Limited customization"],
        "risks": ["Hardware vendor lock-in"]
      },
      {
        "title": "Custom Hardware Platform",
        "summary": "Custom avionics and proprietary flight control software.",
        "cost_estimate": "$120,000",
        "time_estimate": "12 months",
        "complexity": "high",
        "pros": ["Complete intellectual property", "Optimized payload"],
        "cons": ["High capital expense", "Long timeline"],
        "risks": ["Certification delays"]
      },
      {
        "title": "Cloud-Connected Hybrid",
        "summary": "Standard enterprise drones paired with high-throughput cloud streaming.",
        "cost_estimate": "$45,000",
        "time_estimate": "6 months",
        "complexity": "medium",
        "pros": ["Scalable processing", "Real-time client telemetry"],
        "cons": ["Requires cellular uplink"],
        "risks": ["Connectivity dropout in rural zones"]
      }
    ]
  }
  ```

### `POST /api/v1/ai/{project_id}/node-assistant`
Contextual AI Q&A scoped to a specific node (task, phase, risk) and project history.
- **Request Body**:
  ```json
  {
    "node_id": "task-uuid",
    "node_type": "task",
    "node_title": "Implement WebRTC Video Stream",
    "question": "What is the best way to handle low-bandwidth video fallback?"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "answer": "Use dynamic bitrate adaptation (Simulcast or SVC) paired with a lightweight fallback to MJPEG snapshots when network latency exceeds 300ms."
  }
  ```

---

## 4. Tasks & Risks Endpoints

### `POST /api/v1/tasks/{project_id}` & `PUT /api/v1/tasks/{task_id}`
Create and edit tasks (title, priority, status, estimated hours, assignees, acceptance criteria).

### `POST /api/v1/risks/{project_id}` & `PUT /api/v1/risks/{risk_id}`
Create and manage risks (5x5 probability & impact matrix, causes, mitigations, status).

### `POST /api/v1/decisions/{project_id}`
Add an Architectural Decision Record (ADR) to the project's permanent decision log.

---

## 5. Document Ingestion (RAG) Endpoints (`/api/v1/documents`)

### `POST /api/v1/documents/{project_id}/upload`
Uploads a PDF, DOCX, TXT, or Markdown document. Extracts text, generates semantic chunks, builds vector embeddings, and stores for retrieval-augmented generation.

### `GET /api/v1/documents/{project_id}`
Lists all indexed documents for the project.

---

## 6. Version History Endpoints (`/api/v1/versions`)

### `GET /api/v1/versions/{project_id}`
Lists all saved project versions and snapshots.

### `POST /api/v1/versions/{project_id}/restore/{version_id}`
Rolls back the project's graph and entities to the selected version snapshot.
