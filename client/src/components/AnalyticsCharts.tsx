import { useMemo } from 'react';
import { AnalyticsEvent } from '../utils/socket';
import { TRACK_TITLES, EVENT_COLORS, generateTrackColors } from '../utils/colors';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface AnalyticsChartsProps {
  events: AnalyticsEvent[];
  chartType?: 'pie' | 'bar' | 'line' | 'song-timeline';
}

// Event Type Distribution Pie Chart Component
const EventTypePieChart: React.FC<{ events: AnalyticsEvent[] }> = ({ events }) => {
  const eventTypeData = useMemo(() => {
    const eventCounts = events.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(eventCounts).map(([type, count]) => ({
      name: type,
      value: count,
    }));
  }, [events]);

  const eventColors = useMemo(() => {
    const eventTypes = [...new Set(events.map(e => e.event_type))];
    const colorMap: Record<string, string> = {};
    
    eventTypes.forEach((type) => {
      colorMap[type] = EVENT_COLORS[type] || '#8884d8';
    });
    
    return colorMap;
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">No data to display</p>
          <p className="text-sm text-gray-500">Interact with the music player to see analytics</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={eventTypeData}
          cx="50%"
          cy="50%"
          innerRadius={30}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {eventTypeData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={eventColors[entry.name] || '#8884d8'} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{
            backgroundColor: '#374151',
            border: '1px solid #4B5563',
            borderRadius: '8px',
            color: '#F9FAFB'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// Track Total Events Bar Chart Component
const TrackEventsBarChart: React.FC<{ events: AnalyticsEvent[] }> = ({ events }) => {
  const trackData = useMemo(() => {
    const trackCounts = events.reduce((acc, event) => {
      acc[event.track_id] = (acc[event.track_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(trackCounts)
      .map(([track, count]) => ({
        track,
        trackTitle: TRACK_TITLES[track] || track,
        events: count,
      }))
      .sort((a, b) => a.trackTitle.localeCompare(b.trackTitle))
      .slice(0, 10);
  }, [events]);

  const trackColors = useMemo(() => {
    const trackIds = trackData.map(item => item.track);
    return generateTrackColors(trackIds);
  }, [trackData]);

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">No data to display</p>
          <p className="text-sm text-gray-500">Interact with the music player to see analytics</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={trackData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" horizontal={true} vertical={false} />
        <XAxis 
          dataKey="trackTitle" 
          angle={-45} 
          textAnchor="end" 
          height={60}
          tick={{ fill: '#9CA3AF' }}
        />
        <YAxis 
          domain={[0, 'dataMax']} 
          tickCount={5} 
          allowDecimals={false}
          tick={{ fill: '#9CA3AF' }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#374151',
            border: '1px solid #4B5563',
            borderRadius: '8px',
            color: '#F9FAFB'
          }}
        />
        <Bar dataKey="events">
          {trackData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={trackColors[entry.track]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

// Event Timeline Line Chart Component
const EventTimelineChart: React.FC<{ events: AnalyticsEvent[] }> = ({ events }) => {
  const timelineData = useMemo(() => {
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;
    
    const timeSlots = Array.from({ length: 10 }, (_, i) => {
      const start = tenMinutesAgo + i * 60 * 1000;
      const end = start + 60 * 1000;
      return {
        time: new Date(start).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        count: 0,
        start,
        end
      };
    });

    events.forEach(event => {
      const eventTime = new Date(event.timestamp).getTime();
      const slot = timeSlots.find(slot => eventTime >= slot.start && eventTime < slot.end);
      if (slot) {
        slot.count++;
      }
    });

    return timeSlots;
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">No data to display</p>
          <p className="text-sm text-gray-500">Interact with the music player to see analytics</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={timelineData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" horizontal={true} vertical={false} />
        <XAxis 
          dataKey="time" 
          tick={{ fill: '#9CA3AF' }}
        />
        <YAxis 
          domain={[0, 'dataMax']} 
          tickCount={5} 
          allowDecimals={false}
          tick={{ fill: '#9CA3AF' }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#374151',
            border: '1px solid #4B5563',
            borderRadius: '8px',
            color: '#F9FAFB'
          }}
        />
        <Line type="monotone" dataKey="count" stroke="#82ca9d" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Song Timeline Chart Component - Events over song duration
const SongTimelineChart: React.FC<{ events: AnalyticsEvent[] }> = ({ events }) => {
  const timelineData = useMemo(() => {
    // Get the longest track duration from events
    const maxDuration = Math.max(...events.map(e => e.duration || 0));
    
    if (maxDuration === 0) return { timeSlots: [], uniqueTracks: [], trackColors: {} };
    
    // Create 10-second increments
    const incrementSize = 10; // seconds
    const numIncrements = Math.ceil(maxDuration / incrementSize);
    
    // Get unique tracks
    const uniqueTracks = [...new Set(events.map(e => e.track_id))];
    const trackColors = generateTrackColors(uniqueTracks);
    
    const timeSlots = Array.from({ length: numIncrements }, (_, i) => {
      const startTime = i * incrementSize;
      const endTime = Math.min((i + 1) * incrementSize, maxDuration);
      
      const slot: any = {
        timeSlot: `${Math.floor(startTime / 60)}:${(startTime % 60).toString().padStart(2, '0')}`,
        startTime,
        endTime,
        totalCount: 0,
        events: [] as AnalyticsEvent[]
      };
      
      // Initialize count for each track
      uniqueTracks.forEach(trackId => {
        slot[`track_${trackId}`] = 0;
      });
      
      return slot;
    });

    // Group events by time slot and track
    events.forEach(event => {
      const eventTime = event.position || 0;
      const slotIndex = Math.floor(eventTime / incrementSize);
      
      if (slotIndex >= 0 && slotIndex < timeSlots.length) {
        const slot = timeSlots[slotIndex];
        slot.totalCount++;
        slot[`track_${event.track_id}`]++;
        slot.events.push(event);
      }
    });

    return { timeSlots, uniqueTracks, trackColors };
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">No data to display</p>
          <p className="text-sm text-gray-500">Interact with the music player to see analytics</p>
        </div>
      </div>
    );
  }

  const { timeSlots, uniqueTracks, trackColors } = timelineData;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={timeSlots}>
        <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" horizontal={true} vertical={false} />
        <XAxis 
          dataKey="timeSlot" 
          label={{ value: 'Song Timeline', position: 'insideBottom', offset: -10, fill: '#9CA3AF' }}
          interval="preserveStartEnd"
          tick={{ fill: '#9CA3AF' }}
          tickFormatter={(value, index) => {
            // Show every 30 seconds (every 3rd tick) or start/end
            const timeInSeconds = index * 10;
            return timeInSeconds % 30 === 0 || index === 0 || index === timeSlots.length - 1 ? value : '';
          }}
        />
        <YAxis 
          label={{ value: 'Event Count', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
          domain={[0, 'dataMax']}
          tickCount={5}
          allowDecimals={false}
          tick={{ fill: '#9CA3AF' }}
        />
        <Tooltip 
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
                  <p className="font-medium text-gray-100">Time: {label}</p>
                  <p className="text-gray-300">Total Events: {data.totalCount}</p>
                  <p className="text-gray-300">Duration: {data.startTime}s - {data.endTime}s</p>
                  {uniqueTracks.map((trackId: string) => {
                    const trackCount = data[`track_${trackId}`] || 0;
                    if (trackCount > 0) {
                      return (
                        <div key={trackId} className="mt-1 text-xs">
                          <span style={{ color: trackColors[trackId] }}>●</span>
                          <span className="ml-1 text-gray-300">{TRACK_TITLES[trackId] || trackId}: {trackCount}</span>
                        </div>
                      );
                    }
                    return null;
                  })}
                  {data.events.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-100">Event Types:</p>
                      <div className="text-xs space-y-1">
                        {data.events.map((event: AnalyticsEvent, index: number) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-gray-300">{event.event_type}</span>
                            <span className="text-gray-400">{event.user_id}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            return null;
          }}
        />
        {/* Render a line for each track */}
        {uniqueTracks.map((trackId: string) => (
          <Line 
            key={trackId}
            type="monotone" 
            dataKey={`track_${trackId}`}
            stroke={trackColors[trackId]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, stroke: trackColors[trackId], strokeWidth: 2 }}
            name={TRACK_TITLES[trackId] || trackId}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ events, chartType = 'pie' }) => {
  if (chartType === 'pie') {
    return <EventTypePieChart events={events} />;
  } else if (chartType === 'bar') {
    return <TrackEventsBarChart events={events} />;
  } else if (chartType === 'line') {
    return <EventTimelineChart events={events} />;
  } else if (chartType === 'song-timeline') {
    return <SongTimelineChart events={events} />;
  }

  // Default to pie chart
  return <EventTypePieChart events={events} />;
};

export default AnalyticsCharts; 