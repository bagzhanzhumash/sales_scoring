"""
Custom exceptions for the speech recognition service.
"""

from typing import Optional, Dict, Any


class SpeechRecognitionError(Exception):
    """Base exception for speech recognition errors."""
    
    def __init__(self, message: str, error_code: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class ModelNotLoadedError(SpeechRecognitionError):
    """Exception raised when the Whisper model is not loaded."""
    
    def __init__(self, message: str = "Whisper model is not loaded"):
        super().__init__(message, "MODEL_NOT_LOADED")


class UnsupportedAudioFormatError(SpeechRecognitionError):
    """Exception raised when audio format is not supported."""
    
    def __init__(self, format_name: str, supported_formats: list):
        message = f"Unsupported audio format: {format_name}. Supported formats: {', '.join(supported_formats)}"
        super().__init__(message, "UNSUPPORTED_AUDIO_FORMAT", {
            "unsupported_format": format_name,
            "supported_formats": supported_formats
        })


class AudioProcessingError(SpeechRecognitionError):
    """Exception raised when audio processing fails."""
    
    def __init__(self, message: str, file_path: Optional[str] = None):
        super().__init__(message, "AUDIO_PROCESSING_ERROR", {"file_path": file_path})


class TranscriptionError(SpeechRecognitionError):
    """Exception raised when transcription fails."""
    
    def __init__(self, message: str, file_path: Optional[str] = None, error_details: Optional[Dict[str, Any]] = None):
        super().__init__(message, "TRANSCRIPTION_ERROR", {
            "file_path": file_path,
            "error_details": error_details or {}
        })


class FileSizeExceededError(SpeechRecognitionError):
    """Exception raised when file size exceeds the limit."""
    
    def __init__(self, file_size: int, max_size: int, file_path: Optional[str] = None):
        message = f"File size {file_size} bytes exceeds maximum allowed size {max_size} bytes"
        super().__init__(message, "FILE_SIZE_EXCEEDED", {
            "file_size": file_size,
            "max_size": max_size,
            "file_path": file_path
        })


class BatchSizeExceededError(SpeechRecognitionError):
    """Exception raised when batch size exceeds the limit."""
    
    def __init__(self, batch_size: int, max_batch_size: int):
        message = f"Batch size {batch_size} exceeds maximum allowed size {max_batch_size}"
        super().__init__(message, "BATCH_SIZE_EXCEEDED", {
            "batch_size": batch_size,
            "max_batch_size": max_batch_size
        })


class InvalidAudioFileError(SpeechRecognitionError):
    """Exception raised when audio file is invalid or corrupted."""
    
    def __init__(self, message: str, file_path: Optional[str] = None):
        super().__init__(message, "INVALID_AUDIO_FILE", {"file_path": file_path})


class NetworkError(SpeechRecognitionError):
    """Exception raised when network operations fail."""
    
    def __init__(self, message: str, url: Optional[str] = None):
        super().__init__(message, "NETWORK_ERROR", {"url": url})


class ConfigurationError(SpeechRecognitionError):
    """Exception raised when configuration is invalid."""
    
    def __init__(self, message: str, config_key: Optional[str] = None):
        super().__init__(message, "CONFIGURATION_ERROR", {"config_key": config_key})


class JiraIntegrationError(SpeechRecognitionError):
    """Exception raised during Jira integration operations."""
    
    def __init__(self, message: str, ticket_data: Optional[Dict[str, Any]] = None):
        super().__init__(message, "JIRA_INTEGRATION_ERROR", {"ticket_data": ticket_data})
