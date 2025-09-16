#!/usr/bin/env python3
"""
Example usage of the simplified Speech Recognition API.
"""

import requests
import json

# API configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"

def example_single_file_transcription():
    """Example of transcribing a single audio file."""
    print("🎤 Example: Single file transcription")
    print("-" * 40)
    
    # Example with minimal parameters (only file)
    print("1. Minimal request (only file):")
    print("   curl -X POST 'http://localhost:8000/api/v1/transcribe' \\")
    print("     -F 'file=@audio.mp3'")
    print()
    
    # Example with language specified
    print("2. With language specified:")
    print("   curl -X POST 'http://localhost:8000/api/v1/transcribe' \\")
    print("     -F 'file=@audio.mp3' \\")
    print("     -F 'language=ru'")
    print()
    
    # Example with word timestamps
    print("3. With word timestamps:")
    print("   curl -X POST 'http://localhost:8000/api/v1/transcribe' \\")
    print("     -F 'file=@audio.mp3' \\")
    print("     -F 'language=ru' \\")
    print("     -F 'word_timestamps=true'")
    print()
    
    # Example with initial prompt
    print("4. With initial prompt:")
    print("   curl -X POST 'http://localhost:8000/api/v1/transcribe' \\")
    print("     -F 'file=@audio.mp3' \\")
    print("     -F 'language=ru' \\")
    print("     -F 'initial_prompt=Это запись телефонного разговора'")
    print()

def example_batch_transcription():
    """Example of batch transcription."""
    print("📁 Example: Batch transcription")
    print("-" * 40)
    
    print("1. Multiple files:")
    print("   curl -X POST 'http://localhost:8000/api/v1/transcribe/batch' \\")
    print("     -F 'files=@audio1.mp3' \\")
    print("     -F 'files=@audio2.wav' \\")
    print("     -F 'files=@audio3.m4a'")
    print()
    
    print("2. With language and word timestamps:")
    print("   curl -X POST 'http://localhost:8000/api/v1/transcribe/batch' \\")
    print("     -F 'files=@audio1.mp3' \\")
    print("     -F 'files=@audio2.wav' \\")
    print("     -F 'language=ru' \\")
    print("     -F 'word_timestamps=true'")
    print()

def example_url_transcription():
    """Example of URL-based transcription."""
    print("🌐 Example: URL transcription")
    print("-" * 40)
    
    print("1. Basic URL transcription:")
    print("   curl -X POST 'http://localhost:8000/api/v1/transcribe/url' \\")
    print("     -d 'url=https://example.com/audio.mp3'")
    print()
    
    print("2. With language and timestamps:")
    print("   curl -X POST 'http://localhost:8000/api/v1/transcribe/url' \\")
    print("     -d 'url=https://example.com/audio.mp3' \\")
    print("     -d 'language=ru' \\")
    print("     -d 'word_timestamps=true'")
    print()

def example_python_usage():
    """Example of using the API with Python requests."""
    print("🐍 Example: Python usage")
    print("-" * 40)
    
    print("""
import requests

# Single file transcription
def transcribe_file(file_path, language=None, word_timestamps=False):
    url = "http://localhost:8000/api/v1/transcribe"
    
    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {
            'language': language,
            'word_timestamps': word_timestamps
        }
        
        response = requests.post(url, files=files, data=data)
        return response.json()

# Usage
result = transcribe_file('audio.mp3', language='ru', word_timestamps=True)
print(f"Text: {result['text']}")
print(f"Language: {result['language']}")
print(f"Duration: {result['duration']}s")
""")

def example_response_format():
    """Example of response format."""
    print("📋 Example: Response format")
    print("-" * 40)
    
    example_response = {
        "text": "Привет, как дела? Это тестовая запись.",
        "language": "ru",
        "duration": 3.5,
        "segments": [
            {
                "id": 0,
                "start": 0.0,
                "end": 3.5,
                "text": "Привет, как дела? Это тестовая запись.",
                "tokens": [1234, 5678, 9012],
                "temperature": 0.0,
                "avg_logprob": -0.5,
                "compression_ratio": 1.2,
                "no_speech_prob": 0.1
            }
        ],
        "words": [
            {
                "start": 0.0,
                "end": 0.5,
                "word": "Привет",
                "probability": 0.95
            },
            {
                "start": 0.6,
                "end": 1.0,
                "word": "как",
                "probability": 0.92
            }
        ]
    }
    
    print("Response format:")
    print(json.dumps(example_response, indent=2, ensure_ascii=False))

def main():
    """Run all examples."""
    print("🚀 Speech Recognition API - Usage Examples")
    print("=" * 50)
    print()
    
    example_single_file_transcription()
    example_batch_transcription()
    example_url_transcription()
    example_python_usage()
    example_response_format()
    
    print("\n" + "=" * 50)
    print("✅ All examples shown!")
    print()
    print("To start the service:")
    print("  python run.py")
    print()
    print("API documentation:")
    print("  http://localhost:8000/docs")

if __name__ == "__main__":
    main()
