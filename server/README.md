# 📡 Neo Analytics Backend

A Kafka-powered analytics relay server that ingests events via HTTP and streams them in real-time via WebSocket.

## 🏗️ Architecture

```
Frontend App → HTTP POST /produce → Kafka → WebSocket → Dashboard
```

### Components

1. **Event Ingestion API** (`POST /produce`)
   - Accepts JSON events via HTTP
   - Validates required fields
   - Enriches with metadata
   - Produces to Kafka topic `user_events`

2. **Kafka Consumer → WebSocket Relay**
   - Consumes from `user_events` topic
   - Broadcasts events to connected dashboards
   - Real-time streaming via Socket.IO

3. **WebSocket Server**
   - Handles dashboard connections
   - Broadcasts Kafka events to clients
   - Supports legacy music player events

## 🚀 Quick Start

### Prerequisites

1. **Start Kafka** (using Docker Compose):
   ```bash
   cd ../
   docker-compose up -d
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Setup Kafka Topic**:
   ```bash
   npm run setup
   ```

4. **Start Server**:
   ```bash
   npm run dev
   ```

## 📡 API Endpoints

### `POST /produce`

Main event ingestion endpoint.

**Request Body:**
```json
{
  "eventType": "like_clicked",
  "userId": "user-123",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "screen": "main_post"
}
```

**Response:**
```json
{
  "success": true,
  "eventType": "like_clicked",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "connected_clients": 5,
  "dashboard_clients": 2
}
```

### `POST /api/log` (Legacy)

Legacy endpoint for music player events.

## 🔌 WebSocket Events

### Client → Server

- `log_event` - Log a music player event (legacy)
- `join_dashboard` - Join dashboard room

### Server → Client

- `new_event` - New event from Kafka
- `event_logged` - Event logging confirmation
- `dashboard_joined` - Dashboard join confirmation

## 🧪 Testing

### Test the API:
```bash
npm run test
```

### Manual Testing:
```bash
# Test /produce endpoint
curl -X POST http://localhost:3001/produce \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "test_event",
    "userId": "test-user",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }'

# Check health
curl http://localhost:3001/health
```

## 📊 Kafka Topics

- **`user_events`** - Main event stream
  - Partitions: 1
  - Replication: 1
  - Retention: 7 days
  - Key: `userId`

## 🔧 Configuration

### Environment Variables

- `PORT` - Server port (default: 3001)
- `KAFKA_BROKERS` - Kafka broker list (default: localhost:9092)

### Kafka Configuration

- Client ID: `neo-analytics-server`
- Consumer Group: `dashboard-consumer`
- Topic: `user_events`

## 🛠️ Development

### Scripts

- `npm run dev` - Start with nodemon
- `npm run start` - Start production server
- `npm run test` - Run API tests
- `npm run setup` - Setup Kafka topics

### File Structure

```
server/
├── socketServer.js      # Main server
├── setup-kafka.js      # Kafka topic setup
├── test-produce.js     # API tests
├── package.json        # Dependencies
└── README.md          # This file
```

## 🔍 Monitoring

### Logs

The server provides detailed logging:

- `📝 Producing event:` - Event ingestion
- `📨 Received Kafka message:` - Kafka consumption
- `🔌 New client connected:` - WebSocket connections
- `📊 Dashboard client joined:` - Dashboard connections

### Health Check

Monitor server health via `/health` endpoint.

## 🚨 Error Handling

- **Validation Errors**: 400 Bad Request for invalid events
- **Kafka Errors**: 500 Internal Server Error
- **WebSocket Errors**: Graceful disconnection handling

## 🔄 Graceful Shutdown

The server handles SIGINT gracefully:

1. Disconnect Kafka consumer/producer
2. Close HTTP server
3. Exit process

## 📈 Performance

- **Concurrent Connections**: Handles multiple dashboard clients
- **Event Throughput**: Optimized for real-time streaming
- **Memory Usage**: Minimal overhead for event relay

## 🔐 Security

- **CORS**: Configured for local development
- **Helmet**: Security headers enabled
- **Input Validation**: Event structure validation
- **Error Sanitization**: No sensitive data in error responses 