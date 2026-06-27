import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, MarkerClusterer } from '@react-google-maps/api';

const libraries = ['visualization'];
import { mapTheme, getMarkerIcon } from '../utils/mapStyles';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 20.5937, // Default to India
  lng: 78.9629
};

const Map = ({ issues, onMapClick, manualLocation, handleUpvote, selectedIssue, setSelectedIssue }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(5);

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setMapZoom(12);
        },
        () => {
          console.warn('Geolocation denied or unavailable. Defaulting to India.');
        }
      );
    }
  }, []);

  const onLoad = useCallback(function callback(map) {
    if (issues && issues.length > 0 && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      issues.forEach(issue => {
        if (issue.location && issue.location.coordinates) {
          bounds.extend({
            lat: issue.location.coordinates[1],
            lng: issue.location.coordinates[0]
          });
        }
      });
      map.fitBounds(bounds);
    }
  }, [issues]);

  if (!isLoaded) return <div className="flex items-center justify-center h-full bg-background text-on-surface">Loading Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={mapZoom}
      onLoad={onLoad}
      onClick={onMapClick}
      options={{ disableDefaultUI: true, zoomControl: true, styles: mapTheme }}
    >
      {/* Manual Pin Drop Indicator */}
      {manualLocation && (
        <Marker 
          position={manualLocation} 
          draggable={true}
          onDragEnd={(e) => {
            if (onMapClick) onMapClick(e);
          }}
          icon={{
            path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            fillColor: 'var(--color-primary)',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: 'white',
            scale: 8
          }}
        />
      )}

      {/* Clustered Issue Markers */}
      <MarkerClusterer>
        {(clusterer) => (
          <>
            {issues.map((issue, index) => {
              // Add a tiny micro-offset based on index to prevent perfect overlapping of identical coordinates
              // This ensures that when zoomed in completely, you can see and click individual markers
              const latOffset = (index % 5) * 0.00002;
              const lngOffset = (index % 3) * 0.00002;
              
              return (
                <Marker
                  key={issue._id}
                  position={{
                    lat: issue.location.coordinates[1] + latOffset,
                    lng: issue.location.coordinates[0] + lngOffset
                  }}
                  icon={getMarkerIcon(issue.severity, issue.status)}
                  clusterer={clusterer}
                  onClick={() => setSelectedIssue(issue)}
                />
              );
            })}
          </>
        )}
      </MarkerClusterer>
    </GoogleMap>
  );
};

export default React.memo(Map);
