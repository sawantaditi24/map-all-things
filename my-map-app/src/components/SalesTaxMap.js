// src/components/SalesTaxMap.jsx
import React, { useEffect, useState, useMemo } from "react";
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
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

const getTaxColor = (r) => {
  const rate = parseFloat(r) || 0;
  if (rate < 6) return "#c7f9cc";
  if (rate < 7.5) return "#74c69d";
  if (rate < 9) return "#52b788";
  if (rate < 10.5) return "#40916c";
  return "#1b4332";
};

export default function SalesTaxMap() {
  const [data, setData] = useState([]);
  const [zoom, setZoom] = useState(3.5);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/sales_tax_by_university_rev.json")
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((json) => setData(Array.isArray(json) ? json : []))
      .catch(() => {});
  }, []);

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
        div.innerHTML = `<strong>Sales Tax Rate (%)</strong><br/>`;
        const ranges = [
          ["< 6%", "#c7f9cc"], ["6% – 7.5%", "#74c69d"], ["7.5% – 9%", "#52b788"],
          ["9% – 10.5%", "#40916c"], ["> 10.5%", "#1b4332"],
        ];
        ranges.forEach(([label, color]) => {
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

  const filtered = useMemo(() => {
    return data.filter((u) =>
      (u.university_full || u.university || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [data, search]);

  return (
    <div className="bg-white rounded-2xl shadow-md p-0 flex flex-col gap-0 mt-6 w-full">
      {/* Intro and Filter */}
      <div className="px-5 py-5 border-b rounded-t-2xl" style={{
        background: "#f1fff4",
        borderColor: "#b5ead7",
        color: "#1b4332"
      }}>
        <h3 className="font-semibold text-lg mb-2">
          💧 Sales Tax: Buying a Bottle of Water
        </h3>
        <p className="text-base leading-relaxed">
          💡 A $1 <strong>bottle of water</strong> costs <strong>$1.05</strong> in a 5% sales tax state,
          and <strong>$1.10</strong> in a 10% state. Small differences add up! Explore real-world cost-of-living
          differences by university.
        </p>
        <div className="mt-4">
          <input
            type="text"
            placeholder="🔍 Filter university"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-md px-4 py-3 text-base w-full shadow-sm focus:ring-2 focus:ring-green-200"
          />
        </div>
      </div>

      {/* Map */}
      <div className="w-full rounded-b-2xl overflow-hidden" style={{ height: "80vh" }}>
        <MapContainer center={[37, -98.35]} zoom={3.5} className="w-full h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
          <ZoomHandler />
          <LegendControl />

          {filtered.map((uni, i) => {
            const lat = parseFloat(uni.latitude);
            const lon = parseFloat(uni.longitude);
            const rate = uni.state_sales_tax_percent;
            const name = uni.university_full || uni.university || "Unnamed";
            if (isNaN(lat) || isNaN(lon)) return null;

            const isIvy = ivyLeagueSchools.includes(name);

            return isIvy ? (
              <Marker key={i} position={[lat, lon]} icon={starIcon}>
                <Tooltip permanent={zoom >= 12}>⭐️ {name}</Tooltip>
                <Popup>
                  <strong>⭐️ {name}</strong><br />Sales Tax: {rate}%
                </Popup>
              </Marker>
            ) : (
              <CircleMarker
                key={i}
                center={[lat, lon]}
                radius={8}
                fillColor={getTaxColor(rate)}
                color="white"
                weight={1}
                fillOpacity={0.9}
              >
                <Tooltip permanent={zoom >= 12}>{name}</Tooltip>
                <Popup>
                  <strong>{name}</strong><br />Sales Tax: {rate}%
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
