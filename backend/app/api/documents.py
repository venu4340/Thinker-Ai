from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.models.models import User, Project, Document, DocumentChunk
from app.schemas.schemas import DocumentResponse
from app.api.auth import get_current_user
from app.services.project_service import project_service
from app.ai.rag_engine import RAGEngine
from app.core.config import settings

router = APIRouter(prefix="/projects/{project_id}/documents", tags=["Documents & RAG"])

@router.post("", response_model=DocumentResponse)
async def upload_document(
    project_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await project_service.get_project(db, project_id, current_user.id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found.")

    content_bytes = await file.read()
    if len(content_bytes) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    filename = file.filename or "uploaded_doc.txt"
    file_type = filename.split(".")[-1].lower() if "." in filename else "txt"

    # Extract text
    raw_text = RAGEngine.extract_text_from_file(content_bytes, filename)
    
    document = Document(
        project_id=project_id,
        filename=filename,
        file_type=file_type,
        file_size=len(content_bytes),
        raw_text=raw_text
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    # Chunk and embed
    chunks = RAGEngine.chunk_text(raw_text)
    for idx, c_text in enumerate(chunks):
        emb = RAGEngine.compute_simple_embedding(c_text)
        chunk_record = DocumentChunk(
            document_id=document.id,
            project_id=project_id,
            chunk_index=idx,
            content=c_text,
            embedding=emb
        )
        db.add(chunk_record)

    await db.commit()
    return document

@router.delete("/{document_id}")
async def delete_document(
    project_id: str,
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await project_service.get_project(db, project_id, current_user.id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found.")

    q = select(Document).where(Document.id == document_id, Document.project_id == project_id)
    res = await db.execute(q)
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    await db.delete(doc)
    await db.commit()
    return {"message": "Document deleted successfully"}
