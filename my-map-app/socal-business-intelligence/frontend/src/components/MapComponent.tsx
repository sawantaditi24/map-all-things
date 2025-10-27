'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface LocationData {
  area: string;
  score: number;
  reasons: string[];
  coordinates: [number, number];
  business_density: number;
  population_density: number;
  transport_score: number;
}

interface MapComponentProps {
  locations: LocationData[];
  onLocationClick: (location: LocationData) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ locations, onLocationClick }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

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

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(marker => marker.remove());

    // Add markers for each location
    locations.forEach((location) => {
      const { area, score, coordinates } = location;
      
      // Determine color based on score - Pink/Gray/Black theme
      let color = '#ef4444'; // Red for low scores
      if (score >= 8) color = '#ec4899'; // Pink for high scores
      else if (score >= 6) color = '#6b7280'; // Gray for medium scores

      // Create marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      markerElement.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: ${color};
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        color: white;
      `;
      markerElement.textContent = Math.round(score).toString();

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setHTML(`
        <div class="p-3 bg-white rounded-lg shadow-lg border border-pink-100">
          <h3 class="font-bold text-lg text-gray-900">${area}</h3>
          <p class="text-sm text-pink-600 font-medium">Score: ${score}/10</p>
          <p class="text-xs text-gray-500">Click for details</p>
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
    });

  }, [locations, mapLoaded, onLocationClick]);

  return (
    <div className="w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg shadow-lg" />
    </div>
  );
};

export default MapComponent;
