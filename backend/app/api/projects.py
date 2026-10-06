import re as _re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.models.models import User, Project, AIGeneration, ActivityLog
from app.schemas.schemas import (
    ProjectCreate, ProjectUpdate, ProjectSummaryResponse, ProjectDetailResponse, GoalPlanRequest
)
from app.api.auth import get_current_user
from app.services.project_service import project_service
from app.services.export_service import export_service
from app.ai.orchestrator import ai_orchestrator
from app.core.logging import logger

# ── Error sanitisation ───────────────────────────────────────────────────────
_RAW_PATTERNS = _re.compile(
    r"503|UNAVAILABLE|overload|capacity|rate.?limit|quota|"
    r"too many requests|resource.?exhausted|gemini.?connection|"
    r"api.?key|provider|stack.?trace|traceback|google\.api|"
    r"grpc|StatusCode|InternalServerError",
    _re.IGNORECASE,
)
_FRIENDLY_TRANSIENT = "Our AI service is experiencing high demand right now. Please wait a moment and try again."
_FRIENDLY_GENERIC = "Something went wrong while generating your plan. Please try again in a few seconds."


def _sanitize_error(raw: str) -> str:
    """Strip raw provider details; return a user-safe message."""
    if _RAW_PATTERNS.search(raw):
        return _FRIENDLY_TRANSIENT
    # Allow already-friendly messages through
    if len(raw) < 120 and not any(kw in raw.lower() for kw in ("gemini", "api key", "503", "grpc")):
        return raw
    return _FRIENDLY_GENERIC

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("/generate-from-goal", response_model=ProjectDetailResponse)
async def generate_from_goal(
    req: GoalPlanRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    trimmed_goal = req.goal.strip()
    if not trimmed_goal:
        raise HTTPException(status_code=400, detail="Goal cannot be empty.")

    try:
        logger.info(f"Generating full Gemini project plan for goal: {trimmed_goal[:80]}...")
        raw_plan = await ai_orchestrator.generate_project_plan_from_goal(
            goal=trimmed_goal,
            category=req.category,
            timeframe=req.timeframe,
            budget=req.budget,
            tech_stack=req.tech_stack,
            custom_instructions=req.custom_instructions
        )

        title = raw_plan.get("title") or trimmed_goal[:60]
        category = raw_plan.get("category") or req.category or "Software"
        timeframe = raw_plan.get("timeframe") or req.timeframe or "6 months"
        description = raw_plan.get("executive_summary") or trimmed_goal

        # Create project model
        project = await project_service.create_project(
            db,
            user_id=current_user.id,
            data=ProjectCreate(
                title=title,
                description=description,
                category=category,
                goal=trimmed_goal,
                budget=req.budget,
                timeframe=timeframe,
                tech_stack=req.tech_stack
            )
        )

        # Hydrate all objectives, phases, tasks, risks, milestones, resources, decisions
        await project_service.apply_ai_plan_to_project(
            db, project, raw_plan, version_desc="Initial Gemini Plan from Goal"
        )

        # Log AI Generation
        gen_log = AIGeneration(
            project_id=project.id,
            prompt_type="goal_plan_generation",
            prompt_text=trimmed_goal,
            structured_response=raw_plan,
            model_used="gemini"
        )
        db.add(gen_log)
        await db.commit()

        detailed = await project_service.get_project(db, project.id, current_user.id)
        return detailed

    except RuntimeError as re:
        logger.error(f"Gemini execution error: {re}", exc_info=True)
        raise HTTPException(status_code=502, detail=_sanitize_error(str(re)))
    except Exception as e:
        logger.error(f"Unexpected error generating plan: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=_sanitize_error(str(e)))

@router.get("", response_model=List[ProjectSummaryResponse])

async def list_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    projects = await project_service.list_projects(db, current_user.id)
    summaries = []
    for p in projects:
        task_count = len(p.tasks)
        completed_task_count = sum(1 for t in p.tasks if t.status == "done")
        risk_count = len(p.risks)
        summaries.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "category": p.category,
            "goal": p.goal,
            "status": p.status,
            "progress": p.progress,
            "task_count": task_count,
            "completed_task_count": completed_task_count,
            "risk_count": risk_count,
            "created_at": p.created_at,
            "updated_at": p.updated_at
        })
    return summaries

@router.post("", response_model=ProjectDetailResponse)
async def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await project_service.create_project(db, current_user.id, data)
    detailed = await project_service.get_project(db, project.id, current_user.id)
    return detailed

@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await project_service.get_project(db, project_id, current_user.id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found or access denied.")
    return project

@router.put("/{project_id}", response_model=ProjectDetailResponse)
async def update_project(
    project_id: str,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await project_service.get_project(db, project_id, current_user.id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found or access denied.")
    
    updated = await project_service.update_project(db, project, data)
    detailed = await project_service.get_project(db, project_id, current_user.id)
    return detailed

@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await project_service.get_project(db, project_id, current_user.id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found or access denied.")
    
    await project_service.delete_project(db, project)
    return {"message": "Project deleted successfully", "id": project_id}

@router.get("/{project_id}/export")
async def export_project_data(
    project_id: str,
    format: str = Query("markdown", pattern="^(markdown|csv|json|html)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await project_service.get_project(db, project_id, current_user.id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found or access denied.")

    if format == "markdown":
        md = export_service.export_markdown(project)
        return PlainTextResponse(content=md, media_type="text/markdown", headers={
            "Content-Disposition": f"attachment; filename={project.title.replace(' ', '_')}_Plan.md"
        })
    elif format == "csv":
        csv_data = export_service.export_csv(project)
        return PlainTextResponse(content=csv_data, media_type="text/csv", headers={
            "Content-Disposition": f"attachment; filename={project.title.replace(' ', '_')}_Tasks.csv"
        })
    elif format == "json":
        data = export_service.export_json(project)
        return data
    elif format == "html":
        md = export_service.export_markdown(project)
        html_doc = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>{project.title} - ThinkFlow AI Executive Report</title>
<style>
body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 900px; margin: 40px auto; padding: 0 20px; }}
h1 {{ color: #4338ca; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }}
h2 {{ color: #334155; margin-top: 32px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }}
h3 {{ color: #475569; }}
table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
th, td {{ border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }}
th {{ background: #f8fafc; font-weight: 600; }}
code {{ background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; }}
.badge {{ display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; background: #e0e7ff; color: #3730a3; }}
</style>
</head>
<body>
<pre style="white-space: pre-wrap; font-family: inherit;">{md}</pre>
</body>
</html>"""
        return Response(content=html_doc, media_type="text/html")
