import json
from typing import Dict, Any, Optional
from anthropic import AsyncAnthropic
from app.ai.base import BaseAIProvider
from app.core.config import settings
from app.core.logging import logger

class AnthropicProvider(BaseAIProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.ANTHROPIC_API_KEY
        self.model = model or settings.ANTHROPIC_MODEL
        self.client = AsyncAnthropic(api_key=self.api_key) if self.api_key else None

    async def generate_json(self, system_prompt: str, user_prompt: str, schema_class: Any) -> Dict[str, Any]:
        if not self.client:
            raise ValueError("Anthropic API key is not configured.")

        system_instruction = (
            system_prompt
            + "\nCRITICAL: You MUST respond ONLY with a raw, valid JSON object conforming to the schema. Do NOT include any conversational preamble or markdown code blocks."
        )

        logger.info(f"Invoking Anthropic model: {self.model}")
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=system_instruction,
            messages=[{"role": "user", "content": user_prompt}]
        )

        text = response.content[0].text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        data = json.loads(text)
        return data

    async def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        if not self.client:
            raise ValueError("Anthropic API key is not configured.")

        response = await self.client.messages.create(
            model=self.model,
            max_tokens=2048,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}]
        )
        return response.content[0].text
