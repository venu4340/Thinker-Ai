import time
import json
import re
from typing import Dict, Any, Optional, Type
from pydantic import BaseModel, ValidationError

from app.core.config import settings
from app.core.logging import logger
from app.ai.base import BaseAIProvider
from app.ai.gemini_provider import GeminiProvider
from app.ai.schemas import (
    ProjectPlanResponse, GoalProjectPlanResponse, AIChallengeResponse, AIApproachResponse, AINodeAdviceResponse
)
from app.ai.prompts.planner import PLANNER_SYSTEM_PROMPT, build_planner_prompt
from app.ai.prompts.critical_reviewer import CRITICAL_REVIEWER_SYSTEM_PROMPT, build_critical_review_prompt
from app.ai.prompts.alternative_generator import ALTERNATIVE_GENERATOR_SYSTEM_PROMPT, build_alternatives_prompt
from app.ai.prompts.node_assistant import NODE_ASSISTANT_SYSTEM_PROMPT, build_node_assistant_prompt

GOAL_SYSTEM_PROMPT = """You are ThinkFlow AI's Principal Solutions Architect, Systems Engineer, and Strategic Planner.
Your mission is to understand ANY user goal, vision, learning aspiration, product idea, or business challenge, and immediately synthesize a comprehensive, production-grade visual execution plan.

CRITICAL REQUIREMENTS:
1. Every different goal MUST generate uniquely tailored, domain-specific tasks, phases, risks, milestones, resources, and decisions:
   - For learning goals (e.g. 'become an AI engineer'): focus on foundational math/Python, ML models, LLMs, practical projects, portfolio milestones, and learning risks.
   - For product/software goals (e.g. 'build an AI app for students'): focus on UX/specifications, frontend/backend architecture, AI API integration, testing, deployment, scaling risks.
   - For business/startup goals (e.g. 'start a fitness business'): focus on market research, business model, customer acquisition, branding, operations, launch timeline, business risks.
2. Infer a clear, crisp 'title' (e.g. 'AI Engineer Roadmap (6 Months)', 'Student AI Assistant App', 'Fitness Studio Launch Plan').
3. Infer the correct 'category' (Software, Education, Startup, Business, Personal, Research, Marketing, Other).
4. Infer a realistic 'timeframe' (e.g. 6 months, 12 weeks, 3 months).
5. Provide 3 to 6 structured sequential phases, each with 3 to 6 actionable tasks with realistic estimated hours.
6. Provide concrete inter-task dependencies, realistic risks with probability/impact and mitigations, milestones with criteria, resources with allocations, and architectural/business decisions.

You MUST format your entire response as a valid JSON object strictly matching this schema:
{
  "title": "Clear inferred title",
  "category": "Software", // or Education, Startup, Business, Personal, Research, Marketing
  "timeframe": "6 months",
  "executive_summary": "Deep strategic overview...",
  "core_value_proposition": "Core value delivered...",
  "objectives": [
    {"title": "Objective Title", "description": "Why it matters", "target_metric": "KPI", "priority": "high"}
  ],
  "phases": [
    {
      "id": "phase_1",
      "title": "Phase 1: Title",
      "description": "Deliverables...",
      "order": 1,
      "estimated_weeks": 2.0,
      "tasks": [
        {
          "id": "task_1_1",
          "title": "Actionable task name",
          "description": "Specific implementation steps...",
          "priority": "high",
          "estimated_hours": 12.0,
          "dependencies": [],
          "skills_required": ["Python"],
          "resources": ["IDE"],
          "acceptance_criteria": ["Deliverable verified"]
        }
      ]
    }
  ],
  "dependencies": [
    {"source_task_id": "task_1_1", "target_task_id": "task_1_2", "type": "finish_to_start"}
  ],
  "risks": [
    {"risk": "Risk description", "probability": 3, "impact": 4, "severity": "high", "cause": "Root cause", "mitigation": "Concrete fallback", "owner": "Lead"}
  ],
  "milestones": [
    {"title": "Milestone name", "description": "Significance", "estimated_week": 4, "criteria": ["Criteria 1"]}
  ],
  "resources": [
    {"name": "Tool/Resource", "type": "tool", "cost_estimate": "$0", "allocation": "100%"}
  ],
  "recommended_decisions": [
    {"decision": "Key Decision", "reason": "Rationale", "alternatives_considered": ["Alt A"], "impact": "Impact"}
  ],
  "success_metrics": [
    "Measurable KPI 1",
    "Measurable KPI 2"
  ]
}
"""


class AIOrchestrator:
    def __init__(self):
        self.gemini_provider = GeminiProvider()

    def get_provider(self, preferred_provider: Optional[str] = None) -> BaseAIProvider:
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("Something went wrong while generating your plan. Please try again in a few seconds.")
        return self.gemini_provider

    async def _execute_with_validation_and_retry(
        self,
        provider: BaseAIProvider,
        system_prompt: str,
        user_prompt: str,
        schema_class: Type[BaseModel],
        max_retries: int = 1
    ) -> Dict[str, Any]:
        last_error = None
        for attempt in range(max_retries + 1):
            try:
                raw_data = await provider.generate_json(system_prompt, user_prompt, schema_class)
                validated_obj = schema_class.model_validate(raw_data)
                return validated_obj.model_dump()
            except Exception as e:
                logger.error(f"Gemini generation attempt {attempt + 1} failed: {e}", exc_info=True)
                last_error = e

        raise RuntimeError(str(last_error) if last_error else "Something went wrong while generating your plan. Please try again in a few seconds.")

    async def generate_project_plan_from_goal(
        self,
        goal: str,
        category: Optional[str] = None,
        timeframe: Optional[str] = None,
        budget: Optional[str] = None,
        tech_stack: Optional[str] = None,
        custom_instructions: Optional[str] = None
    ) -> Dict[str, Any]:
        start_time = time.time()
        provider = self.get_provider()

        user_prompt = f"""USER GOAL:
{goal}

ADDITIONAL CONTEXT (if specified by user):
- Category Preference: {category or "Auto-infer best matching category"}
- Target Timeframe: {timeframe or "Auto-infer realistic timeframe"}
- Budget Constraints: {budget or "Flexible / Bootstrapped"}
- Preferred Tech Stack / Tools: {tech_stack or "Infer optimal industry-standard tools for this goal"}
- Custom Instructions: {custom_instructions or "None"}

Now generate the complete, production-grade JSON plan with inferred title, category, timeframe, objectives, phases, tasks, dependencies, risks, milestones, resources, decisions, and success metrics."""

        plan = await self._execute_with_validation_and_retry(
            provider=provider,
            system_prompt=GOAL_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            schema_class=GoalProjectPlanResponse
        )

        latency_ms = int((time.time() - start_time) * 1000)
        logger.info(f"Generated Goal Project Plan via Gemini in {latency_ms}ms")
        return plan

    async def generate_project_plan(
        self,
        title: str,
        description: str,
        category: str,
        goal: str = "",
        budget: str = "",
        timeframe: str = "",
        team_size: str = "",
        tech_stack: str = "",
        document_context: str = "",
        custom_instructions: str = "",
        preferred_provider: Optional[str] = None
    ) -> Dict[str, Any]:
        start_time = time.time()
        provider = self.get_provider(preferred_provider)
        
        user_prompt = build_planner_prompt(
            title=title,
            description=description,
            category=category,
            goal=goal,
            budget=budget,
            timeframe=timeframe,
            team_size=team_size,
            tech_stack=tech_stack,
            document_context=document_context,
            custom_instructions=custom_instructions
        )

        plan = await self._execute_with_validation_and_retry(
            provider=provider,
            system_prompt=PLANNER_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            schema_class=ProjectPlanResponse
        )

        latency_ms = int((time.time() - start_time) * 1000)
        logger.info(f"Generated Project Plan in {latency_ms}ms")
        return plan

    async def challenge_plan(self, project_data: dict, preferred_provider: Optional[str] = None) -> Dict[str, Any]:
        provider = self.get_provider(preferred_provider)
        user_prompt = build_critical_review_prompt(project_data)

        critique = await self._execute_with_validation_and_retry(
            provider=provider,
            system_prompt=CRITICAL_REVIEWER_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            schema_class=AIChallengeResponse
        )
        return critique

    async def generate_3_approaches(
        self,
        project_title: str,
        description: str,
        category: str,
        goal: str = "",
        preferred_provider: Optional[str] = None
    ) -> Dict[str, Any]:
        provider = self.get_provider(preferred_provider)
        user_prompt = build_alternatives_prompt(project_title, description, category, goal)

        approaches = await self._execute_with_validation_and_retry(
            provider=provider,
            system_prompt=ALTERNATIVE_GENERATOR_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            schema_class=AIApproachResponse
        )
        return approaches

    async def ask_node_advice(
        self,
        project_context: str,
        node_type: str,
        node_data: dict,
        question: str,
        preferred_provider: Optional[str] = None
    ) -> Dict[str, Any]:
        provider = self.get_provider(preferred_provider)
        user_prompt = build_node_assistant_prompt(project_context, node_type, node_data, question)

        advice = await self._execute_with_validation_and_retry(
            provider=provider,
            system_prompt=NODE_ASSISTANT_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            schema_class=AINodeAdviceResponse
        )
        return advice

ai_orchestrator = AIOrchestrator()

