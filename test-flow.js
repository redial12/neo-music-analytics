const axios = require('axios');

// Test the complete event flow
async function testEventFlow() {
  const serverUrl = 'https://neo-analytics-backend.fly.dev';
  
  console.log('🧪 Testing complete event flow...');
  
  try {
    // 1. Check server health
    console.log('1. Checking server health...');
    const healthResponse = await axios.get(`${serverUrl}/health`);
    console.log('✅ Health check:', healthResponse.data);
    
    // 2. Send a test event via POST /produce
    console.log('2. Sending test event...');
    const testEvent = {
      eventType: 'play',
      userId: 'test-user-123',
      trackId: 'track-001',
      timestamp: new Date().toISOString(),
      position: 0,
      duration: 180
    };
    
    const produceResponse = await axios.post(`${serverUrl}/produce`, testEvent);
    console.log('✅ Event sent:', produceResponse.data);
    
    console.log('🎯 Event should now flow: POST -> Kafka -> Consumer -> WebSocket -> Dashboard');
    console.log('📊 Check the dashboard to see if the event appears in real-time');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testEventFlow();