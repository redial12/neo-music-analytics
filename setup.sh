#!/bin/bash

echo "🚀 Setting up Neo Analytics - Real-time Music Player Dashboard"
echo "================================================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "📦 Installing dependencies..."
npm run install:all

echo "🐳 Starting Kafka and Zookeeper..."
docker-compose up -d

echo "⏳ Waiting for Kafka to be ready..."
sleep 10

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Start the server: npm run dev:server"
echo "2. Start the client: npm run dev:client"
echo "3. Or start both: npm run dev"
echo ""
echo "📊 Access points:"
echo "- Client: http://localhost:5173"
echo "- Server health: http://localhost:3001/health"
echo "- Kafka UI: http://localhost:8080"
echo ""
echo "🎵 Interact with the music player to see real-time analytics!" 