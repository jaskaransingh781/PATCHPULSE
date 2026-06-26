import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Radar, Bell, WifiOff, Map, BarChart3, Shield, Settings, HelpCircle, Plus } from 'lucide-react';
import ReportBottomSheet from './ReportBottomSheet';

const AppShell = ({ children }) => {
  const location = useLocation();
  const { 
    setReportFormOpen, 
    setManualLocation,
    setNeedsManualLocation,
    connectSocket, disconnectSocket, fetchIssues
  } = useStore();

  const handleOpenReport = () => {
    setManualLocation(null);
    setNeedsManualLocation(false);
    setReportFormOpen(true);
  };

  useEffect(() => {
    fetchIssues();
    connectSocket();
    return () => disconnectSocket();
  }, [fetchIssues, connectSocket, disconnectSocket]);

  const navItems = [
    { path: '/', icon: Map, label: 'Map' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/admin', icon: Shield, label: 'Admin' }
  ];

  return (
    <div className="bg-background text-on-background antialiased h-[100dvh] w-full overflow-hidden flex flex-col md:flex-row relative">
      
      {/* Mobile TopAppBar */}
      <header className="md:hidden fixed top-0 w-full z-50 bg-surface/10 backdrop-blur-xl border-b border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex justify-between items-center px-margin-mobile py-4">
        <div className="flex items-center gap-sm">
          <Radar className="text-primary" size={28} />
          <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">PatchPulse</h1>
        </div>
        <div className="flex items-center gap-sm">
          <button className="p-2 rounded-full hover:bg-white/10 transition-all duration-200 text-primary">
            <Bell size={20} />
          </button>
          <button className="p-2 rounded-full hover:bg-white/10 transition-all duration-200 text-primary">
            <WifiOff size={20} />
          </button>
        </div>
      </header>

      {/* Desktop SideNavBar */}
      <nav className="hidden md:flex flex-col h-screen w-sidebar-width fixed left-0 top-0 bg-surface/10 backdrop-blur-xl border-r border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-md gap-lg z-40">
        {/* Header */}
        <div className="flex items-center gap-sm mt-xs">
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center shrink-0">
            <Radar className="text-on-primary-container" size={20} />
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">PatchPulse</h1>
            <p className="font-label-caps text-label-caps text-on-surface-variant">Civic Command</p>
          </div>
        </div>

        {/* CTA */}
        <button 
          onClick={handleOpenReport}
          className="w-full py-3 bg-primary-container text-on-primary-container rounded-lg font-label-caps text-label-caps hover:brightness-110 active:scale-95 transition-all shadow-[0_4px_12px_0_rgba(0,0,0,0.2)] flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Report Issue
        </button>

        {/* Main Tabs */}
        <div className="flex-1 flex flex-col gap-xs">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link 
                key={item.path}
                to={item.path}
                className={`flex items-center gap-sm p-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-primary text-on-primary font-bold shadow-[0_4px_12px_0_rgba(0,0,0,0.2)] scale-98' 
                    : 'text-on-surface-variant hover:bg-white/10 hover:text-primary'
                }`}
              >
                <Icon size={20} className={isActive ? 'fill-current opacity-80' : ''} />
                <span className="font-label-caps text-label-caps">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer Tabs */}
        <div className="flex flex-col gap-xs mt-auto">
          <Link to="/settings" className="flex items-center gap-sm p-3 rounded-xl text-on-surface-variant hover:bg-white/10 hover:text-primary transition-colors">
            <Settings size={20} />
            <span className="font-label-caps text-label-caps">Settings</span>
          </Link>
          <a href="#" className="flex items-center gap-sm p-3 rounded-xl text-on-surface-variant hover:bg-white/10 hover:text-primary transition-colors">
            <HelpCircle size={20} />
            <span className="font-label-caps text-label-caps">Support</span>
          </a>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto md:ml-sidebar-width pt-24 md:pt-0 pb-28 md:pb-0 relative z-0 hide-scrollbar">
        {children}
      </main>

      {/* Mobile BottomNavBar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe h-bottom-bar-height bg-surface/10 backdrop-blur-xl border-t border-white/20 shadow-[0_-8px_32px_0_rgba(0,0,0,0.37)] rounded-t-xl">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          // Inject "Report" button in the middle
          if (item.path === '/analytics') {
            return (
              <React.Fragment key="fragment-analytics">
                <Link to={item.path} className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${isActive ? 'text-primary font-bold' : 'text-on-surface-variant active:bg-white/10'}`}>
                  <Icon size={24} className={`mb-1 ${isActive ? 'fill-current opacity-80 scale-110' : ''}`} />
                  <span className="font-label-caps text-label-caps">{item.label}</span>
                </Link>
                
                <button 
                  key="report-btn"
                  onClick={handleOpenReport}
                  className="flex flex-col items-center justify-center text-on-surface-variant active:bg-white/10 p-2 rounded-lg transition-colors"
                >
                  <Plus size={24} className="mb-1" />
                  <span className="font-label-caps text-label-caps">Report</span>
                </button>
              </React.Fragment>
            );
          }

          return (
            <Link key={item.path} to={item.path} className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${isActive ? 'text-primary font-bold' : 'text-on-surface-variant active:bg-white/10'}`}>
              <Icon size={24} className={`mb-1 ${isActive ? 'fill-current opacity-80 scale-110' : ''}`} />
              <span className="font-label-caps text-label-caps">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* New Report Bottom Sheet */}
      <ReportBottomSheet />
      
    </div>
  );
};

export default AppShell;
