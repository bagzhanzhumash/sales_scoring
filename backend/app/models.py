"""
Pydantic models for the speech recognition service.
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class AudioFormat(str, Enum):
    """Supported audio formats."""
    MP3 = "mp3"
    WAV = "wav"
    M4A = "m4a"
    FLAC = "flac"
    OGG = "ogg"


class TranscriptionRequest(BaseModel):
    """Request model for single audio file transcription."""
    language: Optional[str] = Field(None, description="Language code (e.g., 'ru', 'en'). Auto-detect if not specified")
    task: str = Field("transcribe", description="Task type: 'transcribe' or 'translate'")
    word_timestamps: bool = Field(False, description="Enable word-level timestamps")
    initial_prompt: Optional[str] = Field(None, description="Initial prompt for the model")


class TranscriptionResponse(BaseModel):
    """Response model for transcription."""
    text: str = Field(..., description="Transcribed text")
    language: str = Field(..., description="Detected language")
    duration: float = Field(..., description="Audio duration in seconds")
    segments: Optional[List[dict]] = Field(None, description="Detailed segments with timestamps")
    words: Optional[List[dict]] = Field(None, description="Word-level timestamps if enabled")


class BatchTranscriptionRequest(BaseModel):
    """Request model for batch audio files transcription."""
    files: List[str] = Field(..., description="List of file paths or URLs")
    language: Optional[str] = Field(None, description="Language code (e.g., 'ru', 'en'). Auto-detect if not specified")
    task: str = Field("transcribe", description="Task type: 'transcribe' or 'translate'")
    word_timestamps: bool = Field(False, description="Enable word-level timestamps")
    initial_prompt: Optional[str] = Field(None, description="Initial prompt for the model")


class BatchTranscriptionResponse(BaseModel):
    """Response model for batch transcription."""
    results: List[TranscriptionResponse] = Field(..., description="List of transcription results")
    total_files: int = Field(..., description="Total number of files processed")
    successful_files: int = Field(..., description="Number of successfully processed files")
    failed_files: int = Field(..., description="Number of failed files")
    errors: List[dict] = Field(default_factory=list, description="List of errors for failed files")


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str = Field(..., description="Service status")
    model_loaded: bool = Field(..., description="Whether the Whisper model is loaded")
    version: str = Field(..., description="Service version")


class SummaryFormat(str, Enum):
    """Supported formats for generated summaries."""
    PARAGRAPH = "paragraph"
    BULLET = "bullet"


class SummarizationRequest(BaseModel):
    """Request model for text summarization."""
    text: str = Field(..., description="Full transcript or text to summarize", min_length=1)
    instructions: Optional[str] = Field(None, description="Optional custom guidance for the model")
    focus: Optional[str] = Field(None, description="Key topics or outcomes to prioritize")
    format: SummaryFormat = Field(SummaryFormat.PARAGRAPH, description="Preferred summary style")
    temperature: Optional[float] = Field(None, description="Override generation temperature")
    max_tokens: Optional[int] = Field(None, description="Override maximum tokens for the response")


class SummarizationResponse(BaseModel):
    """Response model for summarization."""
    summary: str = Field(..., description="Generated summary text")
    model: str = Field(..., description="Model used for generation")
    prompt_tokens: Optional[int] = Field(None, description="Approximate tokens used for the prompt")
    completion_tokens: Optional[int] = Field(None, description="Approximate tokens generated in the summary")
    duration_ms: Optional[float] = Field(None, description="Total time spent generating the summary in milliseconds")
