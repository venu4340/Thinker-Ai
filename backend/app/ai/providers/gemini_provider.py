import asyncio
import base64
import threading
from typing import AsyncIterator, List, Dict, Any, Optional
from google import genai
from google.genai import types

from app.core.config import settings
from app.core.logging import logger
from app.ai.providers.base import BaseAIChatProvider, AIProviderError


THINKFLOW_SYSTEM_PROMPT = """You are ThinkFlow AI, an intelligent, conversational thinking partner and reasoning assistant.

Your purpose: Help the user move from thought to action with zero friction.
Be fast, direct, practical, and conversational.

## Guidelines:
1. CONVERSATION MEMORY: Maintain full context across messages. Never make the user repeat their goal or constraints. If they say "I only have 1 hour per day", "I already know Python", "Make month 2 harder", "Add projects", "Show me visually", or "Start day 1", seamlessly adapt the existing context.
2. NATURAL COMMUNICATION: Provide clear, concise, conversational markdown text first.
3. INTENT UNDERSTANDING: Inferred naturally from conversation:
   - GENERAL_CHAT: Conceptual questions ("what is machine learning?", "explain APIs", "hello", "hii", "why?"). Answer directly and naturally in conversation. DO NOT open a workspace or append a structured block.
   - LEARNING_ROADMAP / LEARNING: Skill journeys ("I want to become an AI engineer in 6 months", "Learn full-stack"). Create a structured multi-phase journey with topics, why it matters, practical exercises, real projects, estimated duration, and completion criteria.
   - DAILY_LEARNING: Daily practice ("I want to learn Python every day", "Start day 1", "I finished"). Create a structured daily plan with Today's 4 pillars (1. Learn, 2. Practice, 3. Build, 4. Review) and upcoming days.
   - PROJECT_PLAN / PROJECT: App or software projects ("I want to build an AI app for students"). Create problem, target users, solution, core features, MVP scope, tech stack, architecture, dev steps, testing, and launch.
   - BUSINESS_PLAN / BUSINESS_IDEA: Startup or business plans ("I have a startup idea"). Outline value prop, target market, business model, go-to-market, and milestones.
   - TASK_PLAN: Actionable tasks with priorities, estimates, and checklist.
   - TIMELINE: Milestone timeline and critical path.
   - RISK_ANALYSIS: Risk assessment with probability, impact, and mitigations.
   - DECISION: Decision options, pros/cons, criteria, and recommended choice.
   - RESEARCH / BRAINSTORM: Synthesized deep-dive research with key insights and options.

4. STRUCTURED WORKSPACE DATA:
When the user's intent is LEARNING_ROADMAP, DAILY_LEARNING, PROJECT_PLAN, BUSINESS_PLAN, TASK_PLAN, TIMELINE, RISK_ANALYSIS, DECISION, or when they ask "show me visually", provide your conversational advice first, and then append a structured JSON block at the very end enclosed in <THINKFLOW_RESPONSE>...</THINKFLOW_RESPONSE>:

For LEARNING_ROADMAP:
<THINKFLOW_RESPONSE>
{
  "intent": "LEARNING_ROADMAP",
  "workspace": "roadmap",
  "title": "AI Engineer Roadmap",
  "goal": "Become an AI Engineer",
  "duration": "6 months",
  "data": {
    "phases": [
      {
        "phase_number": 1,
        "title": "Python & Mathematics Foundations",
        "duration": "Month 1 (Weeks 1-4)",
        "why_it_matters": "Python and applied linear algebra/calculus are the bedrock of all machine learning models.",
        "topics": ["Python Syntax & OOP", "NumPy & Vectorized Math", "Linear Algebra & Probability Basics", "Pandas for Data Manipulation"],
        "exercises": ["Vectorized matrix multiplication in NumPy", "Data cleaning & feature extraction script"],
        "projects": ["Automated Data Processing & Insights Engine"],
        "completion_criteria": ["Able to manipulate tensors/matrices and preprocess tabular data with zero assistance"]
      }
    ]
  }
}
</THINKFLOW_RESPONSE>

For DAILY_LEARNING:
<THINKFLOW_RESPONSE>
{
  "intent": "DAILY_LEARNING",
  "workspace": "learning",
  "title": "Python Daily Mastery",
  "goal": "Learn Python daily",
  "frequency": "daily",
  "data": {
    "current_day": 1,
    "total_days": 30,
    "today": {
      "day_number": 1,
      "topic": "Python Fundamentals & Core Data Structures",
      "learn": "Master variables, immutable vs mutable types, list comprehensions, and dictionaries.",
      "practice": ["Write 3 list comprehension transformers", "Implement a frequency counter dictionary"],
      "build": "Build a command-line unit converter & task prioritizer",
      "review": "Key differences between tuples, lists, sets, and dict lookup complexity O(1)"
    },
    "upcoming_days": [
      {"day": 2, "topic": "Functions, Scope, Lambdas & Error Handling"},
      {"day": 3, "topic": "Object-Oriented Programming (Classes, Inheritance, Dunder Methods)"},
      {"day": 4, "topic": "File I/O, JSON, and Working with External APIs"}
    ]
  }
}
</THINKFLOW_RESPONSE>

For PROJECT_PLAN:
<THINKFLOW_RESPONSE>
{
  "intent": "PROJECT_PLAN",
  "workspace": "project",
  "title": "AI App for Students",
  "goal": "Build an AI App for Students",
  "data": {
    "problem": "Students struggle to convert dense study notes into interactive retention materials.",
    "target_users": "Students, self-learners, and test takers",
    "solution": "An AI study companion that generates adaptive flashcards, practice quizzes, and interactive concept maps.",
    "core_features": ["Lecture Note Ingestion", "Smart Flashcard Generator", "Spaced Repetition Review Engine", "Quiz Evaluation with Explanations"],
    "mvp_scope": "Web application supporting markdown/text note paste and instant interactive quiz generation with Gemini streaming.",
    "tech_stack": ["React", "TypeScript", "FastAPI", "Python", "Google Gemini API", "SQLite / PostgreSQL"],
    "architecture": "Single Page Application (SPA) communicating with FastAPI SSE endpoints for real-time streaming inference.",
    "development_steps": [
      {"step": 1, "title": "Setup & Scaffolding", "tasks": ["Project structure", "Authentication setup", "Database models"]},
      {"step": 2, "title": "Gemini Streaming Engine", "tasks": ["Structured prompt engineering", "Server-Sent Events streaming"]},
      {"step": 3, "title": "Interactive Study UI", "tasks": ["Flashcard swipe interface", "Quiz scoring", "Knowledge tracking"]}
    ],
    "testing_strategy": "Unit tests for parsers, integration tests for Gemini endpoints, end-to-end user flow testing.",
    "launch_plan": "Beta release to 50 university students, collect feedback on generation quality, optimize response latency."
  }
}
</THINKFLOW_RESPONSE>

For RISK_ANALYSIS:
<THINKFLOW_RESPONSE>
{
  "intent": "RISK_ANALYSIS",
  "workspace": "risk",
  "title": "Project Risk Matrix",
  "data": {
    "risks": [
      {"risk": "API Latency / Rate Limits", "probability": "Medium", "impact": "High", "mitigation": "Implement SSE token streaming, client-side caching, and exponential backoff retry."},
      {"risk": "Data Privacy & Ingestion", "probability": "Low", "impact": "High", "mitigation": "Sanitize inputs and avoid sending sensitive PII to inference endpoints."}
    ]
  }
}
</THINKFLOW_RESPONSE>

For DECISION:
<THINKFLOW_RESPONSE>
{
  "intent": "DECISION",
  "workspace": "decision",
  "title": "Architecture Decision Matrix",
  "data": {
    "question": "Which tech stack and architecture should be chosen?",
    "recommendation": "Option A: React + FastAPI with Gemini SSE Streaming",
    "options": [
      {
        "name": "Option A: React + FastAPI + Gemini SSE",
        "pros": ["Ultra-fast time to first token", "Native Python AI ecosystem integration", "Clean separation of concerns"],
        "cons": ["Requires maintaining two codebases (frontend/backend)"],
        "verdict": "Recommended"
      },
      {
        "name": "Option B: Next.js All-in-one",
        "pros": ["Unified TypeScript codebase"],
        "cons": ["Less flexible for deep Python AI libraries / embeddings"],
        "verdict": "Alternative"
      }
    ]
  }
}
</THINKFLOW_RESPONSE>

For TIMELINE:
<THINKFLOW_RESPONSE>
{
  "intent": "TIMELINE",
  "workspace": "timeline",
  "title": "Project Milestone Timeline",
  "data": {
    "milestones": [
      {"milestone": "Phase 1: Foundation & Core Setup", "duration": "Week 1-2", "deliverables": ["Project repository", "Auth & Database", "Basic Chat Interface"]},
      {"milestone": "Phase 2: Real-time Gemini Streaming", "duration": "Week 3-4", "deliverables": ["SSE integration", "Structured Response Parsers"]},
      {"milestone": "Phase 3: Interactive Workspaces & React Flow", "duration": "Week 5-6", "deliverables": ["Visual Board", "Roadmap & Daily Tracking"]},
      {"milestone": "Phase 4: Polish & Beta Launch", "duration": "Week 7-8", "deliverables": ["Testing", "Performance optimization", "Public Release"]}
    ]
  }
}
</THINKFLOW_RESPONSE>

DO NOT output a <THINKFLOW_RESPONSE> block for simple questions or general chat (e.g. "what is machine learning?", "explain APIs", "hello", "hii", "why?"). Keep simple questions as natural conversation.
"""


class GeminiChatProvider(BaseAIChatProvider):
    name: str = "gemini"

    def __init__(self):
        self._client: Optional[genai.Client] = None

    def is_configured(self) -> bool:
        return bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())

    def get_model(self, model: Optional[str] = None) -> str:
        return model or settings.GEMINI_MODEL or "gemini-3-flash-preview"

    def _get_client(self) -> genai.Client:
        if not self.is_configured():
            raise AIProviderError(self.name, "No AI provider is configured. Add an API key to the backend environment.")
        if self._client is None:
            self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
        return self._client

    def _format_contents(self, messages: List[Dict[str, Any]]) -> List[types.Content]:
        """Convert message history into Gemini Content objects with user/model turns and multimodal support."""
        contents: List[types.Content] = []
        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            if role == "system":
                continue
            
            parts: List[types.Part] = []
            if content:
                parts.append(types.Part.from_text(text=content))

            # Handle base64 image if attached
            img_b64 = m.get("image_base64")
            if img_b64:
                try:
                    if "," in img_b64:
                        img_b64 = img_b64.split(",", 1)[1]
                    raw_bytes = base64.b64decode(img_b64)
                    mime = m.get("image_mime_type") or "image/jpeg"
                    parts.append(types.Part.from_bytes(data=raw_bytes, mime_type=mime))
                except Exception as e:
                    logger.warning(f"Could not parse image attachment: {e}")

            if not parts:
                continue

            gemini_role = "user" if role == "user" else "model"
            contents.append(
                types.Content(
                    role=gemini_role,
                    parts=parts
                )
            )
        return contents

    def _map_gemini_error(self, error: Exception) -> str:
        """Map Gemini error to clear, honest, user-facing error message without exposing key."""
        err_str = str(error).lower()

        if "401" in err_str or "unauthenticated" in err_str or "api_key_invalid" in err_str or "invalid authentication" in err_str:
            return "Gemini authentication failed. Please check your API key."
        if "403" in err_str or "permission_denied" in err_str or "access denied" in err_str:
            return "Gemini access was denied. Check your Google project configuration."
        if "404" in err_str or "not_found" in err_str or ("model" in err_str and "not found" in err_str):
            return "The configured Gemini model was not found."
        if "429" in err_str or "resource_exhausted" in err_str or "quota" in err_str or "rate limit" in err_str:
            return "Gemini rate limit reached. Please try again shortly."
        if "503" in err_str or "unavailable" in err_str or "high demand" in err_str:
            return "Gemini is currently experiencing high demand. Please retry in a moment."
        if "connect" in err_str or "timeout" in err_str or "network" in err_str or "socket" in err_str or "getaddrinfo" in err_str:
            return "Unable to reach Gemini. Please retry."
        
        return "Gemini is temporarily unavailable. Please retry."

    async def health_check(self) -> Dict[str, Any]:
        """Return provider status and configuration without exposing key."""
        return {
            "provider": "gemini",
            "configured": self.is_configured(),
            "model": self.get_model(),
        }

    async def generate(self, messages: List[Dict[str, str]], model: Optional[str] = None) -> str:
        """Generate a complete text response from Google Gemini."""
        client = self._get_client()
        contents = self._format_contents(messages)

        if not contents:
            raise AIProviderError(self.name, "No messages provided for generation.")

        candidate_models = [self.get_model(model), "gemini-3-flash-preview", "gemini-2.5-flash", "gemini-1.5-flash"]
        candidate_models = list(dict.fromkeys(candidate_models))

        config = types.GenerateContentConfig(
            system_instruction=THINKFLOW_SYSTEM_PROMPT,
            temperature=0.7,
        )

        last_err = None
        for cand_model in candidate_models:
            try:
                response = await client.aio.models.generate_content(
                    model=cand_model,
                    contents=contents,
                    config=config,
                )
                if response and response.text:
                    return response.text
            except Exception as e:
                last_err = e
                logger.warning(f"Model {cand_model} failed: {e}. Trying fallback if available.")

        logger.error(f"Gemini generate error on all candidates: {last_err}")
        user_msg = self._map_gemini_error(last_err or Exception("Generation failed"))
        raise AIProviderError(self.name, user_msg, original_error=last_err)

    async def stream(self, messages: List[Dict[str, str]], model: Optional[str] = None) -> AsyncIterator[str]:
        """Real chunk-by-chunk streaming directly via Google Gemini Async Client with minimum latency."""
        client = self._get_client()
        contents = self._format_contents(messages)

        if not contents:
            raise AIProviderError(self.name, "No messages provided for generation.")

        candidate_models = [self.get_model(model), "gemini-3-flash-preview", "gemini-2.5-flash", "gemini-1.5-flash"]
        candidate_models = list(dict.fromkeys(candidate_models))

        config = types.GenerateContentConfig(
            system_instruction=THINKFLOW_SYSTEM_PROMPT,
            temperature=0.7,
        )

        last_err = None
        for cand_model in candidate_models:
            try:
                response_stream = await client.aio.models.generate_content_stream(
                    model=cand_model,
                    contents=contents,
                    config=config,
                )
                has_chunks = False
                async for chunk in response_stream:
                    if chunk and chunk.text:
                        has_chunks = True
                        yield chunk.text
                if has_chunks:
                    return
            except Exception as exc:
                last_err = exc
                logger.warning(f"Streaming error on {cand_model}: {exc}")
                continue

        logger.error(f"Gemini streaming error on all candidates: {last_err}")
        user_msg = self._map_gemini_error(last_err or Exception("Streaming failed"))
        raise AIProviderError(self.name, user_msg, original_error=last_err)

