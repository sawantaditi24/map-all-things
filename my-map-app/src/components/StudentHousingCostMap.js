// src/components/StudentHousingCostMap.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Popup,
  Tooltip,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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

const costRanges = [
  { label: "< $800", color: "#cce5ff" },
  { label: "$800 – $1,100", color: "#99ccff" },
  { label: "$1,100 – $1,400", color: "#66b2ff" },
  { label: "$1,400 – $1,700", color: "#3399ff" },
  { label: "$1,700 – $2,000", color: "#007acc" },
  { label: "> $2,000", color: "#005fa3" },
];

export default function StudentHousingCostMap({ universities = [] }) {
  const [zoom, setZoom] = useState(4);
  const [search, setSearch] = useState("");

  const ZoomHandler = () => {
    useMapEvents({ zoomend: (e) => setZoom(e.target.getZoom()) });
    return null;
  };

  const LegendControl = () => {
    const map = useMap();
    useEffect(() => {
      const legend = L.control({ position: "topright" });
      legend.onAdd = () => {
        const div = L.DomUtil.create("div", "leaflet-control info legend");
        div.style.background = "white";
        div.style.padding = "10px";
        div.style.borderRadius = "12px";
        div.style.boxShadow = "0 0 10px rgba(0,0,0,0.1)";
        div.style.fontSize = "14px";
        div.innerHTML = `<strong>Monthly Housing Cost</strong><br/>`;
        costRanges.forEach(({ label, color }) => {
          div.innerHTML += `<div><span style="background:${color}; width:12px; height:12px; display:inline-block; margin-right:6px; border-radius:50%;"></span>${label}</div>`;
        });
        div.innerHTML += `<div style="margin-top:8px;">⭐️ Ivy League</div>`;
        return div;
      };
      legend.addTo(map);
      return () => legend.remove();
    }, [map]);
    return null;
  };

  const getCostColor = (costVal) => {
    const cost = parseInt(String(costVal || "").replace(/[^0-9]/g, ""), 10) || 0;
    if (cost < 800) return costRanges[0].color;
    if (cost < 1100) return costRanges[1].color;
    if (cost < 1400) return costRanges[2].color;
    if (cost < 1700) return costRanges[3].color;
    if (cost < 2000) return costRanges[4].color;
    return costRanges[5].color;
  };

  const filtered = universities.filter((u) => u.LATITUDE && u.LONGITUDE);

  const filteredBySearch = useMemo(() => {
    return filtered.filter((u) =>
      (u["University Name"] || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [filtered, search]);

  return (
    <div className="bg-white rounded-2xl shadow-md flex flex-col gap-0 mt-6 w-full">
      {/* Intro on top */}
      <div className="px-5 py-4 border-b rounded-t-2xl" style={{
        backgroundColor: "#f0f8ff",
        borderColor: "#cce5ff",
        color: "#005fa3"
      }}>
        <h3 className="font-semibold text-base mb-1">🏡 Student Housing Costs Explained</h3>
        <p className="text-sm leading-relaxed">
          💡 <strong>Example:</strong> Renting near a rural campus may cost <strong>$750/month</strong> (light blue marker),
          while NYC or SF can soar above <strong>$2,500/month</strong> (dark blue marker). Compare average monthly housing costs to budget smartly!
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

      {/* Map below */}
      <div className="w-full rounded-b-2xl overflow-hidden" style={{ height: "80vh" }}>
        <MapContainer center={[39.5, -98.35]} zoom={4} className="w-full h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
          <ZoomHandler />
          <LegendControl />
          {filteredBySearch.map((uni, i) => {
            const lat = parseFloat(uni.LATITUDE);
            const lon = parseFloat(uni.LONGITUDE);
            if (isNaN(lat) || isNaN(lon)) return null;

            const name = uni["University Name"] || "Unknown University";
            const isIvy = ivyLeagueSchools.includes(name);
            const rawRent = uni["Estimated Monthly Housing Cost"];
            const numericRent = parseInt(String(rawRent).replace(/[^0-9]/g, ""), 10);
            const formattedRent = isNaN(numericRent)
              ? "N/A"
              : `$${numericRent.toLocaleString()}`;

            return isIvy ? (
              <Marker key={`ivy-${i}`} position={[lat, lon]} icon={starIcon}>
                <Tooltip permanent={zoom >= 12}>⭐️ {name}</Tooltip>
                <Popup>
                  <strong>⭐️ {name}</strong><br />Rent: {formattedRent}
                </Popup>
              </Marker>
            ) : (
              <CircleMarker
                key={i}
                center={[lat, lon]}
                radius={8}
                fillColor={getCostColor(uni["Estimated Monthly Housing Cost"])}
                color="white"
                weight={1}
                fillOpacity={0.9}
              >
                <Tooltip permanent={zoom >= 12}>{name}</Tooltip>
                <Popup>
                  <strong>{name}</strong><br />Rent: {formattedRent}
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
