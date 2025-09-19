"""Service gateways that proxy ASR and LLM requests via RabbitMQ."""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, TYPE_CHECKING

from fastapi import HTTPException

from .models import (
    CallSummarizationRequest,
    CallSummarizationResponse,
    ChecklistAnalysisRequest,
    ChecklistAnalysisResult,
    SummarizationRequest,
    SummarizationResponse,
    TranscriptionRequest,
    TranscriptionResponse,
    BatchTranscriptionResponse,
)
from .rabbitmq import rabbitmq_manager
from .summarization_service import SummarizationServiceError, summarization_service

if TYPE_CHECKING:
    from .whisper_service import WhisperService


logger = logging.getLogger(__name__)


async def _get_whisper_service() -> "WhisperService":
    from .main import whisper_service

    if not whisper_service.is_loaded():
        await whisper_service.load_model()
    return whisper_service


class ASRRpcGateway:
    """RPC client for Whisper ASR tasks routed through RabbitMQ."""

    async def transcribe_file(
        self,
        audio_path: str,
        request: TranscriptionRequest,
        timeout: float | None = None,
    ) -> TranscriptionResponse:
        if not rabbitmq_manager.is_available:
            return await self._direct_transcribe_file(audio_path, request)

        try:
            response = await self._call(
                {
                    "action": "transcribe_file",
                    "audio_path": audio_path,
                    "request": request.model_dump(),
                },
                timeout,
            )
        except RuntimeError as exc:
            logger.debug("RabbitMQ unavailable for ASR; running inline: %s", exc)
            return await self._direct_transcribe_file(audio_path, request)

        return TranscriptionResponse.model_validate(response)

    async def transcribe_batch(
        self,
        audio_paths: List[str],
        request: TranscriptionRequest,
        timeout: float | None = None,
    ) -> BatchTranscriptionResponse:
        if not rabbitmq_manager.is_available:
            return await self._direct_transcribe_batch(audio_paths, request)

        try:
            response = await self._call(
                {
                    "action": "transcribe_batch",
                    "audio_paths": audio_paths,
                    "request": request.model_dump(),
                },
                timeout,
            )
        except RuntimeError as exc:
            logger.debug("RabbitMQ unavailable for ASR batch; running inline: %s", exc)
            return await self._direct_transcribe_batch(audio_paths, request)

        return BatchTranscriptionResponse.model_validate(response)

    async def _call(
        self,
        payload: Dict[str, Any],
        timeout: float | None,
    ) -> Dict[str, Any]:
        try:
            envelope = await rabbitmq_manager.rpc_call(
                queue_name=rabbitmq_manager.asr_queue_name,
                payload=payload,
                timeout=timeout,
            )
        except asyncio.TimeoutError:
            raise HTTPException(status_code=504, detail="ASR request timed out")

        status = envelope.get("status")
        if status != "ok":
            error = envelope.get("error", "ASR task failed")
            raise HTTPException(status_code=502, detail=error)

        result = envelope.get("result")
        if result is None:
            raise HTTPException(status_code=502, detail="ASR task returned empty result")
        return result

    async def _direct_transcribe_file(
        self,
        audio_path: str,
        request: TranscriptionRequest,
    ) -> TranscriptionResponse:
        try:
            service = await _get_whisper_service()
            return await service.transcribe_file(audio_path, request)
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"ASR task failed: {exc}") from exc

    async def _direct_transcribe_batch(
        self,
        audio_paths: List[str],
        request: TranscriptionRequest,
    ) -> BatchTranscriptionResponse:
        try:
            service = await _get_whisper_service()
            return await service.transcribe_batch(audio_paths, request)
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"ASR task failed: {exc}") from exc


class SummarizationRpcGateway:
    """RPC client for LLM workloads routed through RabbitMQ."""

    async def summarize(
        self,
        request: SummarizationRequest,
        timeout: float | None = None,
    ) -> SummarizationResponse:
        envelope = await self._call({"action": "summarize", "request": request.model_dump()}, timeout)
        return SummarizationResponse.model_validate(envelope)

    async def summarize_call(
        self,
        request: CallSummarizationRequest,
        timeout: float | None = None,
    ) -> CallSummarizationResponse:
        envelope = await self._call({"action": "summarize_call", "request": request.model_dump()}, timeout)
        return CallSummarizationResponse.model_validate(envelope)

    async def score_checklist(
        self,
        request: ChecklistAnalysisRequest,
        timeout: float | None = None,
    ) -> List[ChecklistAnalysisResult]:
        envelope = await self._call({"action": "score_checklist", "request": request.model_dump()}, timeout)
        return [ChecklistAnalysisResult.model_validate(item) for item in envelope]

    async def health(
        self,
        timeout: float | None = None,
    ) -> dict:
        return await self._call({"action": "health"}, timeout)

    async def _call(
        self,
        payload: Dict[str, Any],
        timeout: float | None,
    ) -> Any:
        try:
            envelope = await rabbitmq_manager.rpc_call(
                queue_name=rabbitmq_manager.llm_queue_name,
                payload=payload,
                timeout=timeout,
            )
        except asyncio.TimeoutError:
            raise HTTPException(status_code=504, detail="LLM request timed out")

        status = envelope.get("status")
        if status != "ok":
            error = envelope.get("error", "LLM task failed")
            raise HTTPException(status_code=502, detail=error)

        if "result" not in envelope:
            raise HTTPException(status_code=502, detail="LLM task returned empty result")
        return envelope["result"]


asr_gateway = ASRRpcGateway()
summarization_gateway = SummarizationRpcGateway()
