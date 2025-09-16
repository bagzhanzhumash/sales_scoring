#!/bin/bash

# Speech Recognition Service Installation Script

echo "🚀 Installing Speech Recognition Service..."

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1,2)
required_version="3.10"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Python 3.10+ is required. Current version: $python_version"
    exit 1
fi

echo "✅ Python version check passed: $python_version"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Install faster-whisper
echo "🎤 Installing faster-whisper..."
pip install faster-whisper

# Optional: Install GPU support
read -p "Do you want to install GPU support? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Installing GPU support..."
    pip install faster-whisper[gpu]
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p temp

# Set permissions
echo "🔐 Setting permissions..."
chmod +x run.py
chmod +x test_service.py

echo "✅ Installation completed!"
echo ""
echo "To start the service:"
echo "  source venv/bin/activate"
echo "  python run.py"
echo ""
echo "To test the service:"
echo "  python test_service.py"
echo ""
echo "API documentation will be available at:"
echo "  http://localhost:8000/docs"
