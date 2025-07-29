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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventFeed; 