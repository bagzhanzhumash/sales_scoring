"""Checklist analysis endpoints."""

import json
import logging
import os
import tempfile
from typing import List, Optional

import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form

from ..models import (
    AudioAnalysisResponse,
    CallSegment,
    CallSummarizationRequest,
    ChecklistAnalysisRequest,
    ChecklistAnalysisResponse,
    ChecklistInput,
    TranscriptionRequest,
)
from ..services_gateway import asr_gateway, summarization_gateway
from ..utils import validate_audio_file
from .transcription import get_whisper_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["analysis"])


def get_summarization_service():
    """Dependency injector for the summarization RPC client."""
    return summarization_gateway


def _parse_checklist_payload(raw: str) -> ChecklistInput:
    try:
        return ChecklistInput.model_validate_json(raw)
    except Exception as exc:  # pragma: no cover - defensive guard
        logger.error("Invalid checklist payload: %s", exc)
        raise HTTPException(status_code=400, detail="Invalid checklist payload") from exc


def _parse_action_items(raw: Optional[str]) -> List[str]:
    if not raw:
        return []

    raw = raw.strip()
    if not raw:
        return []

    try:
        data = json.loads(raw)
        if isinstance(data, list):
            return [str(item).strip() for item in data if str(item).strip()]
    except json.JSONDecodeError:
        pass

    items: List[str] = []
    for chunk in raw.replace(";", "\n").splitlines():
        entry = chunk.strip()
        if entry:
            items.append(entry)
    return items


def _build_segments(segments: Optional[List[dict]]) -> List[CallSegment]:
    if not segments:
        return []

    call_segments: List[CallSegment] = []
    for item in segments:
        text = str(item.get("text") or "").strip()
        if not text:
            continue

        raw_speaker = str(item.get("speaker") or "").strip().lower()
        if raw_speaker.startswith("client") or raw_speaker.startswith("customer"):
            speaker = "Customer"
        elif raw_speaker.startswith("agent") or raw_speaker.startswith("manager"):
            speaker = "Agent"
        else:
            speaker = "Agent"

        call_segments.append(CallSegment(speaker=speaker, text=text))

    return call_segments


@router.post("/analysis/checklist", response_model=ChecklistAnalysisResponse)
async def analyze_against_checklist(
    request: ChecklistAnalysisRequest,
    service = Depends(get_summarization_service),
) -> ChecklistAnalysisResponse:
    """Evaluate transcript text against a provided checklist."""
    try:
        results = await service.score_checklist(request)
        return ChecklistAnalysisResponse(results=results)
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - defensive guard
        logger.exception("Unexpected checklist analysis error")
        raise HTTPException(status_code=500, detail="Failed to evaluate checklist") from exc


@router.post("/analysis/audio-summary", response_model=AudioAnalysisResponse)
async def analyze_audio_summary(
    file: UploadFile = File(..., description="Audio file to transcribe and analyze"),
    checklist: str = Form(..., description="Checklist JSON payload"),
    client_name: Optional[str] = Form(None, description="Client name for context"),
    status: Optional[str] = Form(None, description="Deal status or pipeline stage"),
    action_items: Optional[str] = Form(
        None,
        description="Action items list (JSON array or newline/semicolon separated string)",
    ),
    decision: Optional[str] = Form(None, description="Known decision or outcome"),
    service = Depends(get_summarization_service),
) -> AudioAnalysisResponse:
    """Run the end-to-end audio analysis pipeline and return structured results."""

    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No audio file provided")

    if not validate_audio_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail="Unsupported audio format. Supported formats: mp3, wav, m4a, flac, ogg",
        )

    # Validate checklist payload even though we only output the summary
    _parse_checklist_payload(checklist)
    action_items_list = _parse_action_items(action_items)

    suffix = os.path.splitext(file.filename)[1] or ".tmp"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
        temp_path = tmp_file.name

    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded audio file is empty")

        async with aiofiles.open(temp_path, "wb") as buffer:
            await buffer.write(content)

        transcription_request = TranscriptionRequest()
        await get_whisper_service()  # Ensure model is loaded before queue dispatch
        transcription = await asr_gateway.transcribe_file(temp_path, transcription_request)

    finally:
        try:
            os.unlink(temp_path)
        except OSError:
            logger.warning("Failed to delete temporary audio file %s", temp_path)

    call_segments = _build_segments(transcription.segments)

    try:
        call_summary = await service.summarize_call(
            CallSummarizationRequest(
                transcript_text=transcription.text,
                client_name=client_name or os.path.splitext(file.filename)[0],
                status=status,
                action_items=action_items_list,
                decision=decision,
                segments=call_segments,
            )
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Call summary generation failed")
        raise HTTPException(status_code=500, detail="Failed to generate call summary") from exc

    return AudioAnalysisResponse(call_summary=call_summary)
