"""Checklist analysis endpoints."""

import logging
from fastapi import APIRouter, Depends, HTTPException

from ..models import (
    ChecklistAnalysisRequest,
    ChecklistAnalysisResponse,
)
from ..summarization_service import (
    SummarizationService,
    SummarizationServiceError,
    summarization_service,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["analysis"])


def get_summarization_service() -> SummarizationService:
    """Dependency injector for the summarization service."""
    return summarization_service


@router.post("/analysis/checklist", response_model=ChecklistAnalysisResponse)
async def analyze_against_checklist(
    request: ChecklistAnalysisRequest,
    service: SummarizationService = Depends(get_summarization_service),
) -> ChecklistAnalysisResponse:
    """Evaluate transcript text against a provided checklist."""
    try:
        results = await service.score_checklist(request)
        return ChecklistAnalysisResponse(results=results)
    except SummarizationServiceError as exc:
        logger.error("Checklist analysis failed: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive guard
        logger.exception("Unexpected checklist analysis error")
        raise HTTPException(status_code=500, detail="Failed to evaluate checklist") from exc
