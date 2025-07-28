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
  Cell,
  LineChart,
  Line
} from 'recharts';

interface AnalyticsChartsProps {
  events: AnalyticsEvent[];
  chartType?: 'pie' | 'bar' | 'line';
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
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p>No data to display</p>
          <p className="text-sm">Interact with the music player to see analytics</p>
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
        <Tooltip />
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
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={trackData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="trackTitle" angle={-45} textAnchor="end" height={60} />
        <YAxis />
        <Tooltip />
        <Bar dataKey="events" fill="#8884d8" />
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
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p>No data to display</p>
          <p className="text-sm">Interact with the music player to see analytics</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={timelineData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#82ca9d" strokeWidth={2} />
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
  }

  // Default to pie chart
  return <EventTypePieChart events={events} />;
};

export default AnalyticsCharts; 