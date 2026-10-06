from typing import Dict, Any
from app.models.models import Project

class ContextService:
    @staticmethod
    def build_project_context(project: Project) -> str:
        """
        Builds a concise, highly relevant context snapshot of the project
        without overflowing token windows.
        """
        objectives_summary = ", ".join([obj.title for obj in project.objectives[:5]]) if project.objectives else "None defined"
        phases_summary = ", ".join([f"{p.title} ({len(p.tasks)} tasks)" for p in project.phases[:6]]) if project.phases else "None defined"
        decisions_summary = "; ".join([f"{d.decision} (Reason: {d.reason})" for d in project.decisions[:4]]) if project.decisions else "No formal decisions recorded"
        risks_summary = "; ".join([f"{r.risk} [Severity: {r.severity}]" for r in project.risks[:4]]) if project.risks else "No high risks identified"

        return f"""
PROJECT: {project.title}
CATEGORY: {project.category}
CORE GOAL: {project.goal or project.description}
BUDGET & TIMEFRAME: {project.budget or 'N/A'}, {project.timeframe or 'N/A'}
TECH STACK: {project.tech_stack or 'N/A'}
OBJECTIVES: {objectives_summary}
ACTIVE PHASES: {phases_summary}
KEY ARCHITECTURAL DECISIONS: {decisions_summary}
CURRENT TOP RISKS: {risks_summary}
""".strip()

context_service = ContextService()
