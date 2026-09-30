import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Droplets,
  House,
  IndianRupee,
  Layers,
  Leaf,
  LocateFixed,
  LogOut,
  MapPin,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sprout,
  Sun,
  Tractor,
  UserRound,
  Wheat,
  X,
  Zap,
} from "lucide-react";
import FarmerSectionPage from "./FarmerSectionPage";
import FarmerAiChatView from "./FarmerAiChatView";
import FarmMapPanel from "../components/FarmMapPanel";
import ErrorBoundary from "../components/common/ErrorBoundary";
import farmerApi from "../api/farmerApi";
import { getAuthToken, clearAuthSession } from "../utils/authStorage";

import wheatImg from "../assets/dashboard/wheat.jpg";
import riceImg from "../assets/dashboard/rice.jpg";
import sugarcaneImg from "../assets/dashboard/sugarcane.jpg";
import farmMapPreviewImg from "../assets/dashboard/farm_map_preview.png";
import headerLandscapeImg from "../assets/dashboard/header_banner_clean.png";
import sidebarFoliageImg from "../assets/dashboard/sidebar_foliage_clean.png";
import krishiAiMascotImg from "../assets/krishi_ai_mascot.png";

const safeText = (value, fallback = "Not set") => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object") {
    if (value.crop_name != null) return String(value.crop_name);
    if (value.farm_name != null) return String(value.farm_name);
    if (value.name != null) return String(value.name);
    if (value.label != null) return String(value.label);
  }
  return fallback;
};

function formatDate(value) {
  if (!value) return "Not set";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

function readWeatherTemperature(value) {
  const candidates = [
    value?.temperature,
    value?.temp,
    value?.temperature_c,
    value?.temperature_2m,
    value?.current?.temperature,
    value?.current?.temp,
    value?.current?.temperature_2m,
    value?.current_weather?.temperature,
    value?.current_weather?.temp,
    value?.data?.temperature,
    value?.data?.temp,
  ];
  const found = candidates.find(
    (item) => item !== undefined && item !== null && item !== "" && Number.isFinite(Number(item))
  );
  return found == null ? null : Math.round(Number(found));
}

function readWeatherCondition(value) {
  if (value?.weather_code != null) {
    const code = Number(value.weather_code);
    if (code === 0) return "Clear Sky (साफ मौसम)";
    if ([1, 2, 3].includes(code)) return "Partly Cloudy (आंशिक बादल)";
    if ([45, 48].includes(code)) return "Foggy (कोहरा)";
    if ([51, 53, 55, 61, 63, 65].includes(code)) return "Rainy (वर्षा)";
    if ([80, 81, 82].includes(code)) return "Showers (फुहारें)";
    if ([95, 96, 99].includes(code)) return "Thunderstorm (आंधी/तूफान)";
  }
  return (
    value?.condition ||
    value?.description ||
    value?.weather ||
    value?.current?.condition ||
    value?.current?.description ||
    value?.current_weather?.condition ||
    value?.current_weather?.description ||
    value?.data?.condition ||
    value?.data?.description ||
    "Clear Sky (साफ मौसम)"
  );
}

function NavItem({ icon: Icon, image, label, active, badge, badgeColor, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-left text-[14px] transition cursor-pointer ${
        active
          ? "bg-[#daf1e3] font-bold text-[#156534]"
          : "font-medium text-[#415649] hover:bg-[#eef6f1] hover:text-[#156534]"
      }`}
    >
      <span
        className={`flex items-center justify-center shrink-0 ${
          active ? "text-[#156534]" : "text-[#556d5e] group-hover:text-[#156534]"
        }`}
      >
        {image ? (
          <img
            src={image}
            alt={label}
            className="h-5 w-5 rounded-full object-cover shadow-xs border border-[#15803d]/30"
          />
        ) : (
          <Icon size={19} strokeWidth={active ? 2.4 : 1.9} />
        )}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span
          className={`flex h-4 min-w-[18px] px-1 items-center justify-center rounded-full text-[9px] font-bold shrink-0 ${
            badgeColor || "bg-[#ef4444] text-white"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function FarmerDashboard({ onLogout }) {
  const [data, setData] = useState(null);
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [centres, setCentres] = useState([]);
  const [marketPrices, setMarketPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [sectionPage, setSectionPage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [weather, setWeather] = useState(null);
  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [notificationItems, setNotificationItems] = useState([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [farmForm, setFarmForm] = useState({
    farm_name: "",
    state: "",
    district: "",
    village: "",
    area: "",
    area_unit: "acre",
    irrigation_type: "",
  });
  const [cropForm, setCropForm] = useState({
    farm_id: "",
    crop_name: "",
    season: "",
    sowing_date: "",
    expected_harvest_date: "",
    expected_quantity: "",
    quantity_unit: "quintal",
    status: "GROWING",
  });

  const token = getAuthToken();

  const loadData = useCallback(async () => {
    if (!token) {
      onLogout?.();
      return;
    }

    try {
      setLoading(true);
      setError("");
      const [dashboardResponse, farmsResponse, cropsResponse] = await Promise.all([
        farmerApi.dashboard(),
        farmerApi.farms(),
        farmerApi.crops(),
      ]);

      const dashboard = dashboardResponse.data;
      const farmList = Array.isArray(farmsResponse.data) ? farmsResponse.data : farmsResponse.data?.items || [];
      const rawCrops = Array.isArray(cropsResponse.data) ? cropsResponse.data : cropsResponse.data?.items || [];
      const dashboardCrops = Array.isArray(dashboard?.active_crops) ? dashboard.active_crops : [];
      const mergedCrops = [...rawCrops];
      dashboardCrops.forEach((dc) => {
        if (!mergedCrops.some((c) => String(c.id) === String(dc.id))) {
          mergedCrops.push(dc);
        }
      });

      setData(dashboard);
      setFarms(farmList);
      setCrops(mergedCrops);

      const [centreResult, marketResult] = await Promise.allSettled([
        farmerApi.centres(),
        farmerApi.marketPrices(),
      ]);
      setCentres(
        centreResult.status === "fulfilled"
          ? Array.isArray(centreResult.value.data)
            ? centreResult.value.data
            : centreResult.value.data?.items || []
          : []
      );
      setMarketPrices(
        marketResult.status === "fulfilled"
          ? Array.isArray(marketResult.value.data)
            ? marketResult.value.data
            : marketResult.value.data?.items || []
          : []
      );

      const firstFarm = farmList.find((farm) => farm.latitude != null && farm.longitude != null);
      if (firstFarm) {
        try {
          const weatherResponse = await farmerApi.weather(firstFarm.latitude, firstFarm.longitude);
          setWeather(weatherResponse.data);
        } catch {
          setWeather(null);
        }
      } else {
        const dashboardWeather = dashboard?.weather || dashboard?.current_weather || dashboard?.data?.weather || null;
        if (dashboardWeather && readWeatherTemperature(dashboardWeather) != null) {
          setWeather(dashboardWeather);
        } else if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
              try {
                const weatherResponse = await farmerApi.weather(coords.latitude, coords.longitude);
                setWeather(weatherResponse.data);
              } catch {
                setWeather(dashboardWeather);
              }
            },
            () => setWeather(dashboardWeather),
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 }
          );
        } else {
          setWeather(dashboardWeather);
        }
      }
    } catch (requestError) {
      if (requestError?.response?.status === 401) {
        clearAuthSession();
        onLogout?.();
        return;
      }
      setError(requestError.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [onLogout, token]);

  useEffect(() => {
    loadData();
    const timer = window.setInterval(loadData, 10 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [loadData]);

  // Click outside listener for all popups
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileOpen && !event.target.closest("[data-profile-container]")) {
        setProfileOpen(false);
      }
      if (weatherOpen && !event.target.closest("[data-weather-container]")) {
        setWeatherOpen(false);
      }
      if (search && !event.target.closest("[data-search-container]")) {
        setSearch("");
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setWeatherOpen(false);
        setSearch("");
        if (modal && !saving) {
          setModal(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileOpen, weatherOpen, search, modal, saving]);

  const logout = () => {
    clearAuthSession();
    onLogout?.();
  };

  const openFarmModal = () => {
    setFormError("");
    setFarmForm({
      farm_name: "",
      state: "",
      district: "",
      village: "",
      area: "",
      area_unit: "acre",
      irrigation_type: "",
    });
    setModal("farm");
  };

  const openCropModal = (farmId = "") => {
    setFormError("");
    const defaultFarm = farmId || (farms.length > 0 ? String(farms[0].id) : "");
    setCropForm({
      farm_id: defaultFarm,
      crop_name: "",
      season: "Kharif",
      sowing_date: new Date().toISOString().split("T")[0],
      expected_harvest_date: "",
      expected_quantity: "",
      quantity_unit: "quintal",
      status: "GROWING",
    });
    setModal("crop");
  };

  const saveFarm = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!farmForm.farm_name.trim() || !farmForm.state.trim() || !farmForm.district.trim() || !farmForm.village.trim() || Number(farmForm.area) <= 0) {
      setFormError("Please fill all required farm details.");
      return;
    }
    try {
      setSaving(true);
      await farmerApi.createFarm({
        ...farmForm,
        area: Number(farmForm.area),
        irrigation_type: farmForm.irrigation_type || null,
      });
      setModal(null);
      await loadData();
    } catch (requestError) {
      setFormError(requestError.message || "Could not add farm.");
    } finally {
      setSaving(false);
    }
  };

  const saveCrop = async (event) => {
    event.preventDefault();
    setFormError("");
    
    let targetFarmId = cropForm.farm_id || (farms.length > 0 ? String(farms[0].id) : "");
    const name = cropForm.crop_name.trim();
    if (!name) {
      setFormError("Please enter a crop name (e.g. Rice, Wheat, Sugarcane).");
      return;
    }

    const quantity = Number(cropForm.expected_quantity) > 0 ? Number(cropForm.expected_quantity) : 10;

    try {
      setSaving(true);

      // Auto-create a farm if user has no farm yet
      if (!targetFarmId) {
        const farmRes = await farmerApi.createFarm({
          farm_name: `${name} Farm`,
          state: data?.state || "Uttar Pradesh",
          district: data?.district || "Saharanpur",
          village: "Chhutmalpur",
          area: 5,
          area_unit: "acre",
          irrigation_type: "Tube Well",
          latitude: 30.0363,
          longitude: 77.7518,
        });
        targetFarmId = String(farmRes.data.id);
      }

      const res = await farmerApi.createCrop(targetFarmId, {
        crop_name: name,
        season: cropForm.season || "Kharif",
        sowing_date: cropForm.sowing_date || new Date().toISOString().split("T")[0],
        expected_harvest_date: cropForm.expected_harvest_date || null,
        expected_quantity: quantity,
        quantity_unit: cropForm.quantity_unit || "quintal",
        status: cropForm.status || "GROWING",
      });

      // Optimistic instant state update
      if (res?.data) {
        setCrops((prev) => [res.data, ...prev.filter((c) => String(c.id) !== String(res.data.id))]);
      }

      setModal(null);
      await loadData();
    } catch (requestError) {
      setFormError(requestError.message || "Could not add crop.");
    } finally {
      setSaving(false);
    }
  };

  const farmerName = data?.farmer_name || "Vidit Parmar";
  const totalArea =
    typeof data?.total_area === "number"
      ? data.total_area
      : farms.reduce((sum, farm) => sum + Number(farm.area || 0), 0);

  const filteredSearch = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return [
      ...farms.filter((f) => `${f.farm_name || ""} ${f.village || ""} ${f.district || ""}`.toLowerCase().includes(q)).map((f) => ({
        type: "Farm",
        title: f.farm_name || "Farm",
        detail: `${f.village || ""}${f.district ? `, ${f.district}` : ""}`,
        action: "My Farms",
      })),
      ...crops.filter((c) => `${c.crop_name || ""} ${c.season || ""}`.toLowerCase().includes(q)).map((c) => ({
        type: "Crop",
        title: c.crop_name || "Crop",
        detail: c.season || "Crop record",
        action: "My Crops",
      })),
      ...centres.filter((c) => `${c.name || ""} ${c.centre_name || ""} ${c.district || ""} ${c.address || ""}`.toLowerCase().includes(q)).map((c) => ({
        type: "Centre",
        title: c.name || c.centre_name || "Procurement Centre",
        detail: c.district || c.address || "Centre",
        action: "Find Centre",
      })),
      ...marketPrices.filter((p) => `${p.commodity || ""} ${p.crop_name || ""} ${p.name || ""}`.toLowerCase().includes(q)).map((p) => ({
        type: "Market",
        title: p.commodity || p.crop_name || p.name || "Market price",
        detail: p.price != null ? `₹${p.price} / quintal` : "Market record",
        action: "Market Prices",
      })),
    ].slice(0, 8);
  }, [search, farms, crops, centres, marketPrices]);

  const loadNotifications = useCallback(async () => {
    setNotificationLoading(true);
    setNotificationError("");
    try {
      const response = await farmerApi.notifications();
      const list = Array.isArray(response.data) ? response.data : response.data?.items || [];
      setNotificationItems(list);
    } catch (e) {
      setNotificationError(e?.message || "Could not load notifications.");
    } finally {
      setNotificationLoading(false);
    }
  }, []);

  const markDashboardNotificationRead = async (id) => {
    try {
      await farmerApi.markNotificationRead(id);
      await loadNotifications();
    } catch (e) {
      setNotificationError(e?.message || "Could not mark notification as read.");
    }
  };

  const markAllDashboardNotificationsRead = async () => {
    try {
      await farmerApi.markAllNotificationsRead();
      await loadNotifications();
    } catch (e) {
      setNotificationError(e?.message || "Could not mark notifications as read.");
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setFormError("");
    if (passwordForm.new_password.length < 6) return setFormError("New password must be at least 6 characters.");
    if (passwordForm.new_password !== passwordForm.confirm_password) return setFormError("New passwords do not match.");
    try {
      setSaving(true);
      await farmerApi.updateFarmer({ password: passwordForm.new_password, current_password: passwordForm.current_password });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      setModal("password-success");
    } catch (e) {
      setFormError(e?.message || "Could not change password.");
    } finally {
      setSaving(false);
    }
  };

  const handleNav = (label) => {
    if (label === "Dashboard") {
      setSectionPage(null);
      setModal(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (label === "Notifications") {
      setModal("notifications");
      loadNotifications();
      return;
    }
    if (["My Farms", "My Crops", "Find Centre", "My Bookings", "Live Queue", "Procurement", "Payments", "Market Prices", "Settings", "Advisory", "Schemes", "KrishiSetu AI", "Krishi AI"].includes(label)) {
      setModal(null);
      setSectionPage(label === "Krishi AI" ? "KrishiSetu AI" : label);
      return;
    }
    if (label === "Profile") {
      setProfileOpen(false);
      setModal("profile");
      return;
    }
    setModal(`info:${label}`);
  };

  const renderHeader = () => (
    <header className="sticky top-0 z-20 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-[68px] max-w-[1280px] items-center justify-between gap-4">
        {/* Left: Search Bar */}
        <div data-search-container="true" className="relative flex-1 max-w-[490px]">
          <div className="flex items-center gap-3 rounded-full border border-[#dfe7e1] bg-white px-5 py-3 shadow-[0_2px_10px_rgba(20,50,30,0.03)] focus-within:border-[#22c55e] focus-within:ring-2 focus-within:ring-[#22c55e]/15 transition">
            <Search size={18} className="text-[#869b8e] shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search farms, crops, centres, market prices..."
              className="w-full bg-transparent text-sm text-[#0e2618] outline-none placeholder:text-[#869b8e]"
            />
          </div>

          {search.trim() && (
            <div className="absolute left-0 right-0 top-[56px] z-[60] overflow-hidden rounded-2xl border border-[#dfe8e1] bg-white shadow-2xl">
              {filteredSearch.length ? (
                filteredSearch.map((item, index) => (
                  <button
                    key={`${item.type}-${item.title}-${index}`}
                    type="button"
                    onClick={() => {
                      setSearch("");
                      handleNav(item.action);
                    }}
                    className="flex w-full items-center gap-3 border-b border-[#eef2ee] px-4 py-3 text-left last:border-0 hover:bg-[#f4f8f4] cursor-pointer"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eaf6ed] text-[#176b3e]">
                      <Search size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-extrabold text-[#0e2618]">{item.title}</span>
                      <span className="block truncate text-[10px] text-[#718078]">{item.type} · {item.detail}</span>
                    </span>
                    <ChevronRight size={15} className="text-[#94a198]" />
                  </button>
                ))
              ) : (
                <div className="px-4 py-4 text-xs text-[#718078]">No matching farmer data found.</div>
              )}
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Weather Widget */}
          <div data-weather-container="true" className="relative">
            <button
              type="button"
              onClick={() => setWeatherOpen((v) => !v)}
              className="flex items-center gap-2.5 px-2 py-1 rounded-2xl hover:bg-white/60 transition cursor-pointer"
              title="Click to view weather advisory"
            >
              <div className="flex h-8 w-8 items-center justify-center text-[#f59e0b]">
                <Sun size={26} strokeWidth={2.3} className="fill-[#f59e0b]/20" />
              </div>
              <div className="text-left leading-tight">
                <p className="text-[15px] font-black text-[#0e2618]">
                  {readWeatherTemperature(weather) != null ? `${readWeatherTemperature(weather)}°C` : "32°C"}
                </p>
                <p className="text-[11px] font-medium text-[#71887a]">
                  {farms[0]?.district || "Meerut"}
                </p>
              </div>
            </button>

            {weatherOpen && (
              <div className="absolute right-0 top-[52px] z-[85] w-72 overflow-hidden rounded-3xl border border-[#cce4d4] bg-white p-4 shadow-[0_16px_45px_rgba(23,107,62,.15)] sm:w-80">
                <div className="flex items-center justify-between border-b border-[#edf4ee] pb-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={15} className="text-[#176b3e]" />
                    <div>
                      <p className="text-xs font-extrabold text-[#173a25]">
                        {farms[0]?.village || "Meerut"}, {farms[0]?.district || "Uttar Pradesh"}
                      </p>
                      <p className="text-[9px] font-semibold text-[#718779]">Live Farm Weather</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#eef8f1] px-2 py-0.5 text-[9px] font-black text-[#176b3e]">
                    LIVE
                  </span>
                </div>

                <div className="my-3 flex items-center justify-between rounded-2xl bg-gradient-to-br from-[#f2faf4] to-[#e6f4eb] p-3">
                  <div className="flex items-center gap-3">
                    <Sun size={32} className="text-[#f59e0b] fill-[#f59e0b]/25" />
                    <div>
                      <p className="text-2xl font-black text-[#176b3e]">
                        {readWeatherTemperature(weather) != null ? `${readWeatherTemperature(weather)}°C` : "32°C"}
                      </p>
                      <p className="text-xs font-bold text-[#355642]">
                        {readWeatherCondition(weather)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-[#697f71]">
                    <p>Feels like</p>
                    <p className="font-extrabold text-[#1f3d2b]">
                      {weather?.apparent_temperature_c ? `${Math.round(weather.apparent_temperature_c)}°C` : "34°C"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-[#f7faf7] p-2">
                    <p className="text-[9px] text-[#718779]">Humidity</p>
                    <p className="mt-0.5 text-xs font-black text-[#1d3d29]">
                      {weather?.relative_humidity_percent != null ? `${weather.relative_humidity_percent}%` : "55%"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#f7faf7] p-2">
                    <p className="text-[9px] text-[#718779]">Wind Speed</p>
                    <p className="mt-0.5 text-xs font-black text-[#1d3d29]">
                      {weather?.wind_speed_kmh != null ? `${weather.wind_speed_kmh} km/h` : "8.2 km/h"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#f7faf7] p-2">
                    <p className="text-[9px] text-[#718779]">Rain Chance</p>
                    <p className="mt-0.5 text-xs font-black text-[#1d3d29]">
                      {weather?.precipitation_mm != null ? `${weather.precipitation_mm} mm` : "0 mm"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-[#d6ecdc] bg-[#f5fbf7] p-2.5">
                  <p className="text-[10px] font-bold text-[#1b6b3e]">🌾 कृषि मौसम सलाह (Farm Advisory):</p>
                  <p className="mt-1 text-[11px] leading-4 text-[#395644]">
                    मौसम साफ व अनुकूल है। गेंहू और गन्ने की फसल में सामान्य सिंचाई एवं खाद प्रबंधन जारी रखें।
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <button
            type="button"
            onClick={() => handleNav("Notifications")}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe7e1] bg-white text-[#374d40] shadow-[0_2px_10px_rgba(20,50,30,0.03)] hover:bg-[#f6faf7] transition cursor-pointer"
          >
            <Bell size={18} />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#ef4444] text-[9px] font-black text-white">
              3
            </span>
          </button>

          {/* Profile Pill */}
          <div data-profile-container="true" className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-3 rounded-full border border-[#dfe7e1] bg-white px-3 py-1.5 shadow-[0_2px_10px_rgba(20,50,30,0.03)] hover:bg-[#f6faf7] transition cursor-pointer"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#104b2b] text-[13px] font-black text-white">
                {farmerName.charAt(0) || "V"}
              </span>
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-[13px] font-black text-[#0e2618]">{farmerName}</p>
                <p className="text-[10px] font-medium text-[#71887a]">Farmer</p>
              </div>
              <ChevronDown size={14} className={`text-[#71887a] transition ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-[52px] z-50 w-56 overflow-hidden rounded-2xl border border-[#dfe8e1] bg-white p-2 shadow-2xl">
                <div className="border-b border-[#edf1ed] px-3 py-2.5">
                  <p className="text-sm font-extrabold text-[#0e2618]">{farmerName}</p>
                  <p className="text-[10px] text-[#718078]">Farmer account</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setModal("profile");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-[#f3f7f3] cursor-pointer"
                >
                  <UserRound size={16} />
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setFormError("");
                    setModal("change-password");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-[#f3f7f3] cursor-pointer"
                >
                  <Settings size={16} />
                  Change password
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#b83b42] hover:bg-[#fff1f1] cursor-pointer"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );

  const renderSidebar = () => (
    <aside className="fixed left-4 top-4 z-30 hidden h-[calc(100vh-32px)] w-[240px] flex-col overflow-hidden rounded-[26px] border border-[#e4ece5] bg-white shadow-[0_8px_30px_rgba(20,60,35,0.035)] lg:flex">
      {/* Top Logo */}
      <div className="flex items-center gap-3 px-5 pb-6 pt-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e6f7ec] text-[#16a34a] shadow-xs">
          <Leaf size={22} strokeWidth={2.4} className="rotate-[-10deg]" />
        </div>
        <div>
          <p className="text-[21px] font-black tracking-[-0.035em] text-[#0e2618]">KrishiSetu</p>
          <p className="text-[10px] font-medium text-[#71887a]">Farm Easier, Grow Better</p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="space-y-1 px-3">
        <NavItem
          icon={House}
          label="Dashboard"
          active={!sectionPage}
          onClick={() => handleNav("Dashboard")}
        />
        <NavItem
          icon={Tractor}
          label="My Farms"
          active={sectionPage === "My Farms"}
          onClick={() => handleNav("My Farms")}
        />
        <NavItem
          icon={Sprout}
          label="My Crops"
          active={sectionPage === "My Crops"}
          onClick={() => handleNav("My Crops")}
        />
        <NavItem
          icon={MapPin}
          label="Find Centre"
          active={sectionPage === "Find Centre"}
          onClick={() => handleNav("Find Centre")}
        />
        <NavItem
          icon={CalendarDays}
          label="My Bookings"
          active={sectionPage === "My Bookings"}
          onClick={() => handleNav("My Bookings")}
        />
        <NavItem
          icon={IndianRupee}
          label="Market Prices"
          active={sectionPage === "Market Prices"}
          onClick={() => handleNav("Market Prices")}
        />
        <NavItem
          icon={Sparkles}
          image={krishiAiMascotImg}
          label="Krishi AI"
          badge="AI"
          badgeColor="bg-[#15803d] text-white font-black"
          active={sectionPage === "KrishiSetu AI"}
          onClick={() => handleNav("KrishiSetu AI")}
        />
        <NavItem
          icon={Settings}
          label="Settings"
          active={sectionPage === "Settings"}
          onClick={() => handleNav("Settings")}
        />
      </nav>

      {/* Bottom Foliage Illustration */}
      <div className="mt-auto overflow-hidden pointer-events-none">
        <img
          src={sidebarFoliageImg}
          alt="KrishiSetu Nature Illustration"
          className="w-full h-auto object-cover block"
        />
      </div>
    </aside>
  );

  // Sub-pages view (My Farms, My Crops, etc.)
  if (sectionPage) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-[#f2f7f4] text-[#0e2618]">
        <div className="flex min-h-screen">
          {renderSidebar()}
          <div className="min-w-0 flex-1 lg:pl-[265px]">
            {renderHeader()}
            <section className="mx-auto w-full max-w-[1280px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
              <ErrorBoundary fallbackTitle={`Error in ${sectionPage}`} onGoBack={() => setSectionPage(null)}>
                {sectionPage === "KrishiSetu AI" ? (
                  <FarmerAiChatView
                    farmerName={farmerName}
                    farms={farms}
                    crops={crops}
                    onBack={() => setSectionPage(null)}
                  />
                ) : (
                  <FarmerSectionPage
                    section={sectionPage}
                    farms={farms}
                    crops={crops}
                    onBack={() => setSectionPage(null)}
                    onRefreshData={loadData}
                  />
                )}
              </ErrorBoundary>
            </section>
          </div>
        </div>
      </main>
    );
  }

  // Pixel-perfect Main Dashboard view matching media_1790760935927.jpg
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f2f7f4] text-[#0e2618]">
      <div className="flex min-h-screen">
        {renderSidebar()}

        <div className="min-w-0 flex-1 lg:pl-[265px]">
          {renderHeader()}

          <section className="mx-auto w-full max-w-[1280px] px-4 pb-12 pt-5 sm:px-6 lg:px-8">
            {/* Greeting Banner */}
            <div className="relative mb-6 pt-2">
              <div>
                <p className="text-[15px] font-medium text-[#3f574a]">Good Morning,</p>
                <h1 className="mt-0.5 text-[32px] sm:text-[38px] font-black tracking-tight text-[#0e2618] flex items-center gap-2">
                  <span>{farmerName}</span>
                  <span className="text-[30px]">🌱</span>
                </h1>
                <p className="mt-1 text-[15px] font-normal text-[#5b7366]">
                  Here's your farm overview for today.
                </p>
              </div>

              {/* Top-Right Scenic Illustration */}
              <img
                src={headerLandscapeImg}
                alt="KrishiSetu Farmland Illustration"
                className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 h-[95px] max-w-[390px] object-contain pointer-events-none"
              />
            </div>

            {/* 4 Cards Grid (Two-Column Layout) */}
            <div className="grid gap-6 lg:grid-cols-[1.58fr_1fr]">
              {/* Card 1: Your Farm Map */}
              <div className="rounded-[26px] border border-[#e4ece5] bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgba(20,60,35,0.035)] flex flex-col justify-between">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <MapPin size={20} className="text-[#15803d]" />
                    <h2 className="text-[18px] font-black text-[#0e2618]">Your Farm Map</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModal("full-map")}
                    className="flex items-center gap-1.5 rounded-full border border-[#22c55e] px-4 py-1.5 text-xs font-bold text-[#15803d] transition hover:bg-[#eef8f1] cursor-pointer"
                  >
                    <span>View Full Map</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="isolate relative z-0 h-[310px] w-full overflow-hidden rounded-2xl border border-[#d8e8dd] bg-[#0e2417] shadow-inner">
                  <FarmMapPanel farms={farms} crops={crops} compact={true} />
                </div>
              </div>

              {/* Card 2: Farm Overview */}
              <div className="rounded-[26px] border border-[#e4ece5] bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgba(20,60,35,0.035)] flex flex-col justify-between">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-end gap-0.5 text-[#15803d]">
                      <span className="w-1 h-2.5 bg-[#15803d] rounded-xs" />
                      <span className="w-1 h-4 bg-[#15803d] rounded-xs" />
                      <span className="w-1 h-3 bg-[#15803d] rounded-xs" />
                    </div>
                    <h2 className="text-[18px] font-black text-[#0e2618]">Farm Overview</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNav("My Farms")}
                    className="flex items-center gap-1.5 rounded-full border border-[#22c55e] px-4 py-1.5 text-xs font-bold text-[#15803d] transition hover:bg-[#eef8f1] cursor-pointer"
                  >
                    <span>View All</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {/* 1. Total Area */}
                  <div className="flex items-center gap-3.5 rounded-2xl border border-[#edf3ee] bg-white p-3.5 transition hover:border-[#cde5d4]">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eaf7ee] text-[#15803d]">
                      <Layers size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#71887a]">Total Area</p>
                      <p className="text-[17px] font-black text-[#0e2618]">
                        {totalArea ? `${totalArea} Acres` : farms.length > 0 ? "12 Acres" : "0 Acres"}
                      </p>
                    </div>
                  </div>

                  {/* 2. Current Crop */}
                  <div className="flex items-center gap-3.5 rounded-2xl border border-[#edf3ee] bg-white p-3.5 transition hover:border-[#cde5d4]">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eaf7ee] text-[#15803d]">
                      <Sprout size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#71887a]">Current Crop</p>
                      <p className="text-[17px] font-black text-[#0e2618]">
                        {crops.length > 0 ? safeText(crops[0].crop_name, "Crop") : "No crop added"}
                      </p>
                    </div>
                  </div>

                  {/* 3. Location */}
                  <div className="flex items-center gap-3.5 rounded-2xl border border-[#edf3ee] bg-white p-3.5 transition hover:border-[#cde5d4]">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eaf7ee] text-[#15803d]">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#71887a]">Location</p>
                      <p className="text-[17px] font-black text-[#0e2618]">
                        {farms.length > 0
                          ? `${farms[0].village || farms[0].district || "Chhutmalpur"}${farms[0].district ? `, ${farms[0].district}` : ""}`
                          : data?.district
                          ? `${data.district}, ${data.state || "UP"}`
                          : "Chhutmalpur, Saharanpur"}
                      </p>
                    </div>
                  </div>

                  {/* 4. Irrigation */}
                  <div className="flex items-center gap-3.5 rounded-2xl border border-[#edf3ee] bg-white p-3.5 transition hover:border-[#cde5d4]">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eaf7ee] text-[#0284c7]">
                      <Droplets size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#71887a]">Irrigation</p>
                      <p className="text-[17px] font-black text-[#0e2618]">
                        {farms[0]?.irrigation_type || (farms.length > 0 ? "Tube Well" : "Not set")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: My Crops */}
              <div className="rounded-[26px] border border-[#e4ece5] bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgba(20,60,35,0.035)]">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sprout size={20} className="text-[#15803d]" />
                    <h2 className="text-[18px] font-black text-[#0e2618]">My Crops</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openCropModal()}
                      className="flex items-center gap-1 rounded-full bg-[#16804b] px-3.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-[#12653a] transition cursor-pointer"
                    >
                      <Plus size={13} strokeWidth={2.8} />
                      <span>Add Crop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav("My Crops")}
                      className="flex items-center gap-1 rounded-full border border-[#22c55e] px-3.5 py-1 text-xs font-bold text-[#15803d] transition hover:bg-[#eef8f1] cursor-pointer"
                    >
                      <span>View All</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex min-h-[140px] items-center justify-center">
                    <p className="text-sm font-semibold text-[#71887a]">Loading crops...</p>
                  </div>
                ) : crops.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-[#cfe2d5] bg-[#f8fcf9] p-6 text-center flex flex-col items-center justify-center min-h-[160px]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e6f7ec] text-[#16a34a] mb-2 shadow-xs">
                      <Sprout size={22} strokeWidth={2.2} />
                    </div>
                    <h3 className="text-[15px] font-black text-[#0e2618]">No crops added yet</h3>
                    <p className="mt-0.5 text-xs text-[#62776b] max-w-sm">
                      Track crop growth, sowing dates, and harvest schedule by adding your active crops.
                    </p>
                    <button
                      type="button"
                      onClick={() => openCropModal()}
                      className="mt-3.5 inline-flex items-center gap-2 rounded-full bg-[#16804b] hover:bg-[#12653a] px-5 py-2 text-xs font-bold text-white shadow-md shadow-[#16804b]/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <Plus size={15} strokeWidth={2.8} />
                      <span>Add Crop</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                    {crops.map((crop, index) => {
                      const name = String(crop.crop_name || "").toLowerCase();
                      let img = wheatImg;
                      if (name.includes("rice") || name.includes("चावल") || name.includes("धान") || name.includes("paddy")) {
                        img = riceImg;
                      } else if (name.includes("sugar") || name.includes("गन्ना") || name.includes("cane")) {
                        img = sugarcaneImg;
                      }

                      const status = String(crop.status || "GROWING").toUpperCase();
                      let badgeBg = "bg-[#dcfce7] text-[#15803d]";
                      let badgeLabel = "Active";

                      if (status.includes("HARVEST")) {
                        badgeBg = "bg-[#ffedd5] text-[#c2410c]";
                        badgeLabel = "Harvest Ready";
                      } else if (status.includes("PLAN") || status.includes("SOWN")) {
                        badgeBg = "bg-[#fef3c7] text-[#b45309]";
                        badgeLabel = "Planning";
                      } else if (status.includes("COMPLETED")) {
                        badgeBg = "bg-[#f1f5f9] text-[#475569]";
                        badgeLabel = "Completed";
                      }

                      return (
                        <div
                          key={crop.id || index}
                          className="flex flex-col overflow-hidden rounded-2xl border border-[#edf3ee] bg-white transition hover:border-[#cde5d4] hover:shadow-md"
                        >
                          <img
                            src={img}
                            alt={crop.crop_name || "Crop"}
                            className="h-[95px] w-full rounded-t-2xl object-cover"
                          />
                          <div className="p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="text-[15px] font-black text-[#0e2618]">
                                {safeText(crop.crop_name, "Crop")}
                              </h3>
                              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${badgeBg}`}>
                                {badgeLabel}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-[#526a5c]">
                              <Sprout size={13} className="text-[#15803d]" />
                              <span>
                                {crop.expected_quantity ? `${crop.expected_quantity} ${crop.quantity_unit || "quintal"}` : "Area not set"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-[#526a5c]">
                              <CalendarDays size={13} className="text-[#71887a]" />
                              <span>Sown: {crop.sowing_date ? formatDate(crop.sowing_date) : "Recent"}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Card 4: Quick Actions */}
              <div className="rounded-[26px] border border-[#e4ece5] bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgba(20,60,35,0.035)] flex flex-col justify-between">
                <div className="mb-4 flex items-center gap-2.5">
                  <Zap size={20} className="text-[#eab308] fill-[#eab308]" />
                  <h2 className="text-[18px] font-black text-[#0e2618]">Quick Actions</h2>
                </div>

                <div className="space-y-3">
                  {/* Add Farm */}
                  <button
                    type="button"
                    onClick={openFarmModal}
                    className="flex w-full items-center justify-between rounded-2xl border border-[#d6ecdc] bg-[#ecf8f1] p-3.5 text-left transition hover:bg-[#e2f5e8] cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#15803d] text-white shadow-xs">
                        <Plus size={18} strokeWidth={2.8} />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-[#0e2618]">Add Farm</p>
                        <p className="text-[11px] text-[#556d5e]">Register your farm location and details</p>
                      </div>
                    </div>
                    <ChevronRight size={18} strokeWidth={2.5} className="text-[#15803d]" />
                  </button>

                  {/* Add Crop */}
                  <button
                    type="button"
                    onClick={() => openCropModal()}
                    className="flex w-full items-center justify-between rounded-2xl border border-[#dbeafe] bg-[#eef6ff] p-3.5 text-left transition hover:bg-[#e4efff] cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-[#2563eb] shadow-xs">
                        <Sprout size={18} strokeWidth={2.4} />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-[#0e2618]">Add Crop</p>
                        <p className="text-[11px] text-[#556d5e]">Add a new crop to your farm</p>
                      </div>
                    </div>
                    <ChevronRight size={18} strokeWidth={2.5} className="text-[#2563eb]" />
                  </button>

                  {/* Find Centre */}
                  <button
                    type="button"
                    onClick={() => handleNav("Find Centre")}
                    className="flex w-full items-center justify-between rounded-2xl border border-[#fef08a] bg-[#fef8ed] p-3.5 text-left transition hover:bg-[#fef2dc] cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fde68a] text-[#d97706] shadow-xs">
                        <MapPin size={18} strokeWidth={2.4} />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-[#0e2618]">Find Centre</p>
                        <p className="text-[11px] text-[#556d5e]">Locate nearby procurement centres</p>
                      </div>
                    </div>
                    <ChevronRight size={18} strokeWidth={2.5} className="text-[#d97706]" />
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Floating Krishi AI Assistant Button */}
      <button
        type="button"
        onClick={() => handleNav("KrishiSetu AI")}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-[#135933] px-4 py-3 text-white shadow-[0_8px_25px_rgba(19,89,51,0.35)] transition-all hover:scale-105 hover:bg-[#0e4326] active:scale-95 cursor-pointer"
        title="Ask KrishiSetu AI Assistant"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
          <Sparkles size={16} />
        </span>
        <span className="text-sm font-bold">Ask Krishi AI</span>
      </button>

      {/* Full Map Modal */}
      {modal === "full-map" && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#10291d]/40 p-4 backdrop-blur-xs"
        >
          <div className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/90 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e5ede7] px-6 py-4 bg-[#f8fbf9]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e1f4e7] text-[#15803d]">
                  <MapPin size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#0e2618]">Interactive Farm Map & 3D Boundaries</h2>
                  <p className="text-xs text-[#71887a]">Meerut, Uttar Pradesh · 12 Acres</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-xl p-2 text-[#566e5f] hover:bg-[#ebf3ed] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative flex-1">
              <FarmMapPanel farms={farms} crops={crops} />
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {modal === "notifications" && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#10291d]/20 px-4 py-4 backdrop-blur-[2px]"
        >
          <div className="w-full max-w-md overflow-hidden rounded-[26px] border border-white/90 bg-white shadow-[0_24px_70px_rgba(20,57,35,.22)]">
            <div className="flex items-center justify-between border-b border-[#e8eee9] bg-[#f7fbf8] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e1f4e7] text-[#176b3e]">
                  <Bell size={19} />
                </span>
                <div>
                  <h2 className="text-lg font-extrabold text-[#0e2618]">Notifications</h2>
                  <p className="text-[10px] text-[#718078]">Live updates from KrishiSetu</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-xl p-2 text-[#5c6d63] hover:bg-white cursor-pointer"
                aria-label="Close notifications"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[62vh] overflow-y-auto p-4">
              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  onClick={markAllDashboardNotificationsRead}
                  disabled={notificationLoading || !notificationItems.some((item) => !item.is_read)}
                  className="rounded-xl border border-[#cbd9ce] px-3 py-2 text-[10px] font-bold text-[#176b3e] disabled:opacity-40 cursor-pointer"
                >
                  Mark all read
                </button>
              </div>
              {notificationError && (
                <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                  {notificationError}
                </div>
              )}
              {notificationLoading ? (
                <div className="flex min-h-[160px] items-center justify-center">
                  <div className="text-center">
                    <Bell className="mx-auto animate-pulse text-[#176b3e]" size={28} />
                    <p className="mt-2 text-xs font-bold text-[#63736b]">Loading notifications…</p>
                  </div>
                </div>
              ) : notificationItems.length ? (
                <div className="space-y-2.5">
                  {notificationItems.map((notification) => (
                    <div
                      key={notification.id}
                      className={`rounded-2xl border p-3.5 ${
                        notification.is_read
                          ? "border-[#e7ece8] bg-[#fafcfa] opacity-70"
                          : "border-[#d8eadc] bg-[#f3faf5]"
                      }`}
                    >
                      <div className="flex gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e1f4e7] text-[#176b3e]">
                          <Bell size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-extrabold text-[#0e2618]">{notification.title}</p>
                            {!notification.is_read && (
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#ef4444]" />
                            )}
                          </div>
                          <p className="mt-1 text-xs leading-5 text-[#66776d]">{notification.message}</p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <p className="text-[9px] text-[#8a968e]">
                              {notification.created_at ? new Date(notification.created_at).toLocaleString("en-IN") : ""}
                            </p>
                            {!notification.is_read && (
                              <button
                                type="button"
                                onClick={() => markDashboardNotificationRead(notification.id)}
                                className="rounded-lg bg-white px-2 py-1 text-[9px] font-bold text-[#176b3e] cursor-pointer"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#cbd9ce] bg-[#fbfdfb] text-center">
                  <Bell className="text-[#77a182]" size={28} />
                  <p className="mt-2 text-sm font-bold text-[#607167]">You are all caught up.</p>
                  <p className="mt-1 text-[10px] text-[#87948c]">New farmer updates will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {modal === "profile" && (
        <Modal title="My profile" onClose={() => setModal(null)}>
          <div className="grid grid-cols-2 gap-3">
            <ProfileValue label="Name" value={farmerName} />
            <ProfileValue label="Role" value="Farmer" />
            <ProfileValue label="District" value={data?.district || farms[0]?.district || "Meerut"} />
            <ProfileValue label="State" value={data?.state || farms[0]?.state || "Uttar Pradesh"} />
          </div>
          <button
            onClick={() => setModal(null)}
            className="mt-4 w-full rounded-xl bg-[#16804b] px-4 py-3 text-sm font-bold text-white cursor-pointer"
          >
            Done
          </button>
        </Modal>
      )}

      {/* Change Password Modal */}
      {modal === "change-password" && (
        <Modal title="Change password" onClose={() => !saving && setModal(null)}>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <Field
              label="Current password"
              type="password"
              value={passwordForm.current_password}
              onChange={(value) => setPasswordForm((p) => ({ ...p, current_password: value }))}
            />
            <Field
              label="New password"
              type="password"
              value={passwordForm.new_password}
              onChange={(value) => setPasswordForm((p) => ({ ...p, new_password: value }))}
            />
            <Field
              label="Confirm new password"
              type="password"
              value={passwordForm.confirm_password}
              onChange={(value) => setPasswordForm((p) => ({ ...p, confirm_password: value }))}
            />
            {formError && <p className="text-xs text-red-600">{formError}</p>}
            <button
              disabled={saving}
              className="w-full rounded-xl bg-[#16804b] px-4 py-3 text-sm font-bold text-white disabled:opacity-60 cursor-pointer"
            >
              {saving ? "Changing..." : "Change password"}
            </button>
          </form>
        </Modal>
      )}

      {/* Password Success */}
      {modal === "password-success" && (
        <Modal title="Password changed" onClose={() => setModal(null)}>
          <div className="rounded-2xl bg-[#eef8ef] p-5 text-center">
            <CheckCircle2 className="mx-auto text-[#16804b]" size={38} />
            <p className="mt-3 text-lg font-extrabold text-[#0e2618]">Password updated successfully.</p>
            <p className="mt-1 text-xs text-[#718078]">
              Your account password was updated through the connected farmer profile service.
            </p>
          </div>
          <button
            onClick={() => setModal(null)}
            className="mt-4 w-full rounded-xl bg-[#16804b] px-4 py-3 text-sm font-bold text-white cursor-pointer"
          >
            Done
          </button>
        </Modal>
      )}

      {/* Add Farm Modal */}
      {modal === "farm" && (
        <Modal title="Add Farm" onClose={() => setModal(null)}>
          <form onSubmit={saveFarm} className="space-y-3">
            <Field
              label="Farm name"
              value={farmForm.farm_name}
              onChange={(value) => setFarmForm((p) => ({ ...p, farm_name: value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="State"
                value={farmForm.state}
                onChange={(value) => setFarmForm((p) => ({ ...p, state: value }))}
              />
              <Field
                label="District"
                value={farmForm.district}
                onChange={(value) => setFarmForm((p) => ({ ...p, district: value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Village"
                value={farmForm.village}
                onChange={(value) => setFarmForm((p) => ({ ...p, village: value }))}
              />
              <Field
                label="Area"
                type="number"
                value={farmForm.area}
                onChange={(value) => setFarmForm((p) => ({ ...p, area: value }))}
              />
            </div>
            <Field
              label="Irrigation type"
              value={farmForm.irrigation_type}
              onChange={(value) => setFarmForm((p) => ({ ...p, irrigation_type: value }))}
              placeholder="e.g. Tube Well, Canal"
            />
            {formError && <p className="text-xs font-medium text-red-600">{formError}</p>}
            <button
              disabled={saving}
              className="w-full rounded-xl bg-[#16804b] px-4 py-3 text-sm font-bold text-white disabled:opacity-60 cursor-pointer"
            >
              {saving ? "Saving..." : "Add Farm"}
            </button>
          </form>
        </Modal>
      )}

      {/* Add Crop Modal */}
      {modal === "crop" && (
        <Modal title="Add Crop" onClose={() => setModal(null)}>
          <form onSubmit={saveCrop} className="space-y-3">
            <label className="block text-xs font-semibold text-[#53645b]">
              Farm
              <select
                value={cropForm.farm_id}
                onChange={(e) => setCropForm((p) => ({ ...p, farm_id: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-[#dce6de] bg-white px-3 py-3 text-sm font-semibold text-[#16804b] outline-none"
              >
                {farms.length === 0 ? (
                  <option value="">Default Farm (Chhutmalpur, Saharanpur)</option>
                ) : (
                  farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>
                      {farm.farm_name} ({farm.village || farm.district || "Farm"})
                    </option>
                  ))
                )}
              </select>
            </label>
            <Field
              label="Crop name"
              value={cropForm.crop_name}
              onChange={(value) => setCropForm((p) => ({ ...p, crop_name: value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Season"
                value={cropForm.season}
                onChange={(value) => setCropForm((p) => ({ ...p, season: value }))}
              />
              <Field
                label="Expected quantity"
                type="number"
                value={cropForm.expected_quantity}
                onChange={(value) => setCropForm((p) => ({ ...p, expected_quantity: value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Sowing date"
                type="date"
                value={cropForm.sowing_date}
                onChange={(value) => setCropForm((p) => ({ ...p, sowing_date: value }))}
              />
              <Field
                label="Harvest date"
                type="date"
                value={cropForm.expected_harvest_date}
                onChange={(value) => setCropForm((p) => ({ ...p, expected_harvest_date: value }))}
              />
            </div>
            {formError && <p className="text-xs font-medium text-red-600">{formError}</p>}
            <button
              disabled={saving}
              className="w-full rounded-xl bg-[#16804b] px-4 py-3 text-sm font-bold text-white disabled:opacity-60 cursor-pointer"
            >
              {saving ? "Saving..." : "Add Crop"}
            </button>
          </form>
        </Modal>
      )}

      {/* Info Modal */}
      {modal && modal.startsWith("info:") && (
        <Modal title={modal.slice(5)} onClose={() => setModal(null)}>
          <div className="rounded-2xl border border-[#d8ebdd] bg-[#f3fbf5] p-4">
            <p className="text-sm font-extrabold text-[#176b3e]">KrishiSetu farmer service</p>
            <p className="mt-1 text-sm leading-6 text-[#63736b]">
              Use the left navigation to open this module. Data is loaded through the connected backend service.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModal(null)}
            className="mt-5 w-full rounded-xl bg-[#16804b] px-4 py-3 text-sm font-bold text-white cursor-pointer"
          >
            Close
          </button>
        </Modal>
      )}
    </main>
  );
}

function ProfileValue({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#e0e9e1] bg-white/70 p-3">
      <p className="text-[9px] font-extrabold uppercase tracking-[.12em] text-[#7a877f]">{label}</p>
      <p className="mt-1 text-sm font-extrabold text-[#20362a]">{value || "Not set"}</p>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <label className="block text-xs font-semibold text-[#53645b]">
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-[#dce6de] bg-white px-3 py-3 text-sm font-normal text-[#1c3025] outline-none focus:border-[#5ba579]"
      />
    </label>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#183326]/40 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg rounded-[26px] border border-white bg-[#f9fcfa] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#0e2618]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#edf3ee] p-2 hover:bg-[#e2ede4] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default FarmerDashboard;
