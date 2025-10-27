// src/components/FallSemesterRangeMap.jsx
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

// Ivy League list
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

// Helpers
const formatDate = (date) =>
  new Date(date).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric"
  });

const getWeekRange = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
};

const colorPalette = ["#fdd0a2", "#fdae6b", "#fd8d3c", "#f16913", "#d94801", "#a63603", "#7f2704"];

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
        div.innerHTML += `<div><span style="background:${color};width:12px;height:12px;display:inline-block;margin-right:6px;border-radius:50%;"></span>${range}</div>`;
      });
      div.innerHTML += `<div style="margin-top:8px;">⭐️ Ivy League</div>`;
      return div;
    };
    legend.addTo(map);
    return () => legend.remove();
  }, [map, label, weekMap]);
  return null;
};

export default function FallSemesterRangeMap({ universities = [], dateKey = "First Day of Classes Fall 2025", label = "Start of Fall 2025" }) {
  const defaultCenter = [38, -97];
  const defaultZoom = 3.7;
  const [zoom, setZoom] = useState(defaultZoom);
  const [search, setSearch] = useState("");

  const ZoomTracker = () => {
    useMapEvents({ zoomend: (e) => setZoom(e.target.getZoom()) });
    return null;
  };

  const validUnis = useMemo(() => universities.filter(
    (u) => u.LATITUDE && u.LONGITUDE && u[dateKey]
  ), [universities, dateKey]);

  const filteredBySearch = useMemo(() => validUnis.filter(
    (u) => (u["University Name"] || "").toLowerCase().includes(search.toLowerCase())
  ), [validUnis, search]);

  const weekRanges = [...new Set(filteredBySearch.map((u) => getWeekRange(u[dateKey])))]
    .filter(Boolean)
    .sort((a, b) => new Date(a.split("–")[0]) - new Date(b.split("–")[0]));

  const weekColorMap = Object.fromEntries(
    weekRanges.map((range, i) => [range, colorPalette[i % colorPalette.length]])
  );

  return (
    <div className="bg-white rounded-2xl shadow-md p-0 flex flex-col gap-0 mt-6 w-full">
      {/* Intro on top */}
      <div className="px-5 py-4 border-b rounded-t-2xl" style={{
        background: "#fff6f0",
        borderColor: "#eedad2",
        color: "#8b3a00"
      }}>
        <h3 className="font-semibold text-base mb-1">📅 {label}</h3>
        <p className="text-sm leading-relaxed">
          💡 Circles represent <strong>{label.toLowerCase()}</strong> by week range (Sun–Sat).
          Use the search box to filter universities.
        </p>
        <div className="mt-2">
          <input
            type="text"
            placeholder="🔍 Filter universities"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm w-full shadow-sm focus:ring-2 focus:ring-orange-200"
          />
        </div>
      </div>

      {/* Map area */}
      <div className="w-full rounded-b-2xl overflow-hidden" style={{ height: "80vh" }}>
        <MapContainer center={defaultCenter} zoom={defaultZoom} className="w-full h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
          <ZoomTracker />
          <LegendControl label={`${label} Week Ranges`} weekMap={weekColorMap} />
          {filteredBySearch.map((uni, i) => {
            const lat = parseFloat(uni.LATITUDE);
            const lon = parseFloat(uni.LONGITUDE);
            const date = uni[dateKey];
            const weekRange = getWeekRange(date);
            const color = weekColorMap[weekRange] || "gray";
            const isIvy = ivyLeagueSchools.includes(uni["University Name"]);
            return isIvy ? (
              <Marker key={`ivy-${i}`} position={[lat, lon]} icon={starIcon}>
                {zoom >= 12 && (
                  <Tooltip permanent direction="top">⭐️ {uni["University Name"]}</Tooltip>
                )}
                <Popup>
                  <strong>⭐️ {uni["University Name"]}</strong><br />
                  {label}: {formatDate(date)}
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
                  {label}: {formatDate(date)}
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
