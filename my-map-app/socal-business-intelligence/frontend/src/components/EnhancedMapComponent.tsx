'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@/styles/mapbox.css';

interface LocationData {
  area: string;
  score: number;
  reasons: string[];
  coordinates: [number, number];
  business_density: number;
  population_density: number;
  transport_score: number;
}

interface EnhancedMapComponentProps {
  locations: LocationData[];
  onLocationClick: (location: LocationData) => void;
  activeFilters?: any; // For radius visualization
  showHeatMap?: boolean;
  heatMapMetric?: 'business_density' | 'population_density' | 'transport_score';
}

const EnhancedMapComponent: React.FC<EnhancedMapComponentProps> = ({ 
  locations, 
  onLocationClick, 
  activeFilters,
  showHeatMap = false,
  heatMapMetric = 'business_density'
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const circlesRef = useRef<mapboxgl.CircleLayer[]>([]);

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    // Set your Mapbox access token
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-118.2437, 34.0522], // Los Angeles center
      zoom: 10,
      pitch: 0,
      bearing: 0
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Helper function to get gradient color based on score
  const getScoreColor = (score: number) => {
    if (score >= 9) return '#ec4899'; // Bright pink
    if (score >= 8) return '#f472b6'; // Pink
    if (score >= 7) return '#fb7185'; // Light pink
    if (score >= 6) return '#6b7280'; // Gray
    if (score >= 5) return '#9ca3af'; // Light gray
    if (score >= 4) return '#d1d5db'; // Very light gray
    return '#ef4444'; // Red for low scores
  };

  // Helper function to get marker size based on score
  const getMarkerSize = (score: number) => {
    const baseSize = 20;
    const sizeMultiplier = 0.5 + (score / 10) * 1.5; // 0.5x to 2x size
    return Math.round(baseSize * sizeMultiplier);
  };

  // Helper function to create gradient marker
  const createGradientMarker = (score: number, size: number) => {
    const color = getScoreColor(score);
    const markerElement = document.createElement('div');
    markerElement.className = 'gradient-marker';
    markerElement.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: radial-gradient(circle, ${color} 0%, ${color}80 70%, ${color}40 100%);
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 2px ${color}40;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${Math.max(8, size * 0.4)}px;
      font-weight: bold;
      color: white;
      text-shadow: 0 1px 2px rgba(0,0,0,0.5);
      transition: all 0.3s ease;
    `;
    markerElement.textContent = Math.round(score).toString();
    
    // Add hover effects - Use box-shadow instead of transform to avoid positioning issues
    markerElement.addEventListener('mouseenter', () => {
      markerElement.style.boxShadow = '0 6px 20px rgba(236, 72, 153, 0.6), 0 0 0 4px rgba(236, 72, 153, 0.3)';
      markerElement.style.zIndex = '1000';
    });
    
    markerElement.addEventListener('mouseleave', () => {
      markerElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3), 0 0 0 2px rgba(236, 72, 153, 0.4)';
      markerElement.style.zIndex = 'auto';
    });

    return markerElement;
  };

  // Add radius circles for active filters
  const addRadiusCircles = () => {
    if (!map.current || !activeFilters || !locations.length) return;

    // Clear existing circles
    circlesRef.current.forEach(circle => {
      if (map.current?.getLayer(circle.id)) {
        map.current.removeLayer(circle.id);
        map.current.removeSource(circle.id);
      }
    });
    circlesRef.current = [];

    // Add radius circles around each location
    locations.forEach((location, index) => {
      const radius = 2000; // 2km radius
      const circleId = `radius-${index}`;
      
      if (map.current) {
        map.current.addSource(circleId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: location.coordinates
            },
            properties: {}
          }
        });

        map.current.addLayer({
          id: circleId,
          type: 'circle',
          source: circleId,
          paint: {
            'circle-radius': {
              stops: [
                [0, 0],
                [20, radius]
              ],
              base: 2
            },
            'circle-color': '#ec4899',
            'circle-opacity': 0.1,
            'circle-stroke-color': '#ec4899',
            'circle-stroke-width': 2,
            'circle-stroke-opacity': 0.3
          }
        });

        circlesRef.current.push({ id: circleId } as any);
      }
    });
  };

  // Add heat map overlay
  const addHeatMapOverlay = () => {
    if (!map.current || !showHeatMap || !locations.length) return;

    const heatMapData = {
      type: 'FeatureCollection' as const,
      features: locations.map(location => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: location.coordinates
        },
        properties: {
          intensity: location[heatMapMetric] / 100 // Normalize for heat map
        }
      }))
    };

    if (map.current.getSource('heatmap-source')) {
      map.current.removeLayer('heatmap-layer');
      map.current.removeSource('heatmap-source');
    }

    map.current.addSource('heatmap-source', {
      type: 'geojson',
      data: heatMapData
    });

    map.current.addLayer({
      id: 'heatmap-layer',
      type: 'heatmap',
      source: 'heatmap-source',
      paint: {
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['get', 'intensity'],
          0, 0,
          1, 1
        ],
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 1.2,  // Subtle intensity
          15, 2.5,  // Moderate intensity at max zoom
        ],
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(236,72,153,0)',      // Transparent pink
          0.1, 'rgba(236,72,153,0.1)',  // Very light pink
          0.3, 'rgba(236,72,153,0.2)',  // Light pink
          0.5, 'rgba(236,72,153,0.3)',  // Medium pink
          0.7, 'rgba(236,72,153,0.4)',  // Slightly darker pink
          0.85, 'rgba(219,39,119,0.5)', // Rose pink
          0.95, 'rgba(219,39,119,0.6)', // Darker rose pink
          1, 'rgba(190,24,93,0.7)'      // Deep pink
        ],
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 15,   // Much larger base radius
          5, 30,   // Larger at medium zoom
          10, 50,  // Much larger at higher zoom
          15, 80,  // Very large at max zoom
        ],
        'heatmap-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 0.4,   // Subtle base opacity
          7, 0.6,   // Moderate opacity at medium zoom
          15, 0.5,  // Slightly reduced at max zoom
        ]
      }
    });
  };

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add enhanced markers for each location
    locations.forEach((location) => {
      const { area, score, coordinates } = location;
      const size = getMarkerSize(score);
      
      // Create enhanced marker element
      const markerElement = createGradientMarker(score, size);

      // Create enhanced popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        className: 'custom-popup'
      }).setHTML(`
        <div class="p-4 bg-white rounded-xl shadow-xl border border-pink-100 min-w-[200px]">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-lg text-gray-900">${area}</h3>
            <div class="px-3 py-1 rounded-full text-sm font-bold ${score >= 8 ? 'bg-pink-100 text-pink-700' : score >= 6 ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'}">
              ${score}/10
            </div>
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Population:</span>
              <span class="font-medium">${location.population_density.toLocaleString()}/mi²</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Businesses:</span>
              <span class="font-medium">${location.business_density}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Transport:</span>
              <span class="font-medium">${location.transport_score}/10</span>
            </div>
          </div>
          <div class="mt-3 pt-2 border-t border-gray-100">
            <p class="text-xs text-pink-600 font-medium">Click for detailed analysis</p>
          </div>
        </div>
      `);

      // Create marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(map.current!);

      // Add click handler
      markerElement.addEventListener('click', () => {
        onLocationClick(location);
      });

      markersRef.current.push(marker);
    });

    // Add radius circles if filters are active
    if (activeFilters) {
      addRadiusCircles();
    }

    // Add heat map if enabled
    if (showHeatMap) {
      addHeatMapOverlay();
    }

  }, [locations, mapLoaded, onLocationClick, activeFilters, showHeatMap, heatMapMetric]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="w-full h-full rounded-lg shadow-lg" />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        {showHeatMap && (
          <div className="bg-white rounded-lg shadow-lg p-3 border border-pink-100">
            <div className="text-xs font-medium text-gray-700 mb-2">Heat Map</div>
            <div className="text-xs text-gray-600">
              {heatMapMetric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </div>
          </div>
        )}
        
        {activeFilters && (
          <div className="bg-white rounded-lg shadow-lg p-3 border border-pink-100">
            <div className="text-xs font-medium text-gray-700 mb-1">Filter Radius</div>
            <div className="text-xs text-gray-600">2km coverage</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedMapComponent;
