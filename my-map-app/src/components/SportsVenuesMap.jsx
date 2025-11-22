// src/components/SportsVenuesMap.jsx
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Define sport categories and shapes
const sportCategories = {
  "Water Sports": ["Artistic Swimming", "Canoe Sprint", "Rowing", "Sailing", "Diving", "Open Water Swimming", "Coastal Rowing"],
  "Ball Sports": ["Football (Soccer)", "Basketball", "3x3 Basketball", "Handball", "Baseball", "Softball", "Badminton", "Volleyball", "Beach Volleyball", "Cricket", "Rugby Sevens", "Lacrosse Sixes"],
  "Combat Sports": ["Boxing", "Judo", "Fencing", "Wrestling"],
  "Cycling & Racing": ["Cycling Road", "Cycling Track", "BMX Racing", "BMX Freestyle", "Skateboarding"],
  "Athletics & Gymnastics": ["Athletics", "Artistic Gymnastics", "Rhythmic Gymnastics", "Modern Pentathlon"],
  "Shooting Sports": ["Shooting", "Shooting (Shotgun)"],
  "Equestrian": ["Equestrian"],
  "Other": []
};

// Marker styles (shape + color)
const markerStyles = {
  "Water Sports": { color: "#1E90FF" },
  "Ball Sports": { color: "#32CD32" },
  "Combat Sports": { color: "#FF4500" },
  "Cycling & Racing": { color: "#FFD700" },
  "Athletics & Gymnastics": { color: "#8A2BE2" },
  "Shooting Sports": { color: "#A52A2A" },
  "Equestrian": { color: "#D2691E" },
  "Other": { color: "#808080" }
};

// Helper to get category by sport name
const getCategory = (sport) => {
  for (const [category, sports] of Object.entries(sportCategories)) {
    if (sports.includes(sport)) return category;
  }
  return "Other";
};

// Legend component removed - using EnhancedLegendControl instead

// Distance Calculation Functions (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Find nearest Olympic venue for a business location
const findNearestVenue = (businessLat, businessLon, venues) => {
  if (!venues || venues.length === 0) return null;
  
  let nearestVenue = null;
  let minDistance = Infinity;
  
  venues.forEach(venue => {
    if (!venue.Latitude || !venue.Longitude) return;
    
    const distance = calculateDistance(
      businessLat,
      businessLon,
      venue.Latitude,
      venue.Longitude
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestVenue = { ...venue, distance };
    }
  });
  
  return nearestVenue ? { venue: nearestVenue, distance: minDistance } : null;
};

// Business Intelligence Helper Functions
// Color based on distance to nearest Olympic venue (darker blue = closer to venue)
// Using blue to contrast with pink venue rings
const getBusinessDistanceColor = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined) return '#3b82f6'; // Default medium blue
  
  const distanceMiles = distanceKm * 0.621371;
  
  // Closer to venue = darker blue, farther = lighter blue
  if (distanceMiles <= 2) return '#1e40af';      // Very close: Darkest blue
  if (distanceMiles <= 5) return '#2563eb';       // Close: Dark blue
  if (distanceMiles <= 10) return '#3b82f6';     // Medium: Medium blue
  if (distanceMiles <= 15) return '#60a5fa';      // Medium-far: Light blue
  if (distanceMiles <= 20) return '#93c5fd';      // Far: Lighter blue
  return '#bfdbfe';                                // Very far: Lightest blue
};

// Size based on business score (larger = higher score)
const getBusinessMarkerSize = (score) => {
  if (score >= 9) return 28;      // High score: large marker
  if (score >= 8) return 24;      // Medium-high: medium-large
  if (score >= 7) return 20;     // Medium: medium
  if (score >= 6) return 18;      // Medium-low: small-medium
  if (score >= 5) return 16;     // Low: small
  return 14;                       // Very low: smallest
};

// Create custom teardrop/pushpin marker icon
const createBusinessMarkerIcon = (color, size, score) => {
  // Create SVG for teardrop/pushpin shape
  const svg = `
    <svg width="${size}" height="${size * 1.2}" viewBox="0 0 24 30" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C7.58 0 4 3.58 4 8c0 4.42 8 14 8 14s8-9.58 8-14c0-4.42-3.58-8-8-8z" 
            fill="${color}" 
            stroke="#ffffff" 
            stroke-width="2"/>
      <circle cx="12" cy="8" r="3" fill="#ffffff" opacity="0.9"/>
    </svg>
  `;
  
  return L.divIcon({
    html: svg,
    className: 'business-marker-icon',
    iconSize: [size, size * 1.2],
    iconAnchor: [size / 2, size * 1.2], // Anchor at bottom point
    popupAnchor: [0, -size * 1.2]
  });
};

// Convert miles to meters for geographic radius
const milesToMeters = (miles) => {
  return miles * 1609.34; // 1 mile = 1609.34 meters
};


// Enhanced Legend component
const EnhancedLegendControl = ({ showBusinessData }) => {
  const map = useMap();

  useEffect(() => {
    const legend = L.control({ position: "bottomleft" });

    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "info legend");
      div.style.background = "rgba(255, 255, 255, 0.95)";
      div.style.padding = "6px";
      div.style.borderRadius = "6px";
      div.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
      div.style.maxWidth = "140px";
      div.style.fontSize = "10px";
      div.style.lineHeight = "1.2";
      div.style.margin = "10px";
      div.style.zIndex = "1000";
      
      div.innerHTML += `<b style="font-size: 9px; color: #374151; display: block; margin-bottom: 4px;">Olympic Sports</b>`;
      for (const [category, style] of Object.entries(markerStyles)) {
        div.innerHTML += `
          <div style="display: flex; align-items: center; margin-bottom: 2px;">
            <div style="width: 8px; height: 8px; background: ${style.color}; margin-right: 4px; border: 1px solid #333; border-radius: 50%; flex-shrink: 0;"></div>
            <span style="font-size: 9px; line-height: 1.1;">${category}</span>
          </div>
        `;
      }
      
      if (showBusinessData) {
        div.innerHTML += `<br/><b style="font-size: 9px; color: #374151; display: block; margin-bottom: 4px;">Business Locations</b>`;
        div.innerHTML += `<div style="font-size: 8px; color: #6b7280; margin-bottom: 4px;">Rings = filter radius around venues. Marker color = distance (darker blue = closer). Size = business score (larger = higher)</div>`;
        // Color = distance (blue), size = score
        div.innerHTML += `
          <div style="display: flex; align-items: center; margin-bottom: 2px;">
            <svg width="16" height="20" style="margin-right: 4px; flex-shrink: 0;">
              <path d="M8 0C5.79 0 4 1.79 4 4c0 2.94 4 9.33 4 9.33s4-6.39 4-9.33c0-2.21-1.79-4-4-4z" fill="#1e40af" stroke="#ffffff" stroke-width="1"/>
              <circle cx="8" cy="4" r="2" fill="#ffffff" opacity="0.9"/>
            </svg>
            <span style="font-size: 9px;">Close to venue (≤2mi) - Dark Blue</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 2px;">
            <svg width="14" height="18" style="margin-right: 4px; flex-shrink: 0;">
              <path d="M7 0C5.35 0 3.5 1.35 3.5 3c0 2.57 3.5 8.17 3.5 8.17s3.5-5.6 3.5-8.17c0-1.65-1.15-3-3.5-3z" fill="#3b82f6" stroke="#ffffff" stroke-width="1"/>
              <circle cx="7" cy="3" r="1.5" fill="#ffffff" opacity="0.9"/>
            </svg>
            <span style="font-size: 9px;">Medium distance (5-10mi) - Blue</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 2px;">
            <svg width="12" height="16" style="margin-right: 4px; flex-shrink: 0;">
              <path d="M6 0C4.24 0 3 1.24 3 2.5c0 2.1 3 6.68 3 6.68s3-4.58 3-6.68c0-1.26-1.24-2.5-3-2.5z" fill="#93c5fd" stroke="#ffffff" stroke-width="1"/>
              <circle cx="6" cy="2.5" r="1.2" fill="#ffffff" opacity="0.9"/>
            </svg>
            <span style="font-size: 9px;">Far from venue (>15mi) - Light Blue</span>
          </div>
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e5e7eb;">
            <div style="font-size: 8px; color: #6b7280; margin-bottom: 4px;">Score: Larger marker = higher business score</div>
          </div>
        `;
      }
      
      return div;
    };

    legend.addTo(map);
    return () => {
      legend.remove();
    };
  }, [map, showBusinessData]);

  return null;
};

export default function SportsVenuesMap({ 
  businessLocations = [], 
  onBusinessLocationClick,
  showBusinessHeatMap = false,
  businessHeatMapMetric = 'business_density',
  activeFilters = null
}) {
  const [venues, setVenues] = useState([]);

  useEffect(() => {
    fetch("/olympic_sports_venues.json")
      .then((res) => res.json())
      .then((data) => setVenues(data))
      .catch((err) => console.error("Error loading JSON:", err));
  }, []);

  // Debug: Log activeFilters changes
  useEffect(() => {
    if (activeFilters) {
      console.log('📍 ActiveFilters changed:', activeFilters);
      console.log('📍 RadiusMilesMax:', activeFilters.radiusMilesMax);
    }
  }, [activeFilters]);

  return (
    <div className="bg-white rounded-2xl shadow-md p-4">
      <MapContainer center={[34.05, -118.25]} zoom={9} style={{ height: "100%", width: "100%", minHeight: "500px" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
        
        {/* Olympic Venues with Radius Rings */}
        {venues.map((venue, idx) => {
          const { Latitude, Longitude, Sport, Location } = venue;
          const category = getCategory(Sport);
          const { color } = markerStyles[category];

          if (!Latitude || !Longitude) return null;

          // Get filter radius in meters (use max radius from filters, default to 20 miles if not set)
          const radiusMiles = activeFilters?.radiusMilesMax || 20;
          const radiusMeters = milesToMeters(radiusMiles);

          return (
            <React.Fragment key={`olympic-${idx}`}>
              {/* Radius Ring around Olympic Venue */}
              <Circle
                center={[Latitude, Longitude]}
                radius={radiusMeters}
                pathOptions={{
                  color: '#ec4899',        // Pink color for venue rings
                  fillColor: '#ec4899',
                  fillOpacity: 0.1,        // Very light fill
                  weight: 2,              // Border thickness
                  dashArray: '10, 5',     // Dashed pattern
                  opacity: 0.6
                }}
              />
              {/* Olympic Venue Marker */}
              <CircleMarker
                center={[Latitude, Longitude]}
                radius={10}
                pathOptions={{ color: "#333", fillColor: color, fillOpacity: 0.9, weight: 1 }}
              >
                <Popup>
                  <strong>{Sport}</strong>
                  <br />
                  {Location}
                  <br />
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>
                    Radius: {radiusMiles} miles
                  </span>
                </Popup>
              </CircleMarker>
            </React.Fragment>
          );
        })}

        {/* Business Intelligence Markers */}
        {businessLocations.map((location, idx) => {
          const { area, score, coordinates, business_density, population_density, transport_score } = location;
          
          if (!coordinates || coordinates.length !== 2) return null;
          
          // Calculate distance to nearest Olympic venue
          const businessLat = coordinates[1];
          const businessLon = coordinates[0];
          const nearestVenueInfo = findNearestVenue(businessLat, businessLon, venues);
          const distanceToVenue = nearestVenueInfo ? nearestVenueInfo.distance : null; // Distance in km
          const nearestVenue = nearestVenueInfo ? nearestVenueInfo.venue : null;
          
          // Color based on distance to venue (darker blue = closer)
          const color = getBusinessDistanceColor(distanceToVenue);
          
          // Size based on business score (larger = higher score)
          const markerSize = getBusinessMarkerSize(score);
          
          // Create custom teardrop marker icon
          const markerIcon = createBusinessMarkerIcon(color, markerSize, score);

          return (
            <Marker
              key={`business-${idx}`}
              position={[coordinates[1], coordinates[0]]} // Leaflet uses [lat, lng]
              icon={markerIcon}
              eventHandlers={{
                click: () => onBusinessLocationClick && onBusinessLocationClick(location)
              }}
            >
              <Popup>
                <div style={{ minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#1f2937' }}>{area}</h3>
                    <div style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '12px', 
                      fontWeight: 'bold',
                      backgroundColor: score >= 8 ? '#fce7f3' : score >= 6 ? '#f3f4f6' : '#fee2e2',
                      color: score >= 8 ? '#be185d' : score >= 6 ? '#374151' : '#dc2626'
                    }}>
                      {score}/10
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Population:</span>
                      <span style={{ fontWeight: '500' }}>{population_density.toLocaleString()}/mi²</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Businesses:</span>
                      <span style={{ fontWeight: '500' }}>{business_density}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>Transport:</span>
                      <span style={{ fontWeight: '500' }}>{transport_score}/10</span>
                    </div>
                  </div>
                  {nearestVenue && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                        <strong style={{ color: '#374151' }}>Nearest Olympic Venue:</strong>
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>
                        <span style={{ fontWeight: '500' }}>{nearestVenue.Sport}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                        {nearestVenue.Location}
                      </div>
                      <div style={{ fontSize: '12px', color: '#ec4899', fontWeight: '600', marginTop: '4px' }}>
                        📍 {distanceToVenue ? (distanceToVenue * 0.621371).toFixed(1) : '0'} miles away
                      </div>
                    </div>
                  )}
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '500' }}>Click for detailed analysis</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <EnhancedLegendControl showBusinessData={true} />
      </MapContainer>
    </div>
  );
}
