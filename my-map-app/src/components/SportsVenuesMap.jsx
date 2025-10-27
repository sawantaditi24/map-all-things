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

// Legend component inside the MapContainer
const LegendControl = () => {
  const map = useMap();

  useEffect(() => {
    const legend = L.control({ position: "bottomright" });

    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "info legend");
      div.style.background = "white";
      div.style.padding = "10px";
      div.style.borderRadius = "8px";
      div.style.boxShadow = "0 0 6px rgba(0,0,0,0.3)";
      div.innerHTML += `<b>Olympic Sport Categories</b><br/>`;
      for (const [category, style] of Object.entries(markerStyles)) {
        div.innerHTML += `
          <div style="display: flex; align-items: center; margin-bottom: 6px;">
            <div style="width: 14px; height: 14px; background: ${style.color}; margin-right: 8px; border: 1px solid #333; border-radius: 50%;"></div>
            ${category}
          </div>
        `;
      }
      return div;
    };

    legend.addTo(map);
    return () => {
      legend.remove();
    };
  }, [map]);

  return null;
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

const getBusinessMarkerSize = (score) => {
  const baseSize = 8;
  const sizeMultiplier = 0.5 + (score / 10) * 1.5; // 0.5x to 2x size
  return Math.round(baseSize * sizeMultiplier);
};

// Enhanced Legend component
const EnhancedLegendControl = ({ showBusinessData }) => {
  const map = useMap();

  useEffect(() => {
    const legend = L.control({ position: "bottomright" });

    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "info legend");
      div.style.background = "rgba(255, 255, 255, 0.95)";
      div.style.padding = "8px";
      div.style.borderRadius = "6px";
      div.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
      div.style.maxWidth = "160px";
      div.style.fontSize = "11px";
      div.style.lineHeight = "1.3";
      
      div.innerHTML += `<b style="font-size: 10px; color: #374151;">Olympic Sports</b><br/>`;
      for (const [category, style] of Object.entries(markerStyles)) {
        div.innerHTML += `
          <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 10px; height: 10px; background: ${style.color}; margin-right: 6px; border: 1px solid #333; border-radius: 50%;"></div>
            <span style="font-size: 10px;">${category}</span>
          </div>
        `;
      }
      
      if (showBusinessData) {
        div.innerHTML += `<br/><b style="font-size: 10px; color: #374151;">Business Scores</b><br/>`;
        div.innerHTML += `
          <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 10px; height: 10px; background: #ec4899; margin-right: 6px; border: 1px solid #333; border-radius: 50%;"></div>
            <span style="font-size: 10px;">High (8-10)</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 10px; height: 10px; background: #6b7280; margin-right: 6px; border: 1px solid #333; border-radius: 50%;"></div>
            <span style="font-size: 10px;">Med (6-7)</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 10px; height: 10px; background: #ef4444; margin-right: 6px; border: 1px solid #333; border-radius: 50%;"></div>
            <span style="font-size: 10px;">Low (1-5)</span>
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
          const size = getBusinessMarkerSize(score);

          if (!coordinates || coordinates.length !== 2) return null;

          return (
            <CircleMarker
              key={`business-${idx}`}
              center={[coordinates[1], coordinates[0]]} // Leaflet uses [lat, lng]
              radius={size}
              pathOptions={{ 
                color: "#333", 
                fillColor: color, 
                fillOpacity: 0.8, 
                weight: 2 
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
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Transport:</span>
                      <span style={{ fontWeight: '500' }}>{transport_score}/10</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '12px', color: '#ec4899', fontWeight: '500' }}>Click for detailed analysis</p>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        <EnhancedLegendControl showBusinessData={businessLocations.length > 0} />
      </MapContainer>
    </div>
  );
}
