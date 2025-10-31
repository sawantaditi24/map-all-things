// src/components/SportsVenuesMap.jsx
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
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
const getBusinessScoreColor = (score) => {
  if (score >= 9) return '#ec4899'; // Bright pink
  if (score >= 8) return '#f472b6'; // Pink
  if (score >= 7) return '#fb7185'; // Light pink
  if (score >= 6) return '#6b7280'; // Gray
  if (score >= 5) return '#9ca3af'; // Light gray
  if (score >= 4) return '#d1d5db'; // Very light gray
  return '#ef4444'; // Red for low scores
};

const getBusinessMarkerSize = (score, distanceToVenue = null) => {
  const baseSize = 8;
  let sizeMultiplier = 0.5 + (score / 10) * 1.5; // Base size based on score (0.5x to 2x)
  
  // Adjust size based on proximity to Olympic venues
  if (distanceToVenue !== null) {
    if (distanceToVenue <= 2) {
      // Very close (0-2km): Make it 2x larger
      sizeMultiplier *= 2.0;
    } else if (distanceToVenue <= 5) {
      // Close (2-5km): Make it 1.3x larger
      sizeMultiplier *= 1.3;
    } else if (distanceToVenue <= 10) {
      // Medium (5-10km): Keep base size
      sizeMultiplier *= 1.0;
    } else {
      // Far (10km+): Make it smaller and faded
      sizeMultiplier *= 0.6;
    }
  }
  
  return Math.round(baseSize * sizeMultiplier);
};

const getMarkerOpacity = (distanceToVenue) => {
  if (distanceToVenue === null) return 0.8;
  
  if (distanceToVenue <= 2) return 1.0;      // Very close: Full opacity
  if (distanceToVenue <= 5) return 0.9;       // Close: High opacity
  if (distanceToVenue <= 10) return 0.8;     // Medium: Normal opacity
  return 0.5;                                 // Far: Low opacity
};

const getMarkerBorderWeight = (distanceToVenue) => {
  if (distanceToVenue === null) return 2;
  
  if (distanceToVenue <= 2) return 3;        // Very close: Thicker border
  if (distanceToVenue <= 5) return 2.5;     // Close: Medium border
  return 2;                                   // Others: Normal border
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
        div.innerHTML += `<br/><b style="font-size: 9px; color: #374151; display: block; margin-bottom: 4px;">Business Scores (Rings)</b>`;
        // Ring style: thick border (3px) with low fill opacity (0.2) for hollow look
        div.innerHTML += `
          <div style="display: flex; align-items: center; margin-bottom: 2px;">
            <div style="width: 10px; height: 10px; background: #ec4899; margin-right: 4px; border: 3px solid #ec4899; border-radius: 50%; flex-shrink: 0; opacity: 0.2; background-color: rgba(236, 72, 153, 0.2);"></div>
            <span style="font-size: 9px;">High (8-10)</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 2px;">
            <div style="width: 10px; height: 10px; background: #6b7280; margin-right: 4px; border: 3px solid #6b7280; border-radius: 50%; flex-shrink: 0; opacity: 0.2; background-color: rgba(107, 114, 128, 0.2);"></div>
            <span style="font-size: 9px;">Med (6-7)</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 2px;">
            <div style="width: 10px; height: 10px; background: #ef4444; margin-right: 4px; border: 3px solid #ef4444; border-radius: 50%; flex-shrink: 0; opacity: 0.2; background-color: rgba(239, 68, 68, 0.2);"></div>
            <span style="font-size: 9px;">Low (1-5)</span>
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

  return (
    <div className="bg-white rounded-2xl shadow-md p-4">
      <div className="flex justify-center mb-3">
        <img src="/LA28.png" alt="LA28 Olympics" className="h-20" />
      </div>

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
          const distanceToVenue = nearestVenueInfo ? nearestVenueInfo.distance : null;
          const nearestVenue = nearestVenueInfo ? nearestVenueInfo.venue : null;
          
          // Get marker size and opacity based on proximity
          const size = getBusinessMarkerSize(score, distanceToVenue);
          const opacity = getMarkerOpacity(distanceToVenue);
          const borderWeight = getMarkerBorderWeight(distanceToVenue);
          
          // Ring/hollow style: thick border with low fill opacity
          // Thicker border (3-4px) for ring effect, low fill opacity (0.2) for hollow look
          const ringBorderWeight = Math.max(3, borderWeight + 1); // At least 3px for ring effect
          const ringFillOpacity = Math.min(0.2, opacity * 0.3); // Very low fill for hollow effect

          return (
            <CircleMarker
              key={`business-${idx}`}
              center={[coordinates[1], coordinates[0]]} // Leaflet uses [lat, lng]
              radius={size}
              pathOptions={{ 
                color: color, // Use business color for border (not black)
                fillColor: color, 
                fillOpacity: ringFillOpacity, // Low opacity for hollow/ring effect
                weight: ringBorderWeight // Thick border for ring appearance
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
                        📍 {distanceToVenue.toFixed(1)} km away
                      </div>
                    </div>
                  )}
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '12px', color: '#ec4899', fontWeight: '500' }}>Click for detailed analysis</p>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        <EnhancedLegendControl showBusinessData={true} />
      </MapContainer>
    </div>
  );
}
