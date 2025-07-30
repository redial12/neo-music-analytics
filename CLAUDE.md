# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Quick Start
```bash
# Install all dependencies (monorepo)
npm run install:all

# Start both client and server in development mode
npm run dev

# Start only the server
npm run dev:server

# Start only the client  
npm run dev:client
```

### Testing & Building
```bash
# Build the client for production
npm run build

# Test server without Kafka (in-memory mode)
npm run test:server

# Test server API endpoints
cd server && npm run test

# Test HTTP-only endpoints
cd server && npm run test:http

# Setup Kafka topics
cd server && npm run setup
```

### Kafka Infrastructure
```bash
# Start Kafka in KRaft mode via Docker
docker-compose up -d

# Stop Kafka infrastructure
docker-compose down

# Access Kafka UI at http://localhost:8080
```

### Linting & Type Checking
```bash
# Lint client code
cd client && npm run lint

# Type check client code
cd client && npx tsc --noEmit
```

## Architecture Overview

This is a real-time analytics dashboard with a **client-server-Kafka architecture**:

**Client (React + TypeScript)**
- Port: 5173 (Vite dev server)
- Two-pane UI: Analytics Dashboard (left) + Music Player (right)
- WebSocket connection to server for real-time event streaming
- Built with React 18, Vite, Tailwind CSS, Recharts

**Server (Node.js + Socket.IO + Kafka)**
- Port: 3001
- WebSocket server using Socket.IO
- Kafka producer/consumer for event streaming (KRaft mode)
- Express API for HTTP event ingestion
- Main topic: `user_events`

**Event Flow:**
1. Music Player UI → WebSocket/HTTP → Server → Kafka Topic
2. Kafka Topic → Server Consumer → WebSocket → Dashboard UI

### Key Files & Structure

**Server Architecture (server/socketServer.js:1-257)**
- Express + Socket.IO server with Kafka integration
- Handles both WebSocket (`log_event`) and HTTP (`POST /produce`) event ingestion
- Kafka consumer broadcasts events to dashboard clients via WebSocket
- Graceful fallback when Kafka is unavailable

**Client Architecture (client/src/App.tsx:1-50)**
- Split-screen layout: Dashboard component (left) + MusicPlayer component (right)
- Automatic WebSocket connection and dashboard room joining
- Real-time event streaming from server

**Event Types & Data Structure**
Events are enriched with metadata:
```javascript
{
  eventType: "play|pause|scrub|like_clicked|etc",
  userId: "user-123",
  timestamp: "2024-01-01T12:00:00.000Z",
  // Additional event-specific fields
  serverTimestamp: "auto-generated",
  session_id: "auto-generated"
}
```

### Kafka Configuration
- **Topic**: `user_events` (auto-created)
- **Consumer Group**: `dashboard-consumer`
- **Partitioning**: By `userId`
- **Brokers**: localhost:9092
- **UI**: http://localhost:8080

### Development Modes

**Full Mode (with Kafka)**
- Requires Docker for Kafka in KRaft mode (no Zookeeper needed)
- Events flow through Kafka for durability and decoupling
- Use `npm run dev` after `docker-compose up -d`

**Test Mode (without Kafka)**  
- In-memory event handling, no Docker required
- Use `npm run test:server` for server-only testing
- WebSocket events still work, but no Kafka durability

### WebSocket Events

**Client → Server:**
- `log_event` - Music player actions (legacy)
- `join_dashboard` - Connect to dashboard room

**Server → Client:**
- `new_event` - Kafka events broadcast to dashboard
- `event_logged` - Event ingestion confirmation
- `dashboard_joined` - Dashboard connection confirmation

### API Endpoints

- `GET /health` - Server health check with client counts
- `POST /produce` - Main event ingestion endpoint (HTTP)
- `POST /api/log` - Legacy music player events (HTTP)

### Package Structure

**Monorepo with workspaces:**
- Root: Shared scripts and Docker configuration
- `client/`: React TypeScript application  
- `server/`: Node.js WebSocket + Kafka server

**Key Dependencies:**
- Client: React 18, Vite, Socket.IO client, Recharts, Tailwind CSS
- Server: Express, Socket.IO, KafkaJS, Helmet, CORS

### Common Development Patterns

**Event Logging:**
Use the socket utility (client/src/utils/socket.ts) for consistent event emission

**Component Structure:**
- Dashboard components use real-time WebSocket data
- Music player components emit events via WebSocket
- Charts use Recharts library with responsive design

**Error Handling:**
Server handles Kafka failures gracefully and logs detailed information for debugging