import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Rectangle, useMapEvents, Marker, Popup, useMap } from 'react-leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import { Info, Minus } from 'lucide-react';
import L from 'leaflet';
import Navbar from './Navbar';
import InfoContainer from './InfoContainer';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || map.getZoom(), {
        duration: 1.5
      });
    }
  }, [center, zoom, map]);

  return null;
}
function DrawRectangle({ onRegionSelect, isEnabled }) {
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const map = useMap();
  
  useEffect(() => {
    if (isEnabled) {
      map.getContainer().style.cursor = 'crosshair';
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
      if (map.tap) map.tap.disable();
    } else {
      map.getContainer().style.cursor = '';
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
      if (map.tap) map.tap.enable();
      setIsDrawing(false);
      setStartPoint(null);
      setCurrentPoint(null);
    }
  }, [isEnabled, map]);

  useMapEvents({
    mousedown: (e) => {
      if (!isEnabled) return;
      setStartPoint([e.latlng.lat, e.latlng.lng]);
      setIsDrawing(true);
    },
    mousemove: (e) => {
      if (!isEnabled) return;
      if (isDrawing && startPoint) {
        setCurrentPoint([e.latlng.lat, e.latlng.lng]);
      }
    },
    mouseup: (e) => {
      if (!isEnabled) return;
      if (isDrawing && startPoint) {
        const endPoint = [e.latlng.lat, e.latlng.lng];
        const bounds = [startPoint, endPoint];
        onRegionSelect(bounds);
        setIsDrawing(false);
        setStartPoint(null);
        setCurrentPoint(null);
      }
    },
  });
  
  if (isDrawing && startPoint && currentPoint && isEnabled) {
    return <Rectangle bounds={[startPoint, currentPoint]} pathOptions={{ color: 'blue', fillOpacity: 0.2 }} />;
  }
  return null;
}

function ScaleControl({ onScaleUpdate }) {
  const map = useMap();
  const [scale, setScale] = useState({ distance: 0, unit: 'km' });

  useEffect(() => {
    const updateScale = () => {
      const zoom = map.getZoom();
      const center = map.getCenter();
      const metersPerPixel = 156543.04 * Math.cos(center.lat * Math.PI / 180) / Math.pow(2, zoom);
      const scaleWidthPixels = 100;
      const distanceMeters = metersPerPixel * scaleWidthPixels;
      let distance, unit, actualWidth;
      if (distanceMeters >= 1000) {
        distance = distanceMeters / 1000;
        unit = 'km';
        if (distance >= 100) {
          distance = Math.round(distance / 100) * 100;
        } else if (distance >= 10) {
          distance = Math.round(distance / 10) * 10;
        } else if (distance >= 1) {
          distance = Math.round(distance);
        } else {
          distance = Math.round(distance * 10) / 10;
        }
        actualWidth = (distance * 1000 / distanceMeters) * scaleWidthPixels;
      } else {
        distance = distanceMeters;
        unit = 'm';
        if (distance >= 100) {
          distance = Math.round(distance / 100) * 100;
        } else if (distance >= 10) {
          distance = Math.round(distance / 10) * 10;
        } else {
          distance = Math.round(distance);
        }
        actualWidth = (distance / distanceMeters) * scaleWidthPixels;
      }
      setScale({ distance, unit, width: actualWidth });
      if (onScaleUpdate) onScaleUpdate({ distance, unit, width: actualWidth });
    };

    updateScale();
    map.on('zoom', updateScale);
    map.on('move', updateScale);
    return () => {
      map.off('zoom', updateScale);
      map.off('move', updateScale);
    };
  }, [map, onScaleUpdate]);

  return null;
}

const MapComponent = () => {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regionInfo, setRegionInfo] = useState(null);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState(null);
  const [showVersionInfo, setShowVersionInfo] = useState(false);
  const [mapScale, setMapScale] = useState({ distance: 0, unit: 'km', width: 100 });
  const mapRef = useRef(null);
  const defaultCenter = [23.8103, 90.4125];
  const defaultZoom = 13;
  const provider = new OpenStreetMapProvider();
  const handleSearch = async (query) => {
    try {
      const results = await provider.search({ query });
      if (results && results.length > 0) {
        const { x, y, label } = results[0];
        setSearchedLocation({
          center: [y, x],
          zoom: 13,
          label: label
        });
      } else {
        alert('Location not found. Please try another search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to search location. Please try again.');
    }
  };
  const handleZoomIn = () => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.setZoom(map.getZoom() + 1);
    }
  };
  const handleZoomOut = () => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.setZoom(map.getZoom() - 1);
    }
  };

  const toggleDrawMode = () => {
    setIsDrawMode(!isDrawMode);
  };

  const handleRegionSelect = (bounds) => {
    setSelectedRegion(bounds);
    const [[lat1, lng1], [lat2, lng2]] = bounds;
    const centerLat = (lat1 + lat2) / 2;
    const centerLng = (lng1 + lng2) / 2;
    const latDiff = Math.abs(lat1 - lat2);
    const lngDiff = Math.abs(lng1 - lng2);
    
    setRegionInfo({
      center: [centerLat, centerLng],
      bounds: bounds,
      latDiff: latDiff.toFixed(6),
      lngDiff: lngDiff.toFixed(6),
    });
    setIsDrawMode(false);
  };

  const clearSelection = () => {
    setSelectedRegion(null);
    setRegionInfo(null);
  };

  return (
    <div className="w-full h-screen relative">
      <Navbar
        onSearch={handleSearch}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onToggleDrawMode={toggleDrawMode}
        isDrawMode={isDrawMode}
        onClearSelection={clearSelection}
      />
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="w-full h-full"
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {searchedLocation && (
          <MapController 
            center={searchedLocation.center} 
            zoom={searchedLocation.zoom} 
          />
        )}

        <DrawRectangle 
          onRegionSelect={handleRegionSelect} 
          isEnabled={isDrawMode}
        />
        {selectedRegion && (
          <Rectangle 
            bounds={selectedRegion} 
            pathOptions={{ color: 'red', fillOpacity: 0.3, weight: 2 }} 
          />
        )}
        {regionInfo && (
          <Marker position={regionInfo.center}>
            <Popup>
              <div className="text-sm">
                <strong>Selected Region Center</strong><br />
                Lat: {regionInfo.center[0].toFixed(6)}<br />
                Lng: {regionInfo.center[1].toFixed(6)}
              </div>
            </Popup>
          </Marker>
        )}
        {searchedLocation && (
          <Marker position={searchedLocation.center}>
            <Popup>
              <div className="text-sm">
                <strong>{searchedLocation.label}</strong>
              </div>
            </Popup>
          </Marker>
        )}
        <ScaleControl onScaleUpdate={setMapScale} />
      </MapContainer>
      
      <div 
        className="fixed top-4 left-4 z-[9999] pointer-events-auto"
        style={{ 
          transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)'
        }}
      >
        {!showVersionInfo ? (
          <button
            onClick={() => setShowVersionInfo(true)}
            className="bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200"
            style={{ 
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none'
            }}
            title="Version Info"
          >
            <Info className="text-blue-600" style={{ width: '20px', height: '20px' }} strokeWidth={2} />
          </button>
        ) : (
          <div
            className="bg-white rounded-2xl shadow-lg"
            style={{ 
              width: '320px',
              animation: 'slideInLeft 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
              border: '1px solid rgba(0, 0, 0, 0.1)'
            }}
          >
            <div 
              className="flex items-center justify-between"
              style={{ 
                padding: '16px 20px',
                borderBottom: '1px solid #e5e7eb'
              }}
            >
              <div className="flex items-center" style={{ gap: '12px' }}>
                <div 
                  className="bg-blue-50 rounded-full flex items-center justify-center"
                  style={{ width: '32px', height: '32px' }}
                >
                  <Info className="text-blue-600" style={{ width: '18px', height: '18px' }} strokeWidth={2} />
                </div>
                <h4 
                  className="font-semibold text-gray-900" 
                  style={{ 
                    fontSize: '14px', 
                    lineHeight: '20px',
                    letterSpacing: '-0.01em'
                  }}
                >
                  Base Version 1.0
                </h4>
              </div>
              <button
                onClick={() => setShowVersionInfo(false)}
                className="hover:bg-gray-100 rounded-full transition-all duration-200"
                style={{ 
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  background: 'transparent'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div style={{ padding: '16px 20px' }}>
              <p 
                className="text-gray-600" 
                style={{ 
                  fontSize: '13px', 
                  lineHeight: '20px',
                  marginBottom: '16px'
                }}
              >
                Bangladesh satellite population data at 1km resolution.
              </p>
              <div style={{ marginBottom: '16px' }}>
                <h5 
                  className="text-gray-900 font-medium" 
                  style={{ 
                    fontSize: '12px', 
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  Data Sources
                </h5>
                <div className="space-y-2">
                  <div 
                    className="flex items-start"
                    style={{ gap: '8px' }}
                  >
                    <div 
                      className="rounded-full bg-blue-100"
                      style={{ 
                        width: '6px', 
                        height: '6px', 
                        marginTop: '6px',
                        flexShrink: 0
                      }}
                    />
                    <p 
                      className="text-gray-700" 
                      style={{ fontSize: '12px', lineHeight: '18px' }}
                    >
                      <strong>Population:</strong> Bangladesh 2020 (1km)
                    </p>
                  </div>
                  <div 
                    className="flex items-start"
                    style={{ gap: '8px' }}
                  >
                    <div 
                      className="rounded-full bg-blue-100"
                      style={{ 
                        width: '6px', 
                        height: '6px', 
                        marginTop: '6px',
                        flexShrink: 0
                      }}
                    />
                    <p 
                      className="text-gray-700" 
                      style={{ fontSize: '12px', lineHeight: '18px' }}
                    >
                      <strong>Infrastructure:</strong> OpenStreetMap
                    </p>
                  </div>
                  <div 
                    className="flex items-start"
                    style={{ gap: '8px' }}
                  >
                    <div 
                      className="rounded-full bg-blue-100"
                      style={{ 
                        width: '6px', 
                        height: '6px', 
                        marginTop: '6px',
                        flexShrink: 0
                      }}
                    />
                    <p 
                      className="text-gray-700" 
                      style={{ fontSize: '12px', lineHeight: '18px' }}
                    >
                      <strong>Growth:</strong> 2.5% annually
                    </p>
                  </div>
                </div>
              </div>
              <div 
                className="bg-blue-50 rounded-lg"
                style={{ padding: '12px' }}
              >
                <p 
                  className="text-blue-900" 
                  style={{ 
                    fontSize: '11px', 
                    lineHeight: '16px',
                    fontWeight: 500
                  }}
                >
                  �🇩 Bangladesh coverage only
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(-10px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateX(0) scale(1);
            }
          }
        `}
      </style>
      
      <div 
        className="fixed z-[9999] pointer-events-none"
        style={{ 
          bottom: 'clamp(16px, 3vw, 24px)',
          left: 'clamp(16px, 3vw, 24px)'
        }}
      >
        <div 
          className="bg-white rounded-lg shadow-md"
          style={{ 
            padding: 'clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 12px)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 8px)' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div 
                style={{ 
                  width: `${Math.max(60, Math.min(mapScale.width, 120))}px`,
                  height: '3px',
                  background: '#1f2937',
                  position: 'relative'
                }}
              >
                <div 
                  style={{ 
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '2px',
                    height: '9px',
                    background: '#1f2937'
                  }}
                />
                <div 
                  style={{ 
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '2px',
                    height: '9px',
                    background: '#1f2937'
                  }}
                />
              </div>
            </div>
            <span 
              className="text-gray-900 font-medium"
              style={{ fontSize: 'clamp(11px, 2.5vw, 12px)', lineHeight: '1', whiteSpace: 'nowrap' }}
            >
              {mapScale.distance} {mapScale.unit}
            </span>
          </div>
        </div>
      </div>
      
      <InfoContainer regionInfo={regionInfo} onClose={clearSelection} />
    </div>
  );
};

export default MapComponent;
