import { io, Socket } from 'socket.io-client';

// Event-specific context interfaces
export interface PlayContext {
  previous_track_id?: string;
  time_since_last_play: number; // seconds
  is_autoplay: boolean;
  source: 'manual' | 'autoplay' | 'skip' | 'replay';
}

export interface ScrubContext {
  scrub_direction: 'forward' | 'backward';
  scrub_distance: number; // seconds
  was_playing_before_scrub: boolean;
}

export interface SkipContext {
  skip_direction: 'next' | 'prev';
  time_listened_before_skip: number;
  skip_reason?: 'user_initiated' | 'track_ended' | 'error';
}

export interface VolumeContext {
  previous_volume: number;
  volume_change_amount: number;
  is_mute_action: boolean;
}

export interface EngagementContext {
  time_to_like: number; // seconds from play to like
}

export interface AnalyticsEvent {
  timestamp: string;
  session_id: string;
  user_id: string;
  event_type: 'play' | 'pause' | 'scrub' | 'skip' | 'replay' | 'like' | 'unlike' | 'add_to_playlist' | 'remove_from_playlist' | 'volume_change' | 'view_lyrics' | 'view_artist';
  track_id: string;
  from_timestamp?: number;
  to_timestamp?: number;
  volume?: number;
  duration?: number;
  position?: number;
  liked?: boolean;
  in_playlist?: boolean;
  
  // Event-specific context
  play_context?: PlayContext;
  scrub_context?: ScrubContext;
  skip_context?: SkipContext;
  volume_context?: VolumeContext;
  engagement_context?: EngagementContext;
  
  [key: string]: any;
}

class SocketManager {
  private socket: Socket | null = null;
  private isConnected = false;

  connect() {
    if (this.socket) return;

    // Use environment-based URL for production deployment  
    const socketUrl = "https://neo-analytics-backend.fly.dev/socket.io/"; // Add explicit path

    this.socket = io(socketUrl, {
      transports: ['websocket','polling'], // ONLY use polling for now
      timeout: 20000
    });

    console.log('🔄 Attempting to connect to:', socketUrl);
    
    this.socket.on('connect', () => {
      console.log('🔌 Connected to server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('❌ Connection error:', error);
      console.error('❌ Error details:', error.message, error.type);
      this.isConnected = false;
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  logEvent(event: Omit<AnalyticsEvent, 'timestamp' | 'session_id' | 'user_id'>) {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ Socket not connected, cannot log event');
      return;
    }

    const enrichedEvent: AnalyticsEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      session_id: this.getSessionId(),
      user_id: event.user_id || this.getUserId(),
    } as AnalyticsEvent;

    console.log('📝 Logging event:', enrichedEvent.event_type);
    this.socket.emit('log_event', enrichedEvent);
  }

  joinDashboard() {
    console.log('🔍 Attempting to join dashboard...');
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ Socket not connected, cannot join dashboard');
      return;
    }

    console.log('📊 Emitting join_dashboard event');
    this.socket.emit('join_dashboard');
  }

  onNewEvent(callback: (event: AnalyticsEvent) => void) {
    if (!this.socket) return;
    this.socket.on('new_event', callback);
  }

  onEventLogged(callback: (response: { success: boolean; event_type?: string; error?: string }) => void) {
    if (!this.socket) return;
    this.socket.on('event_logged', callback);
  }

  onDashboardJoined(callback: (response: { success: boolean }) => void) {
    if (!this.socket) return;
    this.socket.on('dashboard_joined', callback);
  }

  private getSessionId(): string {
    let sessionId = localStorage.getItem('neo_analytics_session_id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('neo_analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private getUserId(): string {
    let userId = localStorage.getItem('neo_analytics_user_id');
    if (!userId) {
      userId = `user-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('neo_analytics_user_id', userId);
    }
    return userId;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const socketManager = new SocketManager();

// Export bound methods to preserve 'this' context
export const logEvent = socketManager.logEvent.bind(socketManager);
export const connect = socketManager.connect.bind(socketManager);
export const disconnect = socketManager.disconnect.bind(socketManager);
export const joinDashboard = socketManager.joinDashboard.bind(socketManager);
export const onNewEvent = socketManager.onNewEvent.bind(socketManager);
export const onEventLogged = socketManager.onEventLogged.bind(socketManager);
export const onDashboardJoined = socketManager.onDashboardJoined.bind(socketManager);
export const getConnectionStatus = socketManager.getConnectionStatus.bind(socketManager); 