"""
API endpoints for speech transcription.
"""

import logging
import os
import tempfile
from typing import List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
import aiofiles

from ..models import (
    TranscriptionRequest, 
    TranscriptionResponse, 
    BatchTranscriptionResponse,
    HealthResponse
)
from ..whisper_service import WhisperService
from ..utils import validate_audio_file, get_audio_info

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["transcription"])

# Global whisper service instance
whisper_service = WhisperService()


async def get_whisper_service() -> WhisperService:
    """Dependency to get the whisper service."""
    if not whisper_service.is_loaded():
        await whisper_service.load_model()
    return whisper_service


@router.get("/health", response_model=HealthResponse)
async def health_check(service: WhisperService = Depends(get_whisper_service)):
    """
    Health check endpoint.
    
    Returns:
        Health status of the service
    """
    return HealthResponse(
        status="healthy" if service.is_loaded() else "loading",
        model_loaded=service.is_loaded(),
        version="1.0.0"
    )


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    file: UploadFile = File(..., description="Audio file to transcribe"),
    language: str = Form(None, description="Language code (e.g., 'ru', 'en'). Auto-detect if not specified"),
    task: str = Form("transcribe", description="Task type: 'transcribe' or 'translate'"),
    word_timestamps: bool = Form(False, description="Enable word-level timestamps"),
    initial_prompt: str = Form(None, description="Initial prompt for the model"),
    service: WhisperService = Depends(get_whisper_service)
):
    """
    Transcribe a single audio file.
    
    Args:
        file: Audio file to transcribe
        language: Language code for transcription
        task: Task type (transcribe or translate)
        beam_size: Beam size for beam search
        best_of: Number of candidates to consider
        patience: Patience for beam search
        length_penalty: Length penalty
        temperature: Temperature for sampling
        compression_ratio_threshold: Compression ratio threshold
        log_prob_threshold: Log probability threshold
        no_speech_threshold: No speech threshold
        condition_on_previous_text: Condition on previous text
        prompt_reset_on_temperature: Reset prompt on temperature
        initial_prompt: Initial prompt for the model
        prefix: Prefix for the transcription
        suppress_blank: Suppress blank outputs
        without_timestamps: Disable timestamp generation
        max_initial_timestamp: Maximum initial timestamp
        word_timestamps: Enable word-level timestamps
        prepend_punctuations: Punctuations to prepend
        append_punctuations: Punctuations to append
        vad_filter: Enable VAD filtering
        min_word_duration: Minimum word duration
        hotwords: Hotwords for better recognition
        repetition_penalty: Repetition penalty
        no_repeat_ngram_size: No repeat n-gram size
        service: Whisper service dependency
        
    Returns:
        Transcription result
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Validate audio file
        if not validate_audio_file(file.filename):
            raise HTTPException(
                status_code=400, 
                detail="Unsupported audio format. Supported formats: mp3, wav, m4a, flac, ogg"
            )
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp_file:
            # Save uploaded file
            content = await file.read()
            async with aiofiles.open(tmp_file.name, 'wb') as f:
                await f.write(content)
            
            # Get audio info
            audio_info = get_audio_info(tmp_file.name)
            logger.info(f"Audio info: {audio_info}")
            
            # Create transcription request
            request = TranscriptionRequest(
                language=language,
                task=task,
                word_timestamps=word_timestamps,
                initial_prompt=initial_prompt
            )
            
            # Transcribe audio
            result = await service.transcribe_file(tmp_file.name, request)
            
            # Clean up temporary file
            try:
                os.unlink(tmp_file.name)
            except Exception as e:
                logger.warning(f"Failed to delete temporary file {tmp_file.name}: {e}")
            
            return result
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error transcribing audio: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@router.post("/transcribe/batch", response_model=BatchTranscriptionResponse)
async def transcribe_batch_audio(
    files: List[UploadFile] = File(..., description="Audio files to transcribe"),
    language: str = Form(None, description="Language code (e.g., 'ru', 'en'). Auto-detect if not specified"),
    task: str = Form("transcribe", description="Task type: 'transcribe' or 'translate'"),
    word_timestamps: bool = Form(False, description="Enable word-level timestamps"),
    initial_prompt: str = Form(None, description="Initial prompt for the model"),
    service: WhisperService = Depends(get_whisper_service)
):
    """
    Transcribe multiple audio files in batch.
    
    Args:
        files: List of audio files to transcribe
        language: Language code for transcription
        task: Task type (transcribe or translate)
        beam_size: Beam size for beam search
        best_of: Number of candidates to consider
        patience: Patience for beam search
        length_penalty: Length penalty
        temperature: Temperature for sampling
        compression_ratio_threshold: Compression ratio threshold
        log_prob_threshold: Log probability threshold
        no_speech_threshold: No speech threshold
        condition_on_previous_text: Condition on previous text
        prompt_reset_on_temperature: Reset prompt on temperature
        initial_prompt: Initial prompt for the model
        prefix: Prefix for the transcription
        suppress_blank: Suppress blank outputs
        without_timestamps: Disable timestamp generation
        max_initial_timestamp: Maximum initial timestamp
        word_timestamps: Enable word-level timestamps
        prepend_punctuations: Punctuations to prepend
        append_punctuations: Punctuations to append
        vad_filter: Enable VAD filtering
        min_word_duration: Minimum word duration
        hotwords: Hotwords for better recognition
        repetition_penalty: Repetition penalty
        no_repeat_ngram_size: No repeat n-gram size
        service: Whisper service dependency
        
    Returns:
        Batch transcription results
    """
    try:
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        
        # Validate all files
        for file in files:
            if not file.filename:
                raise HTTPException(status_code=400, detail="One or more files have no filename")
            if not validate_audio_file(file.filename):
                raise HTTPException(
                    status_code=400, 
                    detail=f"Unsupported audio format: {file.filename}. Supported formats: mp3, wav, m4a, flac, ogg"
                )
        
        # Create temporary files
        temp_files = []
        try:
            for file in files:
                with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp_file:
                    content = await file.read()
                    async with aiofiles.open(tmp_file.name, 'wb') as f:
                        await f.write(content)
                    temp_files.append(tmp_file.name)
            
            # Create transcription request
            request = TranscriptionRequest(
                language=language,
                task=task,
                word_timestamps=word_timestamps,
                initial_prompt=initial_prompt
            )
            
            # Transcribe all files
            result = await service.transcribe_batch(temp_files, request)
            
            return result
            
        finally:
            # Clean up temporary files
            for temp_file in temp_files:
                try:
                    os.unlink(temp_file)
                except Exception as e:
                    logger.warning(f"Failed to delete temporary file {temp_file}: {e}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error transcribing batch audio: {e}")
        raise HTTPException(status_code=500, detail=f"Batch transcription failed: {str(e)}")


@router.post("/transcribe/url", response_model=TranscriptionResponse)
async def transcribe_from_url(
    url: str = Form(..., description="URL of the audio file to transcribe"),
    language: str = Form(None, description="Language code (e.g., 'ru', 'en'). Auto-detect if not specified"),
    task: str = Form("transcribe", description="Task type: 'transcribe' or 'translate'"),
    word_timestamps: bool = Form(False, description="Enable word-level timestamps"),
    initial_prompt: str = Form(None, description="Initial prompt for the model"),
    service: WhisperService = Depends(get_whisper_service)
):
    """
    Transcribe audio from URL.
    
    Args:
        url: URL of the audio file
        language: Language code for transcription
        task: Task type (transcribe or translate)
        beam_size: Beam size for beam search
        best_of: Number of candidates to consider
        patience: Patience for beam search
        length_penalty: Length penalty
        temperature: Temperature for sampling
        compression_ratio_threshold: Compression ratio threshold
        log_prob_threshold: Log probability threshold
        no_speech_threshold: No speech threshold
        condition_on_previous_text: Condition on previous text
        prompt_reset_on_temperature: Reset prompt on temperature
        initial_prompt: Initial prompt for the model
        prefix: Prefix for the transcription
        suppress_blank: Suppress blank outputs
        without_timestamps: Disable timestamp generation
        max_initial_timestamp: Maximum initial timestamp
        word_timestamps: Enable word-level timestamps
        prepend_punctuations: Punctuations to prepend
        append_punctuations: Punctuations to append
        vad_filter: Enable VAD filtering
        min_word_duration: Minimum word duration
        hotwords: Hotwords for better recognition
        repetition_penalty: Repetition penalty
        no_repeat_ngram_size: No repeat n-gram size
        service: Whisper service dependency
        
    Returns:
        Transcription result
    """
    try:
        import requests
        
        # Download file from URL
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        # Get file extension from URL
        file_extension = os.path.splitext(url.split('?')[0])[1] or '.mp3'
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp_file:
            for chunk in response.iter_content(chunk_size=8192):
                tmp_file.write(chunk)
            tmp_file.flush()
            
            # Validate audio file
            if not validate_audio_file(tmp_file.name):
                raise HTTPException(
                    status_code=400, 
                    detail="Unsupported audio format from URL"
                )
            
            # Create transcription request
            request = TranscriptionRequest(
                language=language,
                task=task,
                word_timestamps=word_timestamps,
                initial_prompt=initial_prompt
            )
            
            # Transcribe audio
            result = await service.transcribe_file(tmp_file.name, request)
            
            # Clean up temporary file
            try:
                os.unlink(tmp_file.name)
            except Exception as e:
                logger.warning(f"Failed to delete temporary file {tmp_file.name}: {e}")
            
            return result
            
    except requests.RequestException as e:
        logger.error(f"Error downloading audio from URL {url}: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to download audio from URL: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error transcribing audio from URL: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@router.get("/model/info")
async def get_model_info(service: WhisperService = Depends(get_whisper_service)):
    """
    Get information about the loaded model.
    
    Returns:
        Model information
    """
    return service.get_model_info()
