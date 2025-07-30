const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'neo-analytics-setup',
  brokers: ['localhost:9092']
});

const admin = kafka.admin();

async function setupKafka() {
  try {
    console.log('🔧 Setting up Kafka...');
    
    await admin.connect();
    console.log('✅ Connected to Kafka');
    
    // Create the user_events topic
    await admin.createTopics({
      topics: [{
        topic: 'user_events',
        numPartitions: 1,
        replicationFactor: 1,
        configEntries: [
          {
            name: 'cleanup.policy',
            value: 'delete'
          },
          {
            name: 'retention.ms',
            value: '604800000' // 7 days
          }
        ]
      }]
    });
    
    console.log('✅ Created topic: user_events');
    
    // List topics to verify
    const topics = await admin.listTopics();
    console.log('📋 Available topics:', topics);
    
    await admin.disconnect();
    console.log('✅ Kafka setup completed');
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️ Topic user_events already exists');
    } else {
      console.error('❌ Kafka setup failed:', error);
    }
  }
}

setupKafka(); 