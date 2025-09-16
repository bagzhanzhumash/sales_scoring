#!/usr/bin/env python3
"""
Script to run the Speech Recognition Service.
"""

import os
import sys
import uvicorn
from pathlib import Path

# Add the app directory to Python path
app_dir = Path(__file__).parent / "app"
sys.path.insert(0, str(app_dir))

if __name__ == "__main__":
    # Import settings
    from app.config import settings
    
    # Get reload setting from environment
    reload = os.getenv("RELOAD", "false").lower() == "true"
    
    print(f"Starting Speech Recognition Service...")
    print(f"Host: {settings.host}")
    print(f"Port: {settings.port}")
    print(f"Workers: {settings.workers}")
    print(f"Log Level: {settings.log_level}")
    print(f"Reload: {reload}")
    print(f"Model: {settings.model_size}")
    print(f"Device: {settings.device}")
    print(f"Docs: http://{settings.host}:{settings.port}/docs")
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        workers=settings.workers if not reload else 1,
        log_level=settings.log_level,
        reload=reload
    )
