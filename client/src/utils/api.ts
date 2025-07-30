const API_BASE_URL = 'https://neo-analytics-backend.fly.dev';

export interface ProduceEvent {
  eventType: string;
  userId?: string;
  timestamp?: string;
  [key: string]: any;
}

// Import AnalyticsEvent type from socket.ts
import type { AnalyticsEvent } from './socket';

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

// Convert AnalyticsEvent to ProduceEvent format and send via HTTP
export async function logMusicEvent(event: Omit<AnalyticsEvent, 'timestamp' | 'session_id' | 'user_id'> & { user_id?: string }): Promise<ProduceResponse> {
  try {
    // Generate session ID for this request
    let sessionId = localStorage.getItem('neo_analytics_session_id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('neo_analytics_session_id', sessionId);
    }

    // Generate user ID if not provided
    let userId = event.user_id;
    if (!userId) {
      const storedUserId = localStorage.getItem('neo_analytics_user_id');
      if (storedUserId) {
        userId = storedUserId;
      } else {
        userId = `user-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('neo_analytics_user_id', userId);
      }
    }

    // Convert to ProduceEvent format
    const eventData: ProduceEvent = {
      eventType: event.event_type,
      userId: userId,
      timestamp: new Date().toISOString(),
      sessionId: sessionId,
      trackId: event.track_id,
      fromTimestamp: event.from_timestamp,
      toTimestamp: event.to_timestamp,
      volume: event.volume,
      duration: event.duration,
      position: event.position,
      liked: event.liked,
      inPlaylist: event.in_playlist,
      // Include context objects
      playContext: event.play_context,
      scrubContext: event.scrub_context,
      skipContext: event.skip_context,
      volumeContext: event.volume_context,
      engagementContext: event.engagement_context
    };

    console.log('📝 Logging music event via HTTP:', event.event_type);
    
    const result = await produceEvent(eventData);
    console.log('✅ Music event logged successfully');
    return result;
  } catch (error) {
    console.error('❌ Error logging music event:', error);
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