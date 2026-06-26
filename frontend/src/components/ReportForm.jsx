import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { queueImageUpload } from '../utils/indexedDB.js';

const ReportForm = ({ onSuccess, manualLocation, onLocationDenied, onChangeLocationRequest }) => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [reporterNotes, setReporterNotes] = useState('');
  const [wardOrDistrict, setWardOrDistrict] = useState('');
  const [loading, setLoading] = useState(false);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [isListening, setIsListening] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleMicClick = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support the Web Speech API.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setReporterNotes((prev) => prev ? prev + ' ' + transcript : transcript);
    };
    
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  const acquireLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      onLocationDenied();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.warn('GPS Denied or Error:', error);
        onLocationDenied();
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      acquireLocation(); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return alert('Please attach a photo.');
    
    const finalLocation = manualLocation || gpsLocation;
    if (!finalLocation) {
      return alert('Waiting for location... Please allow GPS or drop a pin on the map.');
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('image', image);
    formData.append('longitude', finalLocation.lng);
    formData.append('latitude', finalLocation.lat);
    if (reporterNotes) formData.append('reporterNotes', reporterNotes);
    if (wardOrDistrict) formData.append('wardOrDistrict', wardOrDistrict);

    try {
      const response = await axios.post(import.meta.env.VITE_API_URL + '/issues/report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        setImage(null);
        setPreview('');
        setReporterNotes('');
        setWardOrDistrict('');
        setGpsLocation(null);
        onSuccess();
      }
    } catch (error) {
      if (!navigator.onLine || error.message === 'Network Error') {
        try {
          await queueImageUpload(image, {
            longitude: finalLocation.lng,
            latitude: finalLocation.lat,
            reporterNotes: reporterNotes,
            wardOrDistrict: wardOrDistrict
          });
          alert('You are offline. Your report has been saved locally and will be submitted automatically when your connection is restored!');
          setImage(null);
          setPreview('');
          setReporterNotes('');
          setWardOrDistrict('');
          setGpsLocation(null);
          onSuccess();
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
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6 h-full pb-4 font-body-md">
      
      {/* Image Upload Area */}
      <div>
        <label className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant mb-3 font-bold uppercase tracking-wider">
          <span className="material-symbols-outlined text-[18px]">add_a_photo</span> Visual Evidence
        </label>
        <div 
          className={`relative rounded-2xl flex flex-col items-center justify-center h-48 cursor-pointer overflow-hidden group transition-all duration-300 ${preview ? 'border-none shadow-lg' : 'border-2 border-dashed border-outline-variant bg-surface-container hover:bg-surface-container-high hover:border-primary'}`}
          onClick={() => fileInputRef.current?.click()}
        >
          {preview ? (
            <>
              <img src={preview} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end pb-4">
                <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-white font-medium border border-white/30 text-sm font-label-sm">
                  <span className="material-symbols-outlined text-[18px]">flip_camera_ios</span> Retake
                </div>
              </div>
            </>
          ) : (
            <div className="text-on-surface-variant flex flex-col items-center p-6 text-center">
              <span className="material-symbols-outlined text-4xl mb-3 text-primary group-hover:scale-110 transition-transform">image</span>
              <span className="font-label-md font-bold text-on-surface">Tap to capture or upload</span>
            </div>
          )}
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={fileInputRef}
            onChange={handleImageCapture}
            className="hidden" 
          />
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <label className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[18px]">description</span> Description
          </label>
          <button 
            type="button"
            onClick={handleMicClick}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full transition-all border ${isListening ? 'bg-error-container text-on-error-container border-error animate-pulse' : 'bg-secondary-container/20 text-secondary border-secondary-container hover:bg-secondary-container/40'}`}
          >
            <span className="material-symbols-outlined text-[14px]">mic</span> {isListening ? 'Listening...' : 'Dictate'}
          </button>
        </div>
        <textarea 
          rows="3"
          className="w-full px-5 py-4 bg-surface-container border border-outline-variant rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none transition-all duration-300 text-on-surface font-body-md placeholder:text-on-surface-variant/50"
          placeholder="Provide details about the issue..."
          value={reporterNotes}
          onChange={(e) => setReporterNotes(e.target.value)}
        />
      </div>

      {/* Location Status Indicator */}
      <div className="flex flex-col">
        <label className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant mb-3 font-bold uppercase tracking-wider">
          <span className="material-symbols-outlined text-[18px]">my_location</span> Location
        </label>
        <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-colors ${manualLocation ? 'bg-tertiary-container/20 border-tertiary text-tertiary' : (gpsLocation ? 'bg-primary-container/20 border-primary text-primary' : 'bg-surface-container border-outline-variant text-on-surface-variant')}`}>
          <div className="flex flex-col flex-1">
            <span className="font-label-md font-bold">
              {manualLocation 
                ? 'Manual Pin Dropped' 
                : (gpsLocation ? 'GPS Acquired' : 'Fetching coordinates...')}
            </span>
          </div>
          <button 
            type="button" 
            onClick={onChangeLocationRequest}
            className="p-2 px-3 rounded-lg bg-surface-container-highest hover:bg-outline-variant transition-colors border border-outline-variant text-on-surface flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">edit_location_alt</span>
            <span className="text-xs font-bold">Change</span>
          </button>
        </div>
        <div className="mt-3 relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 transform -translate-y-1/2 text-on-surface-variant text-[20px]">storefront</span>
          <input 
            type="text"
            className="w-full pl-11 pr-5 py-3.5 bg-surface-container border border-outline-variant rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all duration-300 text-on-surface font-body-md placeholder:text-on-surface-variant/50"
            placeholder="Add nearby landmark (optional)"
            value={wardOrDistrict}
            onChange={(e) => setWardOrDistrict(e.target.value)}
          />
        </div>
      </div>

      {/* Submit Button */}
      <button 
        type="submit" 
        disabled={loading || !image || (!gpsLocation && !manualLocation)}
        className="mt-auto w-full py-4 rounded-2xl font-label-md font-bold text-on-primary shadow-[0_8px_20px_rgba(173,198,255,0.3)] flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed bg-gradient-to-r from-primary to-inverse-primary hover:shadow-[0_8px_25px_rgba(173,198,255,0.5)] hover:scale-101 active:scale-95"
      >
        {loading ? (
          <><span className="material-symbols-outlined animate-spin">sync</span> AI Analyzing...</>
        ) : (
          <>Submit Report <span className="material-symbols-outlined text-[20px]">send</span></>
        )}
      </button>
    </form>
  );
};

export default ReportForm;
