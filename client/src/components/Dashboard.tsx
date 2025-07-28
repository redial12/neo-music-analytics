import { useState, useEffect } from 'react';
import { onNewEvent, AnalyticsEvent } from '../utils/socket';
import { TRACK_TITLES } from '../utils/colors';
import EventFeed from './EventFeed';
import AnalyticsCharts from './AnalyticsCharts';

const Dashboard: React.FC = () => {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<AnalyticsEvent[]>([]);
  const [filters, setFilters] = useState({
    eventType: '',
    trackId: '',
    userId: ''
  });

  // Listen for new events
  useEffect(() => {
    onNewEvent((event: AnalyticsEvent) => {
      setEvents(prev => [event, ...prev].slice(0, 100)); // Keep last 100 events
    });
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = events;
    
    if (filters.eventType) {
      filtered = filtered.filter(event => event.event_type === filters.eventType);
    }
    
    if (filters.trackId) {
      filtered = filtered.filter(event => event.track_id === filters.trackId);
    }
    
    if (filters.userId) {
      filtered = filtered.filter(event => event.user_id === filters.userId);
    }
    
    setFilteredEvents(filtered);
  }, [events, filters]);

  const uniqueEventTypes = [...new Set(events.map(e => e.event_type))];
  
  // Sort tracks by title name while keeping track-001 format
  const uniqueTrackIds = [...new Set(events.map(e => e.track_id))]
    .sort((a, b) => {
      const titleA = TRACK_TITLES[a] || a;
      const titleB = TRACK_TITLES[b] || b;
      return titleA.localeCompare(titleB);
    });
    
  const uniqueUserIds = [...new Set(events.map(e => e.user_id))];

  return (
    <div className="h-full bg-background p-6 overflow-hidden">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">📊 Real-Time Analytics</h1>
        <p className="text-muted-foreground">Live event stream from music player</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Event Type
          </label>
          <select
            value={filters.eventType}
            onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            <option value="">All Events</option>
            {uniqueEventTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Track
          </label>
          <select
            value={filters.trackId}
            onChange={(e) => setFilters(prev => ({ ...prev, trackId: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            <option value="">All Tracks</option>
            {uniqueTrackIds.map(id => (
              <option key={id} value={id}>
                {id} - {TRACK_TITLES[id] || 'Unknown Track'}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            User ID
          </label>
          <select
            value={filters.userId}
            onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            <option value="">All Users</option>
            {uniqueUserIds.map(id => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-foreground">{events.length}</div>
          <div className="text-sm text-muted-foreground">Total Events</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-foreground">{uniqueEventTypes.length}</div>
          <div className="text-sm text-muted-foreground">Event Types</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-foreground">{uniqueTrackIds.length}</div>
          <div className="text-sm text-muted-foreground">Tracks</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-foreground">{uniqueUserIds.length}</div>
          <div className="text-sm text-muted-foreground">Users</div>
        </div>
      </div>

      {/* Live Events Banner */}
      <div className="bg-card p-4 rounded-lg border mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">📋 Live Events</h3>
        <div className="h-32">
          <EventFeed events={filteredEvents} />
        </div>
      </div>

      {/* Analytics Charts - Separate Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Type Distribution */}
        <div className="bg-card p-4 rounded-lg border">
          <h3 className="text-lg font-semibold text-foreground mb-4">📊 Event Type Distribution</h3>
          <div className="h-64">
            <AnalyticsCharts events={filteredEvents} chartType="pie" />
          </div>
        </div>
        
        {/* Track Total Events */}
        <div className="bg-card p-4 rounded-lg border">
          <h3 className="text-lg font-semibold text-foreground mb-4">📈 Total Track Events</h3>
          <div className="h-64">
            <AnalyticsCharts events={filteredEvents} chartType="bar" />
          </div>
        </div>
        
        {/* Timeline Chart */}
        <div className="bg-card p-4 rounded-lg border">
          <h3 className="text-lg font-semibold text-foreground mb-4">⏰ Event Timeline</h3>
          <div className="h-64">
            <AnalyticsCharts events={filteredEvents} chartType="line" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 