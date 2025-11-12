// src/components/SportsVenuesMap.jsx
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from "react-leaflet";
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
// Use pink shades: darker pink for high scores, lighter pink for low scores
const getBusinessScoreColor = (score) => {
  if (score >= 9) return '#be185d';      // Dark pink (brightest/darkest)
  if (score >= 8) return '#ec4899';       // Medium-dark pink
  if (score >= 7) return '#f472b6';       // Medium pink
  if (score >= 6) return '#fb7185';       // Light-medium pink
  if (score >= 5) return '#f9a8d4';       // Light pink
  if (score >= 4) return '#fbcfe8';       // Very light pink
  return '#fce7f3';                       // Faintest pink for lowest scores
};

// Convert miles to meters for geographic radius
const milesToMeters = (miles) => {
  return miles * 1609.34; // 1 mile = 1609.34 meters
};

// Get circle radius in meters based on actual distance from Olympic venue
// This represents the actual geographic distance from the nearest Olympic venue
// and will scale with zoom to maintain geographic accuracy
const getBusinessCircleRadius = (distanceToVenueKm = null) => {
  // If we have the actual distance to venue, use that (convert km to miles, then to meters)
  if (distanceToVenueKm != null && !isNaN(distanceToVenueKm) && distanceToVenueKm > 0) {
    const distanceMiles = distanceToVenueKm * 0.621371; // Convert km to miles
    return milesToMeters(distanceMiles); // Convert miles to meters
  }
  
  // Default: use a small fixed radius (e.g., 2 miles) when distance is unknown
  return milesToMeters(2); // Default to 2 miles radius
};

// Get texture pattern based on business score (dashArray for stroke pattern)
// dashArray in Leaflet should be a string like "5,2" or null for solid
const getMarkerTexture = (score) => {
  // Higher score = more solid (shorter dashes or solid)
  // Lower score = more dashed (longer dashes)
  if (score >= 9) {
    return null; // Solid line for high scores (null = no dash)
  } else if (score >= 8) {
    return '5,2'; // Small dashes
  } else if (score >= 7) {
    return '8,3'; // Medium dashes
  } else if (score >= 6) {
    return '10,5'; // Larger dashes
  } else if (score >= 5) {
    return '12,6'; // Even larger dashes
  } else {
    return '15,8'; // Very large dashes for low scores
  }
};

// Get fill opacity based on score (higher score = more opaque)
const getMarkerFillOpacity = (score) => {
  if (score >= 9) return 0.3;      // High score: more visible
  if (score >= 8) return 0.25;
  if (score >= 7) return 0.2;
  if (score >= 6) return 0.15;
  if (score >= 5) return 0.1;
  return 0.08;                      // Low score: less visible
};

// Get border weight based on score (higher score = thicker border)
const getMarkerBorderWeight = (score) => {
  if (score >= 9) return 4;        // High score: thick border
  if (score >= 8) return 3.5;
  if (score >= 7) return 3;
  if (score >= 6) return 2.5;
  return 2;                         // Lower score: thinner border
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
        div.innerHTML += `<br/><b style="font-size: 9px; color: #374151; display: block; margin-bottom: 4px;">Business Scores (Pink Shades + Textures)</b>`;
        div.innerHTML += `<div style="font-size: 8px; color: #6b7280; margin-bottom: 4px;">Circle radius = distance from nearest Olympic venue (scales with zoom). Darker pink + solid = higher score</div>`;
        // Pink shades + texture visualization: darker pink + solid for high scores, lighter pink + dashed for low
        div.innerHTML += `
          <div style="display: flex; align-items: center; margin-bottom: 2px;">
            <svg width="12" height="12" style="margin-right: 4px; flex-shrink: 0;">
              <circle cx="6" cy="6" r="5" fill="none" stroke="#be185d" stroke-width="4" stroke-dasharray="0" opacity="1"/>
            </svg>
            <span style="font-size: 9px;">High (8-10) - Dark Pink, Solid</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 2px;">
            <svg width="12" height="12" style="margin-right: 4px; flex-shrink: 0;">
              <circle cx="6" cy="6" r="5" fill="none" stroke="#f472b6" stroke-width="3" stroke-dasharray="8,3" opacity="1"/>
            </svg>
            <span style="font-size: 9px;">Med (6-7) - Medium Pink, Dashed</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 2px;">
            <svg width="12" height="12" style="margin-right: 4px; flex-shrink: 0;">
              <circle cx="6" cy="6" r="5" fill="none" stroke="#f9a8d4" stroke-width="2" stroke-dasharray="15,8" opacity="1"/>
            </svg>
            <span style="font-size: 9px;">Low (1-5) - Light Pink, Dotted</span>
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
        
        {/* Olympic Venues Markers */}
        {venues.map((venue, idx) => {
          const { Latitude, Longitude, Sport, Location } = venue;
          const category = getCategory(Sport);
          const { color } = markerStyles[category];

          if (!Latitude || !Longitude) return null;

          return (
            <CircleMarker
              key={`olympic-${idx}`}
              center={[Latitude, Longitude]}
              radius={10}
              pathOptions={{ color: "#333", fillColor: color, fillOpacity: 0.9, weight: 1 }}
            >
              <Popup>
                <strong>{Sport}</strong>
                <br />
                {Location}
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Business Intelligence Markers */}
        {businessLocations.map((location, idx) => {
          const { area, score, coordinates, business_density, population_density, transport_score } = location;
          const color = getBusinessScoreColor(score);
          
          if (!coordinates || coordinates.length !== 2) return null;
          
          // Calculate distance to nearest Olympic venue
          const businessLat = coordinates[1];
          const businessLon = coordinates[0];
          const nearestVenueInfo = findNearestVenue(businessLat, businessLon, venues);
          const distanceToVenue = nearestVenueInfo ? nearestVenueInfo.distance : null; // Distance in km
          const nearestVenue = nearestVenueInfo ? nearestVenueInfo.venue : null;
          
          // Get circle radius in meters based on ACTUAL distance from Olympic venue
          // The circle represents the actual distance, not the filter value
          const circleRadiusMeters = getBusinessCircleRadius(distanceToVenue);
          
          // Get marker properties based on score (color, texture, opacity)
          // Circle radius represents actual geographic distance and scales with zoom
          const dashArray = getMarkerTexture(score);
          const fillOpacity = getMarkerFillOpacity(score);
          const borderWeight = getMarkerBorderWeight(score);

          return (
            <Circle
              key={`business-${idx}`}
              center={[coordinates[1], coordinates[0]]} // Leaflet uses [lat, lng]
              radius={circleRadiusMeters} // Radius in meters (geographic distance)
              pathOptions={{ 
                color: color, // Use business color for border
                fillColor: color, 
                fillOpacity: fillOpacity, // Fill opacity based on score
                weight: borderWeight, // Border weight based on score
                ...(dashArray && { dashArray: dashArray }), // Texture pattern based on score (solid for high, dashed for low)
                opacity: 1.0 // Full border opacity
              }}
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
                    <p style={{ fontSize: '12px', color: '#ec4899', fontWeight: '500' }}>Click for detailed analysis</p>
                  </div>
                </div>
              </Popup>
            </Circle>
          );
        })}

        <EnhancedLegendControl showBusinessData={true} />
      </MapContainer>
    </div>
  );
}
