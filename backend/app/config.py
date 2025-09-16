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
