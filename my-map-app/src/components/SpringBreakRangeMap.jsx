// src/components/SpringBreakRangeMap.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Tooltip,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Ivy League schools
const ivyLeagueSchools = [
  "Brown University", "Columbia University", "Cornell University", "Dartmouth College",
  "Harvard University", "Princeton University", "University of Pennsylvania", "Yale University"
];

// Star icon for Ivy League
const starIcon = new L.DivIcon({
  html: "⭐️",
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Helper: format date
const formatDate = (date) =>
  new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

// Helper: get week range
const getWeekRange = (startDate) => {
  const d = new Date(startDate);
  if (isNaN(d)) return null;
  const day = d.getDay();
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - day);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return `${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
};

// Color palette (light → dark pink)
const colorPalette = ["#fde0dd", "#fa9fb5", "#f768a1", "#dd3497", "#ae017e", "#7a0177", "#49006a"];

const LegendControl = ({ label, weekMap }) => {
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
      div.innerHTML = `<strong>${label}</strong><br/>`;
      Object.entries(weekMap).forEach(([range, color]) => {
        div.innerHTML += `<div><span style="background:${color}; width:12px; height:12px; display:inline-block; margin-right:6px; border-radius:50%;"></span>${range}</div>`;
      });
      div.innerHTML += `<div style="margin-top:8px;">⭐️ Ivy League</div>`;
      return div;
    };
    legend.addTo(map);
    return () => legend.remove();
  }, [map, label, weekMap]);
  return null;
};

export default function SpringBreakRangeMap({ universities = [] }) {
  const defaultCenter = [38, -97];
  const defaultZoom = 3.7;
  const [zoom, setZoom] = useState(defaultZoom);
  const [search, setSearch] = useState("");

  const ZoomTracker = () => {
    useMapEvents({ zoomend: (e) => setZoom(e.target.getZoom()) });
    return null;
  };

  const validUnis = useMemo(() => universities.filter(
    (u) => u.LATITUDE && u.LONGITUDE && u["Spring Break Begins"] && u["Spring Break Ends"]
  ), [universities]);

  const filteredBySearch = useMemo(() => validUnis.filter(
    (u) => (u["University Name"] || "").toLowerCase().includes(search.toLowerCase())
  ), [validUnis, search]);

  const weekRanges = [...new Set(filteredBySearch.map((u) => getWeekRange(u["Spring Break Begins"])))]
    .filter(Boolean)
    .sort((a, b) => new Date(a.split("–")[0]) - new Date(b.split("–")[0]));

  const weekColorMap = Object.fromEntries(
    weekRanges.map((range, i) => [range, colorPalette[i % colorPalette.length]])
  );

  return (
    <div className="bg-white rounded-2xl shadow-md p-0 flex flex-col gap-0 mt-6 w-full">
      {/* Intro on top, inside map box look */}
      <div className="px-5 py-4 border-b rounded-t-2xl" style={{
        background: "#f9f9fa",
        borderColor: "#e0e0e0",
        color: "#4a154b"
      }}>
        <h3 className="font-semibold text-base mb-1">🌴 Spring Break Ranges</h3>
        <p className="text-sm leading-relaxed">
          💡 This map shows <strong>Spring Break start and end dates</strong> grouped by week ranges (Sun–Sat).
          Use the search box to filter universities and compare break periods across the U.S.
        </p>
        <div className="mt-2">
          <input
            type="text"
            placeholder="🔍 Filter universities"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm w-full shadow-sm focus:ring-2 focus:ring-pink-200"
          />
        </div>
      </div>

      {/* Map below */}
      <div className="w-full rounded-b-2xl overflow-hidden" style={{ height: "80vh" }}>
        <MapContainer center={defaultCenter} zoom={defaultZoom} className="w-full h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
          <ZoomTracker />
          <LegendControl label="2026 Spring Break Week Ranges" weekMap={weekColorMap} />
          {filteredBySearch.map((uni, i) => {
            const lat = parseFloat(uni.LATITUDE);
            const lon = parseFloat(uni.LONGITUDE);
            const weekRange = getWeekRange(uni["Spring Break Begins"]);
            const color = weekColorMap[weekRange] || "gray";
            const isIvy = ivyLeagueSchools.includes(uni["University Name"]);
            return isIvy ? (
              <Marker key={`ivy-${i}`} position={[lat, lon]} icon={starIcon}>
                {zoom >= 12 && (
                  <Tooltip permanent direction="top">⭐️ {uni["University Name"]}</Tooltip>
                )}
                <Popup>
                  <strong>⭐️ {uni["University Name"]}</strong><br />
                  Spring Break: {formatDate(uni["Spring Break Begins"])} – {formatDate(uni["Spring Break Ends"])}
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
                  <Tooltip permanent direction="top">{uni["University Name"]}</Tooltip>
                )}
                <Popup>
                  <strong>{uni["University Name"]}</strong><br />
                  Spring Break: {formatDate(uni["Spring Break Begins"])} – {formatDate(uni["Spring Break Ends"])}
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
