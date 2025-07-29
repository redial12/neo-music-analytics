import { } from 'react';
import { AnalyticsEvent } from '../utils/socket';
import { EVENT_COLORS } from '../utils/colors';
import { User, Music, Activity } from 'lucide-react';

interface EventFeedProps {
  events: AnalyticsEvent[];
}

const EventFeed: React.FC<EventFeedProps> = ({ events }) => {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'play':
        return '▶️';
      case 'pause':
        return '⏸️';
      case 'skip':
        return '⏭️';
      case 'replay':
        return '🔄';
      case 'scrub':
        return '⏩';
      case 'like':
        return '❤️';
      case 'unlike':
        return '🤍';
      case 'add_to_playlist':
        return '➕';
      case 'remove_from_playlist':
        return '➖';
      case 'volume_change':
        return '🔊';
      case 'view_lyrics':
        return '📄';
      case 'view_artist':
        return '👤';
      default:
        return '📝';
    }
  };

  const getEventColor = (eventType: string) => {
    return EVENT_COLORS[eventType] || '#8884d8';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full overflow-y-auto">
      {events.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No events yet</p>
            <p className="text-sm">Interact with the music player to see events</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event, index) => (
            <div
              key={`${event.timestamp}-${index}`}
              className="bg-background border rounded-lg p-3 hover:bg-accent transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getEventIcon(event.event_type)}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span 
                        className="font-medium"
                        style={{ color: getEventColor(event.event_type) }}
                      >
                        {event.event_type}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <Music className="w-3 h-3" />
                          <span>{event.track_id}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{event.user_id}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <span>{formatTimestamp(event.timestamp)}</span>
                  </div>
                </div>
              </div>
              
              {/* Event details */}
              {event.from_timestamp !== undefined && event.to_timestamp !== undefined && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Scrub: {formatTime(event.from_timestamp)} → {formatTime(event.to_timestamp)}
                </div>
              )}
              
              {event.volume !== undefined && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Volume: {Math.round(event.volume * 100)}%
                </div>
              )}
              
              {event.position !== undefined && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Position: {formatTime(event.position)}
                </div>
              )}

              {/* Enhanced context details */}
              {event.play_context && (
                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                  <div>🎵 Play Context:</div>
                  <div className="ml-2">
                    {event.play_context.previous_track_id && (
                      <div>Previous: {event.play_context.previous_track_id}</div>
                    )}
                    <div>Time since last play: {event.play_context.time_since_last_play.toFixed(1)}s</div>
                    <div>Source: {event.play_context.source}</div>
                    <div>Autoplay: {event.play_context.is_autoplay ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              )}

              {event.scrub_context && (
                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                  <div>⏩ Scrub Context:</div>
                  <div className="ml-2">
                    <div>Direction: {event.scrub_context.scrub_direction}</div>
                    <div>Distance: {event.scrub_context.scrub_distance.toFixed(1)}s</div>
                    <div>Was playing: {event.scrub_context.was_playing_before_scrub ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              )}

              {event.skip_context && (
                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                  <div>⏭ Skip Context:</div>
                  <div className="ml-2">
                    <div>Direction: {event.skip_context.skip_direction}</div>
                    <div>Time listened: {event.skip_context.time_listened_before_skip.toFixed(1)}s</div>
                    <div>Reason: {event.skip_context.skip_reason}</div>
                  </div>
                </div>
              )}

              {event.volume_context && (
                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                  <div>🔊 Volume Context:</div>
                  <div className="ml-2">
                    <div>Previous: {Math.round(event.volume_context.previous_volume * 100)}%</div>
                    <div>Change: {event.volume_context.volume_change_amount > 0 ? '+' : ''}{Math.round(event.volume_context.volume_change_amount * 100)}%</div>
                    <div>Mute action: {event.volume_context.is_mute_action ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              )}

              {event.engagement_context && (
                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                  <div>❤️ Engagement Context:</div>
                  <div className="ml-2">
                    <div>Time to like: {event.engagement_context.time_to_like.toFixed(1)}s</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventFeed; 