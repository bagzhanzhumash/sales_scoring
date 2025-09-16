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
