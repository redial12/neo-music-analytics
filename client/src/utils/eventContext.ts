import { PlayContext, ScrubContext, SkipContext, VolumeContext, EngagementContext } from './socket';

class EventContextManager {
  private sessionStartTime: number = Date.now();
  private lastPlayTime: number = 0;
  private lastTrackId: string = '';
  private trackStartTime: number = 0;
  private lastVolume: number = 0.7;
  private likeStartTime: number = 0;
  private isCurrentlyPlaying: boolean = false;

  // Track when a track starts playing
  trackStarted(trackId: string) {
    this.lastTrackId = trackId;
    this.trackStartTime = Date.now();
    this.isCurrentlyPlaying = true;
  }

  // Track when a track stops playing
  trackStopped() {
    this.isCurrentlyPlaying = false;
  }

  // Calculate play context
  getPlayContext(trackId: string, isAutoplay: boolean = false, source: 'manual' | 'autoplay' | 'skip' | 'replay' = 'manual'): PlayContext {
    const now = Date.now();
    const timeSinceLastPlay = this.lastPlayTime > 0 ? (now - this.lastPlayTime) / 1000 : 0;
    
    this.lastPlayTime = now;
    
    return {
      previous_track_id: this.lastTrackId !== trackId ? this.lastTrackId : undefined,
      time_since_last_play: timeSinceLastPlay,
      is_autoplay: isAutoplay,
      source
    };
  }

  // Calculate scrub context
  getScrubContext(fromTime: number, toTime: number): ScrubContext {
    const direction = toTime > fromTime ? 'forward' : 'backward';
    const distance = Math.abs(toTime - fromTime);
    
    return {
      scrub_direction: direction,
      scrub_distance: distance,
      was_playing_before_scrub: this.isCurrentlyPlaying
    };
  }

  // Calculate skip context
  getSkipContext(direction: 'next' | 'prev', reason: 'user_initiated' | 'track_ended' | 'error' = 'user_initiated'): SkipContext {
    const now = Date.now();
    const timeListened = this.trackStartTime > 0 ? (now - this.trackStartTime) / 1000 : 0;
    
    return {
      skip_direction: direction,
      time_listened_before_skip: timeListened,
      skip_reason: reason
    };
  }

  // Calculate volume context
  getVolumeContext(newVolume: number): VolumeContext {
    const changeAmount = newVolume - this.lastVolume;
    const isMuteAction = newVolume === 0 || this.lastVolume === 0;
    
    this.lastVolume = newVolume;
    
    return {
      previous_volume: this.lastVolume,
      volume_change_amount: changeAmount,
      is_mute_action: isMuteAction
    };
  }

  // Start tracking like engagement
  startLikeTracking() {
    this.likeStartTime = Date.now();
  }

  // Calculate engagement context
  getEngagementContext(): EngagementContext {
    const now = Date.now();
    const timeToLike = this.likeStartTime > 0 ? (now - this.likeStartTime) / 1000 : 0;
    
    return {
      time_to_like: timeToLike
    };
  }

  // Reset like tracking
  resetLikeTracking() {
    this.likeStartTime = 0;
  }

  // Get session duration
  getSessionDuration(): number {
    return (Date.now() - this.sessionStartTime) / 1000;
  }
}

export const eventContextManager = new EventContextManager(); 