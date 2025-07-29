import { } from 'react';
import { AnalyticsEvent } from '../utils/socket';
import { EVENT_COLORS } from '../utils/colors';
import { 
  User, 
  Music, 
  Activity,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Move,
  Heart,
  HeartOff,
  Plus,
  Minus,
  Volume2,
  VolumeX,
  FileText,
  User as UserIcon,
  Clock,
  Zap
} from 'lucide-react';

interface EventFeedProps {
  events: AnalyticsEvent[];
}

const EventFeed: React.FC<EventFeedProps> = ({ events }) => {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'play':
        return <Play className="w-4 h-4" />;
      case 'pause':
        return <Pause className="w-4 h-4" />;
      case 'skip':
        return <SkipForward className="w-4 h-4" />;
      case 'replay':
        return <RotateCcw className="w-4 h-4" />;
      case 'scrub':
        return <Move className="w-4 h-4" />;
      case 'like':
        return <Heart className="w-4 h-4" />;
      case 'unlike':
        return <HeartOff className="w-4 h-4" />;
      case 'add_to_playlist':
        return <Plus className="w-4 h-4" />;
      case 'remove_from_playlist':
        return <Minus className="w-4 h-4" />;
      case 'volume_change':
        return <Volume2 className="w-4 h-4" />;
      case 'view_lyrics':
        return <FileText className="w-4 h-4" />;
      case 'view_artist':
        return <UserIcon className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
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
    <div className="h-full">
      {events.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No events yet</p>
            <p className="text-sm text-gray-500">Interact with the music player to see events</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event, index) => (
            <div
              key={`${event.timestamp}-${index}`}
              className="bg-gray-700 border border-gray-600 rounded-lg p-4 hover:bg-gray-650 hover:border-gray-500 transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="p-2 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${getEventColor(event.event_type)}20` }}
                  >
                    <div style={{ color: getEventColor(event.event_type) }}>
                      {getEventIcon(event.event_type)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span 
                        className="font-semibold text-sm uppercase tracking-wide"
                        style={{ color: getEventColor(event.event_type) }}
                      >
                        {event.event_type}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300">
                      <div className="flex items-center space-x-6">
                        <span className="flex items-center space-x-2">
                          <Music className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{event.track_id}</span>
                        </span>
                        <span className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{event.user_id}</span>
                        </span>
                        {event.position !== undefined && (
                          <span className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>Position: {formatTime(event.position)}</span>
                          </span>
                        )}
                        {event.volume !== undefined && (
                          <span className="flex items-center space-x-2">
                            <Volume2 className="w-4 h-4 text-gray-400" />
                            <span>Volume: {Math.round(event.volume * 100)}%</span>
                          </span>
                        )}
                        {event.from_timestamp !== undefined && event.to_timestamp !== undefined && (
                          <span className="flex items-center space-x-2">
                            <Move className="w-4 h-4 text-gray-400" />
                            <span>Scrub: {formatTime(event.from_timestamp)} → {formatTime(event.to_timestamp)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(event.timestamp)}</span>
                  </div>
                </div>
              </div>
              
              {/* Enhanced context details - Right side layout */}
              {(event.play_context || event.scrub_context || event.skip_context || event.volume_context || event.engagement_context) && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  {event.play_context && (
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span className="font-medium text-blue-400">🎵 Play:</span>
                      <span>Time since last: {event.play_context.time_since_last_play.toFixed(1)}s</span>
                      <span>Source: {event.play_context.source}</span>
                      <span>Autoplay: {event.play_context.is_autoplay ? 'Yes' : 'No'}</span>
                      {event.play_context.previous_track_id && (
                        <span>Previous: {event.play_context.previous_track_id}</span>
                      )}
                    </div>
                  )}
                  
                  {event.scrub_context && (
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span className="font-medium text-orange-400">⏩ Scrub:</span>
                      <span>Direction: {event.scrub_context.scrub_direction}</span>
                      <span>Distance: {event.scrub_context.scrub_distance.toFixed(1)}s</span>
                      <span>Was playing: {event.scrub_context.was_playing_before_scrub ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                  
                  {event.skip_context && (
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span className="font-medium text-purple-400">⏭ Skip:</span>
                      <span>Direction: {event.skip_context.skip_direction}</span>
                      <span>Time listened: {event.skip_context.time_listened_before_skip.toFixed(1)}s</span>
                      <span>Reason: {event.skip_context.skip_reason}</span>
                    </div>
                  )}
                  
                  {event.volume_context && (
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span className="font-medium text-green-400">🔊 Volume:</span>
                      <span>Previous: {Math.round(event.volume_context.previous_volume * 100)}%</span>
                      <span>Change: {event.volume_context.volume_change_amount > 0 ? '+' : ''}{Math.round(event.volume_context.volume_change_amount * 100)}%</span>
                      <span>Mute: {event.volume_context.is_mute_action ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                  
                  {event.engagement_context && (
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span className="font-medium text-pink-400">❤️ Engagement:</span>
                      <span>Time to like: {event.engagement_context.time_to_like.toFixed(1)}s</span>
                    </div>
                  )}
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