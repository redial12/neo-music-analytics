import { useEffect } from 'react';
import { connect, joinDashboard, onDashboardJoined, getConnectionStatus } from './utils/socket';
import MusicPlayer from './components/MusicPlayer';
import Dashboard from './components/Dashboard';

function App() {
  useEffect(() => {
    console.log('App component mounted');
    
    // Connect to WebSocket server
    connect();
    
    // Listen for dashboard joined confirmation
    onDashboardJoined((response) => {
      console.log('Dashboard joined:', response);
    });
    
    // Wait for connection and then join dashboard
    const checkConnection = () => {
      if (getConnectionStatus()) {
        console.log('✅ Socket connected, joining dashboard...');
        joinDashboard();
      } else {
        console.log('⏳ Waiting for socket connection...');
        setTimeout(checkConnection, 100);
      }
    };
    
    // Start checking for connection
    setTimeout(checkConnection, 100);
    
    return () => {
      // Cleanup on unmount
    };
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <div className="w-1/2 border-r border-border">
        <Dashboard />
      </div>
      
      <div className="w-1/2">
        <MusicPlayer />
      </div>
    </div>
  );
}

export default App; 