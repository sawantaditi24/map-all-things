// src/components/AIUniversitiesMap.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Popup,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Ivy League Schools
const ivyLeagueSchools = [
  "Brown University", "Columbia University", "Cornell University", "Dartmouth College",
  "Harvard University", "Princeton University", "University of Pennsylvania", "Yale University"
];

const starIcon = new L.DivIcon({
  html: "⭐️",
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Rank-based colors (darker = higher rank)
const rankPalette = [
  "#0d47a1", "#1565c0", "#1976d2", "#1e88e5", "#2196f3",
  "#42a5f5", "#64b5f6", "#90caf9", "#bbdefb", "#e3f2fd"
];

// Legend control
const LegendControl = ({ label }) => {
  const map = useMap();

  useEffect(() => {
    const legend = L.control({ position: "topright" });
    legend.onAdd = () => {
      const div = L.DomUtil.create("div", "info legend");
      div.style.background = "white";
      div.style.padding = "10px";
      div.style.borderRadius = "8px";
      div.style.boxShadow = "0 0 6px rgba(0,0,0,0.3)";
      div.style.fontSize = "14px";

      div.innerHTML += `<strong>${label}</strong><br/>`;
      const ranges = [
        ["#1–3", rankPalette[0]],
        ["#4–6", rankPalette[1]],
        ["#7–10", rankPalette[2]],
        ["#11–15", rankPalette[3]],
        ["#16+", rankPalette[4]],
      ];

      ranges.forEach(([label, color]) => {
        div.innerHTML += `<div><span style="background:${color}; width:12px; height:12px; display:inline-block; margin-right:6px; border-radius:50%;"></span>${label}</div>`;
      });

      div.innerHTML += `<div style="margin-top:8px;">⭐️ Ivy League</div>`;
      return div;
    };

    legend.addTo(map);
    return () => legend.remove();
  }, [map, label]);

  return null;
};

export default function AIUniversitiesMap() {
  const [data, setData] = useState([]);
  const [zoom, setZoom] = useState(4);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/AI_University_Rankings.json")
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((json) => setData(Array.isArray(json) ? json : []))
      .catch(() => setData([]));
  }, []);

  const ZoomHandler = () => {
    useMapEvents({ zoomend: (e) => setZoom(e.target.getZoom()) });
    return null;
  };

  const filtered = useMemo(() => {
    return data.filter((u) =>
      (u.University || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const getRankColor = (rank) => {
    if (rank <= 3) return rankPalette[0];
    if (rank <= 6) return rankPalette[1];
    if (rank <= 10) return rankPalette[2];
    if (rank <= 15) return rankPalette[3];
    return rankPalette[4];
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-0 flex flex-col gap-0 mt-6 w-full">
      {/* Intro Box */}
      <div className="px-6 py-4 border-b rounded-t-2xl" style={{
        backgroundColor: "#e3f2fd",
        borderColor: "#90caf9",
        color: "#0d47a1"
      }}>
        <h3 className="font-semibold text-lg mb-1">🤖 AI University Rankings (US News 2025)</h3>
        <p className="text-sm leading-relaxed">
          💡 These universities are ranked for their AI graduate programs
          by U.S. News. Top-ranked schools are shaded with darker blue markers.
        </p>
        <div className="mt-2">
          <input
            type="text"
            placeholder="🔍 Filter universities"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm w-full shadow-sm focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      {/* Map */}
      <div className="w-full rounded-b-2xl overflow-hidden" style={{ height: "75vh" }}>
        <MapContainer center={[39.5, -98.35]} zoom={4} className="w-full h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
          <ZoomHandler />
          <LegendControl label="Top AI Programs by Ranking" />
          {filtered.map((uni, i) => {
            const lat = parseFloat(uni.LATITUDE);
            const lon = parseFloat(uni.LONGITUDE);
            const rank = parseInt(uni["Actual Rank"], 10);
            const name = uni.University;
            const link = uni.Weblink;
            const color = getRankColor(rank);
            const isIvy = ivyLeagueSchools.includes(name);

            return isIvy ? (
              <Marker key={`ivy-${i}`} position={[lat, lon]} icon={starIcon}>
                <Tooltip permanent={zoom >= 12}>⭐️ {name} (#{rank})</Tooltip>
                <Popup>
                  <strong>⭐️ {name}</strong><br />
                  Rank #{rank}<br />
                  <a href={link} target="_blank" rel="noopener noreferrer">View Profile</a>
                </Popup>
              </Marker>
            ) : (
              <CircleMarker
                key={i}
                center={[lat, lon]}
                radius={8}
                fillColor={color}
                color="white"
                weight={1}
                fillOpacity={0.9}
              >
                {zoom >= 12 && (
                  <Tooltip permanent direction="top">{name} (#{rank})</Tooltip>
                )}
                <Popup>
                  <strong>{name}</strong><br />
                  Rank #{rank}<br />
                  <a href={link} target="_blank" rel="noopener noreferrer">View Profile</a>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
