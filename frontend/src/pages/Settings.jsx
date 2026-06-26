import React, { useState } from 'react';

const Settings = () => {
  // Local state to make toggles immediately interactive
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [offlineEnabled, setOfflineEnabled] = useState(true);

  // Toggle Dark Mode (visually applies to document)
  const handleDarkModeToggle = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="p-container-padding-mobile md:p-container-padding-desktop min-h-screen max-w-[800px] mx-auto relative z-10 w-full pt-8">
      
      <div className="mb-8">
        <h2 className="font-headline-lg text-[32px] text-on-surface font-bold mb-2">Settings</h2>
        <p className="font-body-md text-on-surface-variant">Manage your command center preferences and app configurations.</p>
      </div>

      <div className="space-y-6">
        
        {/* Profile Section */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center shrink-0 border border-black/10 dark:border-white/20">
              <span className="material-symbols-outlined text-[32px] text-on-primary-container">shield_person</span>
            </div>
            <div>
              <h3 className="font-headline-md text-[20px] font-bold text-on-surface">Municipal Admin</h3>
              <p className="font-label-sm text-primary">admin@patchpulse.gov</p>
            </div>
          </div>
          <button className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-on-surface hover:bg-black/10 dark:hover:bg-white/10 px-4 py-2 rounded-lg font-label-md transition-all">
            Edit Profile
          </button>
        </div>

        {/* Preferences Section */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-4 bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10">
            <h3 className="font-label-md text-on-surface-variant font-bold uppercase tracking-wider">Preferences</h3>
          </div>
          <div className="divide-y divide-black/5 dark:divide-white/5">
            
            {/* Setting Item */}
            <div className="p-5 flex justify-between items-center hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary">dark_mode</span>
                </div>
                <div>
                  <h4 className="font-label-md text-on-surface font-bold">Dark Mode</h4>
                  <p className="font-label-sm text-on-surface-variant mt-0.5">{isDarkMode ? 'Dark theme active' : 'Light theme active'}</p>
                </div>
              </div>
              {/* Working Local Toggle */}
              <div 
                onClick={handleDarkModeToggle}
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${isDarkMode ? 'bg-primary' : 'bg-surface-dim border border-outline'}`}
              >
                <div className={`w-5 h-5 rounded-full absolute top-0.5 shadow-sm transition-all duration-300 ${isDarkMode ? 'right-0.5 bg-on-primary' : 'left-0.5 bg-outline'}`}></div>
              </div>
            </div>

            {/* Setting Item */}
            <div className="p-5 flex justify-between items-center hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-tertiary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary">notifications_active</span>
                </div>
                <div>
                  <h4 className="font-label-md text-on-surface font-bold">Push Notifications</h4>
                  <p className="font-label-sm text-on-surface-variant mt-0.5">{pushEnabled ? 'Enabled for Critical issues' : 'Notifications disabled'}</p>
                </div>
              </div>
              {/* Working Local Toggle */}
              <div 
                onClick={() => setPushEnabled(!pushEnabled)}
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${pushEnabled ? 'bg-primary' : 'bg-surface-dim border border-outline'}`}
              >
                <div className={`w-5 h-5 rounded-full absolute top-0.5 shadow-sm transition-all duration-300 ${pushEnabled ? 'right-0.5 bg-on-primary' : 'left-0.5 bg-outline'}`}></div>
              </div>
            </div>

            {/* Setting Item */}
            <div className="p-5 flex justify-between items-center hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-error/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-error">cloud_sync</span>
                </div>
                <div>
                  <h4 className="font-label-md text-on-surface font-bold">Offline Sync</h4>
                  <p className="font-label-sm text-on-surface-variant mt-0.5">{offlineEnabled ? 'Queue reports when disconnected' : 'Offline sync disabled'}</p>
                </div>
              </div>
              {/* Working Local Toggle */}
              <div 
                onClick={() => setOfflineEnabled(!offlineEnabled)}
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${offlineEnabled ? 'bg-primary' : 'bg-surface-dim border border-outline'}`}
              >
                <div className={`w-5 h-5 rounded-full absolute top-0.5 shadow-sm transition-all duration-300 ${offlineEnabled ? 'right-0.5 bg-on-primary' : 'left-0.5 bg-outline'}`}></div>
              </div>
            </div>

          </div>
        </div>

        {/* System Info */}
        <div className="glass-panel rounded-2xl overflow-hidden mb-20 md:mb-0">
          <div className="p-4 bg-white/5 border-b border-white/10">
            <h3 className="font-label-md text-on-surface-variant font-bold uppercase tracking-wider">System Information</h3>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex justify-between">
              <span className="font-label-sm text-on-surface-variant">Version</span>
              <span className="font-label-md text-on-surface">v1.0.0 (Vibe2Ship Release)</span>
            </div>
            <div className="flex justify-between">
              <span className="font-label-sm text-on-surface-variant">Socket Connection</span>
              <span className="font-label-md text-primary flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Connected
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-label-sm text-on-surface-variant">PWA Status</span>
              <span className="font-label-md text-on-surface">Service Worker Active</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
