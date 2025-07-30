const API_BASE_URL = 'http://localhost:3001';

export interface ProduceEvent {
  eventType: string;
  userId?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface ProduceResponse {
  success: boolean;
  eventType?: string;
  timestamp?: string;
  error?: string;
}

export async function produceEvent(event: ProduceEvent): Promise<ProduceResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/produce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to produce event');
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error producing event:', error);
    throw error;
  }
}

export async function checkHealth(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return await response.json();
  } catch (error) {
    console.error('❌ Health check failed:', error);
    throw error;
  }
}

// Test function to send sample events
export async function sendTestEvents() {
  const events = [
    {
      eventType: 'button_clicked',
      userId: 'test-user-1',
      buttonId: 'like-button',
      screen: 'music-player'
    },
    {
      eventType: 'page_view',
      userId: 'test-user-2',
      page: '/dashboard',
      referrer: 'https://google.com'
    },
    {
      eventType: 'form_submitted',
      userId: 'test-user-3',
      formId: 'contact-form',
      fields: ['name', 'email']
    }
  ];

  console.log('🧪 Sending test events...');
  
  for (const event of events) {
    try {
      const result = await produceEvent(event);
      console.log(`✅ Event sent: ${event.eventType}`, result);
    } catch (error) {
      console.error(`❌ Failed to send event: ${event.eventType}`, error);
    }
  }
} 