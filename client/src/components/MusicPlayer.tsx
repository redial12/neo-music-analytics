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
  VolumeX
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
        duration: currentTrack.duration
      });
    } else {
      setIsPlaying(true);
      logEvent({
        event_type: 'play',
        track_id: currentTrack.id,
        position: currentTime,
        duration: currentTrack.duration
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
      timestamp: new Date().toISOString()
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
        duration: SAMPLE_TRACKS[newIndex].duration
      });
    }, 500);
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
        duration: currentTrack.duration
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
      position: currentTime
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
        position: currentTime
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
        position: currentTime
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
      position: currentTime
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
      position: currentTime
    });
  };

  // Update current time and handle track end
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && audioRef.current) {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          if (newTime >= currentTrack.duration) {
            // Track ended, auto-play next track
            setIsPlaying(false);
            setCurrentTime(0);
            
            // Log end of current track
            logEvent({
              event_type: 'pause',
              track_id: currentTrack.id,
              position: currentTrack.duration,
              duration: currentTrack.duration
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
                duration: SAMPLE_TRACKS[nextIndex].duration
              });
            }, 1000);
            
            return 0;
          }
          return newTime;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack.duration, currentTrackIndex, currentTrack.id]);

  return (
    <div className="h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6 flex flex-col">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Neo Music Player</h1>
        <p className="text-purple-200">Real-time analytics demo</p>
      </div>

      {/* Album Art */}
      <div className="flex justify-center mb-8">
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
          onClick={() => handleSkip('prev')}
          className="p-3 text-white hover:text-purple-300 transition-colors"
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