const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { Kafka } = require('kafkajs');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const server = createServer(app);

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: [
    "http://localhost:5173", 
    "http://127.0.0.1:5173", 
    "https://neo-music-analytics.netlify.app",
    /https:\/\/.*\.netlify\.app$/,
    "https://neo-analytics-backend.fly.dev"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true
}));
app.use(express.json());

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173", 
      "http://127.0.0.1:5173", 
      "https://neo-music-analytics.netlify.app",
      /https:\/\/.*\.netlify\.app$/,
      "https://neo-analytics-backend.fly.dev"
    ],
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true
  },
  allowEIO3: true,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Kafka setup
const kafka = new Kafka({
  clientId: 'neo-analytics-server',
  brokers: ['localhost:29092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'dashboard-consumer' });

// Store connected dashboard clients
let dashboardClients = new Set();
let kafkaConnected = false;

// Initialize Kafka connections
async function initializeKafka() {
  try {
    await producer.connect();
    await consumer.connect();
    
    // Wait a bit for topic metadata to be available
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await consumer.subscribe({ topic: 'user_events', fromBeginning: false });
    
    console.log('✅ Kafka connections established');
    kafkaConnected = true;
    
    // Start consuming messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = JSON.parse(message.value.toString());
          console.log('📨 Received Kafka message:', data.eventType || data.event_type);
          
          // Normalize event structure for dashboard (eventType -> event_type, userId -> user_id)
          const normalizedEvent = {
            ...data,
            event_type: data.eventType || data.event_type,
            user_id: data.userId || data.user_id,
            track_id: data.trackId || data.track_id
          };
          
          // Broadcast to all dashboard clients
          io.to('dashboard').emit('new_event', normalizedEvent);
        } catch (error) {
          console.error('❌ Error processing Kafka message:', error);
        }
      }
    });
    
    console.log('✅ Kafka consumer started');
  } catch (error) {
    console.error('❌ Kafka initialization failed:', error);
    console.log('⚠️ Server will run without Kafka (HTTP endpoints only)');
    kafkaConnected = false;
  }
}

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  console.log('🔗 Client origin:', socket.handshake.headers.origin);
  console.log('🔗 Client user-agent:', socket.handshake.headers['user-agent']);
  
  // Handle music player events (legacy support)
  socket.on('log_event', async (event) => {
    try {
      // Enrich event with metadata
      const enrichedEvent = {
        ...event,
        timestamp: new Date().toISOString(),
        session_id: event.session_id || `session-${Date.now()}`,
        user_id: event.user_id || 'anonymous',
        server_timestamp: new Date().toISOString()
      };
      
      console.log('📝 Logging event:', enrichedEvent.event_type);
      
      if (kafkaConnected) {
        // Send to Kafka
        await producer.send({
          topic: 'user_events',
          messages: [{ 
            key: enrichedEvent.user_id,
            value: JSON.stringify(enrichedEvent) 
          }]
        });
      } else {
        console.log('⚠️ Kafka not available, event logged but not sent to Kafka');
      }
      
      // Acknowledge receipt
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
    kafka_connected: kafkaConnected
  });
});

// Main event ingestion endpoint
app.post('/produce', async (req, res) => {
  try {
    const event = req.body;
    
    // Validate required fields
    if (!event.eventType) {
      return res.status(400).json({ 
        success: false, 
        error: 'eventType is required' 
      });
    }
    
    // Enrich event with metadata
    const enrichedEvent = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
      userId: event.userId || 'anonymous',
      serverTimestamp: new Date().toISOString()
    };
    
    console.log('📝 Producing event:', enrichedEvent.eventType);
    
    if (kafkaConnected) {
      // Send to Kafka with userId as key
      await producer.send({
        topic: 'user_events',
        messages: [{ 
          key: enrichedEvent.userId,
          value: JSON.stringify(enrichedEvent) 
        }]
      });
    } else {
      console.log('⚠️ Kafka not available, event logged but not sent to Kafka');
    }
    
    res.json({ 
      success: true, 
      eventType: enrichedEvent.eventType,
      timestamp: enrichedEvent.timestamp,
      kafka_connected: kafkaConnected
    });
  } catch (error) {
    console.error('❌ Error in /produce endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Legacy REST API endpoint for logging events
app.post('/api/log', async (req, res) => {
  try {
    const event = req.body;
    const enrichedEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      session_id: event.session_id || `session-${Date.now()}`,
      user_id: event.user_id || 'anonymous',
      server_timestamp: new Date().toISOString()
    };
    
    if (kafkaConnected) {
      await producer.send({
        topic: 'user_events',
        messages: [{ 
          key: enrichedEvent.user_id,
          value: JSON.stringify(enrichedEvent) 
        }]
      });
    } else {
      console.log('⚠️ Kafka not available, event logged but not sent to Kafka');
    }
    
    res.json({ success: true, event_type: enrichedEvent.event_type });
  } catch (error) {
    console.error('❌ Error in REST API:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    console.log('🔄 Initializing server...');
    console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
    console.log('🔧 Port:', PORT);
    
    await initializeKafka();
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on 0.0.0.0:${PORT}`);
      console.log(`📊 Health check: https://neo-analytics-backend.fly.dev/health`);
      console.log(`🔌 Socket.IO endpoint: https://neo-analytics-backend.fly.dev/`);
      console.log(`📡 Event ingestion: POST https://neo-analytics-backend.fly.dev/produce`);
      console.log(`🎵 Ready to receive events`);
      if (!kafkaConnected) {
        console.log(`⚠️ Kafka not available - HTTP endpoints work, but events won't be streamed`);
      }
      console.log('✅ Server startup complete');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  try {
    if (kafkaConnected) {
      await consumer.disconnect();
      await producer.disconnect();
    }
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

startServer(); 