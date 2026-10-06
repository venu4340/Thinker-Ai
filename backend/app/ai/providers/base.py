from abc import ABC, abstractmethod
from typing import AsyncIterator, List, Dict, Any, Optional

class AIProviderError(Exception):
    def __init__(self, provider: str, message: str, original_error: Optional[Exception] = None):
        self.provider = provider
        self.message = message
        self.original_error = original_error
        super().__init__(f"[{provider.upper()}] {message}")


class NoProviderConfiguredError(Exception):
    def __init__(self, message: str = "No AI provider is configured. Add an API key to the backend environment."):
        super().__init__(message)


class BaseAIChatProvider(ABC):
    name: str = "base"

    @abstractmethod
    def is_configured(self) -> bool:
        """Returns True if the provider API key / credentials are set."""
        pass

    @abstractmethod
    def get_model(self, model: Optional[str] = None) -> str:
        """Returns the configured or requested model ID."""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if provider API is reachable and key is valid."""
        pass

    @abstractmethod
    async def generate(self, messages: List[Dict[str, str]], model: Optional[str] = None) -> str:
        """Generate a complete text response."""
        pass

    @abstractmethod
    async def stream(self, messages: List[Dict[str, str]], model: Optional[str] = None) -> AsyncIterator[str]:
        """Stream chunks of the AI response."""
        pass
