import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AnalyticsCharts from './components/AnalyticsCharts';
import AppShell from './components/AppShell';
import Settings from './pages/Settings';
import { syncOfflineQueue } from './utils/indexedDB.js';

function App() {
  useEffect(() => {
    window.addEventListener('online', syncOfflineQueue);
    syncOfflineQueue(); // Initial check
    return () => window.removeEventListener('online', syncOfflineQueue);
  }, []);

  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/analytics" element={<AnalyticsCharts />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </AppShell>
    </Router>
  );
}

export default App;
