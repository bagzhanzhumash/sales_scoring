"""RabbitMQ integration for decoupling ASR and LLM workloads."""

from __future__ import annotations

import asyncio
import json
import logging
import uuid
from typing import Any, Awaitable, Callable, Dict, Optional

import aio_pika
from aio_pika.abc import AbstractIncomingMessage

from .config import settings
from .models import (
    CallSummarizationRequest,
    ChecklistAnalysisRequest,
    SummarizationRequest,
    TranscriptionRequest,
)
from .summarization_service import SummarizationService, SummarizationServiceError
from .whisper_service import WhisperService

logger = logging.getLogger(__name__)

Handler = Callable[[Dict[str, Any]], Awaitable[Dict[str, Any]]]


class RabbitMQManager:
    """Manage RabbitMQ RPC-style messaging for ASR and LLM pipelines."""

    def __init__(
        self,
        url: str,
        asr_queue_name: str,
        llm_queue_name: str,
        default_timeout: float,
    ) -> None:
        self._url = url
        self.asr_queue_name = asr_queue_name
        self.llm_queue_name = llm_queue_name
        self._default_timeout = default_timeout

        self._connection: Optional[aio_pika.RobustConnection] = None
        self._producer_channel: Optional[aio_pika.Channel] = None
        self._consumer_channel: Optional[aio_pika.Channel] = None
        self._callback_queue: Optional[aio_pika.Queue] = None

        self._futures: Dict[str, asyncio.Future[Dict[str, Any]]] = {}
        self._ready = asyncio.Event()
        self._disabled_reason: Optional[str] = None

    async def start(self, asr_handler: Handler, llm_handler: Handler) -> None:
        """Establish connection, declare queues, and start consumers."""
        self._disabled_reason = None
        self._ready.clear()
        logger.info("Connecting to RabbitMQ at %s", self._url)
        self._connection = await aio_pika.connect_robust(self._url)

        # Producer channel handles RPC requests/responses
        self._producer_channel = await self._connection.channel()
        await self._producer_channel.set_qos(prefetch_count=10)
        self._callback_queue = await self._producer_channel.declare_queue(
            exclusive=True,
            auto_delete=True,
        )
        await self._callback_queue.consume(self._on_response, no_ack=True)

        # Consumer channel handles workload queues
        self._consumer_channel = await self._connection.channel()
        await self._consumer_channel.set_qos(prefetch_count=1)

        asr_queue = await self._consumer_channel.declare_queue(
            self.asr_queue_name,
            durable=True,
        )
        await asr_queue.consume(lambda msg: self._consume(msg, asr_handler))

        llm_queue = await self._consumer_channel.declare_queue(
            self.llm_queue_name,
            durable=True,
        )
        await llm_queue.consume(lambda msg: self._consume(msg, llm_handler))

        self._ready.set()
        logger.info(
            "RabbitMQ manager ready (queues: %s, %s)",
            self.asr_queue_name,
            self.llm_queue_name,
        )

    @property
    def is_available(self) -> bool:
        """Return True if RabbitMQ connectivity is active."""
        return self._disabled_reason is None and self._ready.is_set()

    @property
    def disabled_reason(self) -> Optional[str]:
        """Return the reason why RabbitMQ was disabled, if any."""
        return self._disabled_reason

    async def disable(self, reason: str, log_level: int = logging.WARNING) -> None:
        """Disable the manager and release any resources."""
        self._disabled_reason = reason
        await self.close()
        logger.log(log_level, "RabbitMQ integration disabled: %s", reason)

    async def close(self) -> None:
        """Close channels and the underlying connection."""
        if self._callback_queue is not None:
            await self._callback_queue.delete(if_unused=False, if_empty=False)
            self._callback_queue = None

        if self._producer_channel is not None:
            await self._producer_channel.close()
            self._producer_channel = None

        if self._consumer_channel is not None:
            await self._consumer_channel.close()
            self._consumer_channel = None

        if self._connection is not None:
            await self._connection.close()
            self._connection = None

        self._ready.clear()
        logger.info("RabbitMQ manager closed")

    async def ensure_ready(self) -> None:
        """Wait until the manager is ready to accept RPC calls."""
        if self._disabled_reason is not None:
            raise RuntimeError(f"RabbitMQ is disabled: {self._disabled_reason}")
        await self._ready.wait()

    async def rpc_call(
        self,
        queue_name: str,
        payload: Dict[str, Any],
        timeout: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Send a payload to a queue and await the RPC response."""
        await self.ensure_ready()
        if self._producer_channel is None or self._callback_queue is None:
            raise RuntimeError("RabbitMQ manager is not initialized")

        correlation_id = str(uuid.uuid4())
        loop = asyncio.get_running_loop()
        future: asyncio.Future[Dict[str, Any]] = loop.create_future()
        self._futures[correlation_id] = future

        message_body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        message = aio_pika.Message(
            body=message_body,
            correlation_id=correlation_id,
            reply_to=self._callback_queue.name,
            content_type="application/json",
        )

        logger.debug(
            "Publishing RPC request correlation_id=%s queue=%s size=%s pending_futures=%s",
            correlation_id,
            queue_name,
            len(message_body),
            len(self._futures),
        )

        await self._producer_channel.default_exchange.publish(
            message,
            routing_key=queue_name,
        )

        effective_timeout = timeout if timeout is not None else self._default_timeout
        try:
            return await asyncio.wait_for(future, timeout=effective_timeout)
        except asyncio.TimeoutError:
            self._futures.pop(correlation_id, None)
            logger.warning(
                "RPC request timed out correlation_id=%s queue=%s timeout=%s remaining_futures=%s",
                correlation_id,
                queue_name,
                effective_timeout,
                len(self._futures),
            )
            raise

    async def _on_response(self, message: AbstractIncomingMessage) -> None:
        correlation_id = message.correlation_id
        if not correlation_id:
            logger.warning("Received RabbitMQ response without correlation id")
            return

        future = self._futures.pop(correlation_id, None)
        if not future:
            logger.warning(
                "Received unexpected RabbitMQ response: %s (pending_futures=%s)",
                correlation_id,
                len(self._futures),
            )
            return

        try:
            payload = json.loads(message.body.decode("utf-8"))
        except json.JSONDecodeError as exc:
            logger.error(
                "Failed to decode RabbitMQ response correlation_id=%s error=%s body=%s",
                correlation_id,
                exc,
                message.body[:200],
            )
            future.set_exception(exc)
            return

        if not future.done():
            logger.debug(
                "Received RabbitMQ response correlation_id=%s keys=%s",
                correlation_id,
                list(payload.keys()),
            )
            future.set_result(payload)

    async def _consume(
        self,
        message: AbstractIncomingMessage,
        handler: Handler,
    ) -> None:
        async with message.process(ignore_processed=True):
            try:
                payload = json.loads(message.body.decode("utf-8"))
            except json.JSONDecodeError as exc:
                logger.error("Invalid message payload: %s", exc)
                return

            try:
                response = await handler(payload)
            except Exception as exc:  # pragma: no cover - defensive guard
                logger.exception("Unhandled worker error")
                response = {"status": "error", "error": str(exc)}

            if message.reply_to and self._producer_channel is not None:
                response_body = json.dumps(response, ensure_ascii=False).encode("utf-8")
                reply = aio_pika.Message(
                    body=response_body,
                    correlation_id=message.correlation_id,
                    content_type="application/json",
                )
                await self._producer_channel.default_exchange.publish(
                    reply,
                    routing_key=message.reply_to,
                )


def create_asr_handler(whisper_service: WhisperService) -> Handler:
    """Factory returning the ASR queue handler bound to a Whisper service instance."""

    async def _handler(payload: Dict[str, Any]) -> Dict[str, Any]:
        action = payload.get("action")
        logger.debug("ASR worker received action: %s", action)

        try:
            if action == "transcribe_file":
                request = TranscriptionRequest(**payload["request"])
                audio_path = payload["audio_path"]
                result = await whisper_service.transcribe_file(audio_path, request)
                return {"status": "ok", "result": result.model_dump()}

            if action == "transcribe_batch":
                request = TranscriptionRequest(**payload["request"])
                audio_paths = payload["audio_paths"]
                result = await whisper_service.transcribe_batch(audio_paths, request)
                return {"status": "ok", "result": result.model_dump()}

            return {
                "status": "error",
                "error": f"Unknown ASR action '{action}'",
            }
        except Exception as exc:
            logger.exception("ASR task failed")
            return {"status": "error", "error": str(exc)}

    return _handler


def create_llm_handler(
    service: SummarizationService,
) -> Handler:
    """Factory returning the LLM queue handler bound to a summarization service."""

    async def _handler(payload: Dict[str, Any]) -> Dict[str, Any]:
        action = payload.get("action")
        logger.debug("LLM worker received action: %s", action)

        try:
            if action == "summarize":
                request = SummarizationRequest(**payload["request"])
                result = await service.summarize(request)
                return {"status": "ok", "result": result.model_dump()}

            if action == "summarize_call":
                request = CallSummarizationRequest(**payload["request"])
                result = await service.summarize_call(request)
                return {"status": "ok", "result": result.model_dump()}

            if action == "score_checklist":
                request = ChecklistAnalysisRequest(**payload["request"])
                results = await service.score_checklist(request)
                return {
                    "status": "ok",
                    "result": [item.model_dump() for item in results],
                }

            if action == "health":
                status = await service.health()
                return {"status": "ok", "result": status}

            return {
                "status": "error",
                "error": f"Unknown LLM action '{action}'",
            }
        except SummarizationServiceError as exc:
            logger.error("LLM task failed: %s", exc)
            return {"status": "error", "error": str(exc)}
        except Exception as exc:  # pragma: no cover - defensive guard
            logger.exception("Unexpected error in LLM handler")
            return {"status": "error", "error": str(exc)}

    return _handler


rabbitmq_manager = RabbitMQManager(
    url=settings.rabbitmq_url,
    asr_queue_name=settings.rabbitmq_asr_queue,
    llm_queue_name=settings.rabbitmq_llm_queue,
    default_timeout=settings.rabbitmq_rpc_timeout,
)
