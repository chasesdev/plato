#!/bin/bash

echo "🏛️ Starting Plato - AR + Socratic AI Science Learning Platform"
echo "=================================================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed!"
else
    echo "✅ Dependencies already installed"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found!"
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "🔑 IMPORTANT: Edit .env and add your OpenRouter API key"
    echo "   Get your key at: https://openrouter.ai/keys"
    echo ""
    echo "Press Enter to continue after adding your API key..."
    read
fi

echo ""
echo "🚀 Starting development server..."
echo "=================================================="
npm start