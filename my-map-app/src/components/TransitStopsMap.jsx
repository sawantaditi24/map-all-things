// src/components/TransitStopsMap.jsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Tooltip,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Ivy League schools list
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

const getColor = (count) => {
  if (count < 5) return '#cce5ff';
  if (count < 15) return '#99ccff';
  if (count < 30) return '#66b2ff';
  if (count < 50) return '#3399ff';
  return '#005fa3';
};

const starIcon = new L.DivIcon({
  html: '⭐️',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const LegendControl = () => {
  const map = useMap();
  useEffect(() => {
    const legend = L.control({ position: 'topright' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend');
      Object.assign(div.style, {
        background: 'white',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 0 6px rgba(0,0,0,0.3)',
        fontSize: '14px',
      });
      div.innerHTML = `
        <strong>Number of Transit Stops within 1 mile</strong><br>
        <div><span style="display:inline-block;width:12px;height:12px;background:#cce5ff;margin-right:6px;border-radius:50%;"></span>< 5</div>
        <div><span style="display:inline-block;width:12px;height:12px;background:#99ccff;margin-right:6px;border-radius:50%;"></span>5 – 14</div>
        <div><span style="display:inline-block;width:12px;height:12px;background:#66b2ff;margin-right:6px;border-radius:50%;"></span>15 – 29</div>
        <div><span style="display:inline-block;width:12px;height:12px;background:#3399ff;margin-right:6px;border-radius:50%;"></span>30 – 49</div>
        <div><span style="display:inline-block;width:12px;height:12px;background:#005fa3;margin-right:6px;border-radius:50%;"></span>≥ 50</div>
        <div style="margin-top:8px;"><span>⭐️ Ivy League University</span></div>
      `;
      return div;
    };
    legend.addTo(map);
    return () => legend.remove();
  }, [map]);
  return null;
};

export default function TransitStopsMap() {
  const [data, setData] = useState([]);
  const [zoom, setZoom] = useState(4);
  const [search, setSearch] = useState('');
  const [selectedName, setSelectedName] = useState(null);

  useEffect(() => {
    fetch('/TransitStops_1_2_3_mile_sAll.json')
      .then((r) => r.json())
      .then(setData)
      .catch((err) =>
        console.error('❌ Failed to load transit stops data:', err)
      );
  }, []);

  const ZoomHandler = () => {
    useMapEvents({ zoomend: (e) => setZoom(e.target.getZoom()) });
    return null;
  };

  const filtered = useMemo(() => {
    return data.filter((d) =>
      (d.Raw_University || d.University || '')
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [data, search]);

  const handleReset = () => {
    setSearch('');
    setSelectedName(null);
  };

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
        <button
          onClick={handleReset}
          className="bg-gray-200 hover:bg-gray-300 text-sm px-3 py-2 rounded-md"
        >
          Reset
        </button>
      </div>

      <MapContainer
        center={[39.5, -98.35]}
        zoom={4}
        style={{ height: '65vh', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
        <ZoomHandler />
        <LegendControl />

        {filtered.map((uni, i) => {
          const lat = parseFloat(uni.LATITUDE);
          const lon = parseFloat(uni.LONGITUDE);
          const count = parseInt(uni['Join_Count_1 mile'], 10) || 0;
          const name = (uni.Raw_University || uni.University || '').trim();

          if (isNaN(lat) || isNaN(lon)) return null;

          const isIvy = ivyLeagueSchools.includes(name);

          if (isIvy) {
            return (
              <Marker key={i} position={[lat, lon]} icon={starIcon}>
                {zoom >= 12 && (
                  <Tooltip direction="top" permanent>
                    ⭐️ {name}
                  </Tooltip>
                )}
                <Popup>
                  <div>
                    <strong>⭐️ {name}</strong><br />
                    Stops within 1 mile:{' '}
                    <span style={{ color: 'red', fontWeight: 'bold' }}>
                      {count}
                    </span>
                  </div>
                </Popup>
              </Marker>
            );
          }

          return (
            <CircleMarker
              key={i}
              center={[lat, lon]}
              radius={6}
              fillColor={getColor(count)}
              color="white"
              weight={1}
              fillOpacity={0.95}
            >
              {zoom >= 12 && (
                <Tooltip direction="top" permanent>
                  {name}
                </Tooltip>
              )}
              <Popup>
                <div>
                  <strong>{name}</strong><br />
                  Stops within 1 mile:{' '}
                  <span style={{ color: 'red', fontWeight: 'bold' }}>
                    {count}
                  </span>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
