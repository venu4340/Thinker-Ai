# AI Pipeline Architecture

ThinkFlow AI uses a multi-stage AI pipeline that converts vague user inputs into structured, validated, database-persisted execution plans.

---

## Pipeline Flow

```
User Input (Idea + Context)
         |
         v
+---------------------------+
|  Project Context Service  |  <- Assembles minimal context from DB
|  (context_service.py)     |     (existing phases, key decisions, constraints)
+---------------------------+
         |
         v
+---------------------------+
|   RAG Engine              |  <- Retrieves relevant document chunks if
|   (rag_engine.py)         |     user has uploaded PDFs/docs
+---------------------------+
         |
         v
+---------------------------+
|   AI Orchestrator         |  <- Selects active provider (OpenAI/Gemini/
|   (orchestrator.py)       |     Anthropic/Simulation) via env config
+---------------------------+
         |
         v
+---------------------------+
|  Prompt Layer             |  <- Versioned, modular prompt strings loaded
|  (ai/prompts/*.py)        |     from planner.py, critical_reviewer.py, etc.
+---------------------------+
         |
         v
+---------------------------+
|  AI Provider Abstraction  |  <- LLM API call (async, with timeout)
|  (base.py + *_provider)   |
+---------------------------+
         |
         v
+---------------------------+
|  Pydantic v2 Validator    |  <- Forces strict schema on raw LLM JSON output
|  (ai/schemas.py)          |     Retries up to 2x on validation failure
+---------------------------+
         |
         v
+---------------------------+
|  Database Persistence     |  <- Creates Phase, Task, Risk, Dependency,
|  (services/project_service)|    Milestone, Resource objects in DB
+---------------------------+
         |
         v
  React Flow Visualization
```

---

## AI Provider Abstraction

All providers implement the `AIProvider` base class:

```python
class AIProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, schema: type[BaseModel]) -> BaseModel:
        ...
    
    @abstractmethod
    async def embed(self, text: str) -> list[float]:
        ...
```

### Supported Providers
| Provider | Model | Use Case |
|---|---|---|
| `SimulationProvider` | Built-in | Zero-cost offline/demo mode |
| `openai` | GPT-4o | Best accuracy |
| `gemini` | Gemini 1.5 Pro | Speed + cost |
| `anthropic` | Claude 3.5 Sonnet | Long context |

---

## Prompt Modules (`backend/app/ai/prompts/`)

| Module | Purpose |
|---|---|
| `planner.py` | Primary project breakdown into phases, tasks, objectives |
| `critical_reviewer.py` | "Challenge My Plan" — red-teams assumptions and gaps |
| `alternative_generator.py` | Generates 3 strategic approaches (Low-cost, Fast, Scalable) |
| `node_assistant.py` | Contextual AI answers per selected canvas node |
| `document_analyzer.py` | Extracts intent and structure from uploaded documents |

---

## Validation & Reliability

1. **Schema enforcement**: All LLM calls request JSON output conforming to Pydantic v2 `ProjectPlanSchema`.
2. **Retry with repair**: If the first response fails validation, the orchestrator makes a second call with the error injected into the prompt as a correction hint.
3. **Simulation fallback**: If no API key is configured, `SimulationProvider` generates domain-aware realistic demo plans.
4. **No blind trust**: Raw LLM text is never stored or rendered without validation.
