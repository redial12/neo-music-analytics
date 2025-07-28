import { useMemo } from 'react';
import { AnalyticsEvent } from '../utils/socket';
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

// Generate consistent colors for event types
const generateEventColors = (eventTypes: string[]) => {
  const baseColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000', '#00ff00', '#0000ff', '#ffff00'];
  const colorMap: Record<string, string> = {};
  
  eventTypes.forEach((type, index) => {
    colorMap[type] = baseColors[index % baseColors.length];
  });
  
  return colorMap;
};

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

  // Generate consistent colors
  const eventColors = useMemo(() => {
    const eventTypes = [...new Set(events.map(e => e.event_type))];
    return generateEventColors(eventTypes);
  }, [events]);

  // Track popularity
  const trackData = useMemo(() => {
    const trackCounts = events.reduce((acc, event) => {
      acc[event.track_id] = (acc[event.track_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(trackCounts)
      .map(([track, count]) => ({
        track,
        events: count,
      }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 5);
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
        <h4 className="text-sm font-medium text-foreground mb-2">Track Popularity</h4>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={trackData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="track" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="events" fill="#8884d8" />
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