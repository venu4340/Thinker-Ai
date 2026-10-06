from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.models.models import User, Template, Project
from app.schemas.schemas import TemplateResponse, ProjectDetailResponse, ProjectCreate
from app.api.auth import get_current_user
from app.services.project_service import project_service
from app.ai.simulation_provider import SimulationProvider

router = APIRouter(prefix="/templates", tags=["Templates"])

@router.get("", response_model=List[TemplateResponse])
async def list_templates(db: AsyncSession = Depends(get_db)):
    q = select(Template).order_by(Template.category)
    res = await db.execute(q)
    return list(res.scalars().all())

@router.post("/{template_id}/use", response_model=ProjectDetailResponse)
async def create_project_from_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    q = select(Template).where(Template.id == template_id)
    res = await db.execute(q)
    template = res.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found.")

    t_data = template.data
    create_dto = ProjectCreate(
        title=t_data.get("title", template.title),
        description=template.description,
        category=template.category,
        goal=t_data.get("goal"),
        budget=t_data.get("budget"),
        timeframe=t_data.get("timeframe"),
        tech_stack=t_data.get("tech_stack")
    )
    project = await project_service.create_project(db, current_user.id, create_dto)

    # Generate starter plan for template
    sim = SimulationProvider()
    plan = sim._generate_simulated_project_plan(template.title, template.category.lower())
    await project_service.apply_ai_plan_to_project(
        db, project, plan, version_desc=f"Initialized from Template: {template.title}"
    )

    detailed = await project_service.get_project(db, project.id, current_user.id)
    return detailed
