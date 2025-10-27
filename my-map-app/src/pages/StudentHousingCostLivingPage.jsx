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

// Ivy League schools
const ivyLeagueSchools = [
  "Brown University",
  "Columbia University",
  "Cornell University",
  "Dartmouth College",
  "Harvard University",
  "Princeton University",
  "University of Pennsylvania",
  "Yale University"
];

const starIcon = new L.DivIcon({
  html: "⭐️",
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export default function StudentHousingCostMap({ universities = [] }) {
  const [selected, setSelected] = useState(null);
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
        const ranges = [
          ["< $800", "#cce5ff"],
          ["$800 – $1,100", "#99ccff"],
          ["$1,100 – $1,400", "#66b2ff"],
          ["$1,400 – $1,700", "#3399ff"],
          ["$1,700 – $2,000", "#007acc"],
          ["> $2,000", "#005fa3"],
        ];
        ranges.forEach(([label, color]) => {
          div.innerHTML +=
            `<div><span style=\"background:${color}; width:12px; height:12px; display:inline-block; margin-right:6px; border-radius:50%;\"></span>${label}</div>`;
        });
        div.innerHTML += `<div style="margin-top:8px;"><span>⭐️ Ivy League</span></div>`;
        return div;
      };
      legend.addTo(map);
      return () => legend.remove();
    }, [map]);
    return null;
  };

  const getCostColor = (costVal) => {
    const cost = parseInt(String(costVal || "").replace(/[^0-9]/g, ""), 10) || 0;
    if (cost < 800) return "#cce5ff";
    if (cost < 1100) return "#99ccff";
    if (cost < 1400) return "#66b2ff";
    if (cost < 1700) return "#3399ff";
    if (cost < 2000) return "#007acc";
    return "#005fa3";
  };

  const filtered = universities.filter((u) => u.LATITUDE && u.LONGITUDE);

  const filteredBySearch = useMemo(() => {
    return filtered.filter((u) =>
      (u["University Name"] || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [filtered, search]);

  const ZoomToMatch = () => {
    const map = useMap();
    useEffect(() => {
      const exact = filtered.find(
        (u) => (u["University Name"] || "").toLowerCase() === search.trim().toLowerCase()
      );
      if (exact && exact.LATITUDE && exact.LONGITUDE) {
        const lat = parseFloat(exact.LATITUDE);
        const lon = parseFloat(exact.LONGITUDE);
        if (!isNaN(lat) && !isNaN(lon)) {
          map.flyTo([lat, lon], 12, { duration: 1.2 });
          setSelected(exact);
        }
      }
    }, [search]);
    return null;
  };

  if (!filtered.length) {
    return <p className="text-gray-500">No housing data available.</p>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-4">
      <div className="mb-3 flex justify-end gap-2">
        <input
          type="text"
          placeholder="🔍 Filter university"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm w-64"
        />
      </div>

      <MapContainer
        center={[39.5, -98.35]}
        zoom={4}
        style={{ height: "65vh", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
        <ZoomHandler />
        <LegendControl />
        <ZoomToMatch />

        {filteredBySearch.map((uni, i) => {
          const lat = parseFloat(uni.LATITUDE);
          const lon = parseFloat(uni.LONGITUDE);
          if (isNaN(lat) || isNaN(lon)) return null;

          const name = uni["University Name"] || "Unknown University";
          const isIvy = ivyLeagueSchools.includes(name);

          if (isIvy) {
            return (
              <Marker key={`ivy-${i}`} position={[lat, lon]} icon={starIcon}>
                <Tooltip permanent={zoom >= 12}>⭐️ {name}</Tooltip>
                <Popup>
                  <strong>⭐️ {name}</strong>
                  <br />
                  Rent: {uni["Estimated Monthly Housing Cost"]}
                </Popup>
              </Marker>
            );
          }

          const color = getCostColor(uni["Estimated Monthly Housing Cost"]);
          return (
            <CircleMarker
              key={i}
              center={[lat, lon]}
              radius={8}
              fillColor={color}
              color="white"
              weight={1}
              fillOpacity={0.9}
              eventHandlers={{ click: () => setSelected(uni) }}
            >
              <Tooltip permanent={zoom >= 12}>{name}</Tooltip>
              <Popup>
                <strong>{name}</strong>
                <br />
                Rent: {uni["Estimated Monthly Housing Cost"]}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {selected && (
        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <h4 className="font-bold text-blue-900 mb-2">
            {selected["University Name"]}
          </h4>
          <p>Rent: {selected["Estimated Monthly Housing Cost"]}</p>
        </div>
      )}
    </div>
  );
}
