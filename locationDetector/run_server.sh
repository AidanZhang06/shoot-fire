#!/bin/bash

# Indoor Localization Metadata Extraction Server Runner
# This script checks prerequisites and starts the FastAPI server

set -e

echo "========================================"
echo "Indoor Localization Metadata Extraction"
echo "========================================"
echo ""

# Check Python version
echo "Checking Python version..."
python_version=$(python --version 2>&1 | awk '{print $2}')
required_version="3.9"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Error: Python 3.9 or higher required. Found: $python_version"
    exit 1
fi
echo "✓ Python $python_version"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo ""
    echo "Virtual environment not found. Creating..."
    python -m venv venv
    echo "✓ Virtual environment created"
fi

# Activate virtual environment
echo ""
echo "Activating virtual environment..."
source venv/bin/activate

# Check if dependencies are installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo ""
    echo "Dependencies not found. Installing..."
    pip install -r requirements.txt
    echo "✓ Dependencies installed"
else
    echo "✓ Dependencies already installed"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo ""
    echo "❌ Error: .env file not found"
    echo ""
    echo "Please create .env file:"
    echo "  cp .env.example .env"
    echo "  # Then edit .env and add your OVERSHOOT_API_KEY"
    exit 1
fi

# Check if API key is set
if grep -q "your_api_key_here" .env; then
    echo ""
    echo "⚠️  Warning: OVERSHOOT_API_KEY not configured in .env"
    echo ""
    echo "Please edit .env and set your actual API key:"
    echo "  OVERSHOOT_API_KEY=your_actual_key"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✓ Configuration file found"
fi

echo ""
echo "========================================"
echo "Starting server..."
echo "========================================"
echo ""
echo "API will be available at:"
echo "  http://localhost:8000"
echo ""
echo "Endpoints:"
echo "  GET  /health         - Health check"
echo "  POST /extract        - Extract metadata from single frame"
echo "  POST /extract/batch  - Extract metadata from multiple frames"
echo "  GET  /schema         - Get JSON schema"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
python -m src.api
