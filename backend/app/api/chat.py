import json
import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel, Field

from app.database.session import get_db, AsyncSessionLocal
from app.models.models import Conversation, Message, User, generate_uuid
from app.api.auth import get_current_user
from app.ai.chat_service import stream_chat_response
from app.ai.providers.provider_manager import provider_manager, AIProviderError, NoProviderConfiguredError

router = APIRouter(prefix="/chat", tags=["chat"])


class SendMessageRequest(BaseModel):
    conversation_id: Optional[str] = None
    content: Optional[str] = None
    message: Optional[str] = None
    provider: Optional[str] = "gemini"
    model: Optional[str] = None
    image_base64: Optional[str] = None
    image_mime_type: Optional[str] = None

    def get_prompt(self) -> str:
        text = self.content or self.message or ""
        return text.strip()


class HealthOut(BaseModel):
    provider: str = "gemini"
    configured: bool
    model: str


class ProviderStatusOut(BaseModel):
    id: str
    label: str
    configured: bool
    model: str
    is_default: bool
    status: str


class ConversationOut(BaseModel):
    id: str
    title: Optional[str]
    model: str
    created_at: str
    updated_at: str
    message_count: int = 0

    class Config:
        from_attributes = True


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    model_used: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


def _title_from_message(content: str) -> str:
    """Generate a short conversation title from the first user message."""
    words = content.strip().split()
    title = " ".join(words[:6])
    if len(words) > 6:
        title += "..."
    return title[:80]


@router.get("/health", response_model=HealthOut)
async def chat_health():
    """Return Gemini health status without exposing credentials."""
    return await provider_manager.get_health()


@router.get("/providers", response_model=List[ProviderStatusOut])
async def list_providers():
    """Return list of configured and available AI providers (Gemini only)."""
    return provider_manager.get_available_providers()


@router.get("/conversations", response_model=List[ConversationOut])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(desc(Conversation.updated_at))
        .limit(50)
    )
    conversations = result.scalars().all()
    out = []
    for c in conversations:
        msgs_result = await db.execute(
            select(Message).where(Message.conversation_id == c.id)
        )
        msg_count = len(msgs_result.scalars().all())
        out.append(ConversationOut(
            id=c.id,
            title=c.title or "New conversation",
            model="gemini",
            created_at=c.created_at.isoformat(),
            updated_at=c.updated_at.isoformat(),
            message_count=msg_count,
        ))
    return out


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageOut])
async def get_messages(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = await db.get(Conversation, conversation_id)
    if not conv or conv.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )
    messages = result.scalars().all()
    return [
        MessageOut(
            id=m.id,
            role=m.role,
            content=m.content,
            model_used=m.model_used or "gemini",
            created_at=m.created_at.isoformat(),
        )
        for m in messages
    ]


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = await db.get(Conversation, conversation_id)
    if not conv or conv.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    await db.delete(conv)
    await db.commit()
    return {"ok": True}


async def _handle_send_stream(
    body: SendMessageRequest,
    db: AsyncSession,
    current_user: User,
):
    prompt_text = body.get_prompt()
    if not prompt_text:
        raise HTTPException(status_code=400, detail="Message content cannot be empty.")

    # 1. Get or create conversation and load previous context
    if body.conversation_id:
        conv = await db.get(Conversation, body.conversation_id)
        if not conv or conv.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Conversation not found")
        history_result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conv.id)
            .order_by(Message.created_at)
        )
        history = history_result.scalars().all()
        messages_payload = [
            {"role": m.role, "content": m.content}
            for m in history
        ]
    else:
        conv = Conversation(
            id=generate_uuid(),
            user_id=current_user.id,
            title=_title_from_message(prompt_text),
            model="gemini",
        )
        db.add(conv)
        await db.flush()
        messages_payload = []

    conv.model = "gemini"
    conv.updated_at = datetime.datetime.utcnow()

    # 2. Save user message and create placeholder assistant message in single commit
    user_msg = Message(
        id=generate_uuid(),
        conversation_id=conv.id,
        role="user",
        content=prompt_text,
        model_used="gemini",
    )
    db.add(user_msg)

    assistant_msg = Message(
        id=generate_uuid(),
        conversation_id=conv.id,
        role="assistant",
        content="",
        model_used="gemini",
    )
    db.add(assistant_msg)
    await db.commit()

    conv_id = conv.id
    msg_id = assistant_msg.id

    messages_payload.append({"role": "user", "content": prompt_text})
    if body.image_base64:
        messages_payload[-1]["image_base64"] = body.image_base64
        messages_payload[-1]["image_mime_type"] = body.image_mime_type or "image/jpeg"

    async def event_stream():
        # Emit initial metadata immediately
        yield f"data: {json.dumps({'type': 'meta', 'conversation_id': conv_id, 'message_id': msg_id, 'provider': 'gemini'})}\n\n"

        full_text = ""

        try:
            async for chunk, prov_name in stream_chat_response(
                messages=messages_payload,
                provider="gemini",
                model=body.model,
            ):
                full_text += chunk
                payload = json.dumps({
                    "type": "chunk",
                    "text": chunk,
                    "provider": "gemini",
                })
                yield f"data: {payload}\n\n"

            # Persist assistant response asynchronously
            async with AsyncSessionLocal() as session:
                msg = await session.get(Message, msg_id)
                if msg:
                    msg.content = full_text
                    msg.model_used = "gemini"
                db_conv = await session.get(Conversation, conv_id)
                if db_conv:
                    db_conv.model = "gemini"
                    db_conv.updated_at = datetime.datetime.utcnow()
                await session.commit()

            yield f"data: {json.dumps({'type': 'done', 'provider': 'gemini'})}\n\n"

        except (AIProviderError, NoProviderConfiguredError) as e:
            raw = e.message if hasattr(e, "message") else str(e)
            safe_msg = "Our AI service is experiencing high demand right now. Please try again." if any(
                kw in raw.lower() for kw in ("503", "unavailable", "overload", "rate limit", "quota", "api key", "gemini")
            ) else "Gemini is temporarily unavailable. Please retry."
            yield f"data: {json.dumps({'type': 'error', 'message': safe_msg, 'provider': 'gemini'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': 'Gemini is temporarily unavailable. Please retry.', 'provider': 'gemini'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.post("/send")
async def send_message(
    body: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send a message and stream back real Google Gemini response via Server-Sent Events.
    Never produces mock or simulation fallback.
    """
    return await _handle_send_stream(body, db, current_user)


@router.post("")
async def send_message_root(
    body: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Alias for POST /chat (or /api/v1/chat)."""
    return await _handle_send_stream(body, db, current_user)
