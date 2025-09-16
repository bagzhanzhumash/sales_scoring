"""
Summarization service that delegates to Ollama's Gemma 3 model.
"""

import logging
from typing import Any, Dict, Optional

import httpx

from .config import settings
from .models import SummarizationRequest, SummarizationResponse, SummaryFormat

logger = logging.getLogger(__name__)


class SummarizationServiceError(Exception):
    """Raised when the summarization service fails."""


class SummarizationService:
    """Service responsible for summarizing text via Ollama."""

    def __init__(self) -> None:
        self.model_name = settings.summarization_model
        self.base_url = settings.ollama_base_url.rstrip("/")
        self.system_prompt = settings.summarization_system_prompt.strip()
        self.default_temperature = settings.summarization_temperature
        self.default_top_p = settings.summarization_top_p
        self.default_max_tokens = settings.summarization_max_tokens
        self.timeout = settings.summarization_timeout
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Return or create the shared HTTP client."""
        if self._client is None:
            self._client = httpx.AsyncClient(base_url=self.base_url, timeout=self.timeout)
        return self._client

    async def close(self) -> None:
        """Close the HTTP client."""
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    async def ensure_model_available(self) -> None:
        """Verify that the configured Ollama model is available."""
        client = await self._get_client()
        try:
            response = await client.get("/api/tags")
            response.raise_for_status()
            models = response.json().get("models", [])
            available = {model.get("name") for model in models}
            if self.model_name not in available:
                raise SummarizationServiceError(
                    f"Model '{self.model_name}' not found in Ollama. Run `ollama pull {self.model_name}`."
                )
        except httpx.HTTPError as exc:
            raise SummarizationServiceError(
                f"Unable to reach Ollama at {self.base_url}: {exc}"
            ) from exc

    def _build_prompt(self, request: SummarizationRequest) -> str:
        """Compose the prompt sent to Ollama."""
        sections = [self.system_prompt]

        details = []
        if request.instructions:
            details.append(f"Custom instructions: {request.instructions.strip()}")
        if request.focus:
            details.append(f"Focus areas: {request.focus.strip()}")
        if request.format == SummaryFormat.BULLET:
            details.append("Format the response as bullet points starting with '-'.")

        if details:
            sections.append("\n".join(details))

        sections.append("Content to summarize:\n" + request.text.strip())
        return "\n\n".join(part for part in sections if part)

    async def summarize(self, request: SummarizationRequest) -> SummarizationResponse:
        """Generate a summary for the supplied text."""
        client = await self._get_client()

        payload: Dict[str, Any] = {
            "model": self.model_name,
            "prompt": self._build_prompt(request),
            "stream": False,
            "options": {
                "temperature": request.temperature if request.temperature is not None else self.default_temperature,
                "top_p": self.default_top_p,
                "num_predict": request.max_tokens if request.max_tokens is not None else self.default_max_tokens,
            },
        }

        try:
            response = await client.post("/api/generate", json=payload)
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            error_message = exc.response.text
            logger.error("Ollama returned an error: %s", error_message)
            raise SummarizationServiceError(
                f"Summarization failed with status {exc.response.status_code}: {error_message}"
            ) from exc
        except httpx.HTTPError as exc:
            logger.error("Error communicating with Ollama: %s", exc)
            raise SummarizationServiceError("Failed to reach Ollama for summarization") from exc

        data = response.json()
        summary_text = data.get("response", "").strip()
        if not summary_text:
            logger.error("Received empty summary from Ollama: %s", data)
            raise SummarizationServiceError("Received empty summary from Ollama")

        total_duration = data.get("total_duration")
        duration_ms: Optional[float] = None
        if isinstance(total_duration, (int, float)):
            duration_ms = total_duration / 1_000_000.0

        return SummarizationResponse(
            summary=summary_text,
            model=data.get("model", self.model_name),
            prompt_tokens=data.get("prompt_eval_count"),
            completion_tokens=data.get("eval_count"),
            duration_ms=duration_ms,
        )

    async def health(self) -> Dict[str, Any]:
        """Return a health snapshot for the summarization backend."""
        try:
            await self.ensure_model_available()
            return {
                "status": "ready",
                "model": self.model_name,
                "endpoint": self.base_url,
            }
        except SummarizationServiceError as exc:
            return {
                "status": "error",
                "model": self.model_name,
                "endpoint": self.base_url,
                "error": str(exc),
            }


summarization_service = SummarizationService()
# Shared service instance imported by routers and the application lifespan.
