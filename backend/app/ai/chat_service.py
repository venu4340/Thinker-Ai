import json
from typing import AsyncIterator, List, Dict, Any, Optional, Tuple
from app.core.config import settings
from app.core.logging import logger
from app.ai.providers.provider_manager import provider_manager, AIProviderError, NoProviderConfiguredError

from app.ai.providers.gemini_provider import THINKFLOW_SYSTEM_PROMPT



async def stream_chat_response(
    messages: List[Dict[str, str]],
    provider: Optional[str] = None,
    model: Optional[str] = None,
) -> AsyncIterator[Tuple[str, str]]:
    """
    Stream chat response from configured real AI providers.
    Yields (chunk_text, provider_name_used).
    
    Automatic Failover Flow:
    1. Check selected provider (if user explicitly selected one).
    2. Otherwise use AI_DEFAULT_PROVIDER.
    3. If that provider fails or is unconfigured, try the other configured REAL provider.
    4. If both fail, raise AIProviderError (NEVER generates fake fallback).
    """
    # Prepend system prompt to the message history
    full_messages = [{"role": "system", "content": THINKFLOW_SYSTEM_PROMPT}] + [
        {"role": m.get("role", "user"), "content": m.get("content", "")}
        for m in messages
    ]

    async for chunk, prov_name in provider_manager.stream(
        messages=full_messages,
        requested_provider=provider,
        model=model,
    ):
        yield chunk, prov_name


async def generate_chat_response(
    messages: List[Dict[str, str]],
    provider: Optional[str] = None,
    model: Optional[str] = None,
) -> Tuple[str, str]:
    """Generate complete chat response from real AI provider."""
    full_messages = [{"role": "system", "content": THINKFLOW_SYSTEM_PROMPT}] + [
        {"role": m.get("role", "user"), "content": m.get("content", "")}
        for m in messages
    ]
    return await provider_manager.generate(
        messages=full_messages,
        requested_provider=provider,
        model=model,
    )
