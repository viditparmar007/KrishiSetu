import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Box,
  Compass,
  LocateFixed,
  Pencil,
  Satellite,
  Trash2,
  Undo2,
  Check,
  Layers,
  MapPin,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  X,
  Crosshair,
  Search,
  Plus,
  Minus,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

// Official Google Maps Tile Servers
const GOOGLE_HYBRID = "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"; // Satellite + Roads + Labels
const GOOGLE_STREET = "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"; // Google Street Map

// Default to Chhutmalpur, Saharanpur, UP
const CHHUTMALPUR_CENTER = [30.0363, 77.7518];
const STORAGE_KEY = "krishisetu-farmer-custom-boundaries-v5";
const LOCATION_STORAGE_KEY = "krishisetu-my-farm-location-v1";

// Read ONLY user-drawn boundaries. If none drawn, map stays completely clean!
function readSavedBoundaries() {
  try {
    const val = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (val && typeof val === "object" && Object.keys(val).length > 0) {
      return val;
    }
    return {};
  } catch {
    return {};
  }
}

function saveBoundariesToStorage(val) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

function getInitialCenter() {
  try {
    const saved = JSON.parse(localStorage.getItem(LOCATION_STORAGE_KEY) || "null");
    if (Array.isArray(saved) && saved.length === 2) return saved;
  } catch {
    // fallback
  }
  return CHHUTMALPUR_CENTER;
}

// Calculate spherical polygon area in Acres
function calculateAreaInAcres(latLngs) {
  if (!latLngs || latLngs.length < 3) return 0;
  const RADIUS = 6378137;
  let area = 0;
  const n = latLngs.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const p1 = latLngs[i];
    const p2 = latLngs[j];
    const lat1 = (p1[0] * Math.PI) / 180;
    const lat2 = (p2[0] * Math.PI) / 180;
    const dLng = ((p2[1] - p1[1]) * Math.PI) / 180;
    area += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  area = Math.abs((area * RADIUS * RADIUS) / 4);
  return area * 0.000247105;
}

export default function FarmMapPanel({ farms = [], crops = [], compact = false }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const locationLayerRef = useRef(null);
  const boundaryLayerRef = useRef(null);
  const drawingLayerRef = useRef(null);

  // Exactly 3 Modes matching Image 2: "Map", "Satellite", "3D View"
  const [mapMode, setMapMode] = useState("satellite"); // "map" | "satellite"
  const [is3D, setIs3D] = useState(false);
  const [pitch, setPitch] = useState(45); // degrees tilt in 3D
  const [bearing, setBearing] = useState(-10); // degrees rotation
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Chhutmalpur, Saharanpur • Satellite View");
  const [savedBoundaries, setSavedBoundaries] = useState(readSavedBoundaries);
  const [savedFarmCenter, setSavedFarmCenter] = useState(getInitialCenter);

  // Search Bar State
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Field boundary state
  const [editingBoundary, setEditingBoundary] = useState(false);
  const [boundaryPoints, setBoundaryPoints] = useState([]);
  const [selectedCropForBoundary, setSelectedCropForBoundary] = useState("sweet_corn");
  const [customPlotName, setCustomPlotName] = useState("");
  const [isPinpointingLocation, setIsPinpointingLocation] = useState(false);
  const [locationSavedToast, setLocationSavedToast] = useState(false);

  // Update Location Marker (Google Maps Style Pulsing Dot)
  const updateLocationMarker = useCallback((lat, lng, accuracy = 15) => {
    const group = locationLayerRef.current;
    if (!group) return;
    group.clearLayers();

    // Accuracy Circle
    L.circle([lat, lng], {
      radius: Math.max(accuracy, 20),
      color: "#1a73e8",
      fillColor: "#1a73e8",
      fillOpacity: 0.15,
      weight: 1.5,
    }).addTo(group);

    // Pulsing Google Maps Dot
    const pulseIcon = L.divIcon({
      className: "ks-google-location-icon",
      iconSize: [46, 46],
      iconAnchor: [23, 23],
      html: `
        <div style="position:relative;width:46px;height:46px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:46px;height:46px;border-radius:50%;background:rgba(26,115,232,0.25);border:1.5px solid rgba(26,115,232,0.7);animation:ks-gmap-pulse 2s ease-out infinite;"></div>
          <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:rgba(26,115,232,0.2);"></div>
          <div style="width:17px;height:17px;border-radius:50%;background:#1a73e8;border:3px solid #ffffff;box-shadow:0 2px 10px rgba(0,0,0,0.5),0 0 10px rgba(26,115,232,0.7);"></div>
        </div>
      `,
    });

    const marker = L.marker([lat, lng], { icon: pulseIcon, zIndexOffset: 1000 }).addTo(group);
    marker.bindPopup(`
      <div style="min-width:180px;font-family:sans-serif;padding:6px;">
        <strong style="color:#1a73e8;font-size:13px;">📍 आपकी लाइव लोकेशन (Google Maps GPS)</strong>
        <div style="margin-top:4px;font-size:11px;color:#333;">अक्षांश/देशांतर: ${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
        <div style="margin-top:2px;font-size:10px;color:#666;">सटीकता: ±${Math.round(accuracy)} मीटर</div>
      </div>
    `);
  }, []);

  // Precise Google Maps style Geolocation detection
  const detectLocation = useCallback(
    (isSilent = false) => {
      if (!navigator.geolocation) {
        setStatusMsg("⚠️ ब्राउज़र में GPS उपलब्ध नहीं है। '📍 Chhutmalpur' पर क्लिक करें।");
        return;
      }

      setLocating(true);
      if (!isSilent) {
        setStatusMsg("📍 GPS से आपकी लाइव लोकेशन खोजी जा रही है...");
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const acc = pos.coords.accuracy || 15;

          setCurrentLocation([lat, lng]);
          setLocating(false);
          updateLocationMarker(lat, lng, acc);
          setStatusMsg(`📍 लोकेशन मिल गई: ${lat.toFixed(5)}, ${lng.toFixed(5)} (±${Math.round(acc)}m)`);

          const map = mapRef.current;
          if (map) {
            map.flyTo([lat, lng], 18, { animate: true, duration: 1.3 });
          }
        },
        (err) => {
          setLocating(false);
          if (!isSilent) {
            let msg = "⚠️ GPS लोकेशन नहीं मिल सकी।";
            if (err.code === 1) {
              msg = "⚠️ लोकेशन अनुमति (Permission) ब्लॉक है। '📍 Chhutmalpur' से अपने खेत पर जाएँ।";
            } else if (err.code === 2) {
              msg = "⚠️ GPS सिग्नल नहीं मिला। '📍 Chhutmalpur' पर क्लिक करें।";
            } else if (err.code === 3) {
              msg = "⚠️ लोकेशन टाइमआउट। पुनः प्रयास करें।";
            }
            setStatusMsg(msg);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        }
      );
    },
    [updateLocationMarker]
  );

  // Jump smoothly to Chhutmalpur (Farmer's actual location)
  const jumpToChhutmalpur = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo(CHHUTMALPUR_CENTER, 17, { animate: true, duration: 1.2 });
    setStatusMsg("📍 Chhutmalpur, Saharanpur (आपका खेत) पर केंद्रित है");
  }, []);

  // Save current center as Farmer's default farm location
  const saveCurrentCenterAsFarm = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const center = map.getCenter();
    const coords = [center.lat, center.lng];
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(coords));
    setSavedFarmCenter(coords);
    setLocationSavedToast(true);
    setStatusMsg(`✅ आपकी फार्म लोकेशन सुरक्षित हो गई: ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`);
    setTimeout(() => setLocationSavedToast(false), 3000);
  }, []);

  // Search any village or place via Nominatim
  const handleSearchLocation = async (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setSearching(true);
    setStatusMsg(`🔍 '${q}' खोजा जा रहा है...`);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          q + ", India"
        )}&format=json&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setStatusMsg(`📍 मिल गया: ${data[0].display_name.split(",").slice(0, 3).join(",")}`);
        mapRef.current?.flyTo([lat, lon], 17, { animate: true, duration: 1.4 });
      } else {
        setStatusMsg(`⚠️ '${q}' नहीं मिला। कृपया दूसरा नाम खोजें।`);
      }
    } catch {
      setStatusMsg("⚠️ सर्च में त्रुटि। कृपया पुनः प्रयास करें।");
    } finally {
      setSearching(false);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter = getInitialCenter();
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
      maxZoom: 21,
      minZoom: 4,
    });

    mapRef.current = map;

    // Default tile layer: Google Hybrid Satellite
    tileLayerRef.current = L.tileLayer(GOOGLE_HYBRID, {
      maxZoom: 21,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      attribution: "Google Maps Satellite",
    }).addTo(map);

    locationLayerRef.current = L.layerGroup().addTo(map);
    boundaryLayerRef.current = L.layerGroup().addTo(map);
    drawingLayerRef.current = L.layerGroup().addTo(map);

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Tile Layer when mapMode changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const url = mapMode === "map" ? GOOGLE_STREET : GOOGLE_HYBRID;

    tileLayerRef.current = L.tileLayer(url, {
      maxZoom: 21,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
    }).addTo(map);

    setStatusMsg(
      mapMode === "map"
        ? "🗺️ Google Street Map Active"
        : is3D
        ? "🧊 3D Aerial View Active"
        : "🛰️ Google Satellite Live (Chhutmalpur)"
    );
  }, [mapMode, is3D]);

  // Handle 3D mode toggle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (is3D) {
      map.dragging.disable();
      setStatusMsg(`🧊 3D Aerial View Active (Tilt: ${pitch}°) • Camera Controls se pan karein`);
    } else {
      map.dragging.enable();
      setStatusMsg(mapMode === "map" ? "🗺️ Google Street Map" : "🛰️ Google Satellite Live");
    }
  }, [is3D, pitch, mapMode]);

  // 3D Camera Controls: smooth pan
  const pan3DCamera = useCallback((dx, dy) => {
    const map = mapRef.current;
    if (!map) return;
    map.panBy([dx, dy], { animate: true, duration: 0.35 });
  }, []);

  // Render ONLY user-saved or configured agricultural zones and active farm crops
  useEffect(() => {
    const map = mapRef.current;
    const boundaryGroup = boundaryLayerRef.current;
    if (!map || !boundaryGroup) return;

    boundaryGroup.clearLayers();

    const savedKeys = Object.keys(savedBoundaries);
    if (savedKeys.length > 0) {
      savedKeys.forEach((plotKey) => {
        const plotData = savedBoundaries[plotKey];
        if (!plotData || !plotData.points || plotData.points.length < 3) return;

        const color = plotData.color || "#22c55e";

        // Draw Polygon fitting agricultural land
        const polygon = L.polygon(plotData.points, {
          color: color,
          weight: 2.5,
          fillColor: color,
          fillOpacity: 0.22,
        }).addTo(boundaryGroup);

        // Tooltip with crop and area
        polygon.bindTooltip(
          `<strong>${plotData.zone || plotData.name}</strong><br/>Crop: ${plotData.crop}<br/>Area: ${plotData.area}`,
          { permanent: false, direction: "center" }
        );

        // Center pill badge matching user's reference image 2
        const center = plotData.center || plotData.points[0];
        const badgeIcon = L.divIcon({
          className: "ks-crop-badge",
          iconSize: [140, 32],
          iconAnchor: [70, 16],
          html: `
            <div style="
              background: rgba(255, 255, 255, 0.95);
              border: 1.5px solid ${color};
              border-radius: 9999px;
              padding: 4px 12px;
              color: #1a3826;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 11px;
              font-weight: 800;
              white-space: nowrap;
              box-shadow: 0 4px 16px rgba(0,0,0,0.18);
              display: flex;
              align-items: center;
              gap: 6px;
              cursor: pointer;
            ">
              <span>${plotData.icon || "🌱"}</span>
              <span>${plotData.zone || plotData.name}</span>
            </div>
          `,
        });

        const marker = L.marker(center, { icon: badgeIcon }).addTo(boundaryGroup);
        marker.on("click", () => {
          map.flyTo(center, 18, { animate: true, duration: 0.8 });
          setStatusMsg(`🌾 ${plotData.zone || plotData.name} (${plotData.crop} • ${plotData.area})`);
        });
      });
    }

    // Render active crops on the map
    if (crops && crops.length > 0) {
      crops.forEach((crop, idx) => {
        const cropName = crop.crop_name || "Crop";
        const icon = cropName.toLowerCase().includes("rice") || cropName.toLowerCase().includes("धान") || cropName.toLowerCase().includes("चावल")
          ? "🌾"
          : cropName.toLowerCase().includes("sugar") || cropName.toLowerCase().includes("गन्ना")
          ? "🎋"
          : "🌽";

        const baseCenter = savedFarmCenter || CHHUTMALPUR_CENTER;
        const cropLat = baseCenter[0] + (idx * 0.001);
        const cropLng = baseCenter[1] + (idx * 0.001);

        const cropBadge = L.divIcon({
          className: "ks-live-crop-badge",
          iconSize: [160, 34],
          iconAnchor: [80, 17],
          html: `
            <div style="
              background: #ffffff;
              border: 2px solid #16804b;
              border-radius: 9999px;
              padding: 4px 12px;
              color: #0e2618;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 11px;
              font-weight: 900;
              white-space: nowrap;
              box-shadow: 0 4px 14px rgba(22,128,75,0.25);
              display: flex;
              align-items: center;
              gap: 6px;
              cursor: pointer;
            ">
              <span style="font-size:14px;">${icon}</span>
              <span>${cropName}</span>
              <span style="background:#eaf7ee;color:#16804b;font-size:9px;padding:2px 5px;border-radius:6px;font-weight:800;">
                ${crop.expected_quantity ? `${crop.expected_quantity} Q` : "Active"}
              </span>
            </div>
          `,
        });

        const cropMarker = L.marker([cropLat, cropLng], { icon: cropBadge }).addTo(boundaryGroup);
        cropMarker.on("click", () => {
          map.flyTo([cropLat, cropLng], 18, { animate: true, duration: 0.8 });
          setStatusMsg(`🌾 ${cropName}: ${crop.expected_quantity || ""} ${crop.quantity_unit || "quintal"} • Active Farm Crop`);
        });
      });
    }
  }, [savedBoundaries, crops, savedFarmCenter]);

  // Click on map to add boundary points or pinpoint location
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (e) => {
      if (isPinpointingLocation) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        setCurrentLocation([lat, lng]);
        updateLocationMarker(lat, lng, 10);
        setIsPinpointingLocation(false);
        setStatusMsg(`📍 आपकी सटीक लोकेशन सेट की गई: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        return;
      }

      if (!editingBoundary) return;
      const pt = [e.latlng.lat, e.latlng.lng];
      setBoundaryPoints((prev) => [...prev, pt]);
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [editingBoundary, isPinpointingLocation, updateLocationMarker]);

  // Render Live Drawing Layer
  useEffect(() => {
    const group = drawingLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!editingBoundary || boundaryPoints.length === 0) return;

    boundaryPoints.forEach((pt, index) => {
      const marker = L.circleMarker(pt, {
        radius: 6,
        color: "#ffffff",
        fillColor: "#eab308",
        fillOpacity: 1,
        weight: 2.5,
      }).addTo(group);

      marker.bindTooltip(`P${index + 1}`, { permanent: true, direction: "top", className: "ks-pt-tooltip" });
    });

    if (boundaryPoints.length >= 2) {
      L.polyline(boundaryPoints, {
        color: "#eab308",
        weight: 3,
        dashArray: "6, 6",
      }).addTo(group);
    }

    if (boundaryPoints.length >= 3) {
      L.polygon(boundaryPoints, {
        color: "#eab308",
        fillColor: "#eab308",
        fillOpacity: 0.25,
      }).addTo(group);
    }
  }, [editingBoundary, boundaryPoints]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showSearch && !e.target.closest("[data-map-search]")) {
        setShowSearch(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (showSearch) setShowSearch(false);
        if (editingBoundary) {
          setEditingBoundary(false);
          drawingLayerRef.current?.clearLayers();
          setStatusMsg("Boundary marking cancelled.");
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showSearch, editingBoundary]);

  const calculatedAcres = calculateAreaInAcres(boundaryPoints);
  const calculatedBighas = calculatedAcres * 5.0; // 1 Acre = 5 Bigha in Western UP

  const startEditingBoundary = () => {
    setBoundaryPoints([]);
    setEditingBoundary(true);
    setStatusMsg("✏️ मैप पर क्लिक करके अपने खेत के चारों कोनों को मार्क करें");
  };

  const undoPoint = () => {
    setBoundaryPoints((prev) => prev.slice(0, -1));
  };

  const saveCurrentBoundary = () => {
    if (boundaryPoints.length < 3) {
      alert("कृपया खेत की बाउंड्री के लिए कम से कम 3 पॉइंट्स मार्क करें।");
      return;
    }

    const zoneCount = Object.keys(savedBoundaries).length + 1;
    const cropLabels = {
      sweet_corn: "Sweet Corn",
      black_lentils: "Black Lentils",
      sugarcane: "Sugarcane",
      custom: customPlotName || "Custom Plot",
    };

    const colors = {
      sweet_corn: "#22c55e",
      black_lentils: "#eab308",
      sugarcane: "#ef4444",
      custom: "#3b82f6",
    };

    const key = `zone_${Date.now()}`;
    const newPlotData = {
      id: key,
      zone: `Zone ${zoneCount} - ${customPlotName || cropLabels[selectedCropForBoundary]}`,
      name: customPlotName || cropLabels[selectedCropForBoundary],
      crop: cropLabels[selectedCropForBoundary] || "Crop",
      area: `${calculatedAcres.toFixed(2)} Acre (${calculatedBighas.toFixed(1)} Bigha)`,
      color: colors[selectedCropForBoundary] || "#22c55e",
      icon: "🌱",
      center: boundaryPoints[0],
      points: boundaryPoints,
    };

    const updated = {
      ...savedBoundaries,
      [key]: newPlotData,
    };

    setSavedBoundaries(updated);
    saveBoundariesToStorage(updated);
    setEditingBoundary(false);
    drawingLayerRef.current?.clearLayers();
    setStatusMsg(`✅ ${newPlotData.zone} सुरक्षित हो गया! (${newPlotData.area})`);
  };

  const clearAllBoundaries = () => {
    if (!confirm("क्या आप खेत की सभी बाउंड्री हटाना चाहते हैं?")) return;
    setSavedBoundaries({});
    saveBoundariesToStorage({});
    setStatusMsg("सभी बाउंड्री हटा दी गई हैं।");
  };

  // Switch between 3 options: Map, Satellite, 3D View
  const handleSelectMode = (mode) => {
    if (mode === "map") {
      setIs3D(false);
      setMapMode("map");
    } else if (mode === "satellite") {
      setIs3D(false);
      setMapMode("satellite");
    } else if (mode === "3d") {
      setMapMode("satellite");
      setIs3D(true);
      setPitch(45);
      setBearing(-10);
    }
  };

  const handleZoom = (delta) => {
    const map = mapRef.current;
    if (!map) return;
    if (delta > 0) map.zoomIn();
    else map.zoomOut();
  };

  return (
    <div className={`isolate relative z-0 h-full w-full overflow-hidden rounded-[22px] border border-white/85 bg-[#0e2417] shadow-inner select-none ${compact ? "min-h-[280px]" : "min-h-[420px]"}`}>
      <style>{`
        @keyframes ks-gmap-pulse {
          0% { transform: scale(0.6); opacity: 0.9; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        .ks-pt-tooltip {
          background: #000;
          color: #ffeb3b;
          border: 1px solid #ffeb3b;
          border-radius: 4px;
          font-size: 10px;
          padding: 1px 4px;
        }
      `}</style>

      {/* Top Left: Mode Selector (Map, Satellite, 3D View) */}
      <div className={`absolute ${compact ? "left-2.5 top-2.5 p-0.5 z-10" : "left-3 top-3 p-1 z-[500]"} flex items-center rounded-full border border-white/90 bg-white/90 shadow-xl backdrop-blur-md`}>
        <button
          type="button"
          onClick={() => handleSelectMode("map")}
          className={`rounded-full ${compact ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs"} font-bold transition-all ${
            mapMode === "map" && !is3D
              ? "bg-[#176b3e] text-white shadow-md font-black"
              : "text-[#2e4d3b] hover:text-[#176b3e]"
          }`}
        >
          Map
        </button>

        <button
          type="button"
          onClick={() => handleSelectMode("satellite")}
          className={`rounded-full ${compact ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs"} font-bold transition-all ${
            mapMode === "satellite" && !is3D
              ? "bg-[#176b3e] text-white shadow-md font-black"
              : "text-[#2e4d3b] hover:text-[#176b3e]"
          }`}
        >
          Satellite
        </button>

        <button
          type="button"
          onClick={() => handleSelectMode("3d")}
          className={`rounded-full ${compact ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs"} font-bold transition-all ${
            is3D
              ? "bg-[#176b3e] text-white shadow-md font-black"
              : "text-[#2e4d3b] hover:text-[#176b3e]"
          }`}
        >
          3D View
        </button>
      </div>

      {/* Top Center: Location Quick-Jump Pills (Chhutmalpur / Live GPS / Search) */}
      {!compact && (
        <div className="absolute left-1/2 -translate-x-1/2 top-3 z-[480] hidden sm:flex items-center gap-1.5 rounded-full border border-white/80 bg-white/90 px-2 py-1 shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={jumpToChhutmalpur}
            className="flex items-center gap-1 rounded-full bg-[#edf7ee] px-3 py-1 text-[11px] font-extrabold text-[#176b3e] hover:bg-[#d8edd9] transition"
            title="Go to Chhutmalpur Farm"
          >
            <MapPin size={12} />
            <span>📍 Chhutmalpur (Mera Khet)</span>
          </button>

          <button
            type="button"
            onClick={() => detectLocation(false)}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-[#1a73e8] hover:bg-[#eef4fd] transition"
            title="Detect Live GPS Location"
          >
            <LocateFixed size={12} />
            <span>Live GPS</span>
          </button>

          <button
            type="button"
            data-map-search="true"
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-[#5a7263] hover:bg-black/5 transition"
          >
            <Search size={12} />
          </button>
        </div>
      )}

      {/* Top Center Dropdown Search Bar */}
      {!compact && showSearch && (
        <form
          data-map-search="true"
          onSubmit={handleSearchLocation}
          className="absolute left-1/2 -translate-x-1/2 top-14 z-[490] flex items-center gap-2 rounded-2xl border border-white/90 bg-white p-1.5 shadow-2xl backdrop-blur-md w-80"
        >
          <Search size={16} className="ml-2 text-[#6e8576]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search place (e.g. Chhutmalpur, Saharanpur)..."
            className="flex-1 bg-transparent text-xs font-semibold text-[#183a24] outline-none"
            autoFocus
          />
          <button
            type="submit"
            disabled={searching}
            className="rounded-xl bg-[#176b3e] px-3 py-1.5 text-xs font-bold text-white shadow"
          >
            {searching ? "..." : "Go"}
          </button>
        </form>
      )}

      {/* Right Side Floating Vertical Action Buttons */}
      <div className={`absolute ${compact ? "right-2.5 top-2.5 gap-1.5 z-10" : "right-3 top-3 gap-2 z-[500]"} flex flex-col items-center`}>
        {/* Layer Toggle Button (Satellite <-> Map) */}
        <button
          type="button"
          onClick={() => setMapMode((m) => (m === "map" ? "satellite" : "map"))}
          title="Toggle Layers"
          className={`flex ${compact ? "h-8 w-8 rounded-xl" : "h-10 w-10 rounded-2xl"} items-center justify-center border border-white/90 bg-white/95 text-[#244633] shadow-xl backdrop-blur-md transition hover:scale-105 active:scale-95`}
        >
          <Layers size={compact ? 15 : 18} />
        </button>

        {/* Live GPS Locate Me Button */}
        <button
          type="button"
          onClick={() => detectLocation(false)}
          disabled={locating}
          title="Google Map की तरह अपनी लोकेशन देखें"
          className={`flex ${compact ? "h-8 w-8 rounded-xl" : "h-10 w-10 rounded-2xl"} items-center justify-center border border-white/90 bg-white/95 shadow-xl backdrop-blur-md transition hover:scale-105 active:scale-95 ${
            locating ? "animate-spin text-[#1a73e8]" : "text-[#176b3e]"
          }`}
        >
          <LocateFixed size={compact ? 15 : 18} className={currentLocation ? "text-[#1a73e8]" : "text-[#176b3e]"} />
        </button>

        {/* Draw Boundary / Measure Button (Pencil Icon) - shown in full view */}
        {!compact && (
          <button
            type="button"
            onClick={startEditingBoundary}
            title="खेत की बाउंड्री मार्क करें"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/90 bg-white/95 text-[#244633] shadow-xl backdrop-blur-md transition hover:scale-105 active:scale-95"
          >
            <Pencil size={17} />
          </button>
        )}
      </div>

      {/* Bottom Right: Zoom & Compass Controls */}
      <div className={`absolute ${compact ? "right-2.5 bottom-2.5 gap-1.5 z-10" : "right-3 bottom-12 gap-2 z-[500]"} flex flex-col items-center`}>
        {/* Vertical Zoom Control Pill */}
        <div className="flex flex-col items-center rounded-2xl border border-white/90 bg-white/95 shadow-xl backdrop-blur-md overflow-hidden">
          <button
            type="button"
            onClick={() => handleZoom(1)}
            title="Zoom In"
            className={`flex ${compact ? "h-7 w-7" : "h-9 w-9"} items-center justify-center text-[#244633] transition hover:bg-[#edf5ee] active:scale-95`}
          >
            <Plus size={compact ? 13 : 16} />
          </button>
          <div className="h-px w-5 bg-[#e1ece3]" />
          <button
            type="button"
            onClick={() => handleZoom(-1)}
            title="Zoom Out"
            className={`flex ${compact ? "h-7 w-7" : "h-9 w-9"} items-center justify-center text-[#244633] transition hover:bg-[#edf5ee] active:scale-95`}
          >
            <Minus size={compact ? 13 : 16} />
          </button>
        </div>

        {/* Compass Needle Button */}
        {!compact && (
          <button
            type="button"
            onClick={() => {
              setBearing(0);
              mapRef.current?.setView(mapRef.current.getCenter(), mapRef.current.getZoom());
            }}
            title="Reset North"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/90 bg-white/95 text-[#244633] shadow-xl backdrop-blur-md transition hover:scale-105 active:scale-95"
            style={{ transform: `rotate(${-bearing}deg)` }}
          >
            <Compass size={17} className="text-[#c73b3b]" />
          </button>
        )}
      </div>

      {/* 3D Perspective Stage Container */}
      <div
        className="absolute inset-0 h-full w-full"
        style={
          is3D
            ? {
                transform: `perspective(1000px) rotateX(${pitch}deg) rotateZ(${bearing}deg)`,
                transformOrigin: "center 70%",
                transition: "transform 0.4s ease-out",
              }
            : {
                transition: "transform 0.4s ease-out",
              }
        }
      >
        <div ref={mapContainerRef} className="h-full w-full" />
      </div>

      {/* 3D Camera Controls HUD (Visible only in 3D mode) */}
      {is3D && (
        <div className={`absolute ${compact ? "right-11 bottom-2.5 p-1 text-[8px]" : "right-14 bottom-12 p-2"} z-[500] flex flex-col items-center gap-1 rounded-2xl border border-white/90 bg-[#0e2b1c]/90 text-white shadow-2xl backdrop-blur-md`}>
          <p className="text-[8px] font-black text-[#48d982]">3D CAM</p>
          <button
            type="button"
            onClick={() => pan3DCamera(0, -90)}
            className="flex h-6 w-6 items-center justify-center rounded bg-white/15 hover:bg-white/30 active:scale-95"
            title="Pan North"
          >
            <ArrowUp size={12} />
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => pan3DCamera(-90, 0)}
              className="flex h-6 w-6 items-center justify-center rounded bg-white/15 hover:bg-white/30 active:scale-95"
              title="Pan West"
            >
              <ArrowLeft size={12} />
            </button>
            <button
              type="button"
              onClick={() => {
                setBearing(0);
                setPitch(45);
              }}
              className="flex h-6 w-6 items-center justify-center rounded bg-[#48d982] text-[#0f2e1e] font-black text-[9px]"
              title="Reset 3D Center"
            >
              3D
            </button>
            <button
              type="button"
              onClick={() => pan3DCamera(90, 0)}
              className="flex h-6 w-6 items-center justify-center rounded bg-white/15 hover:bg-white/30 active:scale-95"
              title="Pan East"
            >
              <ArrowRight size={12} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => pan3DCamera(0, 90)}
            className="flex h-6 w-6 items-center justify-center rounded bg-white/15 hover:bg-white/30 active:scale-95"
            title="Pan South"
          >
            <ArrowDown size={12} />
          </button>
        </div>
      )}

      {/* Bottom Left: Action bar / Indicator */}
      {compact ? (
        <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1.5 rounded-full border border-white/90 bg-white/95 px-3 py-1 text-[11px] font-extrabold text-[#176b3e] shadow-md backdrop-blur-md">
          <MapPin size={12} />
          <span>{currentLocation ? "Live GPS" : "Chhutmalpur, Saharanpur"}</span>
        </div>
      ) : (
        <div className="absolute bottom-3 left-3 z-[500] flex flex-wrap items-center gap-2">
          {!editingBoundary ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={saveCurrentCenterAsFarm}
                className="flex items-center gap-1.5 rounded-full border border-white/90 bg-white/95 px-3.5 py-2 text-xs font-black text-[#176b3e] shadow-xl backdrop-blur-md transition hover:bg-[#edf8f1] active:scale-95"
                title="Save current view as your permanent farm center"
              >
                <CheckCircle2 size={13} className="text-[#176b3e]" />
                <span>📌 यहाँ मेरा खेत सेट करें (Set Farm Location)</span>
              </button>

              <button
                type="button"
                onClick={jumpToChhutmalpur}
                className="sm:hidden flex items-center gap-1 rounded-full bg-[#176b3e] px-3 py-2 text-xs font-black text-white shadow-xl"
              >
                <MapPin size={12} />
                <span>Chhutmalpur</span>
              </button>
            </div>
          ) : (
          <div className="flex flex-col gap-2 rounded-2xl border-2 border-[#176b3e] bg-white p-3 shadow-2xl backdrop-blur-md sm:flex-row sm:items-center">
            {/* Choose Crop for Boundary */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1a3d28]">फसल:</span>
              <select
                value={selectedCropForBoundary}
                onChange={(e) => setSelectedCropForBoundary(e.target.value)}
                className="rounded-xl border border-[#cfe2d5] bg-[#f7faf8] px-2.5 py-1.5 text-xs font-extrabold text-[#176b3e] outline-none"
              >
                <option value="sweet_corn">🌽 Sweet Corn Farm</option>
                <option value="black_lentils">🫘 Black Lentils (उड़द)</option>
                <option value="sugarcane">🎋 Sugarcane (गन्ना)</option>
                <option value="custom">➕ अन्य खेत (Custom)</option>
              </select>
            </div>

            {selectedCropForBoundary === "custom" && (
              <input
                type="text"
                value={customPlotName}
                onChange={(e) => setCustomPlotName(e.target.value)}
                placeholder="खेत का नाम..."
                className="rounded-xl border border-[#cfe2d5] px-2 py-1 text-xs"
              />
            )}

            {/* Points & Live Area */}
            <div className="flex items-center gap-2 text-xs font-black text-[#176b3e] bg-[#edf8f1] px-3 py-1.5 rounded-xl">
              <span>{boundaryPoints.length} Points</span>
              {calculatedAcres > 0 && (
                <span>• {calculatedAcres.toFixed(2)} Ac ({calculatedBighas.toFixed(1)} Bigha)</span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={saveCurrentBoundary}
                disabled={boundaryPoints.length < 3}
                className="flex items-center gap-1 rounded-xl bg-[#176b3e] px-3 py-1.5 text-xs font-black text-white shadow hover:bg-[#125832] disabled:opacity-50"
              >
                <Check size={13} />
                <span>Save</span>
              </button>

              {boundaryPoints.length > 0 && (
                <button
                  type="button"
                  onClick={undoPoint}
                  className="flex items-center gap-1 rounded-xl border border-[#cbe2d3] px-2 py-1.5 text-xs font-bold text-[#355642] hover:bg-[#f1f7f3]"
                >
                  <Undo2 size={13} />
                  <span>Undo</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setEditingBoundary(false);
                  drawingLayerRef.current?.clearLayers();
                  setStatusMsg("Boundary marking cancelled.");
                }}
                className="rounded-xl px-2 py-1.5 text-xs font-bold text-[#718779] hover:bg-[#f1f7f3]"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    )}

      {/* Bottom Center: Status Bar */}
      <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 ${compact ? "z-10" : "z-[480]"} max-w-[340px] truncate rounded-full border border-white/85 bg-white/95 px-3.5 py-1 text-[11px] font-semibold text-[#2b4837] shadow-xl backdrop-blur-md`}>
        <div className="flex items-center gap-1.5">
          {locating ? (
            <span className="h-2 w-2 rounded-full bg-[#1a73e8] animate-ping" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-[#176b3e]" />
          )}
          <span className="truncate">{statusMsg}</span>
        </div>
      </div>
    </div>
  );
}
