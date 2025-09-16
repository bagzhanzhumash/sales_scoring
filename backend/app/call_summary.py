"""Utility helpers for generating structured call summaries."""

from __future__ import annotations

import datetime as dt
from typing import Iterable, List, Optional

from .models import (
    CallSummarizationRequest,
    CallSummarizationResponse,
    CallSummaryDetails,
    ScorecardEntry,
    SentimentDetails,
)

DEFAULT_CATEGORY = "Заинтересован"
DEFAULT_SENTIMENT = "Нейтральное"
DEFAULT_TONES = ["Вдумчивый", "Взволнованный"]
DEFAULT_DRIVERS = [
    "Клиент уточняет условия сделки",
    "Менеджер объясняет шаги и даёт гарантии",
]
DEFAULT_RECOMMENDATIONS = [
    "Подтвердите договорённости письмом",
    "Назначьте повторный созвон после отправки материалов",
]
DEFAULT_SCORECARDS = [
    ScorecardEntry(
        title="Выявление потребностей",
        score=4.2,
        target=5,
        description="Менеджер уточнил цели клиента и контекст",
    ),
    ScorecardEntry(
        title="Соответствие решения",
        score=3.8,
        target=5,
        description="Предложение продукта сопоставлено с запросами",
    ),
    ScorecardEntry(
        title="Следующие шаги",
        score=4.5,
        target=5,
        description="Ясный план и ожидания по дальнейшим действиям",
    ),
]


def _dedupe(values: Iterable[str]) -> List[str]:
    seen: List[str] = []
    for item in values:
        text = item.strip()
        if text and text not in seen:
            seen.append(text)
    return seen


def _normalize_summary_line(line: str) -> Optional[str]:
    cleaned = line.strip().lstrip("-•")
    cleaned = cleaned.strip()
    return cleaned or None


def _from_segments(request: CallSummarizationRequest, limit: int = 3) -> List[str]:
    items: List[str] = []
    for segment in request.segments:
        prefix = "Менеджер" if segment.speaker.lower().startswith("agent") else "Клиент"
        sentence = segment.text.strip()
        if sentence:
            items.append(f"{prefix}: {sentence}")
        if len(items) >= limit:
            break
    if not items:
        items.append("Клиент обсуждает условия сделки и ожидает уточнений")
    return items


def _action_items(base: Iterable[str]) -> List[str]:
    items = _dedupe(base)
    if not items:
        items.extend(DEFAULT_RECOMMENDATIONS[:2])
    return items


def _decision_text(decision: Optional[str], status: Optional[str]) -> str:
    if decision and decision.strip():
        return decision.strip()
    if status and "ожид" in status.lower():
        return "Ожидается уточнение условий и обратная связь от клиента."
    return "Клиент рассматривает предложение и планирует вернуться с ответом."


def _category(status: Optional[str]) -> str:
    return status.strip() if status and status.strip() else DEFAULT_CATEGORY


def _purpose(name: Optional[str]) -> str:
    customer = name.strip() if name else "Клиент"
    return f"{customer} обсуждает условия и следующий шаг по сделке."


def _sentiment(transcript: str) -> SentimentDetails:
    lowered = transcript.lower()
    overall = DEFAULT_SENTIMENT
    tones = list(DEFAULT_TONES)
    if any(token in lowered for token in ["спасибо", "отлично", "здорово"]):
        overall = "Позитивное"
        tones = ["Уверенный", "Дружелюбный"]
    elif any(token in lowered for token in ["сомневаюсь", "не уверен", "проблем", "переживаю"]):
        overall = "Нейтрально-негативное"
        tones = ["Сомневающийся", "Тревожный"]
    return SentimentDetails(
        overall=overall,
        tone=tones,
        drivers=list(DEFAULT_DRIVERS),
        recommendations=list(DEFAULT_RECOMMENDATIONS),
    )


def _manager_recommendations(action_items: List[str], decision: str, sentiment: SentimentDetails) -> List[str]:
    recommendations: List[str] = []
    if action_items:
        recommendations.append(f"Контролируйте выполнение первого шага: {action_items[0]}")
    recommendations.append(
        "Сформируйте бриф к следующей встрече с ключевыми возражениями и планом ответов."
    )
    recommendations.append("Обновите CRM, чтобы команда видела прогресс и качество коммуникации.")
    recommendations.append("Подготовьте next best action: назначьте повторный звонок или отправьте КП.")
    if "позит" in sentiment.overall.lower():
        recommendations.append(
            "Используйте позитивный настрой, чтобы закрепить договорённость и сократить цикл сделки."
        )
    else:
        recommendations.append(
            "Проработайте возражения, предложите дополнительную ценность и подтвердите заботу о клиенте."
        )
    if decision:
        recommendations.append(f"Подтвердите договорённость письмом: {decision}")
    return _dedupe(recommendations)


def _augment_with_llm_points(points: List[str], llm_summary: Optional[str]) -> List[str]:
    if not llm_summary:
        return points
    augmented = list(points)
    for line in llm_summary.splitlines():
        normalized = _normalize_summary_line(line)
        if normalized:
            augmented.append(normalized)
    return _dedupe(augmented)[: max(len(points), 3)]


def build_call_summary(
    request: CallSummarizationRequest,
    llm_summary: Optional[str] = None,
) -> CallSummarizationResponse:
    """Compose a structured summary payload for the frontend."""

    discussion_points = _from_segments(request)
    discussion_points = _augment_with_llm_points(discussion_points, llm_summary)

    action_items = _action_items(request.action_items)
    decision = _decision_text(request.decision, request.status)
    category = _category(request.status)
    purpose = _purpose(request.client_name)
    sentiment = _sentiment(request.transcript_text)
    manager_recs = _manager_recommendations(action_items, decision, sentiment)

    sentiment.managerRecommendations = list(manager_recs)

    call_summary = CallSummaryDetails(
        category=category,
        purpose=purpose,
        discussionPoints=discussion_points,
        actionItems=action_items,
        decisionMade=decision,
        createdAt=dt.date.today().strftime("%d.%m.%Y"),
        managerRecommendations=list(manager_recs),
    )

    return CallSummarizationResponse(
        callSummary=call_summary,
        sentiment=sentiment,
        scorecards=list(DEFAULT_SCORECARDS),
    )
