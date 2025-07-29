import { useState, useEffect } from 'react';
import { onNewEvent, AnalyticsEvent } from '../utils/socket';
import { TRACK_TITLES } from '../utils/colors';
import EventFeed from './EventFeed';
import AnalyticsCharts from './AnalyticsCharts';
import { 
  BarChart3, 
  Activity, 
  Users, 
  Music, 
  Filter,
  TrendingUp,
  Clock,
  Zap,
  ChevronDown
} from 'lucide-react';

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
    <div className="bg-gray-900 text-gray-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Neo Analytics
            </h1>
            <p className="text-gray-400 text-sm">Real-time music analytics dashboard</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-100">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event Type
            </label>
            <div className="relative">
              <select
                value={filters.eventType}
                onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
                className="w-full px-4 py-3 pr-12 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
              >
                <option value="">All Events</option>
                {uniqueEventTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Track
            </label>
            <div className="relative">
              <select
                value={filters.trackId}
                onChange={(e) => setFilters(prev => ({ ...prev, trackId: e.target.value }))}
                className="w-full px-4 py-3 pr-12 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
              >
                <option value="">All Tracks</option>
                {uniqueTrackIds.map(id => (
                  <option key={id} value={id}>
                    {id} - {TRACK_TITLES[id] || 'Unknown Track'}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              User ID
            </label>
            <div className="relative">
              <select
                value={filters.userId}
                onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                className="w-full px-4 py-3 pr-12 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
              >
                <option value="">All Users</option>
                {uniqueUserIds.map(id => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm font-medium">Total Events</p>
              <p className="text-3xl font-bold text-white">{events.length}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-xl border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm font-medium">Event Types</p>
              <p className="text-3xl font-bold text-white">{uniqueEventTypes.length}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-xl border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-200 text-sm font-medium">Tracks</p>
              <p className="text-3xl font-bold text-white">{uniqueTrackIds.length}</p>
            </div>
            <Music className="w-8 h-8 text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-600 to-orange-700 p-6 rounded-xl border border-orange-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-200 text-sm font-medium">Users</p>
              <p className="text-3xl font-bold text-white">{uniqueUserIds.length}</p>
            </div>
            <Users className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Live Events Banner */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 mb-8">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-gray-100">Live Events</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-700">
            <EventFeed events={filteredEvents} />
          </div>
        </div>
      </div>

      {/* Charts Row 1 - Pie and Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Event Type Distribution */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-100">Event Type Distribution</h3>
          </div>
          <div className="h-64 overflow-hidden">
            <AnalyticsCharts events={filteredEvents} chartType="pie" />
          </div>
        </div>
        
        {/* Track Total Events */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-gray-100">Track Events</h3>
          </div>
          <div className="h-64 overflow-hidden">
            <AnalyticsCharts events={filteredEvents} chartType="bar" />
          </div>
        </div>
      </div>

      {/* Charts Row 2 - Timeline Chart */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 mb-8 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Clock className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-100">Event Timeline</h3>
        </div>
        <div className="h-64 overflow-hidden">
          <AnalyticsCharts events={filteredEvents} chartType="line" />
        </div>
      </div>

      {/* Charts Row 3 - Song Timeline Chart */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 mb-8 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Music className="w-5 h-5 text-pink-400" />
          <h3 className="text-lg font-semibold text-gray-100">Song Timeline Events</h3>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Events over song duration (10-second increments)
        </p>
        <div className="h-80 overflow-hidden">
          <AnalyticsCharts events={filteredEvents} chartType="song-timeline" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 