const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const server = createServer(app);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"]
  }
});

// In-memory event store (simulating Kafka)
let eventStore = [];
let dashboardClients = new Set();

// Simulate Kafka producer
const produceEvent = async (event) => {
  const enrichedEvent = {
    ...event,
    timestamp: new Date().toISOString(),
    session_id: event.session_id || `session-${Date.now()}`,
    user_id: event.user_id || 'anonymous',
    server_timestamp: new Date().toISOString()
  };
  
  eventStore.push(enrichedEvent);
  
  // Keep only last 1000 events
  if (eventStore.length > 1000) {
    eventStore = eventStore.slice(-1000);
  }
  
  // Broadcast to dashboard clients
  io.to('dashboard').emit('new_event', enrichedEvent);
  
  return enrichedEvent;
};

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  // Handle music player events
  socket.on('log_event', async (event) => {
    try {
      console.log('📝 Logging event:', event.event_type, event.track_id);
      const enrichedEvent = await produceEvent(event);
      socket.emit('event_logged', { success: true, event_type: enrichedEvent.event_type });
    } catch (error) {
      console.error('❌ Error logging event:', error);
      socket.emit('event_logged', { success: false, error: error.message });
    }
  });
  
  // Handle dashboard connections
  socket.on('join_dashboard', () => {
    socket.join('dashboard');
    dashboardClients.add(socket.id);
    console.log('📊 Dashboard client joined:', socket.id);
    socket.emit('dashboard_joined', { success: true });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    dashboardClients.delete(socket.id);
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    connected_clients: io.engine.clientsCount,
    dashboard_clients: dashboardClients.size,
    total_events: eventStore.length,
    mode: 'test-without-kafka'
  });
});

// REST API endpoint for logging events
app.post('/api/log', async (req, res) => {
  try {
    const enrichedEvent = await produceEvent(req.body);
    res.json({ success: true, event_type: enrichedEvent.event_type });
  } catch (error) {
    console.error('❌ Error in REST API:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT} (without Kafka)`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/health`);
  console.log(`🎵 Ready to receive music player events`);
  console.log(`⚠️  Running in test mode - events stored in memory only`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
}); 