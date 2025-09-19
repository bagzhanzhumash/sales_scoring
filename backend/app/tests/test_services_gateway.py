"""Tests for the RabbitMQ-backed service gateways."""

import asyncio
from unittest.mock import AsyncMock

import pytest

from app.models import SummarizationRequest, TranscriptionRequest, BatchTranscriptionResponse
from app.services_gateway import asr_gateway, summarization_gateway
from app import rabbitmq


@pytest.fixture(autouse=True)
def restore_rpc_call(monkeypatch):
    """Ensure rpc_call is reset after each test."""
    original = rabbitmq.rabbitmq_manager.rpc_call
    yield
    monkeypatch.setattr(rabbitmq.rabbitmq_manager, "rpc_call", original)


def test_summarization_gateway_uses_llm_queue(monkeypatch):
    """summarize() should dispatch through the LLM queue via RabbitMQ."""
    captured = {}

    async def fake_rpc_call(queue_name, payload, timeout=None):
        captured["queue"] = queue_name
        captured["payload"] = payload
        return {"status": "ok", "result": {"summary": "ok", "model": "gemma", "prompt_tokens": 1, "completion_tokens": 1}}

    monkeypatch.setattr(rabbitmq.rabbitmq_manager, "rpc_call", fake_rpc_call)

    request = SummarizationRequest(text="hello")
    result = asyncio.run(summarization_gateway.summarize(request))

    assert captured["queue"] == rabbitmq.rabbitmq_manager.llm_queue_name
    assert captured["payload"]["action"] == "summarize"
    assert result.summary == "ok"


def test_asr_gateway_uses_asr_queue(monkeypatch):
    """transcribe_file should dispatch over the ASR queue."""
    captured = {}

    async def fake_rpc_call(queue_name, payload, timeout=None):
        captured["queue"] = queue_name
        captured["payload"] = payload
        return {"status": "ok", "result": {"text": "", "language": "en", "duration": 1.0, "segments": [], "words": []}}

    monkeypatch.setattr(rabbitmq.rabbitmq_manager, "rpc_call", fake_rpc_call)

    request = TranscriptionRequest()
    result = asyncio.run(asr_gateway.transcribe_file("/tmp/audio.wav", request))

    assert captured["queue"] == rabbitmq.rabbitmq_manager.asr_queue_name
    assert captured["payload"]["action"] == "transcribe_file"
    assert result.language == "en"


def test_asr_gateway_returns_batch_response(monkeypatch):
    """transcribe_batch should return a BatchTranscriptionResponse model."""
    async def fake_rpc_call(queue_name, payload, timeout=None):
        return {
            "status": "ok",
            "result": {
                "results": [
                    {"text": "one", "language": "en", "duration": 1.0, "segments": [], "words": []}
                ],
                "total_files": 1,
                "successful_files": 1,
                "failed_files": 0,
                "errors": [],
            },
        }

    monkeypatch.setattr(rabbitmq.rabbitmq_manager, "rpc_call", fake_rpc_call)

    request = TranscriptionRequest()
    response = asyncio.run(asr_gateway.transcribe_batch(["/tmp/a.wav"], request))

    assert isinstance(response, BatchTranscriptionResponse)
    assert response.total_files == 1
    assert response.successful_files == 1
