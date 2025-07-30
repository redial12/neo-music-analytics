const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { Kafka } = require('kafkajs');
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

// Kafka setup
const kafka = new Kafka({
  clientId: 'neo-analytics-server',
  brokers: ['localhost:9092']
});

const { Partitioners } = require('kafkajs');

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner
});
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
          
          // Broadcast to all dashboard clients
          io.to('dashboard').emit('new_event', data);
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
    await initializeKafka();
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}/health`);
      console.log(`📡 Event ingestion: POST http://localhost:${PORT}/produce`);
      console.log(`🎵 Ready to receive events`);
      if (!kafkaConnected) {
        console.log(`⚠️ Kafka not available - HTTP endpoints work, but events won't be streamed`);
      }
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