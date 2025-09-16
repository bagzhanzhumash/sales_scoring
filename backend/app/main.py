"""
Main FastAPI application for speech recognition service.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from .api.transcription import router as transcription_router
from .whisper_service import WhisperService
from .config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("speech_recognition.log")
    ]
)

logger = logging.getLogger(__name__)

# Global whisper service instance
whisper_service = WhisperService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("Starting Speech Recognition Service...")
    try:
        await whisper_service.load_model()
        logger.info("Whisper model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load Whisper model: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down Speech Recognition Service...")


# Create FastAPI app
app = FastAPI(
    title="Speech Recognition Service",
    description="A FastAPI service for speech recognition using faster-whisper large-v3 turbo model",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)

# Include routers
app.include_router(transcription_router)


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler."""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "status_code": 500
        }
    )


@app.get("/")
async def root():
    """
    Root endpoint.
    
    Returns:
        Welcome message and service information
    """
    return {
        "message": "Speech Recognition Service",
        "version": "1.0.0",
        "model": "faster-whisper large-v3 turbo",
        "docs": "/docs",
        "health": "/api/v1/health"
    }


@app.get("/info")
async def info():
    """
    Service information endpoint.
    
    Returns:
        Detailed service information
    """
    return {
        "service": "Speech Recognition Service",
        "version": "1.0.0",
        "model": {
            "name": "faster-whisper",
            "size": settings.model_size,
            "device": settings.device,
            "compute_type": settings.compute_type
        },
        "features": [
            "Single file transcription",
            "Batch file transcription",
            "URL-based transcription",
            "Multiple audio formats support",
            "8kHz and 16kHz sample rate support",
            "Word-level timestamps",
            "Language detection",
            "Translation support"
        ],
        "supported_formats": [".mp3", ".wav", ".m4a", ".flac", ".ogg", ".aac", ".wma"],
        "supported_sample_rates": [8000, 16000, 22050, 44100, 48000],
        "endpoints": {
            "health": "/api/v1/health",
            "transcribe": "/api/v1/transcribe",
            "transcribe_batch": "/api/v1/transcribe/batch",
            "transcribe_url": "/api/v1/transcribe/url",
            "model_info": "/api/v1/model/info"
        }
    }


if __name__ == "__main__":
    # Get configuration from settings
    logger.info(f"Starting server on {settings.host}:{settings.port}")
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        workers=settings.workers,
        log_level=settings.log_level,
        reload=False
    )
