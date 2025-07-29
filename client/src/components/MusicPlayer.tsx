import { useState, useRef, useEffect } from 'react';
import { logEvent } from '../utils/socket';
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
  User
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
      logEvent({
        event_type: 'pause',
        track_id: currentTrack.id,
        position: currentTime,
        duration: currentTrack.duration,
        user_id: username
      });
    } else {
      setIsPlaying(true);
      logEvent({
        event_type: 'play',
        track_id: currentTrack.id,
        position: currentTime,
        duration: currentTrack.duration,
        user_id: username
      });
    }
  };

  // Handle skip
  const handleSkip = (direction: 'next' | 'prev') => {
    // Log skip event for the current track that was playing
    logEvent({
      event_type: 'skip',
      track_id: currentTrack.id,
      position: currentTime,
      timestamp: new Date().toISOString(),
      user_id: username
    });

    const newIndex = direction === 'next' 
      ? (currentTrackIndex + 1) % SAMPLE_TRACKS.length
      : (currentTrackIndex - 1 + SAMPLE_TRACKS.length) % SAMPLE_TRACKS.length;
    
    setCurrentTrackIndex(newIndex);
    setCurrentTime(0);
    setIsPlaying(false);
    setIsLiked(false); // Reset like button
    setIsInPlaylist(false); // Reset playlist button

    // Auto-play track after a short delay (for both directions)
    setTimeout(() => {
      setIsPlaying(true);
      logEvent({
        event_type: 'play',
        track_id: SAMPLE_TRACKS[newIndex].id,
        position: 0,
        duration: SAMPLE_TRACKS[newIndex].duration,
        user_id: username
      });
    }, 500);
  };

  // Handle replay (back button after 5 seconds)
  const handleReplay = () => {
    if (currentTime > 5) {
      logEvent({
        event_type: 'replay',
        track_id: currentTrack.id,
        position: currentTime, // Log the position where replay was hit
        duration: currentTrack.duration,
        user_id: username
      });
      setCurrentTime(0);
      setIsPlaying(true);
    } else {
      // Normal skip behavior
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
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  };

  // Handle seek end (when user releases the slider)
  const handleSeekEnd = () => {
    if (isSeeking) {
      const newTime = currentTime;
      const oldTime = seekStartTime;
      
      logEvent({
        event_type: 'scrub',
        track_id: currentTrack.id,
        from_timestamp: oldTime,
        to_timestamp: newTime,
        duration: currentTrack.duration,
        user_id: username
      });
      
      setIsSeeking(false);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Handle volume change end (when user releases the slider)
  const handleVolumeEnd = () => {
    const newVolume = volume;
    
    logEvent({
      event_type: 'volume_change',
      track_id: currentTrack.id,
      volume: newVolume,
      position: currentTime,
      user_id: username
    });
  };

  // Handle mute/unmute
  const handleMuteToggle = () => {
    if (isMuted) {
      // Unmute: restore last volume
      setIsMuted(false);
      setVolume(lastVolume);
      logEvent({
        event_type: 'volume_change',
        track_id: currentTrack.id,
        volume: lastVolume,
        position: currentTime,
        user_id: username
      });
    } else {
      // Mute: save current volume and set to 0
      setLastVolume(volume);
      setIsMuted(true);
      setVolume(0);
      logEvent({
        event_type: 'volume_change',
        track_id: currentTrack.id,
        volume: 0,
        position: currentTime,
        user_id: username
      });
    }
  };

  // Handle like
  const handleLike = () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    logEvent({
      event_type: newLikedState ? 'like' : 'unlike',
      track_id: currentTrack.id,
      liked: newLikedState,
      position: currentTime,
      user_id: username
    });
  };

  // Handle add to playlist
  const [isInPlaylist, setIsInPlaylist] = useState(false);

  const handleAddToPlaylist = () => {
    const newPlaylistState = !isInPlaylist;
    setIsInPlaylist(newPlaylistState);
    logEvent({
      event_type: newPlaylistState ? 'add_to_playlist' : 'remove_from_playlist',
      track_id: currentTrack.id,
      in_playlist: newPlaylistState,
      position: currentTime,
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
      user_id: username
    });
  };

  // Handle view artist
  const handleViewArtist = () => {
    logEvent({
      event_type: 'view_artist',
      track_id: currentTrack.id,
      position: currentTime,
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
              return 0;
            } else {
              // Track ended, auto-play next track
              setIsPlaying(false);
              setCurrentTime(0);
              
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
                logEvent({
                  event_type: 'play',
                  track_id: SAMPLE_TRACKS[nextIndex].id,
                  position: 0,
                  duration: SAMPLE_TRACKS[nextIndex].duration,
                  user_id: username
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
    <div className="h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6 flex flex-col">
      {/* Header with Username */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Neo Music Player</h1>
        <p className="text-purple-200">Real-time analytics demo</p>
        
        {/* Username Display/Input */}
        <div className="mt-4 flex justify-center">
          {showUsernameInput ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => setShowUsernameInput(false)}
                onKeyPress={(e) => e.key === 'Enter' && setShowUsernameInput(false)}
                className="px-3 py-1 rounded bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:bg-opacity-30"
                placeholder="Enter username"
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={() => setShowUsernameInput(true)}
              className="text-purple-200 hover:text-white transition-colors flex items-center space-x-1"
            >
              <User size={16} />
              <span>{username}</span>
            </button>
          )}
        </div>
      </div>

      {/* Album Art with Side Buttons */}
      <div className="flex justify-center items-center mb-8">
        <button
          onClick={handleViewArtist}
          className="p-3 text-white hover:text-purple-300 transition-colors mr-4"
          title="View Artist"
        >
          <User size={24} />
        </button>
        
        <div className="relative">
          <img 
            src={currentTrack.albumArt} 
            alt={currentTrack.album}
            className="w-64 h-64 rounded-lg shadow-2xl object-cover"
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <div className="w-2 h-8 bg-white rounded-full mx-1 animate-pulse"></div>
                <div className="w-2 h-8 bg-white rounded-full mx-1 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-8 bg-white rounded-full mx-1 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={handleViewLyrics}
          className="p-3 text-white hover:text-purple-300 transition-colors ml-4"
          title="View Lyrics"
        >
          <FileText size={24} />
        </button>
      </div>

      {/* Track Info */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-white mb-1">{currentTrack.title}</h2>
        <p className="text-purple-200">{currentTrack.artist}</p>
        <p className="text-purple-300 text-sm">{currentTrack.album}</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-purple-200 mb-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(currentTrack.duration)}</span>
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
          className="w-full h-2 bg-purple-700 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-6 mb-8">
        <button
          onClick={handleReplay}
          className="p-3 text-white hover:text-purple-300 transition-colors"
          title={currentTime > 5 ? "Restart Song" : "Previous Track"}
        >
          <SkipBack size={24} />
        </button>
        
        <button
          onClick={handlePlayPause}
          className="p-4 bg-white rounded-full hover:bg-gray-100 transition-colors"
        >
          {isPlaying ? <Pause size={32} className="text-purple-900" /> : <Play size={32} className="text-purple-900 ml-1" />}
        </button>
        
        <button
          onClick={() => handleSkip('next')}
          className="p-3 text-white hover:text-purple-300 transition-colors"
        >
          <SkipForward size={24} />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <button
          onClick={handleLike}
          className={`p-3 rounded-full transition-colors ${
            isLiked 
              ? 'bg-red-500 text-white' 
              : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
          }`}
        >
          <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
        
        <button
          onClick={handleAddToPlaylist}
          className={`p-3 rounded-full transition-colors ${
            isInPlaylist 
              ? 'bg-green-500 text-white' 
              : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
          }`}
        >
          <Plus size={20} />
        </button>
        
        <button
          onClick={handleLoopToggle}
          className={`p-3 rounded-full transition-colors ${
            isLooping 
              ? 'bg-blue-500 text-white' 
              : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
          }`}
          title="Loop Track"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={handleMuteToggle}
          className="text-white hover:text-purple-300 transition-colors"
        >
          {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          onMouseUp={handleVolumeEnd}
          onKeyUp={handleVolumeEnd}
          className="w-32 h-2 bg-purple-700 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

      {/* Hidden audio element for simulation */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
};

export default MusicPlayer; 