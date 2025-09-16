"""
Whisper service for speech recognition using faster-whisper.
"""

import logging
import os
import tempfile
from typing import List, Optional, Dict, Any
import librosa
import soundfile as sf
from faster_whisper import WhisperModel
from faster_whisper.transcribe import Segment, Word

from .models import TranscriptionRequest, TranscriptionResponse, BatchTranscriptionResponse
from .config import settings

logger = logging.getLogger(__name__)


class WhisperService:
    """Service for speech recognition using faster-whisper."""
    
    def __init__(self):
        """Initialize the Whisper service with settings from config."""
        self.model_size = settings.model_size
        self.device = settings.device
        self.compute_type = settings.compute_type
        self.model: Optional[WhisperModel] = None
        self._is_loaded = False
        
    async def load_model(self) -> None:
        """Load the Whisper model asynchronously."""
        try:
            logger.info(f"Loading Whisper model: {self.model_size}")
            self.model = WhisperModel(
                self.model_size,
                device=self.device,
                compute_type=self.compute_type,
                download_root=settings.download_root
            )
            self._is_loaded = True
            logger.info("Whisper model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            raise
    
    def is_loaded(self) -> bool:
        """Check if the model is loaded."""
        return self._is_loaded
    
    def _preprocess_audio(self, audio_path: str, target_sr: int = 16000) -> str:
        """
        Preprocess audio file to ensure correct sample rate and format.
        
        Args:
            audio_path: Path to the audio file
            target_sr: Target sample rate (default: 16000)
            
        Returns:
            Path to the preprocessed audio file
        """
        try:
            # Load audio file
            audio, sr = librosa.load(audio_path, sr=None)
            
            # Check if resampling is needed
            if sr != target_sr:
                logger.info(f"Resampling audio from {sr}Hz to {target_sr}Hz")
                audio = librosa.resample(audio, orig_sr=sr, target_sr=target_sr)
            
            # Create temporary file for preprocessed audio
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
                sf.write(tmp_file.name, audio, target_sr)
                return tmp_file.name
                
        except Exception as e:
            logger.error(f"Error preprocessing audio {audio_path}: {e}")
            raise
    
    def _convert_segments_to_dict(self, segments: List[Segment]) -> List[Dict[str, Any]]:
        """Convert Segment objects to dictionaries."""
        return [
            {
                "id": segment.id,
                "start": segment.start,
                "end": segment.end,
                "text": segment.text,
                "tokens": segment.tokens,
                "temperature": segment.temperature,
                "avg_logprob": segment.avg_logprob,
                "compression_ratio": segment.compression_ratio,
                "no_speech_prob": segment.no_speech_prob,
                "words": [
                    {
                        "start": word.start,
                        "end": word.end,
                        "word": word.word,
                        "probability": word.probability
                    } for word in segment.words
                ] if segment.words else None
            }
            for segment in segments
        ]
    
    def _convert_words_to_dict(self, words: List[Word]) -> List[Dict[str, Any]]:
        """Convert Word objects to dictionaries."""
        return [
            {
                "start": word.start,
                "end": word.end,
                "word": word.word,
                "probability": word.probability
            }
            for word in words
        ]
    
    async def transcribe_file(
        self, 
        audio_path: str, 
        request: TranscriptionRequest
    ) -> TranscriptionResponse:
        """
        Transcribe a single audio file.
        
        Args:
            audio_path: Path to the audio file
            request: Transcription request parameters
            
        Returns:
            Transcription response with text and metadata
        """
        if not self._is_loaded:
            await self.load_model()
        
        preprocessed_path = None
        try:
            # Preprocess audio
            preprocessed_path = self._preprocess_audio(audio_path)
            
            # Prepare transcription parameters using config defaults
            transcribe_kwargs = {
                "language": request.language or settings.default_language,
                "task": request.task,
                "beam_size": settings.default_beam_size,
                "best_of": settings.default_best_of,
                "patience": settings.default_patience,
                "length_penalty": settings.default_length_penalty,
                "temperature": settings.default_temperature,
                "compression_ratio_threshold": settings.default_compression_ratio_threshold,
                "log_prob_threshold": settings.default_log_prob_threshold,
                "no_speech_threshold": settings.default_no_speech_threshold,
                "condition_on_previous_text": settings.default_condition_on_previous_text,
                "prompt_reset_on_temperature": settings.default_prompt_reset_on_temperature,
                "initial_prompt": request.initial_prompt,
                "suppress_blank": settings.default_suppress_blank,
                "without_timestamps": settings.default_without_timestamps,
                "word_timestamps": request.word_timestamps,
                "vad_filter": settings.default_vad_filter,
                "repetition_penalty": settings.default_repetition_penalty,
                "no_repeat_ngram_size": settings.default_no_repeat_ngram_size,
            }
            
            # Remove None values
            transcribe_kwargs = {k: v for k, v in transcribe_kwargs.items() if v is not None}
            
            # Perform transcription
            logger.info(f"Transcribing audio file: {audio_path}")
            segments, info = self.model.transcribe(preprocessed_path, **transcribe_kwargs)
            
            # Convert segments to list
            segments_list = list(segments)
            
            # Extract text
            text = " ".join([segment.text for segment in segments_list])
            
            # Get audio duration
            audio, sr = librosa.load(audio_path, sr=None)
            duration = len(audio) / sr
            
            # Prepare response
            response = TranscriptionResponse(
                text=text,
                language=info.language,
                duration=duration,
                segments=self._convert_segments_to_dict(segments_list) if not settings.default_without_timestamps else None,
                words=self._convert_words_to_dict(info.words) if request.word_timestamps and info.words else None
            )
            
            logger.info(f"Transcription completed for {audio_path}")
            return response
            
        except Exception as e:
            logger.error(f"Error transcribing {audio_path}: {e}")
            raise
        finally:
            # Clean up preprocessed file
            if preprocessed_path and os.path.exists(preprocessed_path):
                try:
                    os.unlink(preprocessed_path)
                except Exception as e:
                    logger.warning(f"Failed to delete preprocessed file {preprocessed_path}: {e}")
    
    async def transcribe_batch(
        self, 
        audio_paths: List[str], 
        request: TranscriptionRequest
    ) -> BatchTranscriptionResponse:
        """
        Transcribe multiple audio files.
        
        Args:
            audio_paths: List of paths to audio files
            request: Transcription request parameters
            
        Returns:
            Batch transcription response with results for all files
        """
        results = []
        errors = []
        successful_count = 0
        
        for i, audio_path in enumerate(audio_paths):
            try:
                logger.info(f"Processing file {i+1}/{len(audio_paths)}: {audio_path}")
                result = await self.transcribe_file(audio_path, request)
                results.append(result)
                successful_count += 1
            except Exception as e:
                logger.error(f"Failed to transcribe {audio_path}: {e}")
                errors.append({
                    "file": audio_path,
                    "error": str(e)
                })
        
        return BatchTranscriptionResponse(
            results=results,
            total_files=len(audio_paths),
            successful_files=successful_count,
            failed_files=len(errors),
            errors=errors
        )
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model."""
        return {
            "model_size": self.model_size,
            "device": self.device,
            "compute_type": self.compute_type,
            "is_loaded": self._is_loaded
        }
