from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.models.models import User, Project, Risk
from app.schemas.schemas import RiskCreate, RiskUpdate, RiskResponse
from app.api.auth import get_current_user
from app.services.project_service import project_service

router = APIRouter(prefix="/projects/{project_id}/risks", tags=["Risks"])

@router.post("", response_model=RiskResponse)
async def create_risk(
    project_id: str,
    data: RiskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await project_service.get_project(db, project_id, current_user.id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found.")

    risk = Risk(
        project_id=project_id,
        risk=data.risk,
        probability=data.probability,
        impact=data.impact,
        severity=data.severity,
        cause=data.cause,
        mitigation=data.mitigation,
        owner=data.owner,
        status=data.status
    )
    db.add(risk)
    await db.commit()
    await db.refresh(risk)
    return risk

@router.put("/{risk_id}", response_model=RiskResponse)
async def update_risk(
    project_id: str,
    risk_id: str,
    data: RiskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await project_service.get_project(db, project_id, current_user.id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found.")

    q = select(Risk).where(Risk.id == risk_id, Risk.project_id == project_id)
    res = await db.execute(q)
    risk = res.scalar_one_or_none()
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found.")

    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(risk, field, val)

    await db.commit()
    await db.refresh(risk)
    return risk

@router.delete("/{risk_id}")
async def delete_risk(
    project_id: str,
    risk_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await project_service.get_project(db, project_id, current_user.id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found.")

    q = select(Risk).where(Risk.id == risk_id, Risk.project_id == project_id)
    res = await db.execute(q)
    risk = res.scalar_one_or_none()
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found.")

    await db.delete(risk)
    await db.commit()
    return {"message": "Risk deleted successfully"}
