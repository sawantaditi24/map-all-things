// src/components/EntertainmentVenuesMap.jsx
import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Example events
const entertainmentEvents = [
  { artist: "Taylor Swift", event: "Concert", lat: 40.7128, lon: -74.0060, city: "New York" },
  { artist: "Beyoncé", event: "Concert", lat: 34.0522, lon: -118.2437, city: "Los Angeles" },
  { artist: "Ed Sheeran", event: "Concert", lat: 41.8781, lon: -87.6298, city: "Chicago" },
  { artist: "Adele", event: "Show", lat: 36.1699, lon: -115.1398, city: "Las Vegas" },
  { artist: "Coldplay", event: "Concert", lat: 29.7604, lon: -95.3698, city: "Houston" },
  // Add more!
];

export default function EntertainmentVenuesMap() {
  const centerUSA = [39.8283, -98.5795]; // Center of continental USA

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-center">🎭 Celebrity Concerts and Entertainment Events</h2>
      <MapContainer center={centerUSA} zoom={4} style={{ height: "70vh", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
        {entertainmentEvents.map((event, idx) => (
          <Marker key={idx} position={[event.lat, event.lon]}>
            <Popup>
              <strong>{event.artist}</strong><br />
              {event.event} in {event.city}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
