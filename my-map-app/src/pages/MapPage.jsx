import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { motion } from "framer-motion";
import { Facebook, Apple } from "lucide-react";
import LoanCalculator from "../components/LoanCalculator"; // adjust the path if needed


const CURRENCIES = [
  "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "INR", "NZD",
];

// Helper function to format dates into a readable format.
const formatDate = (dateInput) => {
  let d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    d = new Date(Number(dateInput));
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};
const getHousingCostColor = (costStr) => {
  const cost = parseInt((costStr || "").toString().replace(/[^0-9]/g, ""));
  if (isNaN(cost)) return "gray";
  if (cost < 800) return "#deebf7";
  if (cost < 1100) return "#9ecae1";
  if (cost < 1400) return "#6baed6";
  if (cost < 1700) return "#4292c6";
  if (cost < 2000) return "#2171b5";
  return "#084594";
};

// Helper function to extract a date from a deadline string.
const extractDeadlineDate = (deadlineStr) => {
  if (!deadlineStr) return null;
  const cleaned = deadlineStr.split("(")[0].trim();
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d;
};

const CurrencyConverter = () => {
  const [amount, setAmount] = useState("1");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [exchangeRates, setExchangeRates] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch(
          `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
        );
        const data = await response.json();
        setExchangeRates(data.rates);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching exchange rates:", error);
        setIsLoading(false);
      }
    };
    fetchRates();
  }, [fromCurrency]);

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const calculateExchange = () => {
    if (!exchangeRates[toCurrency] || isNaN(Number(amount))) return "0.00";
    const result = Number(amount) * exchangeRates[toCurrency];
    return result.toFixed(2);
  };

  return (
    <div style={{ padding: "10px", background: "#f8f8f8", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h4>💱 Currency Calculator</h4>
      {isLoading ? (
        <div>Loading exchange rates...</div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            style={{ padding: "8px", width: "100px" }}
          />
          <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)}>
            {CURRENCIES.map((cur) => (<option key={cur} value={cur}>{cur}</option>))}
          </select>
          <button onClick={handleSwapCurrencies}>⇄</button>
          <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)}>
            {CURRENCIES.map((cur) => (<option key={cur} value={cur}>{cur}</option>))}
          </select>
          <span>= <strong>{calculateExchange()} {toCurrency}</strong></span>
        </div>
      )}
    </div>
  );
};

// Helper component to update map view.
const SetViewOnChange = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// MapByFinalDate displays university markers for start dates (or other data)
const MapByFinalDate = ({ universities, dateKey, label, viewMode, centerOverride }) => {
  const defaultCenter = [39.5, -98.35];
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(4);

  // Listen for zoom changes
  const ZoomTracker = () => {
    useMapEvents({ zoomend: (e) => setZoomLevel(e.target.getZoom()) });
    return null;
  };

  const filtered = universities.filter((u) => u.LATITUDE && u.LONGITUDE);
  const uniqueDates = [...new Set(filtered.map((u) => u[dateKey]))]
    .filter(Boolean)
    .sort((a, b) => new Date(a) - new Date(b));

  const redShades = ["#ffcccc", "#ff9999", "#ff6666", "#ff3333", "#ff1a1a", "#e60000", "#cc0000", "#b30000", "#990000"];
  const purpleShades = ["#f3e5f5", "#e1bee7", "#ce93d8", "#ba68c8", "#ab47bc", "#9c27b0", "#8e24aa", "#7b1fa2", "#6a1b9a"];
  const usePurple = dateKey === "Last Day of Finals Week in Fall 2025";
  const colorSet = viewMode === "spring" ? (usePurple ? purpleShades : redShades) : [];
  const dateColorMap = Object.fromEntries(uniqueDates.map((date, i) => [date, colorSet[i % colorSet.length]]));

  const LegendControl = () => {
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
        div.innerHTML += `<div style="font-weight: bold; margin-bottom: 5px;">${label}</div>`;
        if (viewMode === "spring") {
          const getWeekRangeLabel = (dateStr) => {
            const d = new Date(dateStr);
            const start = new Date(d);
            start.setDate(d.getDate() - d.getDay());
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
          };
          const weekMap = {};
          uniqueDates.forEach((date) => {
            const week = getWeekRangeLabel(date);
            if (!weekMap[week]) weekMap[week] = dateColorMap[date];
          });
          for (const [range, color] of Object.entries(weekMap)) {
            div.innerHTML += `<div><span style="background:${color};width:12px;height:12px;display:inline-block;margin-right:6px;border-radius:50%;"></span>${range}</div>`;
          }
        }
        return div;
      };
      legend.addTo(map);
      return () => legend.remove();
    }, [map]);
    return null;
  };

  return (
    <motion.div
      style={{
        flex: "1 1 30%",
        minWidth: "350px",
        maxWidth: "450px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <MapContainer center={defaultCenter} zoom={4} style={{ height: "80vh", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors, HOT" />
        {centerOverride && <SetViewOnChange center={centerOverride} zoom={12} />}
        <ZoomTracker />
        <LegendControl />
        {filtered.map((uni, index) => {
          const lat = parseFloat(uni.LATITUDE);
          const lon = parseFloat(uni.LONGITUDE);
          if (isNaN(lat) || isNaN(lon)) return null;
          const fillColor = viewMode === "spring"
            ? (dateColorMap[uni[dateKey]] || "gray")
            : getHousingCostColor(uni["Estimated Monthly Housing Cost"]);
          return (
            <CircleMarker
              key={index}
              center={[lat, lon]}
              radius={8}
              fillColor={fillColor}
              color="white"
              weight={1}
              fillOpacity={0.9}
              eventHandlers={{ click: () => setSelectedInfo(uni) }}
            >
              <Tooltip permanent={zoomLevel >= 12} direction="top" opacity={1} key={`tooltip-${index}-${zoomLevel}`}>
                {uni["University Name"]}
              </Tooltip>
              <Popup>
                <div>
                  <strong>{uni["University Name"]}</strong>
                  <br />
                  {viewMode === "spring"
                    ? `${label}: ${formatDate(uni[dateKey])}`
                    : `Housing Cost: ${uni["Estimated Monthly Housing Cost"] || "N/A"}`}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      {selectedInfo && (
        <div style={{ padding: "10px", background: "#fff", border: "1px solid #ccc", borderRadius: "8px" }}>
          <h4>{selectedInfo["University Name"]}</h4>
          <p>
            <strong>{label}:</strong> {viewMode === "spring" ? formatDate(selectedInfo[dateKey]) : selectedInfo[dateKey]}
          </p>
        </div>
      )}
      {viewMode === "cost" && <CurrencyConverter />}
    </motion.div>
  );
};

// New component to display deadlines for a specific type (Undergraduate or Graduate)
const MapByDeadlineType = ({ deadlines, centerOverride, deadlineKey, legendLabel }) => {
  const defaultCenter = [39.5, -98.35];
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(4);
  const markerColor = "#ff9900"; // Orange markers for deadlines

  // ZoomListener inside MapContainer.
  const ZoomListener = () => {
    useMapEvents({ zoomend: (e) => setZoomLevel(e.target.getZoom()) });
    return null;
  };

  // Compute overall date range using the given deadlineKey.
  const deadlineDates = deadlines
    .map(item => extractDeadlineDate(item[deadlineKey]))
    .filter(d => d !== null);
  let rangeText = "";
  if (deadlineDates.length > 0) {
    const minDate = new Date(Math.min(...deadlineDates));
    const maxDate = new Date(Math.max(...deadlineDates));
    rangeText = `${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}`;
  }

  const LegendControl = () => {
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
        div.innerHTML = `<div style="font-weight: bold; margin-bottom: 5px;">${legendLabel}</div>`;
        if (rangeText) {
          div.innerHTML += `<div style="margin-bottom: 5px;">Date Range: ${rangeText}</div>`;
        }
        return div;
      };
      legend.addTo(map);
      return () => legend.remove();
    }, [map, rangeText]);
    return null;
  };

  return (
    <motion.div
      style={{
        flex: "1 1 30%",
        minWidth: "350px",
        maxWidth: "450px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <MapContainer center={defaultCenter} zoom={4} style={{ height: "80vh", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors, HOT" />
        {centerOverride && <SetViewOnChange center={centerOverride} zoom={12} />}
        <ZoomListener />
        <LegendControl />
        {deadlines.map((item, index) => {
          const lat = parseFloat(item.LATITUDE);
          const lon = parseFloat(item.LONGITUDE);
          if (isNaN(lat) || isNaN(lon)) return null;
          return (
            <CircleMarker
              key={index}
              center={[lat, lon]}
              radius={8}
              fillColor={markerColor}
              color="white"
              weight={1}
              fillOpacity={0.9}
              eventHandlers={{ click: () => setSelectedInfo(item) }}
            >
              <Tooltip permanent={zoomLevel >= 12} direction="top" opacity={1} key={`tooltip-${index}-${zoomLevel}`}>
                {item.University}
              </Tooltip>
              <Popup>
                <div>
                  <strong>{item.University}</strong>
                  <br />
                  <span>
                    <strong>{legendLabel}: </strong>
                    {item[deadlineKey]}
                  </span>
                  <br />
                  <a href={item["Undergraduate Link"]} target="_blank" rel="noopener noreferrer">
                    Undergrad Info
                  </a>{" "}
                  |{" "}
                  <a href={item["Graduate Link"]} target="_blank" rel="noopener noreferrer">
                    Graduate Info
                  </a>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      {selectedInfo && (
        <div style={{ padding: "10px", background: "#fff", border: "1px solid #ccc", borderRadius: "8px" }}>
          <h4>{selectedInfo.University}</h4>
          <p>
            <strong>{legendLabel}: </strong>
            {selectedInfo[deadlineKey]}
          </p>
          <p>
            <a href={selectedInfo["Undergraduate Link"]} target="_blank" rel="noopener noreferrer">
              Undergrad Info
            </a>{" "}
            |{" "}
            <a href={selectedInfo["Graduate Link"]} target="_blank" rel="noopener noreferrer">
              Graduate Info
            </a>
          </p>
        </div>
      )}
    </motion.div>
  );
};

const HeaderBar = ({ searchQuery, setSearchQuery, onLogin, suggestions }) => {
  const [showSuggestions, setShowSuggestions] = useState(true);
  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(true);
  };
  const handleSuggestionClick = (uniName) => {
    setSearchQuery(uniName);
    setShowSuggestions(false);
  };
  return (
    <header style={{ padding: "10px 20px", borderBottom: "1px solid #ddd", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button onClick={() => onLogin("apple")} style={{ cursor: "pointer", border: "none", background: "none" }} title="Login with Apple">
          <Apple size={24} />
        </button>
        <button onClick={() => onLogin("google")} style={{ cursor: "pointer", border: "none", background: "none" }} title="Login with Google">
          <span style={{ display: "inline-block", width: "24px", height: "24px", lineHeight: "24px", textAlign: "center", fontWeight: "bold", borderRadius: "50%", backgroundColor: "#fff", border: "1px solid #ccc" }}>G</span>
        </button>
        <button onClick={() => onLogin("facebook")} style={{ cursor: "pointer", border: "none", background: "none" }} title="Login with Facebook">
          <Facebook size={24} />
        </button>
      </div>
      <div style={{ width: "250px", position: "relative", textAlign: "right" }}>
        <input
          type="text"
          placeholder="Filter university"
          value={searchQuery}
          onChange={handleInputChange}
          style={{ width: "100%", padding: "12px", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        {showSuggestions && searchQuery && suggestions && suggestions.length > 0 && (
          <ul style={{ position: "absolute", top: "100%", right: 0, left: 0, zIndex: 10, listStyle: "none", padding: "0", margin: "5px 0", background: "#fff", border: "1px solid #ccc", borderRadius: "4px", maxHeight: "200px", overflowY: "auto" }}>
            {suggestions.map((uni) => (
              <li key={uni["University Name"]} style={{ padding: "8px", borderBottom: "1px solid #eee", cursor: "pointer" }} onClick={() => handleSuggestionClick(uni["University Name"])}>
                {uni["University Name"]}
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  );
};

const MapPage = () => {
  const [universities, setUniversities] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/University_Long_Lat2_rev3.json")
      .then((res) => res.json())
      .then((data) => setUniversities(data));
  }, []);

  useEffect(() => {
    fetch("/Spring_2026_Deadlines_Final_v9.json")
      .then((res) => res.json())
      .then((data) => setDeadlines(data));
  }, []);

  const mergedDeadlines = deadlines
    .map((d) => {
      const match = universities.find(
        (u) => u["University Name"].toLowerCase() === d.University.toLowerCase()
      );
      return match ? { ...d, LATITUDE: match.LATITUDE, LONGITUDE: match.LONGITUDE } : null;
    })
    .filter(Boolean);

  const filteredUniversities = universities.filter((uni) =>
    uni["University Name"].toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredDeadlines = mergedDeadlines.filter((d) =>
    d.University.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedUniversity = filteredUniversities.length === 1 ? filteredUniversities[0] : null;
  const customCenter = selectedUniversity
    ? [parseFloat(selectedUniversity.LATITUDE), parseFloat(selectedUniversity.LONGITUDE)]
    : undefined;

  const handleSocialLogin = (provider) => {
    window.location.href = `/login?provider=${provider}`;
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <HeaderBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onLogin={handleSocialLogin}
        suggestions={filteredUniversities}
      />
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <p><strong>Money Value Calculator</strong> helps you plan your college journey with interactive maps.</p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "20px" }}>
        <MapByFinalDate
          universities={filteredUniversities}
          dateKey="First Day of Classes Fall 2025"
          label="Fall 2025 Start Dates"
          viewMode="spring"
          centerOverride={customCenter}
        />
        <MapByFinalDate
          universities={filteredUniversities}
          dateKey="Last Day of Finals Week in Fall 2025"
          label="Finals Week/Fall 2025 Semester End Dates"
          viewMode="spring"
          centerOverride={customCenter}
        />
        <MapByDeadlineType
          deadlines={filteredDeadlines}
          centerOverride={customCenter}
          deadlineKey="Undergraduate Deadline Spring 2026"
          legendLabel="Undergraduate Deadlines"
        />
        <MapByDeadlineType
          deadlines={filteredDeadlines}
          centerOverride={customCenter}
          deadlineKey="Graduate Deadline Spring 2026"
          legendLabel="Graduate Deadlines"
        />
      </div>
    </div>
  );
};

export default MapPage;
