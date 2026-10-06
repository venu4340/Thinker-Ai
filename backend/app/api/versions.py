from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database.session import get_db
from app.models.models import User, Project, ProjectVersion
from app.schemas.schemas import VersionResponse, ProjectDetailResponse
from app.api.auth import get_current_user
from app.services.project_service import project_service

router = APIRouter(prefix="/projects/{project_id}/versions", tags=["Version History"])

@router.get("", response_model=List[VersionResponse])
async def list_versions(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await project_service.get_project(db, project_id, current_user.id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found.")

    q = select(ProjectVersion).where(ProjectVersion.project_id == project_id).order_by(desc(ProjectVersion.version_number))
    res = await db.execute(q)
    return list(res.scalars().all())

@router.post("/{version_id}/restore", response_model=ProjectDetailResponse)
async def restore_version(
    project_id: str,
    version_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await project_service.get_project(db, project_id, current_user.id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found.")

    q = select(ProjectVersion).where(ProjectVersion.id == version_id, ProjectVersion.project_id == project_id)
    res = await db.execute(q)
    version = res.scalar_one_or_none()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found.")

    snapshot = version.snapshot_data
    # Re-apply snapshot to project
    await project_service.apply_ai_plan_to_project(
        db, project, snapshot, version_desc=f"Restored to Version {version.version_number}"
    )

    detailed = await project_service.get_project(db, project_id, current_user.id)
    return detailed
