// src/components/MapByFinalDate.jsx
import React, { useEffect, useMemo, useState } from "react";
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
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Format for popup
const formatDate = (dateInput) => {
  const d = new Date(dateInput);
  if (isNaN(d)) return "N/A";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Format for week range
const getWeekRange = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const day = d.getDay();
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - day);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return `${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
};

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

const LegendControl = ({ label, bucketColorMap }) => {
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
      div.innerHTML = `<div style="font-weight: bold; margin-bottom: 5px;">${label} Week Ranges</div>`;
      Object.entries(bucketColorMap).forEach(([range, color]) => {
        div.innerHTML += `<div><span style="background:${color}; width:12px; height:12px; display:inline-block; margin-right:6px; border-radius:50%;"></span>${range}</div>`;
      });
      div.innerHTML += `<div style="margin-top:8px;">⭐️ Ivy League</div>`;
      return div;
    };
    legend.addTo(map);
    return () => legend.remove();
  }, [map, label, bucketColorMap]);
  return null;
};

export default function MapByFinalDate({ universities = [], dateKey, label }) {
  const defaultCenter = [39.5, -98.35];
  const [zoom, setZoom] = useState(4);
  const [search, setSearch] = useState("");

  const ZoomTracker = () => {
    useMapEvents({ zoomend: (e) => setZoom(e.target.getZoom()) });
    return null;
  };

  const filtered = useMemo(() => universities.filter(
    (u) => u.LATITUDE && u.LONGITUDE && u[dateKey]
  ), [universities, dateKey]);

  const filteredBySearch = useMemo(() => filtered.filter(
    (u) => (u["University Name"] || "").toLowerCase().includes(search.toLowerCase())
  ), [filtered, search]);

  const weekRanges = [...new Set(filteredBySearch.map((u) => getWeekRange(u[dateKey])))]
    .filter(Boolean)
    .sort((a, b) => new Date(a.split("–")[0].trim()) - new Date(b.split("–")[0].trim()));

  let numBuckets = 5;
  if (weekRanges.length > 10) numBuckets = 7;
  else if (weekRanges.length > 7) numBuckets = 6;
  else if (weekRanges.length < 5) numBuckets = weekRanges.length;

  const bucketSize = Math.ceil(weekRanges.length / numBuckets);
  const buckets = [];
  for (let i = 0; i < numBuckets; i++) {
    const startIdx = i * bucketSize;
    const endIdx = startIdx + bucketSize;
    const group = weekRanges.slice(startIdx, endIdx);
    if (group.length > 0) {
      const startDate = group[0].split("–")[0].trim();
      const endDate = group[group.length - 1].split("–")[1].trim();
      buckets.push({
        range: `${startDate} – ${endDate}`,
        dates: group
      });
    }
  }

  // Theme based on label
  let introBg = "#ede7f6", introBorder = "#b39ddb", introText = "#4a148c";
  let palette = ["#ede7f6", "#d1c4e9", "#b39ddb", "#9575cd", "#7e57c2", "#673ab7", "#512da8"];
  if (label.toLowerCase().includes("start")) {
    introBg = "#e3f2fd"; introBorder = "#90caf9"; introText = "#0d47a1";
    palette = ["#2196f3", "#1976d2", "#1565c0", "#0d47a1", "#003c8f", "#002171", "#001858"];
  }

  const weekToColorMap = {};
  buckets.forEach((bucket, i) => {
    bucket.dates.forEach((week) => {
      weekToColorMap[week] = palette[i % palette.length];
    });
  });

  const bucketColorMap = {};
  buckets.forEach((bucket, i) => {
    bucketColorMap[bucket.range] = palette[i % palette.length];
  });

  return (
    <div className="bg-white rounded-2xl shadow-md p-0 flex flex-col gap-0 mt-6 w-full">
      {/* Intro */}
      <div className="px-6 py-4 border-b rounded-t-2xl" style={{
        backgroundColor: introBg,
        borderColor: introBorder,
        color: introText
      }}>
        <h3 className="font-semibold text-lg mb-1">{label}</h3>
        <p className="text-sm leading-relaxed">
  💡 This map shows the timing of <strong className="uppercase">{label}</strong> across universities, grouped by weekly range. 
  Use the search box to find a specific school.
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

      {/* Map */}
      <div className="w-full rounded-b-2xl overflow-hidden" style={{ height: "75vh" }}>
        <MapContainer center={defaultCenter} zoom={4} className="w-full h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
          <ZoomTracker />
          <LegendControl label={label} bucketColorMap={bucketColorMap} />
          {filteredBySearch.map((uni, i) => {
            const lat = parseFloat(uni.LATITUDE);
            const lon = parseFloat(uni.LONGITUDE);
            const uniDate = uni[dateKey];
            const weekRange = getWeekRange(uniDate);
            const color = weekToColorMap[weekRange] || "gray";
            const isIvy = ivyLeagueSchools.includes(uni["University Name"]);
            return isIvy ? (
              <Marker key={`ivy-${i}`} position={[lat, lon]} icon={starIcon}>
                <Tooltip permanent={zoom >= 12}>⭐️ {uni["University Name"]}</Tooltip>
                <Popup>
                  <strong>⭐️ {uni["University Name"]}</strong><br />
                  {label}: {formatDate(uniDate)}
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
                  {label}: {formatDate(uniDate)}
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
