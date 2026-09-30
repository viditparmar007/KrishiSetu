import { useEffect, useMemo, useState, useRef } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed } from "lucide-react";

// Google Maps Tile Endpoints
const GOOGLE_HYBRID = "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";
const GOOGLE_STREET = "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";

function FitBounds({ points }) {
  const map = useMap();
  const coordKey = useMemo(() => (points || []).map((p) => `${Number(p.latitude).toFixed(3)},${Number(p.longitude).toFixed(3)}`).join("|"), [points]);

  useEffect(() => {
    if (!points || !points.length) return;
    try {
      const bounds = L.latLngBounds(points.map((p) => [p.latitude, p.longitude]));
      map.fitBounds(bounds.pad(0.18), { animate: true, maxZoom: 13 });
    } catch {
      // safe fallback
    }
  }, [map, coordKey]);
  return null;
}

function FlyTo({ point }) {
  const map = useMap();
  const pointKey = point ? `${Number(point.latitude).toFixed(4)},${Number(point.longitude).toFixed(4)}` : "";
  useEffect(() => {
    if (!point) return;
    try {
      map.flyTo([point.latitude, point.longitude], Math.max(map.getZoom(), 14), { duration: 0.8 });
    } catch {
      // safe fallback
    }
  }, [map, pointKey]);
  return null;
}

function loadTone(wait) {
  const n = Number(wait);
  if (!Number.isFinite(n)) return "#4d8d63";
  if (n <= 20) return "#2f9a58";
  if (n <= 45) return "#c38b22";
  return "#c34c4c";
}

export default function CentreMap({ centres = [], recommendations = [], farms = [], selected, onSelect }) {
  const [satellite, setSatellite] = useState(true); // Default to Google Satellite
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);

  const mapPoints = useMemo(() => {
    const all = [...centres, ...recommendations]
      .map((c) => ({
        id: c.id ?? c.centre_id,
        name: c.name ?? c.centre_name,
        latitude: Number(c.latitude),
        longitude: Number(c.longitude),
      }))
      .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
    return all.filter((p, i, arr) => arr.findIndex((x) => String(x.id) === String(p.id)) === i);
  }, [centres, recommendations]);

  const firstFarm = farms.find((f) => Number.isFinite(Number(f.latitude)) && Number.isFinite(Number(f.longitude)));
  const centreById = useMemo(() => {
    const map = new Map();
    centres.forEach((c) => map.set(String(c.id), c));
    recommendations.forEach((c) => map.set(String(c.centre_id), { ...(map.get(String(c.centre_id)) || {}), ...c }));
    return map;
  }, [centres, recommendations]);

  const center = userLocation
    ? userLocation
    : firstFarm
      ? [Number(firstFarm.latitude), Number(firstFarm.longitude)]
      : mapPoints[0]
        ? [mapPoints[0].latitude, mapPoints[0].longitude]
        : [29.9804, 77.5815];

  const activePoint = selected
    ? mapPoints.find((p) => String(p.id) === String(selected.id ?? selected.centre_id))
    : null;

  const farmPoint = firstFarm && [Number(firstFarm.latitude), Number(firstFarm.longitude)];

  const locateUser = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="isolate relative z-0 h-full min-h-[520px] overflow-hidden rounded-[26px] border border-[#d8e3da] bg-[#eaf2ea]">
      <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full min-h-[520px] w-full">
        <TileLayer
          url={satellite ? GOOGLE_HYBRID : GOOGLE_STREET}
          subdomains={["mt0", "mt1", "mt2", "mt3"]}
          attribution="Google Maps"
        />
        <FitBounds
          points={
            userLocation
              ? [{ latitude: userLocation[0], longitude: userLocation[1] }, ...mapPoints]
              : mapPoints.length
                ? mapPoints
                : farmPoint
                  ? [{ latitude: farmPoint[0], longitude: farmPoint[1] }]
                  : []
          }
        />
        <FlyTo point={activePoint || (userLocation ? { latitude: userLocation[0], longitude: userLocation[1] } : null)} />

        {/* User Current Location Marker */}
        {userLocation && (
          <CircleMarker
            center={userLocation}
            radius={9}
            pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#1a73e8", fillOpacity: 1 }}
          >
            <Popup>
              <div className="min-w-[170px]">
                <strong style={{ color: "#1a73e8" }}>📍 Aapki Location</strong>
                <div style={{ marginTop: 4, fontSize: 12 }}>Current GPS Position</div>
              </div>
            </Popup>
          </CircleMarker>
        )}

        {farmPoint && (
          <CircleMarker center={farmPoint} radius={10} pathOptions={{ color: "#176b3e", weight: 3, fillColor: "#9ad5a6", fillOpacity: 0.9 }}>
            <Popup>
              <div className="min-w-[170px]">
                <strong>{firstFarm.farm_name || "My Farm"}</strong>
                <div style={{ marginTop: 4, fontSize: 12 }}>Your farm</div>
              </div>
            </Popup>
          </CircleMarker>
        )}

        {mapPoints.map((point) => {
          const item = centreById.get(String(point.id)) || {};
          const wait = item.estimated_wait_minutes;
          const color = loadTone(wait);
          const active = String(selected?.id ?? selected?.centre_id) === String(point.id);
          return (
            <CircleMarker
              key={point.id}
              center={[point.latitude, point.longitude]}
              radius={active ? 12 : 9}
              pathOptions={{ color: active ? "#ffffff" : color, weight: active ? 4 : 3, fillColor: color, fillOpacity: 0.95 }}
              eventHandlers={{ click: () => onSelect?.(item) }}
            >
              <Popup>
                <div className="min-w-[210px]">
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{point.name}</div>
                  <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.6 }}>
                    {item.distance_km != null && <div>Distance: <b>{Number(item.distance_km).toFixed(1)} km</b></div>}
                    {wait != null && <div>Expected wait: <b>{wait} min</b></div>}
                    {item.open_slot_count != null && <div>Open slots: <b>{item.open_slot_count}</b></div>}
                    {item.available_farmer_capacity != null && <div>Farmer capacity: <b>{item.available_farmer_capacity}</b></div>}
                  </div>
                  <button type="button" onClick={() => onSelect?.(item)} style={{ marginTop: 9, border: 0, borderRadius: 9, padding: "7px 11px", background: "#176b3e", color: "white", fontWeight: 700, cursor: "pointer" }}>
                    View slots
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Mode Controls */}
      <div className="absolute left-4 top-4 z-[500] flex items-center gap-1 rounded-2xl border border-white/70 bg-white/95 p-1.5 shadow-lg backdrop-blur">
        <button type="button" onClick={() => setSatellite(true)} className={`rounded-xl px-3 py-2 text-xs font-bold ${satellite ? "bg-[#176b3e] text-white" : "text-[#42564a]"}`}>Google Satellite</button>
        <button type="button" onClick={() => setSatellite(false)} className={`rounded-xl px-3 py-2 text-xs font-bold ${!satellite ? "bg-[#176b3e] text-white" : "text-[#42564a]"}`}>Street</button>
      </div>

      {/* Locate Button */}
      <button
        type="button"
        onClick={locateUser}
        title="Find my location"
        className={`absolute right-4 top-4 z-[500] flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/95 text-[#176b3e] shadow-lg backdrop-blur hover:scale-105 ${
          locating ? "animate-spin text-[#1a73e8]" : ""
        }`}
      >
        <LocateFixed size={20} className={userLocation ? "text-[#1a73e8]" : "text-[#176b3e]"} />
      </button>

      <div className="absolute bottom-4 left-4 z-[500] flex flex-wrap gap-2 rounded-2xl border border-white/70 bg-white/95 p-3 text-[10px] font-bold shadow-lg backdrop-blur">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#2f9a58]" />Low wait</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#c38b22]" />Medium</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#c34c4c]" />High</span>
      </div>
    </div>
  );
}
