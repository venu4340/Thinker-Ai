import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, desc
from sqlalchemy.orm import selectinload

from app.models.models import (
    Project, Phase, Task, Dependency, Risk, Objective, 
    Milestone, Resource, Decision, Document, DocumentChunk, ProjectVersion, ActivityLog
)
from app.schemas.schemas import ProjectCreate, ProjectUpdate, TaskCreate, TaskUpdate, RiskCreate, RiskUpdate
from app.services.export_service import export_service

class ProjectService:
    @staticmethod
    async def get_project(db: AsyncSession, project_id: str, user_id: str) -> Optional[Project]:
        query = (
            select(Project)
            .where(Project.id == project_id)
            .options(
                selectinload(Project.objectives),
                selectinload(Project.phases).selectinload(Phase.tasks),
                selectinload(Project.tasks),
                selectinload(Project.dependencies),
                selectinload(Project.risks),
                selectinload(Project.milestones),
                selectinload(Project.resources),
                selectinload(Project.decisions),
                selectinload(Project.documents),
            )
            .execution_options(populate_existing=True)
        )
        result = await db.execute(query)
        project = result.scalar_one_or_none()
        return project

    @staticmethod
    async def list_projects(db: AsyncSession, user_id: str) -> List[Project]:
        query = (
            select(Project)
            .where(Project.user_id == user_id)
            .options(
                selectinload(Project.tasks),
                selectinload(Project.risks)
            )
            .order_by(desc(Project.updated_at))
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def create_project(db: AsyncSession, user_id: str, data: ProjectCreate) -> Project:
        project = Project(
            user_id=user_id,
            title=data.title,
            description=data.description,
            category=data.category,
            goal=data.goal,
            budget=data.budget,
            timeframe=data.timeframe,
            team_size=data.team_size,
            tech_stack=data.tech_stack,
            status="planning",
            progress=0.0
        )
        db.add(project)
        await db.commit()
        await db.refresh(project)

        # Log creation activity
        log = ActivityLog(
            project_id=project.id,
            user_id=user_id,
            action="PROJECT_CREATED",
            details={"title": project.title}
        )
        db.add(log)
        await db.commit()
        return project

    @staticmethod
    async def update_project(db: AsyncSession, project: Project, data: ProjectUpdate) -> Project:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(project, field, value)
        project.updated_at = datetime.datetime.utcnow()
        await db.commit()
        await db.refresh(project)
        return project

    @staticmethod
    async def delete_project(db: AsyncSession, project: Project) -> None:
        await db.delete(project)
        await db.commit()

    @classmethod
    async def apply_ai_plan_to_project(
        cls, db: AsyncSession, project: Project, plan_data: Dict[str, Any], version_desc: str = "AI Plan Generated"
    ) -> Project:
        proj_id = project.id
        owner_id = project.user_id

        # 1. Clear existing plan nodes if any
        await db.execute(delete(Dependency).where(Dependency.project_id == proj_id))
        await db.execute(delete(Task).where(Task.project_id == proj_id))
        await db.execute(delete(Phase).where(Phase.project_id == proj_id))
        await db.execute(delete(Risk).where(Risk.project_id == proj_id))
        await db.execute(delete(Objective).where(Objective.project_id == proj_id))
        await db.execute(delete(Milestone).where(Milestone.project_id == proj_id))
        await db.execute(delete(Resource).where(Resource.project_id == proj_id))
        await db.execute(delete(Decision).where(Decision.project_id == proj_id))
        await db.commit()

        # 2. Insert Objectives
        for idx, obj in enumerate(plan_data.get("objectives", [])):
            objective = Objective(
                project_id=proj_id,
                title=obj.get("title", f"Objective {idx+1}"),
                description=obj.get("description"),
                target_metric=obj.get("target_metric"),
                priority=obj.get("priority", "high"),
                order=idx
            )
            db.add(objective)

        # 3. Insert Phases and Tasks
        phase_colors = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"]
        task_id_map = {}

        base_x = 100
        base_y = 120

        for p_idx, p_data in enumerate(plan_data.get("phases", [])):
            phase = Phase(
                project_id=proj_id,
                title=p_data.get("title", f"Phase {p_idx+1}"),
                description=p_data.get("description"),
                order=p_idx + 1,
                status="not_started",
                color=phase_colors[p_idx % len(phase_colors)]
            )
            db.add(phase)
            await db.flush()

            tasks_list = p_data.get("tasks", [])
            for t_idx, t_data in enumerate(tasks_list):
                pos_x = base_x + (p_idx * 320)
                pos_y = base_y + (t_idx * 160)
                
                task = Task(
                    project_id=proj_id,
                    phase_id=phase.id,
                    title=t_data.get("title", f"Task {t_idx+1}"),
                    description=t_data.get("description"),
                    priority=t_data.get("priority", "medium"),
                    estimated_hours=float(t_data.get("estimated_hours", 4.0)),
                    status="todo",
                    owner=t_data.get("owner", "Lead Engineer"),
                    skills_required=t_data.get("skills_required", []),
                    resources=t_data.get("resources", []),
                    acceptance_criteria=t_data.get("acceptance_criteria", []),
                    position_x=float(pos_x),
                    position_y=float(pos_y),
                    order=t_idx + 1
                )
                db.add(task)
                await db.flush()
                
                ai_id = t_data.get("id")
                if ai_id:
                    task_id_map[ai_id] = task.id

        # 4. Insert Dependencies
        for dep in plan_data.get("dependencies", []):
            src_ai = dep.get("source_task_id")
            tgt_ai = dep.get("target_task_id")
            src_db = task_id_map.get(src_ai, src_ai)
            tgt_db = task_id_map.get(tgt_ai, tgt_ai)
            if src_db and tgt_db:
                dependency = Dependency(
                    project_id=proj_id,
                    source_task_id=src_db,
                    target_task_id=tgt_db,
                    type=dep.get("type", "finish_to_start")
                )
                db.add(dependency)

        # 5. Insert Risks
        for r_data in plan_data.get("risks", []):
            risk = Risk(
                project_id=proj_id,
                risk=r_data.get("risk", "Identified risk"),
                probability=int(r_data.get("probability", 3)),
                impact=int(r_data.get("impact", 3)),
                severity=r_data.get("severity", "medium"),
                cause=r_data.get("cause"),
                mitigation=r_data.get("mitigation"),
                owner=r_data.get("owner", "Risk Officer"),
                status="identified"
            )
            db.add(risk)

        # 6. Insert Milestones
        for m_data in plan_data.get("milestones", []):
            milestone = Milestone(
                project_id=proj_id,
                title=m_data.get("title", "Key Milestone"),
                description=m_data.get("description"),
                status="pending",
                criteria=m_data.get("criteria", [])
            )
            db.add(milestone)

        # 7. Insert Resources
        for res_data in plan_data.get("resources", []):
            resource = Resource(
                project_id=proj_id,
                name=res_data.get("name", "Team Member / Service"),
                type=res_data.get("type", "human"),
                cost=res_data.get("cost_estimate"),
                allocation=res_data.get("allocation")
            )
            db.add(resource)

        # 8. Insert Recommended Decisions
        for d_data in plan_data.get("recommended_decisions", []):
            decision = Decision(
                project_id=proj_id,
                decision=d_data.get("decision", "Architecture Choice"),
                reason=d_data.get("reason", "Rationale"),
                alternatives_considered=d_data.get("alternatives_considered", []),
                impact=d_data.get("impact"),
                status="approved"
            )
            db.add(decision)

        # Store IDs before commit
        proj_id = project.id
        owner_id = project.user_id

        # Update project status
        project.status = "in_progress"
        project.progress = 0.0
        project.updated_at = datetime.datetime.now(datetime.timezone.utc)
        await db.commit()

        # 9. Create a Version Snapshot
        refreshed = await cls.get_project(db, proj_id, owner_id)
        if refreshed:
            snapshot = export_service.export_json(refreshed)
            
            # Count existing versions
            q_v = select(ProjectVersion).where(ProjectVersion.project_id == project.id)
            v_res = await db.execute(q_v)
            v_count = len(v_res.scalars().all())
            
            version = ProjectVersion(
                project_id=project.id,
                version_number=v_count + 1,
                description=version_desc,
                snapshot_data=snapshot,
                created_by="ThinkFlow AI Planner"
            )
            db.add(version)
            await db.commit()

        return refreshed or project

    @classmethod
    async def recalculate_progress(cls, db: AsyncSession, project_id: str) -> float:
        q_tasks = select(Task).where(Task.project_id == project_id)
        res = await db.execute(q_tasks)
        tasks = list(res.scalars().all())
        if not tasks:
            return 0.0
        done_count = sum(1 for t in tasks if t.status == "done")
        progress = round((done_count / len(tasks)) * 100.0, 1)

        q_p = select(Project).where(Project.id == project_id)
        p_res = await db.execute(q_p)
        project = p_res.scalar_one_or_none()
        if project:
            project.progress = progress
            if progress >= 100.0:
                project.status = "completed"
            await db.commit()
        return progress

project_service = ProjectService()
