"""
Utility functions for the speech recognition service.
"""

import os
import logging
from typing import Dict, Any, List
import librosa
import soundfile as sf

logger = logging.getLogger(__name__)

# Supported audio formats
SUPPORTED_FORMATS = {'.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac', '.wma'}

# Supported sample rates
SUPPORTED_SAMPLE_RATES = {8000, 16000, 22050, 44100, 48000}


def validate_audio_file(filename: str) -> bool:
    """
    Validate if the file has a supported audio format.
    
    Args:
        filename: Name of the file to validate
        
    Returns:
        True if the file format is supported, False otherwise
    """
    if not filename:
        return False
    
    file_extension = os.path.splitext(filename.lower())[1]
    return file_extension in SUPPORTED_FORMATS


def get_audio_info(file_path: str) -> Dict[str, Any]:
    """
    Get audio file information including sample rate, duration, and format.
    
    Args:
        file_path: Path to the audio file
        
    Returns:
        Dictionary containing audio information
    """
    try:
        # Load audio file
        audio, sr = librosa.load(file_path, sr=None)
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Get duration
        duration = len(audio) / sr
        
        # Get format
        file_format = os.path.splitext(file_path)[1].lower()
        
        return {
            "sample_rate": sr,
            "duration": duration,
            "channels": 1,  # librosa loads as mono
            "file_size": file_size,
            "format": file_format,
            "samples": len(audio),
            "is_supported_format": file_format in SUPPORTED_FORMATS,
            "is_supported_sample_rate": sr in SUPPORTED_SAMPLE_RATES
        }
        
    except Exception as e:
        logger.error(f"Error getting audio info for {file_path}: {e}")
        return {
            "error": str(e),
            "sample_rate": None,
            "duration": None,
            "channels": None,
            "file_size": None,
            "format": None,
            "samples": None,
            "is_supported_format": False,
            "is_supported_sample_rate": False
        }


def validate_audio_quality(file_path: str) -> Dict[str, Any]:
    """
    Validate audio quality and provide recommendations.
    
    Args:
        file_path: Path to the audio file
        
    Returns:
        Dictionary containing validation results and recommendations
    """
    audio_info = get_audio_info(file_path)
    
    if "error" in audio_info:
        return {
            "valid": False,
            "error": audio_info["error"],
            "recommendations": []
        }
    
    recommendations = []
    warnings = []
    
    # Check sample rate
    if audio_info["sample_rate"] not in SUPPORTED_SAMPLE_RATES:
        warnings.append(f"Unsupported sample rate: {audio_info['sample_rate']}Hz")
        if audio_info["sample_rate"] < 8000:
            recommendations.append("Sample rate is too low. Consider using at least 8kHz")
        elif audio_info["sample_rate"] > 48000:
            recommendations.append("Sample rate is very high. Consider downsampling to 16kHz for better performance")
    
    # Check duration
    if audio_info["duration"] < 0.1:
        warnings.append("Audio is very short (less than 0.1 seconds)")
        recommendations.append("Ensure the audio contains speech content")
    elif audio_info["duration"] > 1800:  # 30 minutes
        warnings.append("Audio is very long (more than 30 minutes)")
        recommendations.append("Consider splitting long audio into smaller chunks for better processing")
    
    # Check file size
    if audio_info["file_size"] > 100 * 1024 * 1024:  # 100MB
        warnings.append("Audio file is very large (more than 100MB)")
        recommendations.append("Consider compressing the audio or splitting into smaller chunks")
    
    # Check format
    if not audio_info["is_supported_format"]:
        warnings.append(f"Unsupported audio format: {audio_info['format']}")
        recommendations.append("Convert to a supported format (mp3, wav, m4a, flac, ogg)")
    
    return {
        "valid": len(warnings) == 0,
        "audio_info": audio_info,
        "warnings": warnings,
        "recommendations": recommendations
    }


def get_supported_formats() -> List[str]:
    """
    Get list of supported audio formats.
    
    Returns:
        List of supported format extensions
    """
    return list(SUPPORTED_FORMATS)


def get_supported_sample_rates() -> List[int]:
    """
    Get list of supported sample rates.
    
    Returns:
        List of supported sample rates
    """
    return list(SUPPORTED_SAMPLE_RATES)


def format_duration(seconds: float) -> str:
    """
    Format duration in seconds to human-readable format.
    
    Args:
        seconds: Duration in seconds
        
    Returns:
        Formatted duration string
    """
    if seconds < 60:
        return f"{seconds:.1f}s"
    elif seconds < 3600:
        minutes = int(seconds // 60)
        secs = seconds % 60
        return f"{minutes}m {secs:.1f}s"
    else:
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = seconds % 60
        return f"{hours}h {minutes}m {secs:.1f}s"


def format_file_size(bytes_size: int) -> str:
    """
    Format file size in bytes to human-readable format.
    
    Args:
        bytes_size: File size in bytes
        
    Returns:
        Formatted file size string
    """
    if bytes_size < 1024:
        return f"{bytes_size} B"
    elif bytes_size < 1024 * 1024:
        return f"{bytes_size / 1024:.1f} KB"
    elif bytes_size < 1024 * 1024 * 1024:
        return f"{bytes_size / (1024 * 1024):.1f} MB"
    else:
        return f"{bytes_size / (1024 * 1024 * 1024):.1f} GB"
