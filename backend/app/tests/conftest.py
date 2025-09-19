"""Shared fixtures for RabbitMQ integration tests."""

import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


@pytest.fixture
def app_mocks(monkeypatch):
    """Patch heavy startup dependencies and expose the FastAPI app."""
    from app import main

    load_model_mock = AsyncMock()
    ensure_model_mock = AsyncMock()
    rabbit_start_mock = AsyncMock()
    rabbit_close_mock = AsyncMock()
    summarization_close_mock = AsyncMock()

    monkeypatch.setattr(main.whisper_service, "load_model", load_model_mock)
    monkeypatch.setattr(main.summarization_service, "ensure_model_available", ensure_model_mock)
    monkeypatch.setattr(main.summarization_service, "close", summarization_close_mock)
    monkeypatch.setattr(main.rabbitmq_manager, "start", rabbit_start_mock)
    monkeypatch.setattr(main.rabbitmq_manager, "close", rabbit_close_mock)

    return SimpleNamespace(
        app=main.app,
        load_model=load_model_mock,
        ensure_model=ensure_model_mock,
        rabbit_start=rabbit_start_mock,
        rabbit_close=rabbit_close_mock,
        summarization_close=summarization_close_mock,
    )
