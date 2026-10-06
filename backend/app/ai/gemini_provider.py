import json
import re as _re
from typing import Dict, Any, Optional
from google import genai
from app.ai.base import BaseAIProvider
from app.core.config import settings
from app.core.logging import logger

# Patterns that indicate a temporary/overload issue
_TRANSIENT_PATTERNS = _re.compile(
    r"503|UNAVAILABLE|overload|capacity|rate.?limit|quota|too many requests|resource.?exhausted",
    _re.IGNORECASE,
)

_USER_MSG_TRANSIENT = "Our AI service is experiencing high demand right now. Please wait a moment and try again."
_USER_MSG_GENERIC = "Something went wrong while generating your plan. Please try again in a few seconds."

GEMINI_MODELS_CANDIDATES = [
    "gemini-3-flash-preview",
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-flash-latest",
]

class GeminiProvider(BaseAIProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model or settings.GEMINI_MODEL or "gemini-3-flash-preview"

    def _clean_json_text(self, text: str) -> str:
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return text.strip()

    @staticmethod
    def _friendly_error(raw_error: Exception) -> str:
        """Return a user-safe message; raw details stay in server logs only."""
        raw_str = str(raw_error)
        if _TRANSIENT_PATTERNS.search(raw_str):
            return _USER_MSG_TRANSIENT
        return _USER_MSG_GENERIC

    async def generate_json(self, system_prompt: str, user_prompt: str, schema_class: Any) -> Dict[str, Any]:
        if not self.api_key:
            logger.error("Gemini API key is not configured in backend environment.")
            raise ValueError(_USER_MSG_GENERIC)

        full_prompt = (
            system_prompt
            + "\nReturn strictly a valid JSON object matching the requested schema. No markdown fences.\n\n"
            + user_prompt
        )

        models_to_try = [self.model_name] + [m for m in GEMINI_MODELS_CANDIDATES if m != self.model_name]
        last_error = None

        client = genai.Client(api_key=self.api_key)

        for model in models_to_try:
            try:
                logger.info(f"Invoking Gemini model: {model} for structured JSON...")
                response = client.models.generate_content(
                    model=model,
                    contents=full_prompt,
                    config={"response_mime_type": "application/json"}
                )
                text = self._clean_json_text(response.text)
                return json.loads(text)
            except Exception as e:
                logger.warning(f"Gemini model {model} attempt failed: {e}")
                last_error = e

        logger.error(f"All Gemini models failed: {last_error}", exc_info=True)
        raise RuntimeError(self._friendly_error(last_error))

    async def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        if not self.api_key:
            raise ValueError(_USER_MSG_GENERIC)

        full_prompt = system_prompt + "\n\n" + user_prompt
        models_to_try = [self.model_name] + [m for m in GEMINI_MODELS_CANDIDATES if m != self.model_name]
        last_error = None

        client = genai.Client(api_key=self.api_key)

        for model in models_to_try:
            try:
                response = client.models.generate_content(model=model, contents=full_prompt)
                return response.text
            except Exception as e:
                logger.warning(f"Gemini text model {model} failed: {e}")
                last_error = e

        logger.error(f"All Gemini text models failed: {last_error}", exc_info=True)
        raise RuntimeError(self._friendly_error(last_error))

