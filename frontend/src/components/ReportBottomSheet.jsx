import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useStore } from '../store/useStore';
import { Camera, MapPin, Sparkles, Send, X, ShieldAlert, Loader2, Mic } from 'lucide-react';
import { queueImageUpload } from '../utils/indexedDB.js';

/**
 * ReportBottomSheet component
 * Responsive modal for reporting infrastructure issues with AI duplication logic.
 */
const ReportBottomSheet = () => {
  const { isReportFormOpen, setReportFormOpen, manualLocation, setNeedsManualLocation } = useStore();
  const [loadingGps, setLoadingGps] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [form, setForm] = useState({
    category: 'Road Hazard',
    description: '',
    severity: 'medium',
    landmark: ''
  });
  
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);

  const recognitionRef = useRef(null);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = form.description;

    recognition.onstart = () => setIsRecording(true);
    
    recognition.onresult = (event) => {
      let interimTranscript = '';
      let currentFinal = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentFinal += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      finalTranscript = finalTranscript + (finalTranscript && currentFinal ? ' ' : '') + currentFinal;
      
      setForm(prev => ({ 
        ...prev, 
        description: finalTranscript + (interimTranscript ? ' ' + interimTranscript : '') 
      }));
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
    };
    
    recognition.onend = () => setIsRecording(false);
    
    try {
      recognition.start();
    } catch (e) {
      console.error(e);
    }
  };

  const handleGpsFetch = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLoadingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLoadingGps(false);
      },
      (error) => {
        console.warn('GPS Error:', error);
        setLoadingGps(false);
        alert('Failed to acquire GPS location. Please drop a pin on the map instead.');
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (isReportFormOpen && !manualLocation && !gpsLocation && !loadingGps) {
      handleGpsFetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReportFormOpen]);

  if (!isReportFormOpen) return null;



  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      handleGpsFetch(); // Auto fetch GPS on image capture
    }
  };

  const handleSubmit = async () => {
    if (!image) return alert('Please attach a photo.');
    
    const finalLocation = manualLocation || gpsLocation;
    if (!finalLocation) {
      return alert('Waiting for location... Please allow GPS or pick a pin on the map.');
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('image', image);
    formData.append('longitude', finalLocation.lng);
    formData.append('latitude', finalLocation.lat);
    if (form.description) formData.append('reporterNotes', form.description);
    if (form.landmark) formData.append('wardOrDistrict', form.landmark);

    try {
      const response = await axios.post(import.meta.env.VITE_API_URL + '/issues/report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        setReportFormOpen(false);
        setPreview('');
        setImage(null);
        setForm({ category: 'Road Hazard', description: '', severity: 'medium', landmark: '' });
        setGpsLocation(null);
        
        // Show the duplicate/insight message if returned
        if (response.data.message) {
           alert(`AI Insight: ${response.data.message}`);
        }
      }
    } catch (error) {
      if (!navigator.onLine || error.message === 'Network Error') {
        try {
          await queueImageUpload(image, {
            longitude: finalLocation.lng,
            latitude: finalLocation.lat,
            reporterNotes: form.description,
            wardOrDistrict: form.landmark
          });
          alert('You are offline. Your report has been saved locally and will be submitted automatically when your connection is restored!');
          setReportFormOpen(false);
          setPreview('');
          setImage(null);
          setForm({ category: 'Road Hazard', description: '', severity: 'medium', landmark: '' });
          setGpsLocation(null);
        } catch (dbErr) {
          console.error('Failed to queue offline report:', dbErr);
          alert('You are offline, but we failed to save the report locally.');
        }
      } else {
        console.error(error);
        const serverError = error.response?.data?.error || error.message;
        alert(`Failed to submit report. Server says: ${serverError}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={() => setReportFormOpen(false)}
      />

      {/* Sheet / Panel */}
      <div className="relative w-full max-w-xl md:rounded-[40px] rounded-t-[40px] backdrop-blur-3xl bg-[#121620]/90 border border-white/20 shadow-[0_32px_128px_rgba(0,0,0,0.8)] overflow-hidden animate-in slide-in-from-bottom duration-500">
        <div className="p-8 space-y-8">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">Report Issue</h2>
              <p className="text-slate-400 mt-1">Civic anomalies are triaged instantly by AI.</p>
            </div>
            <button 
              onClick={() => setReportFormOpen(false)}
              className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 text-white"
            >
              <X size={20} />
            </button>
          </header>

          <div className="space-y-6">
            {/* Category Grid */}
            <div className="grid grid-cols-2 gap-3">
              {['Road Hazard', 'Streetlight Out', 'Water Leak', 'Vandalism'].map((cat) => (
                <button 
                  key={cat}
                  onClick={() => setForm({ ...form, category: cat })}
                  className={`p-4 rounded-2xl border text-sm font-bold text-left transition-all ${
                    form.category === cat ? 'bg-indigo-500/20 border-indigo-500 text-indigo-100 shadow-[0_0_20px_rgba(79,70,229,0.3)]' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* GPS Trigger */}
            <div className="space-y-3">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl transition-all ${loadingGps ? 'bg-blue-500/20 text-blue-400' : (manualLocation ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-slate-300')}`}>
                    {loadingGps ? <Loader2 className="animate-spin" /> : <MapPin />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Location Data</p>
                    <p className="text-xs text-slate-400">
                      {manualLocation ? 'Manual Pin Dropped' : (loadingGps ? 'Syncing with satellites...' : '1400 Civic Center Dr, Block 4')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <button 
                    onClick={handleGpsFetch}
                    className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Refetch
                  </button>
                  <button 
                    onClick={() => {
                      setReportFormOpen(false);
                      setNeedsManualLocation(true);
                    }}
                    className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Map Pin
                  </button>
                </div>
              </div>

              {/* Landmark Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MapPin size={16} className="text-slate-400" />
                </div>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                  placeholder="Add nearby landmark (optional)"
                  value={form.landmark}
                  onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                />
              </div>
            </div>

            {/* Photo & Description */}
            <div className="flex gap-4">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 w-24 h-24 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-indigo-500/50 hover:text-indigo-400 transition-all overflow-hidden relative group"
              >
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={20} className="text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    <Camera size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-center leading-tight px-1">Add Photo</span>
                  </>
                )}
              </button>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                ref={fileInputRef}
                onChange={handleImageCapture}
                className="hidden" 
              />
              <div className="flex-1 relative">
                <textarea 
                  className="w-full h-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-12 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                  placeholder="Provide any additional details about the hazard..."
                  rows="3"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <button
                  type="button"
                  onClick={toggleRecording}
                  title="Use Microphone"
                  className={`absolute bottom-3 right-3 p-2 rounded-full transition-all ${isRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-white/10 text-slate-400 hover:bg-indigo-500/20 hover:text-indigo-400'}`}
                >
                  <Mic size={16} />
                </button>
              </div>
            </div>

            {/* AI Insight Box */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-5 flex items-start gap-4">
              <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-200">AI Duplicate Analysis</p>
                <p className="text-xs text-indigo-100/70 mt-1 leading-relaxed">
                  Scanning 500m radius... No identical reports found. This will be marked as a <span className="text-indigo-300 font-bold uppercase">New Unique Incident</span>.
                </p>
              </div>
            </div>
          </div>

          <footer className="flex gap-4">
            <button 
              onClick={() => setReportFormOpen(false)}
              className="flex-1 py-4 rounded-2xl border border-white/10 text-sm font-bold text-white hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="flex-[2] bg-indigo-600 hover:bg-indigo-500 shadow-[0_8px_32px_rgba(79,70,229,0.4)] py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 group transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Analyzing...
                </>
              ) : (
                <>
                  Submit Report
                  <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </>
              )}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ReportBottomSheet;
