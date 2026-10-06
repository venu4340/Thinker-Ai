# Database Schema Design

ThinkFlow AI uses a normalized relational data model managed through SQLAlchemy 2.0. The schema is optimized for graph querying, dependency tracking, version snapshots, and document RAG chunk storage.

---

## Entity Relationship Overview

```
+----------------+          1:N          +-------------------+
|     users      | --------------------> |     projects      |
+----------------+                       +-------------------+
                                            |
      +------------------+------------------+------------------+------------------+
      | 1:N              | 1:N              | 1:N              | 1:N              | 1:N
      v                  v                  v                  v                  v
+-----------+      +-----------+      +------------+     +------------+     +-------------------+
|  phases   |      |   risks   |      | decisions  |     | documents  |     | project_versions  |
+-----------+      +-----------+      +------------+     +------------+     +-------------------+
      | 1:N                                                    | 1:N
      v                                                        v
+-----------+                                            +-------------------+
|   tasks   |                                            |  document_chunks  |
+-----------+                                            +-------------------+
      | 1:N
      v
+-------------------+
|   dependencies    |
+-------------------+
```

---

## Detailed Table Specifications

### 1. `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | String(36) | Primary Key, UUID | Unique user identifier |
| `email` | String(255) | Unique, Indexed, Not Null | User login email |
| `hashed_password` | String(255) | Not Null | Bcrypt hashed password |
| `full_name` | String(255) | Nullable | Display name |
| `avatar_url` | String(500) | Nullable | Profile avatar URL |
| `is_active` | Boolean | Default True | Account activation state |
| `created_at` | DateTime | Default UTC now | Registration timestamp |

### 2. `projects`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | String(36) | Primary Key, UUID | Project ID |
| `title` | String(255) | Indexed, Not Null | Project title |
| `description` | Text | Nullable | Detailed idea / problem description |
| `category` | String(50) | Indexed, Default 'Software' | Domain category (Startup, Software, Research, etc.) |
| `goal` | Text | Nullable | Explicit definition of success |
| `budget` | String(100) | Nullable | Financial constraints |
| `timeline_limit` | String(100) | Nullable | Target schedule constraint |
| `team_size` | String(100) | Nullable | Team capacity constraint |
| `tech_stack` | String(255) | Nullable | Preferred technologies |
| `owner_id` | String(36) | Foreign Key -> `users.id` | Project creator |
| `canvas_layout` | JSON | Nullable | React Flow node coordinates & zoom state |
| `created_at` | DateTime | Default UTC now | Creation timestamp |
| `updated_at` | DateTime | On update UTC now | Last modified timestamp |

### 3. `phases`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | String(36) | Primary Key, UUID | Phase ID |
| `project_id` | String(36) | Foreign Key -> `projects.id` | Parent project |
| `name` | String(255) | Not Null | Phase title (e.g., Discovery, Architecture, MVP) |
| `description` | Text | Nullable | Phase scope |
| `order_index` | Integer | Default 0 | Visual and chronological sequencing |
| `color` | String(20) | Nullable | UI hex badge accent |

### 4. `tasks`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | String(36) | Primary Key, UUID | Task ID |
| `phase_id` | String(36) | Foreign Key -> `phases.id` | Containing phase |
| `title` | String(255) | Not Null | Actionable task name |
| `description` | Text | Nullable | Execution details |
| `priority` | String(20) | Default 'medium' | Priority (`low`, `medium`, `high`, `critical`) |
| `status` | String(20) | Default 'todo' | Execution status (`todo`, `in_progress`, `completed`, `blocked`) |
| `estimated_hours`| Float | Default 0.0 | AI or user estimated effort in hours |
| `start_date` | Date | Nullable | Scheduled start date for Gantt |
| `end_date` | Date | Nullable | Scheduled completion date for Gantt |
| `skills_required`| JSON | Array of strings | Competencies needed |
| `resources` | JSON | Array of strings | Tools, APIs, or infrastructure required |
| `acceptance_criteria` | JSON | Array of strings | Verifiable completion criteria |
| `owner` | String(255) | Nullable | Assigned team member |
| `notes` | Text | Nullable | Manual notes or AI advice |

### 5. `dependencies`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | String(36) | Primary Key, UUID | Dependency ID |
| `source_task_id` | String(36) | Foreign Key -> `tasks.id` | Prerequisite task |
| `target_task_id` | String(36) | Foreign Key -> `tasks.id` | Dependent task |
| `dependency_type`| String(50) | Default 'finish_to_start' | Relationship type |

### 6. `risks`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | String(36) | Primary Key, UUID | Risk ID |
| `project_id` | String(36) | Foreign Key -> `projects.id` | Parent project |
| `title` | String(255) | Not Null | Risk name |
| `category` | String(50) | Nullable | Technical, Market, Financial, Operational |
| `probability` | Integer | 1 to 5 | Risk Likelihood |
| `impact` | Integer | 1 to 5 | Risk Consequence |
| `severity` | String(20) | low / medium / high / critical | Computed severity score |
| `cause` | Text | Nullable | Root trigger |
| `mitigation` | Text | Nullable | Actionable contingency |
| `status` | String(20) | Default 'identified' | Identified, Mitigating, Resolved |

### 7. `decisions` (ADR Log)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | String(36) | Primary Key, UUID | Decision ID |
| `project_id` | String(36) | Foreign Key -> `projects.id` | Parent project |
| `title` | String(255) | Not Null | Architectural decision title |
| `status` | String(50) | Default 'proposed' | Proposed, Accepted, Deprecated, Superseded |
| `context_problem`| Text | Nullable | Problem and constraints |
| `chosen_solution`| Text | Nullable | Selected path |
| `alternatives` | Text | Nullable | Evaluated options |
| `consequences` | Text | Nullable | Trade-offs and impact |

### 8. `documents` & `document_chunks`
Supports RAG vector storage with chunk embeddings for semantic retrieval.
