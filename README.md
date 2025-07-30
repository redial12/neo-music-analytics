# 🎧 Neo Analytics - Real-Time Music Analytics Dashboard

A sophisticated real-time analytics platform that combines a music player interface with live data visualization. Built with React, Node.js, Kafka, and WebSockets to demonstrate modern streaming analytics architecture.

## 🚀 Project Overview

Neo Analytics is a split-screen web application featuring:
- **Right Panel**: Interactive music player (Spotify-like interface) that generates user events
- **Left Panel**: Real-time analytics dashboard that visualizes those events instantly

The system captures detailed user interactions and provides immediate insights through charts, filters, and live event feeds.

## 🏗️ Architecture

```
┌─────────────────┐    WebSocket/HTTP    ┌──────────────────┐    Kafka     ┌─────────────────┐
│   Music Player  │ ──────────────────→ │   Server         │ ──────────→ │   Dashboard     │
│   (React)       │                     │   (Node.js)      │             │   (React)       │
│                 │                     │   + Kafka        │             │                 │
│   • Play/Pause  │                     │   + Socket.IO    │             │   • Charts      │
│   • Scrubbing   │                     │                  │             │   • Event Feed  │
│   • Volume      │                     │                  │             │   • Filters     │
│   • Likes       │                     │                  │             │   • Stats       │
└─────────────────┘                     └──────────────────┘             └─────────────────┘
```

**Event Flow:**
1. User interacts with music player
2. Event sent to server via WebSocket/HTTP
3. Server produces event to Kafka topic
4. Server consumes from Kafka and broadcasts to dashboard clients
5. Dashboard updates in real-time

## 🛠️ Tech Stack

### Frontend (Client)
- **React 18** with TypeScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling with custom dark theme
- **Socket.IO Client** - Real-time WebSocket communication
- **Recharts** - Interactive data visualization
- **Lucide React** - Modern icon library

### Backend (Server)
- **Node.js** with Express
- **Socket.IO** - WebSocket server for real-time communication
- **KafkaJS** - Kafka client for event streaming
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

### Infrastructure
- **Apache Kafka** - Event streaming platform (KRaft mode)
- **Docker Compose** - Container orchestration
- **Kafka UI** - Web-based Kafka management

## 📁 Project Structure

```
neo-analytics/
├── client/                    # React TypeScript frontend
│   ├── src/
│   │   ├── App.tsx           # Main split-screen layout
│   │   ├── components/
│   │   │   ├── Dashboard.tsx          # Analytics dashboard
│   │   │   ├── MusicPlayer.tsx        # Interactive music player
│   │   │   ├── EventFeed.tsx          # Live event stream
│   │   │   └── AnalyticsCharts.tsx    # Data visualizations
│   │   └── utils/
│   │       ├── socket.ts              # WebSocket client
│   │       ├── api.ts                 # HTTP API client
│   │       ├── eventContext.ts        # Event enrichment
│   │       └── colors.ts              # Design system
│   ├── package.json
│   └── vite.config.ts
├── server/
│   ├── socketServer.js       # Main server with Kafka integration
│   └── package.json
├── docker-compose.yml        # Kafka infrastructure
├── package.json              # Monorepo scripts
└── CLAUDE.md                 # Development instructions
```

## 🎵 Music Player Features

- **3 Sample Tracks**: Bohemian Rhapsody, Hotel California, Stairway to Heaven
- **Full Controls**: Play/pause, skip forward/back, scrubbing, volume
- **User Actions**: Like/unlike, add to playlist, view lyrics/artist
- **Visual Design**: Album art, progress bars, gradient backgrounds
- **User Management**: Editable usernames with persistence
- **Rich Context**: Every interaction generates detailed analytics events

## 📊 Dashboard Features

### Real-Time Analytics
- **Live Event Feed**: Scrollable list of events with timestamps and context
- **Statistics Cards**: Total events, event types, tracks, and users
- **Interactive Filters**: Filter by event type, track, or user

### Data Visualizations
- **Event Distribution** (Pie Chart): Breakdown of event types
- **Track Popularity** (Bar Chart): Events per track
- **Timeline Analysis** (Line Chart): Event frequency over time
- **Song Position Analysis**: Events by position in track (10-second increments)

### Advanced Context
- **Play Context**: Source (manual/autoplay), previous track, timing
- **Scrub Context**: Direction, distance, was playing before
- **Skip Context**: Direction, listening time, skip reason
- **Volume Context**: Previous volume, change amount, mute actions
- **Engagement Context**: Time to like, user behavior patterns

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Docker (for Kafka)
- npm or yarn

### Option 1: Full Mode (with Kafka)
```bash
# Install dependencies
npm run install:all

# Start Kafka infrastructure
docker-compose up -d

# Start both server and client
npm run dev
```

### Option 2: Test Mode (without Kafka)
```bash
# Install dependencies
npm run install:all

# Start test server (in-memory events)
npm run test:server

# In another terminal, start client
npm run dev:client
```

### Access Points
- **Client Application**: http://localhost:5173
- **Server Health Check**: http://localhost:3001/health  
- **Kafka UI**: http://localhost:8080

## 🔧 Development Commands

```bash
# Install all dependencies (monorepo)
npm run install:all

# Start both client and server
npm run dev

# Start only server
npm run dev:server

# Start only client  
npm run dev:client

# Build client for production
npm run build

# Test server without Kafka
npm run test:server

# Setup Kafka topics
cd server && npm run setup

# Linting and type checking
cd client && npm run lint
cd client && npx tsc --noEmit
```

## 📡 Event Types & Data Structure

### Core Events
- `play` / `pause` - Playback control
- `scrub` - Seeking to different position
- `skip` - Next/previous track
- `replay` - Restart current track
- `like` / `unlike` - User engagement
- `add_to_playlist` / `remove_from_playlist` - Collection management
- `volume_change` - Audio adjustments
- `view_lyrics` / `view_artist` - Content exploration

### Event Schema
```typescript
interface AnalyticsEvent {
  timestamp: string;
  session_id: string;
  user_id: string;
  event_type: string;
  track_id: string;
  position?: number;
  duration?: number;
  volume?: number;
  
  // Rich context objects
  play_context?: PlayContext;
  scrub_context?: ScrubContext;
  skip_context?: SkipContext;
  volume_context?: VolumeContext;
  engagement_context?: EngagementContext;
}
```

## 🌐 Deployment

The application is configured for deployment with:
- **Client**: Static hosting (Vercel, Netlify)
- **Server**: Node.js hosting (Fly.io, Railway, Heroku)
- **Kafka**: Managed Kafka service or self-hosted

Environment variables are handled through the codebase for production deployment.

## 🚀 Future Enhancements

- **Persistent Storage**: PostgreSQL integration for historical data
- **Session Replay**: Step-by-step playback of user sessions
- **Advanced Analytics**: Cohort analysis, funnel tracking, retention metrics
- **User Authentication**: Multi-user support with login system
- **Real-Time Alerts**: Anomaly detection and notifications
- **Export Capabilities**: Data export in multiple formats
- **Mobile Optimization**: Enhanced mobile responsiveness

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

Built with ❤️ using modern web technologies for real-time analytics and data visualization.