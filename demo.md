# 🎵 Neo Analytics Demo Guide

## 🚀 Quick Demo

### 1. Start the Application

```bash
# Terminal 1: Start test server
npm run test:server

# Terminal 2: Start client
npm run dev:client
```

### 2. Open the Application

Navigate to: http://localhost:5173

You'll see a split-screen interface:
- **Left**: Real-time analytics dashboard
- **Right**: Spotify-like music player

### 3. Interact with the Music Player

Try these interactions to see real-time analytics:

1. **Play/Pause** - Click the play button
2. **Skip Tracks** - Use the skip forward/backward buttons
3. **Seek** - Drag the progress bar to different positions
4. **Volume** - Adjust the volume slider
5. **Like** - Click the heart button
6. **Add to Playlist** - Click the plus button

### 4. Watch the Analytics Dashboard

As you interact with the player, you'll see:

- **Live Event Feed**: Real-time list of all events
- **Event Type Distribution**: Pie chart showing event types
- **Track Popularity**: Bar chart of most interacted tracks
- **Event Frequency**: Timeline of events over time
- **Statistics**: Live counters for events, tracks, users

### 5. Filter Events

Use the filter dropdowns to:
- Filter by event type (play, pause, scrub, etc.)
- Filter by track ID
- Filter by user ID

## 📊 What You'll See

### Event Types
- `play` - When user starts playing a track
- `pause` - When user pauses a track
- `skip` - When user skips to next/previous track
- `scrub` - When user seeks to a different position
- `like` - When user likes a track
- `add_to_playlist` - When user adds track to playlist
- `volume_change` - When user adjusts volume

### Analytics Features
- **Real-time updates** - No page refresh needed
- **Interactive charts** - Hover for details
- **Event details** - See timestamps, positions, volumes
- **Session tracking** - Each user gets a unique session ID
- **User tracking** - Anonymous user IDs for analytics

## 🔧 Technical Details

### Architecture
```
Music Player → WebSocket → Server → In-Memory Store → Dashboard
```

### Event Flow
1. User interacts with music player
2. Frontend logs event via WebSocket
3. Server stores event and broadcasts to dashboard
4. Dashboard updates in real-time

### Data Structure
Each event includes:
- `timestamp` - When the event occurred
- `session_id` - Unique session identifier
- `user_id` - Anonymous user identifier
- `event_type` - Type of interaction
- `track_id` - Which track was interacted with
- Additional data based on event type

## 🎯 Next Steps

1. **Start Kafka** - Use `docker-compose up -d` for production mode
2. **Add Persistence** - Connect to PostgreSQL or MongoDB
3. **Add Authentication** - User login and session management
4. **Add More Analytics** - Funnels, heatmaps, user journeys
5. **Scale Up** - Multiple servers, load balancing

## 🐛 Troubleshooting

- **Server not starting**: Check if port 3001 is available
- **Client not connecting**: Ensure server is running on localhost:3001
- **No events showing**: Try refreshing the page and interacting with the player
- **Charts not updating**: Check browser console for WebSocket errors

---

**Enjoy exploring real-time analytics! 🎉** 