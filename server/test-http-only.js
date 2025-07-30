const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testHealthEndpoint() {
  try {
    console.log('🏥 Testing /health endpoint...');
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testProduceEndpoint() {
  try {
    console.log('🧪 Testing /produce endpoint...');
    
    // Test 1: Basic event
    const event1 = {
      eventType: 'like_clicked',
      userId: 'user-123',
      timestamp: new Date().toISOString(),
      screen: 'main_post'
    };
    
    console.log('📤 Sending event 1:', event1.eventType);
    const response1 = await axios.post(`${BASE_URL}/produce`, event1);
    console.log('✅ Response 1:', response1.data);
    
    // Test 2: Event with additional context
    const event2 = {
      eventType: 'page_view',
      userId: 'user-456',
      timestamp: new Date().toISOString(),
      page: '/dashboard',
      referrer: 'https://google.com',
      userAgent: 'Mozilla/5.0...'
    };
    
    console.log('📤 Sending event 2:', event2.eventType);
    const response2 = await axios.post(`${BASE_URL}/produce`, event2);
    console.log('✅ Response 2:', response2.data);
    
    // Test 3: Invalid event (missing eventType)
    try {
      const invalidEvent = {
        userId: 'user-789',
        timestamp: new Date().toISOString()
      };
      
      console.log('📤 Sending invalid event (missing eventType)');
      await axios.post(`${BASE_URL}/produce`, invalidEvent);
    } catch (error) {
      console.log('✅ Correctly rejected invalid event:', error.response.data);
    }
    
    console.log('🎉 All HTTP tests completed!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting HTTP-only tests...\n');
  
  const healthOk = await testHealthEndpoint();
  console.log('');
  
  if (healthOk) {
    await testProduceEndpoint();
  } else {
    console.log('⚠️ Skipping /produce tests since server is not healthy');
  }
  
  console.log('\n✨ Tests completed!');
}

runTests(); 