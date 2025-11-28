// src/components/SportsVenuesMap.jsx
import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { calculateAllFilterScores, getShadeColor } from "../utils/filterScoring";

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

// Helper function to create a triangle icon with black border
const createTriangleIcon = (color) => {
  return L.divIcon({
    className: 'custom-triangle-marker',
    html: `<div style="
      position: relative;
      width: 0;
      height: 0;
      border-left: 12px solid transparent;
      border-right: 12px solid transparent;
      border-bottom: 20px solid #333;
    ">
      <div style="
        position: absolute;
        top: 1px;
        left: -11px;
        width: 0;
        height: 0;
        border-left: 11px solid transparent;
        border-right: 11px solid transparent;
        border-bottom: 18px solid ${color};
      "></div>
    </div>`,
    iconSize: [24, 20],
    iconAnchor: [12, 20],
    popupAnchor: [0, -20]
  });
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

// Convert miles to meters for geographic radius
const milesToMeters = (miles) => {
  return miles * 1609.34; // 1 mile = 1609.34 meters
};


// Component to control map view and focus on coordinates
const MapController = ({ focusLocation, onFocusComplete }) => {
  const map = useMap();
  
  useEffect(() => {
    if (focusLocation && focusLocation.coordinates && focusLocation.coordinates.length === 2) {
      const [lon, lat] = focusLocation.coordinates;
      // Just pan to the location without changing zoom level (or minimal zoom change)
      const currentZoom = map.getZoom();
      map.setView([lat, lon], currentZoom, { animate: true, duration: 0.3 });
      if (onFocusComplete) {
        setTimeout(() => onFocusComplete(), 400); // After animation completes
      }
    }
  }, [focusLocation, map, onFocusComplete]);
  
  return null;
};

// Enhanced Legend component
const EnhancedLegendControl = ({ showBusinessData, showFilterShades }) => {
  const map = useMap();

  useEffect(() => {
    const legend = L.control({ position: "bottomleft" });

    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "info legend");
      div.style.background = "rgba(255, 255, 255, 0.95)";
      div.style.padding = "8px";
      div.style.borderRadius = "6px";
      div.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
      div.style.maxWidth = "180px";
      div.style.fontSize = "10px";
      div.style.lineHeight = "1.3";
      div.style.margin = "10px";
      div.style.zIndex = "1000";
      
      // Add filter-based region shades if filters are active
      if (showFilterShades) {
        div.innerHTML += `<b style="font-size: 10px; color: #374151; display: block; margin-bottom: 6px;">Region Recommendation</b>`;
        div.innerHTML += `<div style="font-size: 9px; color: #6b7280; margin-bottom: 6px;">Based on filter criteria:</div>`;
        
        const shades = [
          { label: "Dark - Best", color: "#ec4899" },
          { label: "Medium - Good", color: "#f472b6" },
          { label: "Faint - Lower", color: "#6b7280" }
        ];
        
        shades.forEach(({ label, color }) => {
          div.innerHTML += `
            <div style="display: flex; align-items: center; margin-bottom: 3px;">
              <div style="width: 12px; height: 12px; background: ${color}; margin-right: 6px; border: 1px solid #d1d5db; border-radius: 50%; flex-shrink: 0;"></div>
              <span style="font-size: 9px; line-height: 1.2;">${label}</span>
            </div>
          `;
        });
        
        div.innerHTML += `<hr style="margin: 8px 0; border: none; border-top: 1px solid #e5e7eb;" />`;
      }
      
      div.innerHTML += `<b style="font-size: 9px; color: #374151; display: block; margin-bottom: 4px;">Olympic Sports</b>`;
      for (const [category, style] of Object.entries(markerStyles)) {
        div.innerHTML += `
          <div style="display: flex; align-items: center; margin-bottom: 2px;">
            <div style="position: relative; width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 10px solid #333; margin-right: 4px; flex-shrink: 0;">
              <div style="position: absolute; top: 1px; left: -5px; width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 8px solid ${style.color};"></div>
            </div>
            <span style="font-size: 9px; line-height: 1.1;">${category}</span>
          </div>
        `;
      }
      
      if (showBusinessData) {
        div.innerHTML += `<br/><b style="font-size: 9px; color: #374151; display: block; margin-bottom: 4px;">Venue Rings</b>`;
        div.innerHTML += `<div style="font-size: 8px; color: #6b7280; margin-bottom: 4px;">Pink rings show the filter radius around each Olympic venue</div>`;
      }
      
      return div;
    };

    legend.addTo(map);
    return () => {
      legend.remove();
    };
  }, [map, showBusinessData, showFilterShades]);

  return null;
};

const SportsVenuesMap = forwardRef(({ 
  businessLocations = [], 
  onBusinessLocationClick,
  showBusinessHeatMap = false,
  businessHeatMapMetric = 'business_density',
  activeFilters = null,
  focusLocation = null
}, ref) => {
  const [venues, setVenues] = useState([]);
  const [openPopupIndex, setOpenPopupIndex] = useState(null);
  const [cities, setCities] = useState([]);
  const [citiesWithScores, setCitiesWithScores] = useState([]);

  // Load Olympic venues
  useEffect(() => {
    fetch("/olympic_sports_venues.json")
      .then((res) => res.json())
      .then((data) => setVenues(data))
      .catch((err) => console.error("Error loading JSON:", err));
  }, []);

  // Load cities data
  useEffect(() => {
    fetch("/socal_cities_metrics.json")
      .then((res) => res.json())
      .then((data) => {
        setCities(data);
      })
      .catch((err) => console.error("Error loading cities metrics:", err));
  }, []);

  // Calculate filter scores when filters or cities change
  useEffect(() => {
    if (cities.length > 0 && activeFilters) {
      const scored = calculateAllFilterScores(cities, activeFilters);
      setCitiesWithScores(scored);
    } else {
      setCitiesWithScores([]);
    }
  }, [cities, activeFilters]);

  // Find matching recommended location for a clicked venue
  const findMatchingLocation = (venue) => {
    if (!businessLocations || businessLocations.length === 0) return null;
    
    const venueLat = venue.Latitude;
    const venueLon = venue.Longitude;
    const venueLocation = venue.Location;
    const venueSport = venue.Sport;
    
    // Try to match by coordinates (most accurate)
    const matchingByCoords = businessLocations.find(loc => {
      if (!loc.coordinates || loc.coordinates.length !== 2) return false;
      const locLon = loc.coordinates[0];
      const locLat = loc.coordinates[1];
      
      // Check if coordinates are very close (within ~10 meters)
      const distance = calculateDistance(venueLat, venueLon, locLat, locLon);
      return distance < 0.01; // Less than 10 meters
    });
    
    if (matchingByCoords) return matchingByCoords;
    
    // Fallback: match by venue_location string or sport
    const matchingByLocation = businessLocations.find(loc => {
      if (loc.venue_location && loc.venue_location === venueLocation) return true;
      if (loc.sport && loc.sport === venueSport && loc.area) {
        // Check if area name appears in venue location
        return venueLocation.toLowerCase().includes(loc.area.toLowerCase()) ||
               loc.area.toLowerCase().includes(venueLocation.toLowerCase());
      }
      return false;
    });
    
    return matchingByLocation || null;
  };

  // Handle Olympic venue click
  const handleVenueClick = (venue) => {
    const matchingLocation = findMatchingLocation(venue);
    if (matchingLocation && onBusinessLocationClick) {
      onBusinessLocationClick(matchingLocation);
    }
  };

  // Find venue marker by location and open its popup
  const focusOnLocation = (location) => {
    if (!location || !location.coordinates || location.coordinates.length !== 2) return;
    
    const [lon, lat] = location.coordinates;
    
    // Find the matching venue marker
    const venueIndex = venues.findIndex(v => {
      if (!v.Latitude || !v.Longitude) return false;
      const distance = calculateDistance(lat, lon, v.Latitude, v.Longitude);
      return distance < 0.01; // Within 10 meters
    });
    
    if (venueIndex !== -1) {
      // Set the index to open popup
      setOpenPopupIndex(venueIndex);
      // Reset after a delay to allow re-opening
      setTimeout(() => setOpenPopupIndex(null), 100);
    }
  };

  // Expose focusOnLocation method to parent via ref
  useImperativeHandle(ref, () => ({
    focusOnLocation
  }));

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
        <MapController focusLocation={focusLocation} />
        
        {/* Olympic Venues with Radius Rings */}
        {venues.map((venue, idx) => {
          const { Latitude, Longitude, Sport, Location } = venue;
          const category = getCategory(Sport);
          const { color } = markerStyles[category];

          if (!Latitude || !Longitude) return null;

          // Get filter radius in meters (use max radius from filters, default to 20 miles if not set)
          const radiusMiles = activeFilters?.radiusMilesMax || 20;
          const radiusMeters = milesToMeters(radiusMiles);

          // Find nearest city and get its filter score to determine ring shade
          let ringColor = '#ec4899'; // Default pink (when no filters)
          let ringOpacity = 0.6;
          let ringFillOpacity = 0.1;
          
          if (activeFilters && citiesWithScores.length > 0) {
            // Find nearest city to this venue
            let nearestCity = null;
            let minDistance = Infinity;
            
            citiesWithScores.forEach(city => {
              if (!city.latitude || !city.longitude) return;
              const distance = calculateDistance(
                Latitude,
                Longitude,
                city.latitude,
                city.longitude
              );
              if (distance < minDistance) {
                minDistance = distance;
                nearestCity = city;
              }
            });
            
            // Use the nearest city's shade to color the ring
            if (nearestCity) {
              // If shade is 'none', treat it as 'faint' (gray)
              const shade = nearestCity.shade === 'none' ? 'faint' : nearestCity.shade;
              ringColor = getShadeColor(shade);
              // Adjust opacity based on shade - darker shades get more opacity
              if (shade === 'dark') {
                ringOpacity = 0.8;
                ringFillOpacity = 0.15;
              } else if (shade === 'medium') {
                ringOpacity = 0.6;
                ringFillOpacity = 0.1;
              } else {
                // faint shade - consistent opacity for all gray rings
                ringOpacity = 0.6;
                ringFillOpacity = 0.1;
              }
            } else {
              // No nearest city found - use gray (faint) with same opacity
              ringColor = getShadeColor('faint');
              ringOpacity = 0.6;
              ringFillOpacity = 0.1;
            }
          }

          // Calculate offset for overlapping markers at the same location
          // Find how many venues share the same coordinates (within 0.001 degrees ~ 100m)
          const sameLocationVenues = venues.filter((v, i) => 
            i < idx && 
            v.Latitude && 
            v.Longitude &&
            Math.abs(v.Latitude - Latitude) < 0.001 &&
            Math.abs(v.Longitude - Longitude) < 0.001
          );
          const offsetIndex = sameLocationVenues.length;
          
          // Apply small offset (about 50-100 meters) to prevent complete overlap
          // Offset in degrees: ~0.0005 degrees ≈ 50 meters
          const offsetLat = offsetIndex * 0.0005;
          const offsetLon = offsetIndex * 0.0005;
          const markerLat = Latitude + offsetLat;
          const markerLon = Longitude + offsetLon;

          return (
            <React.Fragment key={`olympic-${idx}`}>
              {/* Radius Ring around Olympic Venue - shade based on nearest city's filter score */}
              <Circle
                center={[Latitude, Longitude]}
                radius={radiusMeters}
                pathOptions={{
                  color: ringColor,
                  fillColor: ringColor,
                  fillOpacity: ringFillOpacity,
                  weight: 2,
                  dashArray: '10, 5',
                  opacity: ringOpacity
                }}
              />
              {/* Olympic Venue Marker - with offset if overlapping */}
              <VenueMarker
                center={[markerLat, markerLon]}
                sport={Sport}
                location={Location}
                radiusMiles={radiusMiles}
                color={color}
                onVenueClick={() => handleVenueClick(venue)}
                markerIndex={idx}
                openPopup={openPopupIndex === idx}
              />
            </React.Fragment>
          );
        })}

        {/* Business Intelligence Markers - Removed per professor's request */}

        <EnhancedLegendControl showBusinessData={true} showFilterShades={activeFilters !== null} />
      </MapContainer>
    </div>
  );
});

// Component to handle popup opening via map instance
const PopupController = ({ openPopup, center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (openPopup && center && center.length === 2) {
      const [targetLat, targetLon] = center;
      setTimeout(() => {
        // Find the marker at this center and open its popup
        map.eachLayer((layer) => {
          if (layer instanceof L.Marker) {
            const layerLatLng = layer.getLatLng();
            // Check if coordinates match (within small tolerance)
            const latDiff = Math.abs(layerLatLng.lat - targetLat);
            const lonDiff = Math.abs(layerLatLng.lng - targetLon);
            if (latDiff < 0.0001 && lonDiff < 0.0001) { // Very close coordinates
              if (layer.getPopup) {
                layer.openPopup();
              }
            }
          }
        });
      }, 400); // Wait for map animation to complete
    }
  }, [openPopup, center, map]);
  
  return null;
};

// Venue Marker component
const VenueMarker = ({ center, sport, location, radiusMiles, color, onVenueClick, markerIndex, openPopup }) => {
  const triangleIcon = createTriangleIcon(color);
  
  return (
    <>
      {openPopup && <PopupController openPopup={openPopup} center={center} />}
      <Marker
        position={center}
        icon={triangleIcon}
        eventHandlers={{
          click: onVenueClick
        }}
      >
        <Popup>
          <strong>{sport}</strong>
          <br />
          {location}
          <br />
          <span style={{ fontSize: '11px', color: '#6b7280' }}>
            Radius: {radiusMiles} miles
          </span>
          <br />
          <span style={{ fontSize: '10px', color: '#ec4899', fontStyle: 'italic', marginTop: '4px', display: 'block' }}>
            Click to see recommendation
          </span>
        </Popup>
      </Marker>
    </>
  );
};

VenueMarker.displayName = 'VenueMarker';

export default SportsVenuesMap;
