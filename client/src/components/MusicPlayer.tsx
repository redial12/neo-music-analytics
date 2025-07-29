import { useState, useRef, useEffect } from 'react';
import { logEvent } from '../utils/socket';
import { eventContextManager } from '../utils/eventContext';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Heart, 
  Plus,
  Volume2,
  VolumeX,
  RotateCcw,
  FileText,
  User,
  Music
} from 'lucide-react';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  albumArt: string;
}

const SAMPLE_TRACKS: Track[] = [
  {
    id: 'track-001',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    duration: 354,
    albumArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop&crop=center'
  },
  {
    id: 'track-002',
    title: 'Hotel California',
    artist: 'Eagles',
    album: 'Hotel California',
    duration: 391,
    albumArt: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200&h=200&fit=crop&crop=center'
  },
  {
    id: 'track-003',
    title: 'Stairway to Heaven',
    artist: 'Led Zeppelin',
    album: 'Led Zeppelin IV',
    duration: 482,
    albumArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop&crop=center'
  }
];

const MusicPlayer: React.FC = () => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [lastVolume, setLastVolume] = useState(0.7);
  const [isLiked, setIsLiked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekStartTime, setSeekStartTime] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [isInPlaylist, setIsInPlaylist] = useState(false);
  const [username, setUsername] = useState(`user-${Math.random().toString(36).substr(2, 9)}`);
  const [showUsernameInput, setShowUsernameInput] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTrack = SAMPLE_TRACKS[currentTrackIndex];

  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle play/pause
  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      eventContextManager.trackStopped();
      logEvent({
        event_type: 'pause',
        track_id: currentTrack.id,
        position: currentTime,
        duration: currentTrack.duration,
        user_id: username
      });
    } else {
      setIsPlaying(true);
      eventContextManager.trackStarted(currentTrack.id);
      logEvent({
        event_type: 'play',
        track_id: currentTrack.id,
        position: currentTime,
        duration: currentTrack.duration,
        user_id: username,
        play_context: eventContextManager.getPlayContext(currentTrack.id, false, 'manual')
      });
    }
  };

  // Handle skip
  const handleSkip = (direction: 'next' | 'prev') => {
    const currentIndex = currentTrackIndex;
    let newIndex: number;
    
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % SAMPLE_TRACKS.length;
    } else {
      newIndex = currentIndex === 0 ? SAMPLE_TRACKS.length - 1 : currentIndex - 1;
    }
    
    setCurrentTrackIndex(newIndex);
    setCurrentTime(0);
    setIsLiked(false);
    setIsInPlaylist(false);
    
    // Log skip event
    logEvent({
      event_type: 'skip',
      track_id: currentTrack.id,
      position: currentTime,
      duration: currentTrack.duration,
      user_id: username,
      skip_context: eventContextManager.getSkipContext(direction, 'user_initiated')
    });
    
    // If currently playing, start playing the new track
    if (isPlaying) {
      eventContextManager.trackStarted(SAMPLE_TRACKS[newIndex].id);
      logEvent({
        event_type: 'play',
        track_id: SAMPLE_TRACKS[newIndex].id,
        position: 0,
        duration: SAMPLE_TRACKS[newIndex].duration,
        user_id: username,
        play_context: eventContextManager.getPlayContext(SAMPLE_TRACKS[newIndex].id, false, 'skip')
      });
    }
  };

  // Handle replay/restart
  const handleReplay = () => {
    if (currentTime > 5) {
      // Restart current song
      setCurrentTime(0);
      logEvent({
        event_type: 'replay',
        track_id: currentTrack.id,
        position: currentTime,
        duration: currentTrack.duration,
        user_id: username
      });
      eventContextManager.trackStarted(currentTrack.id);
      logEvent({
        event_type: 'play',
        track_id: currentTrack.id,
        position: 0,
        duration: currentTrack.duration,
        user_id: username,
        play_context: eventContextManager.getPlayContext(currentTrack.id, false, 'replay')
      });
    } else {
      // Go to previous track
      handleSkip('prev');
    }
  };

  // Handle seek start
  const handleSeekStart = () => {
    setIsSeeking(true);
    setSeekStartTime(currentTime);
  };

  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(Number(e.target.value));
  };

  // Handle seek end
  const handleSeekEnd = () => {
    if (isSeeking) {
      const seekDistance = Math.abs(currentTime - seekStartTime);
      if (seekDistance > 1) {
        logEvent({
          event_type: 'scrub',
          track_id: currentTrack.id,
          from_timestamp: seekStartTime,
          to_timestamp: currentTime,
          user_id: username,
          scrub_context: eventContextManager.getScrubContext(seekStartTime, currentTime)
        });
      }
      setIsSeeking(false);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  // Handle volume end
  const handleVolumeEnd = () => {
    const volumeChange = Math.abs(volume - lastVolume);
    if (volumeChange > 0.05) {
      logEvent({
        event_type: 'volume_change',
        track_id: currentTrack.id,
        position: currentTime,
        duration: currentTrack.duration,
        volume: volume,
        user_id: username,
        volume_context: eventContextManager.getVolumeContext(volume)
      });
      setLastVolume(volume);
    }
  };

  // Handle mute toggle
  const handleMuteToggle = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(lastVolume);
      logEvent({
        event_type: 'volume_change',
        track_id: currentTrack.id,
        position: currentTime,
        duration: currentTrack.duration,
        volume: lastVolume,
        user_id: username,
        volume_context: eventContextManager.getVolumeContext(lastVolume)
      });
    } else {
      setIsMuted(true);
      setLastVolume(volume);
      logEvent({
        event_type: 'volume_change',
        track_id: currentTrack.id,
        position: currentTime,
        duration: currentTrack.duration,
        volume: 0,
        user_id: username,
        volume_context: eventContextManager.getVolumeContext(0)
      });
    }
  };

  // Handle like
  const handleLike = () => {
    if (!isLiked) {
      eventContextManager.startLikeTracking();
    }
    
    setIsLiked(!isLiked);
    logEvent({
      event_type: isLiked ? 'unlike' : 'like',
      track_id: currentTrack.id,
      position: currentTime,
      duration: currentTrack.duration,
      liked: !isLiked,
      user_id: username,
      engagement_context: eventContextManager.getEngagementContext()
    });
    
    if (!isLiked) {
      eventContextManager.resetLikeTracking();
    }
  };

  // Handle add to playlist
  const handleAddToPlaylist = () => {
    setIsInPlaylist(!isInPlaylist);
    logEvent({
      event_type: isInPlaylist ? 'remove_from_playlist' : 'add_to_playlist',
      track_id: currentTrack.id,
      position: currentTime,
      duration: currentTrack.duration,
      in_playlist: !isInPlaylist,
      user_id: username
    });
  };

  // Handle loop toggle
  const handleLoopToggle = () => {
    setIsLooping(!isLooping);
  };

  // Handle view lyrics
  const handleViewLyrics = () => {
    logEvent({
      event_type: 'view_lyrics',
      track_id: currentTrack.id,
      position: currentTime,
      duration: currentTrack.duration,
      user_id: username
    });
  };

  // Handle view artist
  const handleViewArtist = () => {
    logEvent({
      event_type: 'view_artist',
      track_id: currentTrack.id,
      position: currentTime,
      duration: currentTrack.duration,
      user_id: username
    });
  };

  // Update current time and handle track end
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && audioRef.current) {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          if (newTime >= currentTrack.duration) {
            if (isLooping) {
              // Loop the same track - log as replay instead of play
              setCurrentTime(0);
              logEvent({
                event_type: 'replay',
                track_id: currentTrack.id,
                position: currentTrack.duration,
                duration: currentTrack.duration,
                user_id: username
              });
              eventContextManager.trackStarted(currentTrack.id);
              logEvent({
                event_type: 'play',
                track_id: currentTrack.id,
                position: 0,
                duration: currentTrack.duration,
                user_id: username,
                play_context: eventContextManager.getPlayContext(currentTrack.id, true, 'replay')
              });
              return 0;
            } else {
              // Track ended, auto-play next track
              setIsPlaying(false);
              setCurrentTime(0);
              eventContextManager.trackStopped();
              
              // Log end of current track
              logEvent({
                event_type: 'pause',
                track_id: currentTrack.id,
                position: currentTrack.duration,
                duration: currentTrack.duration,
                user_id: username
              });
              
              // Auto-play next track
              const nextIndex = (currentTrackIndex + 1) % SAMPLE_TRACKS.length;
              setCurrentTrackIndex(nextIndex);
              setIsLiked(false);
              setIsInPlaylist(false);
              
              // Start playing next track after a short delay
              setTimeout(() => {
                setIsPlaying(true);
                eventContextManager.trackStarted(SAMPLE_TRACKS[nextIndex].id);
                logEvent({
                  event_type: 'play',
                  track_id: SAMPLE_TRACKS[nextIndex].id,
                  position: 0,
                  duration: SAMPLE_TRACKS[nextIndex].duration,
                  user_id: username,
                  play_context: eventContextManager.getPlayContext(SAMPLE_TRACKS[nextIndex].id, true, 'autoplay')
                });
              }, 1000);
              
              return 0;
            }
          }
          return newTime;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack.duration, currentTrackIndex, currentTrack.id, isLooping, username]);

  return (
    <div className="relative min-h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Main Content */}
      <div className="relative z-10 p-8 flex flex-col h-full">
        {/* Header with Username */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-gray-700 rounded-xl border border-gray-600">
              <Music className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-100">
                Neo Music
              </h1>
              <p className="text-gray-400 text-sm">Real-time analytics demo</p>
            </div>
          </div>
          
          {/* Username Display/Input */}
          <div className="flex justify-center">
            {showUsernameInput ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => setShowUsernameInput(false)}
                  onKeyPress={(e) => e.key === 'Enter' && setShowUsernameInput(false)}
                  className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter username"
                  autoFocus
                />
              </div>
            ) : (
              <button
                onClick={() => setShowUsernameInput(true)}
                className="text-gray-300 hover:text-gray-100 transition-colors flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-800"
              >
                <User size={16} />
                <span className="font-medium">{username}</span>
              </button>
            )}
          </div>
        </div>

        {/* Album Art with Side Buttons */}
        <div className="flex justify-center items-center mb-8">
          <button
            onClick={handleViewArtist}
            className="p-4 text-gray-400 hover:text-blue-400 transition-colors mr-6 hover:bg-gray-800 rounded-full"
            title="View Artist"
          >
            <User size={24} />
          </button>
          
          <div className="relative group">
            <div className="absolute inset-0 bg-gray-700 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <img 
              src={currentTrack.albumArt} 
              alt={currentTrack.album}
              className="relative w-72 h-72 rounded-2xl shadow-2xl object-cover ring-2 ring-gray-600"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center">
                <div className="w-20 h-20 bg-gray-800/80 rounded-full flex items-center justify-center">
                  <div className="w-3 h-10 bg-gray-300 rounded-full mx-1 animate-pulse"></div>
                  <div className="w-3 h-10 bg-gray-300 rounded-full mx-1 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-3 h-10 bg-gray-300 rounded-full mx-1 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={handleViewLyrics}
            className="p-4 text-gray-400 hover:text-blue-400 transition-colors ml-6 hover:bg-gray-800 rounded-full"
            title="View Lyrics"
          >
            <FileText size={24} />
          </button>
        </div>

        {/* Track Info */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-2">{currentTrack.title}</h2>
          <p className="text-gray-300 text-lg">{currentTrack.artist}</p>
          <p className="text-gray-400 text-sm">{currentTrack.album}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-300 mb-3">
            <span className="font-medium">{formatTime(currentTime)}</span>
            <span className="font-medium">{formatTime(currentTrack.duration)}</span>
          </div>
          <div className="relative">
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${(currentTime / currentTrack.duration) * 100}%` }}
              ></div>
            </div>
            <input
              type="range"
              min="0"
              max={currentTrack.duration}
              value={currentTime}
              onChange={handleSeek}
              onMouseDown={handleSeekStart}
              onMouseUp={handleSeekEnd}
              onKeyDown={handleSeekStart}
              onKeyUp={handleSeekEnd}
              className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-8 mb-8">
          <button
            onClick={handleReplay}
            className="p-4 text-gray-400 hover:text-gray-200 transition-colors hover:bg-gray-800 rounded-full"
            title={currentTime > 5 ? "Restart Song" : "Previous Track"}
          >
            <SkipBack size={28} />
          </button>
          
          <button
            onClick={handlePlayPause}
            className="p-6 bg-blue-500 hover:bg-blue-600 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {isPlaying ? <Pause size={36} className="text-white" /> : <Play size={36} className="text-white ml-1" />}
          </button>
          
          <button
            onClick={() => handleSkip('next')}
            className="p-4 text-gray-400 hover:text-gray-200 transition-colors hover:bg-gray-800 rounded-full"
          >
            <SkipForward size={28} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-6 mb-8">
          <button
            onClick={handleLike}
            className={`p-4 rounded-full transition-all duration-300 ${
              isLiked 
                ? 'bg-red-500 text-white shadow-lg' 
                : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700 hover:scale-105'
            }`}
          >
            <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
          
          <button
            onClick={handleAddToPlaylist}
            className={`p-4 rounded-full transition-all duration-300 ${
              isInPlaylist 
                ? 'bg-green-500 text-white shadow-lg' 
                : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700 hover:scale-105'
            }`}
          >
            <Plus size={24} />
          </button>
          
          <button
            onClick={handleLoopToggle}
            className={`p-4 rounded-full transition-all duration-300 ${
              isLooping 
                ? 'bg-blue-500 text-white shadow-lg' 
                : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700 hover:scale-105'
            }`}
            title="Loop Track"
          >
            <RotateCcw size={24} />
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={handleMuteToggle}
            className="text-gray-400 hover:text-gray-200 transition-colors p-2 hover:bg-gray-800 rounded-full"
          >
            {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          
          <div className="relative w-40">
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              ></div>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              onMouseUp={handleVolumeEnd}
              onKeyUp={handleVolumeEnd}
              className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Hidden audio element for simulation */}
        <audio ref={audioRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default MusicPlayer; 