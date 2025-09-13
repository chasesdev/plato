#!/bin/bash

echo "🏛️ Building Plato for Production"
echo "=================================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: No .env file found!"
    echo "The app will work but API calls will fail without an OpenRouter key."
    echo ""
fi

# Run the build
echo "🔨 Building production bundle..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo "=================================="
    echo "📁 Production files are in: ./build"
    echo ""
    echo "To deploy:"
    echo "  Vercel:  npx vercel --prod"
    echo "  Netlify: Drag ./build folder to netlify.com"
    echo ""
    echo "To test locally:"
    echo "  npx serve -s build"
else
    echo ""
    echo "❌ Build failed!"
    echo "Please check the error messages above."
    exit 1
fi