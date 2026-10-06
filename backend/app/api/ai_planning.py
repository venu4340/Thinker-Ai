from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.models.models import User, Project, AIGeneration, ActivityLog, DocumentChunk
from app.schemas.schemas import (
    AIGeneratePlanRequest, AIAskNodeRequest, AIRefinePlanRequest, ProjectDetailResponse
)
from app.api.auth import get_current_user
from app.services.project_service import project_service
from app.services.context_service import context_service
from app.ai.orchestrator import ai_orchestrator
from app.ai.rag_engine import RAGEngine

router = APIRouter(prefix="/projects", tags=["AI Planning"])

@router.post("/{project_id}/generate", response_model=ProjectDetailResponse)
async def generate_plan(
    project_id: str,
    req: AIGeneratePlanRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await project_service.get_project(db, project_id, current_user.id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found or access denied.")

    # Retrieve RAG context from uploaded document chunks if requested or available
    document_context = ""
    query_text = f"{project.title} {project.description or ''} {project.goal or ''}"
    
    q_chunks = select(DocumentChunk).where(DocumentChunk.project_id == project_id)
    chunk_res = await db.execute(q_chunks)
    all_chunks = list(chunk_res.scalars().all())
    
    if all_chunks:
        chunks_payload = [{"content": c.content, "embedding": c.embedding} for c in all_chunks]
        top_chunks = RAGEngine.retrieve_relevant_chunks(query_text, chunks_payload, top_k=4)
        if top_chunks:
            document_context = "\n\n".join(top_chunks)

    # Invoke AI Orchestration
    raw_plan = await ai_orchestrator.generate_project_plan(
        title=project.title,
        description=project.description or project.title,
        category=project.category,
        goal=project.goal or "",
        budget=project.budget or "",
        timeframe=project.timeframe or "",
        team_size=project.team_size or "",
        tech_stack=project.tech_stack or "",
        document_context=document_context,
        custom_instructions=req.custom_instructions or "",
        preferred_provider=req.preferred_provider
    )

    p_id = project.id
    p_title = project.title

    # Hydrate relational models and update project
    updated_project = await project_service.apply_ai_plan_to_project(
        db, project, raw_plan, version_desc="AI Generated Full Plan"
    )

    # Log AI Generation
    gen_log = AIGeneration(
        project_id=p_id,
        prompt_type="plan_generation",
        prompt_text=query_text,
        structured_response=raw_plan,
        model_used=req.preferred_provider or "default"
    )
    db.add(gen_log)
    
    act_log = ActivityLog(
        project_id=p_id,
        user_id=current_user.id,
        action="AI_PLAN_GENERATED",
        details={"phases_count": len(raw_plan.get("phases", []))}
    )
    db.add(act_log)
    await db.commit()

    detailed = await project_service.get_project(db, p_id, current_user.id)
    return detailed

@router.post("/{project_id}/challenge")
async def challenge_plan(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await project_service.get_project(db, project_id, current_user.id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found or access denied.")

    project_data = {
        "title": project.title,
        "description": project.description,
        "category": project.category,
        "goal": project.goal,
        "budget": project.budget,
        "timeframe": project.timeframe,
        "team_size": project.team_size,
        "objectives": [o.title for o in project.objectives],
        "phases": [
            {"title": p.title, "tasks": [t.title for t in p.tasks]}
            for p in project.phases
        ],
        "risks": [r.risk for r in project.risks]
    }

    challenge_result = await ai_orchestrator.challenge_plan(project_data)

    # Log generation
    gen_log = AIGeneration(
        project_id=project.id,
        prompt_type="challenge",
        structured_response=challenge_result
    )
    db.add(gen_log)
    await db.commit()

    return challenge_result

@router.post("/{project_id}/approaches")
async def generate_3_approaches(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await project_service.get_project(db, project_id, current_user.id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found or access denied.")

    approaches_result = await ai_orchestrator.generate_3_approaches(
        project_title=project.title,
        description=project.description or project.title,
        category=project.category,
        goal=project.goal or ""
    )

    gen_log = AIGeneration(
        project_id=project.id,
        prompt_type="approaches",
        structured_response=approaches_result
    )
    db.add(gen_log)
    await db.commit()

    return approaches_result

@router.post("/{project_id}/ask-node")
async def ask_node_question(
    project_id: str,
    req: AIAskNodeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await project_service.get_project(db, project_id, current_user.id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found or access denied.")

    context_str = context_service.build_project_context(project)

    advice_result = await ai_orchestrator.ask_node_advice(
        project_context=context_str,
        node_type=req.node_type,
        node_data=req.node_data,
        question=req.question
    )

    return advice_result

@router.post("/{project_id}/refine", response_model=ProjectDetailResponse)
async def refine_plan(
    project_id: str,
    req: AIRefinePlanRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await project_service.get_project(db, project_id, current_user.id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found or access denied.")

    context_str = context_service.build_project_context(project)
    custom_inst = f"Refinement strategy: {req.refinement_type}. Details: {req.instructions or ''}"

    raw_plan = await ai_orchestrator.generate_project_plan(
        title=project.title,
        description=f"{project.description}\n\nExisting Context:\n{context_str}",
        category=project.category,
        goal=project.goal or "",
        budget=project.budget or "",
        timeframe=project.timeframe or "",
        team_size=project.team_size or "",
        tech_stack=project.tech_stack or "",
        custom_instructions=custom_inst
    )

    p_id = project.id
    updated_project = await project_service.apply_ai_plan_to_project(
        db, project, raw_plan, version_desc=f"Refined Plan: {req.refinement_type.replace('_', ' ').title()}"
    )

    detailed = await project_service.get_project(db, p_id, current_user.id)
    return detailed
