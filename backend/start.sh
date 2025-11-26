#!/bin/bash

# Render Deployment Script
echo "🚀 Starting MindCare AI Backend on Render..."

# Ensure node_modules are installed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Create uploads directory
mkdir -p uploads

# Start the application
echo "✅ Starting server..."
npm start
