import React, { useState } from 'react';
import Map from './Map';
import { useStore } from '../store/useStore';
import { ThumbsUp, Sparkles, Navigation, X } from 'lucide-react';

const Dashboard = () => {
  const { 
    issues, 
    manualLocation, setManualLocation, 
    needsManualLocation, 
    setReportFormOpen,
    upvoteIssue
  } = useStore();

  const [selectedIssue, setSelectedIssue] = useState(null);

  const handleMapClick = (e) => {
    if (needsManualLocation) {
      setManualLocation({
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      });
      setReportFormOpen(true);
    } else {
      setSelectedIssue(null);
    }
  };

  const criticalCount = issues.filter(i => i.severity === 'Critical' && i.status !== 'Resolved').length;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-background pointer-events-auto">
      
      {/* Map Control Overlays */}
      <div className="absolute top-24 left-6 md:left-12 right-6 z-20 pointer-events-none flex justify-between items-start">
        <div className="pointer-events-auto backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/20 border border-rose-500/30 rounded-full">
            <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">{criticalCount} Critical</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-sm font-medium text-slate-300">Active sweeps</span>
        </div>
      </div>

      {needsManualLocation && !manualLocation && (
        <div className="absolute top-40 left-1/2 transform -translate-x-1/2 z-20 bg-primary-container/90 backdrop-blur-md text-on-primary-container px-6 py-3 rounded-full shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] font-label-md animate-bounce text-center flex items-center gap-2 border border-primary/50 pointer-events-none">
          <Navigation size={16} />
          Drop a pin on the map
        </div>
      )}

      {/* Main Map Area */}
      <Map 
        issues={issues.filter(issue => issue.status !== 'Resolved')} 
        onMapClick={handleMapClick} 
        manualLocation={manualLocation} 
        handleUpvote={upvoteIssue} 
        selectedIssue={selectedIssue}
        setSelectedIssue={setSelectedIssue}
      />
      
      {/* InfoWindow / Issue Detail Popup Overlay */}
      {selectedIssue && (
        <div className="absolute bottom-32 md:bottom-auto md:top-24 right-6 z-30 w-[calc(100%-48px)] md:w-96 animate-in slide-in-from-right duration-500 pointer-events-auto">
          <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
            <div className="relative h-48 bg-slate-800">
              <img 
                src={selectedIssue.mediaUrl?.startsWith('/') ? `http://localhost:5000${selectedIssue.mediaUrl}` : (selectedIssue.mediaUrl || 'https://images.unsplash.com/photo-1517649763962-0c623066013b')} 
                alt={selectedIssue.category} 
                className="w-full h-full object-cover" 
              />
              <button 
                onClick={() => setSelectedIssue(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/60 text-white"
              >
                <X size={16} />
              </button>
              <div className="absolute bottom-4 left-4 flex gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border text-white ${
                  selectedIssue.severity === 'Critical' ? 'bg-rose-500/40 border-rose-500/50' : 
                  selectedIssue.severity === 'Medium' ? 'bg-amber-500/40 border-amber-500/50' : 'bg-emerald-500/40 border-emerald-500/50'
                }`}>
                  {selectedIssue.severity}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedIssue.category}</h3>
                <p className="text-sm text-slate-400 mt-1">{selectedIssue.aiDescription}</p>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Sparkles size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">AI Triage Breakdown</span>
                </div>
                <p className="text-xs text-indigo-100 leading-relaxed italic">
                  "{selectedIssue.aiDescription || 'AI analysis unavailable for this legacy report.'}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4 text-slate-400 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Navigation size={14} />
                    <span>Location Logged</span>
                  </div>
                </div>
                <button 
                  onClick={() => upvoteIssue(selectedIssue._id)}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-xl transition-all active:scale-95"
                >
                  <ThumbsUp size={16} />
                  <span className="font-bold">{selectedIssue.upvotes || 0}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
