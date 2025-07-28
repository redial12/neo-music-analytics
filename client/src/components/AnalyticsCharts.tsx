import { useMemo } from 'react';
import { AnalyticsEvent } from '../utils/socket';
import { TRACK_TITLES, EVENT_COLORS } from '../utils/colors';
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
  Cell
} from 'recharts';

interface AnalyticsChartsProps {
  events: AnalyticsEvent[];
}

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ events }) => {
  // Event type distribution
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

  // Generate consistent colors for event types using fixed mapping
  const eventColors = useMemo(() => {
    const eventTypes = [...new Set(events.map(e => e.event_type))];
    const colorMap: Record<string, string> = {};
    
    eventTypes.forEach((type) => {
      colorMap[type] = EVENT_COLORS[type] || '#8884d8';
    });
    
    return colorMap;
  }, [events]);

  // Track popularity - one bar per event type per track
  const trackData = useMemo(() => {
    const trackEventCounts: Record<string, Record<string, number>> = {};
    
    // Count events by track and event type
    events.forEach(event => {
      if (!trackEventCounts[event.track_id]) {
        trackEventCounts[event.track_id] = {};
      }
      trackEventCounts[event.track_id][event.event_type] = 
        (trackEventCounts[event.track_id][event.event_type] || 0) + 1;
    });

    // Convert to chart data format - one bar per event type per track
    const chartData: Array<{
      track: string;
      trackTitle: string;
      eventType: string;
      count: number;
      color: string;
      label: string; // For X-axis display
    }> = [];

    Object.entries(trackEventCounts).forEach(([trackId, eventCounts]) => {
      Object.entries(eventCounts).forEach(([eventType, count]) => {
        chartData.push({
          track: trackId,
          trackTitle: TRACK_TITLES[trackId] || trackId,
          eventType,
          count,
          color: EVENT_COLORS[eventType] || '#8884d8',
          label: `${TRACK_TITLES[trackId] || trackId} - ${eventType}`
        });
      });
    });

    // Sort by track title, then by event type
    return chartData
      .sort((a, b) => {
        const titleCompare = a.trackTitle.localeCompare(b.trackTitle);
        if (titleCompare !== 0) return titleCompare;
        return a.eventType.localeCompare(b.eventType);
      })
      .slice(0, 20); // Limit to prevent overcrowding
  }, [events]);

  // Time-based event frequency (last 10 minutes)
  const timeData = useMemo(() => {
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
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p>No data to display</p>
          <p className="text-sm">Interact with the music player to see analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Event Type Distribution */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-2">Event Type Distribution</h4>
        <ResponsiveContainer width="100%" height={120}>
          <PieChart>
            <Pie
              data={eventTypeData}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={50}
              paddingAngle={2}
              dataKey="value"
            >
              {eventTypeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={eventColors[entry.name] || '#8884d8'} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Track Popularity */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-2">Track Popularity by Event Type</h4>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={trackData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" angle={-45} textAnchor="end" height={60} />
            <YAxis />
            <Tooltip 
              formatter={(value, _name, props) => [
                `${value} ${props.payload.eventType} events`,
                props.payload.trackTitle
              ]}
            />
            {trackData.map((entry, index) => (
              <Bar 
                key={`bar-${index}`}
                dataKey="count" 
                fill={entry.color}
                name={entry.eventType}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Event Frequency Over Time */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-2">Event Frequency (Last 10 min)</h4>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={timeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsCharts; 