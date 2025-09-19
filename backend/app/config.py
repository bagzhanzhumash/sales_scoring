"""
Configuration settings for the speech recognition service.
"""

from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 1
    log_level: str = "info"
    reload: bool = False
    
    # Model settings
    model_size: str = "deepdml/faster-whisper-large-v3-turbo-ct2"
    device: str = "auto"  # auto, cpu, cuda
    compute_type: str = "auto"  # auto, float16, int8, int8_float16
    download_root: str = "backend/app/models"

    # Summarization settings
    ollama_base_url: str = "http://localhost:11434"
    summarization_model: str = "gemma3:27b"
    summarization_temperature: float = 0.3
    summarization_top_p: float = 0.9
    summarization_max_tokens: int = 512
    summarization_timeout: float = 300.0
    summarization_system_prompt: str = (
        """
        You are a meticulous call-analysis engine. Your job is to read a single sales call (or a short brief about it) and return a STRICT, valid JSON object with the following top-level keys:
- "call_summary"
- "check_list"

### Language & tone
- Output fields that are natural language (descriptions, recommendations, etc.) **in Russian** unless the input is clearly another language.
- Be concise, specific, and actionable.

### Output schema (STRICT)
{
  "call_summary": {
    "callSummary": {
      "category": "string",                       // e.g., "Первичный контакт", "Демо", "Переговоры", "Закрытие"
      "purpose": "string",                        // one sentence; e.g., "обсуждает условия и следующий шаг по сделке."
      "discussionPoints": ["string", ...],        // bullet-like utterances; prefix speakers if known, e.g., "Менеджер: ...", "Клиент: ..."
      "actionItems": ["string", ...],             // each starts with a verb; if none, []
      "decisionMade": "string",                   // if no clear decision, use "Не принято"
      "managerRecommendations": [
        "string", ...                             // practical, imperative guidance for the manager
      ]
    },
    "sentiment": {
      "overall": "Позитивное" | "Нейтральное" | "Негативное",
      "tone": ["Уверенный" | "Дружелюбный" | "Нейтральный" | "Осторожный" | "Напористый", ...],
      "drivers": ["string", ...],                 // what drove the sentiment
      "recommendations": ["string", ...],         // next steps tied to sentiment
      "managerRecommendations": ["string", ...]   // may repeat or extend from callSummary.managerRecommendations
    },
    "scorecards": [
      {
        "title": "Выявление потребностей",
        "score": number,                          // 0.0–5.0
        "target": number,                         // default 5
        "description": "string"
      },
      {
        "title": "Соответствие решения",
        "score": number,
        "target": number,
        "description": "string"
      },
      {
        "title": "Следующие шаги",
        "score": number,
        "target": number,
        "description": "string"
      }
    ]
  },

  "check_list": {
  based on check list provided
  }
    
}

### Transformation rules
- Keep "discussionPoints" atomic (one idea per item); do not paraphrase away concrete phrasing.
- For any unknown but required value:
  - Prefer a neutral placeholder like "Не указано" **only** if you have enough to complete the rest; otherwise trigger clarifying questions mode.
- Do not invent facts (names, numbers, commitments, dates). If the input hints at them but isn't explicit, either ask or mark as "Не указано" and list in check_list.summary_quality.missing_fields.

### Scoring guidance
- Map 0–5 scores to 0–100: overall_score = round( (avg(scorecards[i].score)/5) * 100 , 1 ).
- If any score is missing, compute the average over available items and list missing in check_list.summary_quality.missing_fields.

### Manager recommendations guidance
- Make each item imperative and specific (start with a verb), e.g.:
  - "Контролируйте выполнение первого шага: <что именно>."
  - "Сформируйте бриф к следующей встрече с ключевыми возражениями и планом ответов."
  - "Обновите CRM, чтобы команда видела прогресс и качество коммуникации."
  - "Подготовьте next best action: назначьте повторный звонок или отправьте КП."
  - "Подтвердите договорённость письмом: <что вложить>."
  - "Используйте позитивный настрой, чтобы закрепить договорённость и сократить цикл сделки."

### Validation
- Return **only** the JSON object (no prose, no markdown).
- Ensure valid JSON (double quotes, no trailing commas).
- Ensure all required keys exist exactly as specified.
"""
    )
    summarization_required: bool = False
    
    # File upload settings
    max_file_size: int = 100 * 1024 * 1024  # 100MB
    max_batch_files: int = 10
    temp_dir: str = "/tmp/speech_recognition"
    
    # CORS settings
    cors_origins: list = ["*"]
    cors_allow_credentials: bool = True
    cors_allow_methods: list = ["*"]
    cors_allow_headers: list = ["*"]
    
    # Logging settings
    log_file: str = "speech_recognition.log"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Whisper settings
    default_language: Optional[str] = None
    default_task: str = "transcribe"
    default_beam_size: int = 5
    default_best_of: int = 5
    default_patience: float = 1.0
    default_length_penalty: float = 1.0
    default_temperature: float = 0.0
    default_compression_ratio_threshold: float = 2.4
    default_log_prob_threshold: float = -1.0
    default_no_speech_threshold: float = 0.6
    default_condition_on_previous_text: bool = True
    default_prompt_reset_on_temperature: bool = False
    default_suppress_blank: bool = True
    default_without_timestamps: bool = False
    default_word_timestamps: bool = False
    default_vad_filter: bool = True
    default_min_word_duration: float = 0.1
    default_repetition_penalty: float = 1.0
    default_no_repeat_ngram_size: int = 0
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()
