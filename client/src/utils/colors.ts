// Shared color utilities for consistent event and track colors across components

export const BASE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000', '#00ff00', '#0000ff', '#ffff00'];

// Fixed color mapping for event types to ensure consistency
export const EVENT_COLORS: Record<string, string> = {
  'play': '#8884d8',      // Purple
  'pause': '#82ca9d',     // Green
  'skip': '#ffc658',      // Yellow
  'scrub': '#ff7300',     // Orange
  'replay': '#9c27b0',    // Deep Purple
  'like': '#ff0000',      // Red
  'unlike': '#00ff00',    // Bright Green
  'add_to_playlist': '#0000ff', // Blue
  'remove_from_playlist': '#ffff00', // Yellow
  'volume_change': '#e91e63', // Pink
  'view_lyrics': '#3f51b5', // Indigo
  'view_artist': '#009688' // Teal
};

// Generate consistent colors for event types
export const generateEventColors = (eventTypes: string[]) => {
  const colorMap: Record<string, string> = {};
  
  eventTypes.forEach((type, index) => {
    // Use fixed colors if available, otherwise fall back to base colors
    colorMap[type] = EVENT_COLORS[type] || BASE_COLORS[index % BASE_COLORS.length];
  });
  
  return colorMap;
};

// Generate consistent colors for tracks
export const generateTrackColors = (trackIds: string[]) => {
  const colorMap: Record<string, string> = {};
  
  trackIds.forEach((trackId, index) => {
    colorMap[trackId] = BASE_COLORS[index % BASE_COLORS.length];
  });
  
  return colorMap;
};

// Track mapping for display purposes
export const TRACK_TITLES: Record<string, string> = {
  'track-001': 'Bohemian Rhapsody',
  'track-002': 'Hotel California', 
  'track-003': 'Stairway to Heaven'
}; 