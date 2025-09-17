"""Summarization service that delegates to Ollama's Gemma 3 model."""

import json
import logging
import re
import textwrap
import time
from typing import Any, Dict, List, Literal, Optional

import httpx
from pydantic import ValidationError

from .config import settings
from .models import (
    CallSummarizationRequest,
    CallSummarizationResponse,
    ChecklistAnalysisRequest,
    ChecklistAnalysisResult,
    ChecklistAnalysisResponse,
    SummarizationRequest,
    SummarizationResponse,
    SummaryFormat,
)
from .call_summary import build_call_summary

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
        self.checklist_response_schema = ChecklistAnalysisResponse.model_json_schema()
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

    @staticmethod
    def _extract_json(content: str) -> Dict[str, Any]:
        """Extract a JSON object from the LLM response."""
        try:
            return json.loads(content)
        except json.JSONDecodeError as exc:
            logger.debug("Direct JSON parse failed: %s", exc)

        fenced = re.search(r"```json\s*(.*?)```", content, re.DOTALL)
        if fenced:
            try:
                return json.loads(fenced.group(1))
            except json.JSONDecodeError as exc:
                logger.debug("Fenced JSON parse failed: %s", exc)

        compact = re.search(r"\{.*\}", content, re.DOTALL)
        if compact:
            try:
                return json.loads(compact.group(0))
            except json.JSONDecodeError as exc:  # pragma: no cover - defensive guard
                logger.error(
                    "Failed to parse JSON from response snippet: %s",
                    compact.group(0)[:500],
                )
                raise SummarizationServiceError("Received malformed JSON from summarization model") from exc

        raise SummarizationServiceError("Summarization model did not return JSON output")

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

    async def score_checklist(
        self, request: ChecklistAnalysisRequest
    ) -> List[ChecklistAnalysisResult]:
        """Score a transcript against a structured checklist using the LLM."""

        call_summary = await self.summarize_call(
            CallSummarizationRequest(
                transcript_text=request.transcript_text,
                client_name=request.client_name,
                status=request.status,
                action_items=request.action_items,
                decision=request.decision,
                segments=request.segments,
            )
        )

        checklist_payload = request.checklist.model_dump()
        summary_payload = call_summary.model_dump()

        system_message = textwrap.dedent(
            f"""
            {self.system_prompt}

            Ты аналитик контроля качества контакт-центра. Оцени выполнение критериев чек-листа
            по транскрипту разговора. Всегда возвращай JSON строго в соответствии со схемой,
            переданной в параметре format — никаких пояснений вне JSON.

            Правила оценки:\n
            - score = 1, если критерий выполнен;\n
            - score = 0, если критерий нарушен;\n
            - score = "?", если недостаточно данных;\n
            - needs_review = true, если вывод неочевиден или score = "?";\n
            - explanation — лаконичный комментарий на русском языке.
            """
        ).strip()

        user_message = textwrap.dedent(
            f"""
            Транскрипт:
            <<<TRANSCRIPT>>>
            {request.transcript_text.strip()}
            <<<END TRANSCRIPT>>>

            Чек-лист (JSON):
            {json.dumps(checklist_payload, ensure_ascii=False)}

            Сводка разговора (JSON):
            {json.dumps(summary_payload, ensure_ascii=False)}
            """
        ).strip()

        client = await self._get_client()
        max_attempts = 3
        num_predict = max(self.default_max_tokens, 1024)
        max_tokens_cap = max(num_predict, 4096)

        for attempt in range(max_attempts):
            payload: Dict[str, Any] = {
                "model": self.model_name,
                "messages": [
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message},
                ],
                "stream": False,
                "format": self.checklist_response_schema,
                "options": {
                    "temperature": 0.0,
                    "top_p": self.default_top_p,
                    "num_predict": min(num_predict, max_tokens_cap),
                },
            }

            logger.debug(
                "Submitting checklist evaluation to Ollama (attempt %s/%s): model=%s system_chars=%s user_chars=%s num_predict=%s",
                attempt + 1,
                max_attempts,
                self.model_name,
                len(system_message),
                len(user_message),
                payload["options"]["num_predict"],
            )

            start_time = time.perf_counter()
            try:
                response = await client.post("/api/chat", json=payload)
                response.raise_for_status()
                elapsed = time.perf_counter() - start_time
                logger.info(
                    "Checklist evaluation completed in %.2fs (status=%s, attempt=%s)",
                    elapsed,
                    response.status_code,
                    attempt + 1,
                )
            except httpx.HTTPStatusError as exc:
                logger.error("Checklist evaluation failed: %s", exc.response.text)
                raise SummarizationServiceError(
                    f"Checklist analysis failed with status {exc.response.status_code}"
                ) from exc
            except httpx.ReadTimeout as exc:
                elapsed = time.perf_counter() - start_time
                logger.error(
                    "Checklist evaluation timed out after %.2fs (timeout=%.2fs) on attempt %s: %s",
                    elapsed,
                    self.timeout,
                    attempt + 1,
                    exc,
                )
                if attempt + 1 < max_attempts:
                    num_predict = min(num_predict * 2, max_tokens_cap)
                    logger.info("Retrying checklist evaluation with increased num_predict=%s", num_predict)
                    continue
                raise SummarizationServiceError("Checklist analysis timed out") from exc
            except httpx.HTTPError as exc:
                elapsed = time.perf_counter() - start_time
                logger.error(
                    "Error while requesting checklist evaluation (elapsed %.2fs, type %s, attempt %s): %s",
                    elapsed,
                    exc.__class__.__name__,
                    attempt + 1,
                    exc,
                )
                raise SummarizationServiceError("Failed to reach Ollama for checklist analysis") from exc

            data = response.json()
            done_reason = data.get("done_reason")
            if done_reason:
                logger.debug("Checklist evaluation done_reason=%s", done_reason)

            message_payload: Dict[str, Any] = data.get("message") or {}
            message_content = message_payload.get("content") or data.get("response", "")

            logger.debug(
                "Raw checklist response snippet (first 500 chars): %s",
                message_content[:500],
            )

            if not message_content:
                logger.error("Checklist analysis returned empty response body: %s", data)
                raise SummarizationServiceError("Checklist analysis returned empty response")

            try:
                structured = ChecklistAnalysisResponse.model_validate_json(message_content)
                raw_results = [item.model_dump() for item in structured.results]
                logger.debug("Checklist response validated via schema (%s items)", len(raw_results))
                break
            except ValidationError as exc:
                logger.warning("Checklist analysis schema validation failed: %s", exc)
                try:
                    parsed = self._extract_json(message_content)
                    raw_results = parsed.get("results", [])
                    logger.debug("Checklist response parsed via fallback extractor (%s items)", len(raw_results))
                    break
                except SummarizationServiceError as parse_exc:
                    opens_curly = message_content.count("{")
                    closes_curly = message_content.count("}")
                    opens_sq = message_content.count("[")
                    closes_sq = message_content.count("]")
                    trailing_comma = message_content.rstrip().endswith(",")
                    truncated = (
                        done_reason == "length"
                        or opens_curly > closes_curly
                        or opens_sq > closes_sq
                        or trailing_comma
                    )

                    if truncated and attempt + 1 < max_attempts:
                        num_predict = min(num_predict * 2, max_tokens_cap)
                        logger.info(
                            "Retrying checklist evaluation due to suspected truncation (attempt %s) with num_predict=%s",
                            attempt + 1,
                            num_predict,
                        )
                        continue
                    raise parse_exc
        else:
            raise SummarizationServiceError("Checklist analysis failed to produce usable results")

        normalized: Dict[str, ChecklistAnalysisResult] = {}
        for item in raw_results:
            try:
                criterion_id = str(item.get("criterion_id") or item.get("criterion") or "").strip()
                category_id = str(item.get("category_id") or item.get("category") or "").strip()
                if not criterion_id:
                    continue

                score_raw = item.get("score", "unknown")
                if isinstance(score_raw, (int, float)):
                    if score_raw >= 0.75:
                        score_value: Literal[0, 1, "?"] = 1
                    elif score_raw <= 0.25:
                        score_value = 0
                    else:
                        score_value = "?"
                else:
                    score_text = str(score_raw).strip().lower()
                    if score_text in {"pass", "yes", "true", "1", "выполнено"}:
                        score_value = 1
                    elif score_text in {"fail", "no", "false", "0", "не выполнено"}:
                        score_value = 0
                    else:
                        score_value = "?"

                confidence_raw = item.get("confidence", 60)
                try:
                    confidence = int(float(confidence_raw))
                except (TypeError, ValueError):
                    confidence = 60
                confidence = max(0, min(confidence, 100))

                explanation = str(item.get("explanation") or "Критерий требует проверки оператора.").strip()
                needs_review = item.get("needs_review")
                if isinstance(needs_review, bool):
                    needs_review_flag = needs_review
                else:
                    needs_review_flag = score_value != 1 or confidence < 70

                normalized[criterion_id] = ChecklistAnalysisResult(
                    criterion_id=criterion_id,
                    category_id=category_id or "",
                    score=score_value,
                    confidence=confidence,
                    explanation=explanation,
                    needs_review=needs_review_flag,
                )
            except Exception as exc:  # pragma: no cover - defensive guard
                logger.warning("Failed to normalize checklist item %s: %s", item, exc)

        results: List[ChecklistAnalysisResult] = []
        for category in request.checklist.categories:
            for criterion in category.criteria:
                key = criterion.id
                normalized_result = normalized.get(key)
                if normalized_result:
                    # Fill missing category id if the model skipped it
                    if not normalized_result.category_id:
                        normalized_result.category_id = category.id
                    results.append(normalized_result)
                    continue

                results.append(
                    ChecklistAnalysisResult(
                        criterion_id=criterion.id,
                        category_id=category.id,
                        score="?",
                        confidence=50,
                        explanation="Модель не смогла оценить критерий автоматически. Проверьте вручную.",
                        needs_review=True,
                    )
                )

        return results

    async def summarize_call(
        self, request: CallSummarizationRequest
    ) -> CallSummarizationResponse:
        """Produce a structured call summary payload consumed by the frontend."""

        llm_bullets: Optional[str] = None
        # The conversational summary benefits from concise bullet points. We
        # attempt to obtain them from the LLM but gracefully fall back to the
        # heuristic builder if the generation fails or is unavailable.
        try:
            bullet_summary = await self.summarize(
                SummarizationRequest(
                    text=request.transcript_text,
                    instructions=(
                        "Выдели 2-3 ключевые темы разговора. Форматируй ответ в виде кратких пунктов."
                    ),
                    format=SummaryFormat.BULLET,
                )
            )
            llm_bullets = bullet_summary.summary
        except SummarizationServiceError as exc:
            logger.warning("Falling back to heuristic call summary: %s", exc)
        except Exception as exc:  # pragma: no cover - defensive guard
            logger.exception("Unexpected error while generating call summary hints")

        return build_call_summary(request, llm_bullets)


summarization_service = SummarizationService()
# Shared service instance imported by routers and the application lifespan.
