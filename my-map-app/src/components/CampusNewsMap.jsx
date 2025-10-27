// src/components/CampusNewsMap.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Center over U.S.
const defaultCenter = [39.5, -98.35];
const defaultZoom = 4;

// Custom legend
const Legend = () => {
  const map = useMap();
  useEffect(() => {
    const legend = L.control({ position: 'topright' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend');
      div.style.background = 'white';
      div.style.padding = '10px';
      div.style.borderRadius = '8px';
      div.style.boxShadow = '0 0 6px rgba(0,0,0,0.3)';
      div.style.fontSize = '14px';
      div.innerHTML = `
        <span style="display:inline-block;width:12px;height:12px;background:#2563eb;border-radius:50%;margin-right:6px;"></span>
        OCR Investigation
      `;
      return div;
    };
    legend.addTo(map);
    return () => map.removeControl(legend);
  }, [map]);
  return null;
};

export default function CampusNewsMap() {
  const [schools, setSchools] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoomLevel, setZoomLevel] = useState(defaultZoom);

  useEffect(() => {
    fetch("/schools_lat_long.json")
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setSchools(Array.isArray(data) ? data : []))
      .catch(err => console.error("❌ Error loading schools data:", err));
  }, []);

  const filteredSchools = useMemo(() =>
    schools.filter(s => (s.Raw_University || "").trim().toLowerCase().includes(searchQuery.toLowerCase())),
    [schools, searchQuery]
  );

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 flex flex-col gap-6 mt-6 w-full">
      {/* Intro on top */}
      <div className="p-4 rounded-lg shadow-sm border"
        style={{ background: "#dbeafe", color: "#1e3a8a" }}>
        <h3 className="font-semibold mb-2 text-base">
          📰 Campus News: Universities Under Investigation
        </h3>
        <p>
          💡 This map shows universities recently reported or investigated by OCR (Office for Civil Rights)
          related to **antisemitism practices and other civil rights issues on campus**. Click a marker for details.
        </p>
        <div className="mt-3">
          <input
            type="text"
            placeholder="🔍 Filter universities"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm w-full shadow-sm focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      {/* Map */}
      <div className="w-full" style={{ height: "80vh" }}>
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          className="w-full h-full rounded-lg"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          />
          <Legend />

          {filteredSchools.map((school, i) => {
            const lat = parseFloat(school.LATITUDE);
            const lon = parseFloat(school.LONGITUDE);
            const name = (school.Raw_University || "").trim();
            if (isNaN(lat) || isNaN(lon)) return null;

            return (
              <CircleMarker
                key={i}
                center={[lat, lon]}
                radius={8}
                fillColor="#2563eb"
                color="white"
                weight={1}
                fillOpacity={0.85}
              >
                {zoomLevel >= 12 && (
                  <Tooltip permanent direction="top">{name}</Tooltip>
                )}
                <Popup>
                  <strong>{name}</strong><br />
                  Under OCR Investigation
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
