from typing import AsyncIterator, List, Dict, Any, Optional, Tuple
from app.core.config import settings
from app.core.logging import logger
from app.ai.providers.base import BaseAIChatProvider, AIProviderError, NoProviderConfiguredError
from app.ai.providers.gemini_provider import GeminiChatProvider


class ProviderManager:
    def __init__(self):
        self.provider = GeminiChatProvider()

    def get_available_providers(self) -> List[Dict[str, Any]]:
        """Return status and metadata for Gemini provider."""
        configured = self.provider.is_configured()
        model_id = self.provider.get_model()
        return [
            {
                "id": "gemini",
                "label": "Gemini",
                "configured": configured,
                "model": model_id,
                "is_default": True,
                "status": "Available" if configured else "Not configured",
            }
        ]

    async def get_health(self) -> Dict[str, Any]:
        """Return Gemini health status."""
        return {
            "provider": "gemini",
            "configured": self.provider.is_configured(),
            "model": self.provider.get_model(),
        }

    def select_provider(self, requested: Optional[str] = None) -> BaseAIChatProvider:
        """Select Gemini provider."""
        if not self.provider.is_configured():
            raise NoProviderConfiguredError(
                "No AI provider is configured. Add an API key to the backend environment."
            )
        return self.provider

    async def generate(
        self,
        messages: List[Dict[str, str]],
        requested_provider: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Tuple[str, str]:
        """
        Generate text response using Gemini.
        Returns tuple of (response_text, provider_name).
        """
        if not self.provider.is_configured():
            raise NoProviderConfiguredError(
                "No AI provider is configured. Add an API key to the backend environment."
            )
        text = await self.provider.generate(messages, model)
        return text, "gemini"

    async def stream(
        self,
        messages: List[Dict[str, str]],
        requested_provider: Optional[str] = None,
        model: Optional[str] = None,
    ) -> AsyncIterator[Tuple[str, str]]:
        """
        Stream response directly from Gemini.
        Yields (chunk_text, provider_name).
        NEVER falls back to demo/mock content.
        """
        if not self.provider.is_configured():
            raise NoProviderConfiguredError(
                "No AI provider is configured. Add an API key to the backend environment."
            )

        async for chunk in self.provider.stream(messages, model):
            yield chunk, "gemini"


# Global singleton instance
provider_manager = ProviderManager()
