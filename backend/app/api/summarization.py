"""
API endpoints for text summarization backed by Ollama.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException

from ..models import (
    CallSummarizationRequest,
    CallSummarizationResponse,
    SummarizationRequest,
    SummarizationResponse,
)
from ..summarization_service import (
    SummarizationService,
    SummarizationServiceError,
    summarization_service,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["summarization"])


async def get_summarization_service() -> SummarizationService:
    """Dependency injector for the summarization service."""
    return summarization_service


@router.post("/summarize", response_model=SummarizationResponse)
async def summarize(
    request: SummarizationRequest,
    service: SummarizationService = Depends(get_summarization_service),
) -> SummarizationResponse:
    """Summarize arbitrary text content."""
    try:
        return await service.summarize(request)
    except SummarizationServiceError as exc:
        logger.error("Summarization failed: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected summarization error")
        raise HTTPException(status_code=500, detail="Failed to generate summary") from exc


@router.get("/summarize/health")
async def summarize_health(
    service: SummarizationService = Depends(get_summarization_service),
) -> dict:
    """Expose health diagnostics for the summarization backend."""
    return await service.health()


@router.post("/summarize/call", response_model=CallSummarizationResponse)
async def summarize_call(
    request: CallSummarizationRequest,
    service: SummarizationService = Depends(get_summarization_service),
) -> CallSummarizationResponse:
    """Generate a structured summary tailored for the scoring dashboard."""
    try:
        return await service.summarize_call(request)
    except SummarizationServiceError as exc:
        logger.error("Call summarization failed: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive guard
        logger.exception("Unexpected call summarization error")
        raise HTTPException(status_code=500, detail="Failed to build call summary") from exc
