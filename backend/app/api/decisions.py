from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.models.models import User, Project, Decision
from app.schemas.schemas import DecisionCreate, DecisionResponse
from app.api.auth import get_current_user
from app.services.project_service import project_service

router = APIRouter(prefix="/projects/{project_id}/decisions", tags=["Decisions"])

@router.post("", response_model=DecisionResponse)
async def create_decision(
    project_id: str,
    data: DecisionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await project_service.get_project(db, project_id, current_user.id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found.")

    dec = Decision(
        project_id=project_id,
        decision=data.decision,
        reason=data.reason,
        alternatives_considered=data.alternatives_considered,
        impact=data.impact,
        status=data.status
    )
    db.add(dec)
    await db.commit()
    await db.refresh(dec)
    return dec

@router.delete("/{decision_id}")
async def delete_decision(
    project_id: str,
    decision_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await project_service.get_project(db, project_id, current_user.id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found.")

    q = select(Decision).where(Decision.id == decision_id, Decision.project_id == project_id)
    res = await db.execute(q)
    dec = res.scalar_one_or_none()
    if not dec:
        raise HTTPException(status_code=404, detail="Decision record not found.")

    await db.delete(dec)
    await db.commit()
    return {"message": "Decision deleted successfully"}
