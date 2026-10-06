from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.database.session import get_db
from app.models.models import User, Project, Task, Dependency, ActivityLog
from app.schemas.schemas import (
    TaskCreate, TaskUpdate, TaskResponse, DependencyCreate, DependencyResponse
)
from app.api.auth import get_current_user
from app.services.project_service import project_service

router = APIRouter(prefix="/projects/{project_id}/tasks", tags=["Tasks & Dependencies"])

@router.post("", response_model=TaskResponse)
async def create_task(
    project_id: str,
    data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await project_service.get_project(db, project_id, current_user.id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found.")

    task = Task(
        project_id=project_id,
        phase_id=data.phase_id,
        title=data.title,
        description=data.description,
        priority=data.priority,
        estimated_hours=data.estimated_hours,
        status=data.status,
        owner=data.owner,
        skills_required=data.skills_required,
        resources=data.resources,
        acceptance_criteria=data.acceptance_criteria,
        position_x=data.position_x or 100.0,
        position_y=data.position_y or 100.0,
        notes=data.notes
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    await project_service.recalculate_progress(db, project_id)
    return task

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    project_id: str,
    task_id: str,
    data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await project_service.get_project(db, project_id, current_user.id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found.")

    q = select(Task).where(Task.id == task_id, Task.project_id == project_id)
    res = await db.execute(q)
    task = res.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(task, field, val)

    await db.commit()
    await db.refresh(task)

    await project_service.recalculate_progress(db, project_id)
    return task

@router.delete("/{task_id}")
async def delete_task(
    project_id: str,
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await project_service.get_project(db, project_id, current_user.id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found.")

    q = select(Task).where(Task.id == task_id, Task.project_id == project_id)
    res = await db.execute(q)
    task = res.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    # Delete related dependencies
    await db.execute(
        delete(Dependency).where(
            Dependency.project_id == project_id,
            (Dependency.source_task_id == task_id) | (Dependency.target_task_id == task_id)
        )
    )

    await db.delete(task)
    await db.commit()
    await project_service.recalculate_progress(db, project_id)
    return {"message": "Task deleted successfully", "id": task_id}

@router.post("/dependencies", response_model=DependencyResponse)
async def create_dependency(
    project_id: str,
    data: DependencyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await project_service.get_project(db, project_id, current_user.id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found.")

    dep = Dependency(
        project_id=project_id,
        source_task_id=data.source_task_id,
        target_task_id=data.target_task_id,
        type=data.type
    )
    db.add(dep)
    await db.commit()
    await db.refresh(dep)
    return dep

@router.delete("/dependencies/{dependency_id}")
async def delete_dependency(
    project_id: str,
    dependency_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await project_service.get_project(db, project_id, current_user.id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found.")

    q = select(Dependency).where(Dependency.id == dependency_id, Dependency.project_id == project_id)
    res = await db.execute(q)
    dep = res.scalar_one_or_none()
    if not dep:
        raise HTTPException(status_code=404, detail="Dependency not found.")

    await db.delete(dep)
    await db.commit()
    return {"message": "Dependency deleted successfully"}
