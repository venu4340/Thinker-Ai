import pytest
import asyncio
from unittest.mock import patch, MagicMock
from app.ai.providers.base import AIProviderError, NoProviderConfiguredError
from app.ai.providers.provider_manager import ProviderManager
from app.ai.providers.gemini_provider import GeminiChatProvider, THINKFLOW_SYSTEM_PROMPT


@pytest.mark.asyncio
async def test_no_gemini_key_raises_unconfigured_error():
    pm = ProviderManager()
    with patch.object(pm.provider, "is_configured", return_value=False):
        with pytest.raises(NoProviderConfiguredError) as exc_info:
            pm.select_provider()
        assert "No AI provider is configured" in str(exc_info.value)


@pytest.mark.asyncio
async def test_gemini_streaming_success():
    pm = ProviderManager()

    async def mock_gemini_stream(messages, model=None):
        yield "Hello"
        yield " from "
        yield "Gemini!"

    with patch.object(pm.provider, "is_configured", return_value=True), \
         patch.object(pm.provider, "stream", side_effect=mock_gemini_stream):

        chunks = []
        providers_used = []
        async for chunk, prov in pm.stream([{"role": "user", "content": "hi"}]):
            chunks.append(chunk)
            providers_used.append(prov)

        assert "".join(chunks) == "Hello from Gemini!"
        assert all(p == "gemini" for p in providers_used)


@pytest.mark.asyncio
async def test_gemini_auth_error_mapping():
    provider = GeminiChatProvider()
    msg = provider._map_gemini_error(Exception("401 UNAUTHENTICATED: API_KEY_INVALID"))
    assert msg == "Gemini authentication failed. Please check your API key."


@pytest.mark.asyncio
async def test_gemini_rate_limit_error_mapping():
    provider = GeminiChatProvider()
    msg = provider._map_gemini_error(Exception("429 RESOURCE_EXHAUSTED: quota exceeded"))
    assert msg == "Gemini rate limit reached. Please try again shortly."


@pytest.mark.asyncio
async def test_gemini_model_not_found_error_mapping():
    provider = GeminiChatProvider()
    msg = provider._map_gemini_error(Exception("404 NOT_FOUND: model not found"))
    assert msg == "The configured Gemini model was not found."


@pytest.mark.asyncio
async def test_gemini_network_error_mapping():
    provider = GeminiChatProvider()
    msg = provider._map_gemini_error(Exception("Failed to connect to host: timeout"))
    assert msg == "Unable to reach Gemini. Please retry."


@pytest.mark.asyncio
async def test_gemini_health_check():
    pm = ProviderManager()
    with patch.object(pm.provider, "is_configured", return_value=True):
        health = await pm.get_health()
        assert health["provider"] == "gemini"
        assert health["configured"] is True
        assert "gemini" in health["model"]


@pytest.mark.asyncio
async def test_conversation_context_passed_to_gemini():
    """Verify that multiple history turns are preserved and formatted for Gemini."""
    history = [
        {"role": "user", "content": "I want to build an AI app for students."},
        {"role": "assistant", "content": "That is an exciting domain. What problem do you want to solve?"},
        {"role": "user", "content": "What problem should I solve?"},
    ]

    captured_messages = []

    async def mock_stream(messages, model=None):
        captured_messages.extend(messages)
        yield "Focus on student time management."

    pm = ProviderManager()
    with patch.object(pm.provider, "is_configured", return_value=True), \
         patch.object(pm.provider, "stream", side_effect=mock_stream):

        chunks = []
        async for chunk, _ in pm.stream(history):
            chunks.append(chunk)

        # Confirm all 3 conversation turns are present
        assert len(captured_messages) == 3
        assert captured_messages[0]["content"] == "I want to build an AI app for students."
        assert captured_messages[1]["content"] == "That is an exciting domain. What problem do you want to solve?"
        assert captured_messages[2]["content"] == "What problem should I solve?"
