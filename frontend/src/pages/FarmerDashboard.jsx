import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Bot,
  CloudSun,
  LocateFixed,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  FileText,
  House,
  IndianRupee,
  Leaf,
  LogOut,
  MapPin,
  Plus,
  Search,
  Settings,
  Sprout,
  Tractor,
  UserRound,
  Users,
  Wheat,
  X,
  Sparkles,
  Send,
  RefreshCw,
} from "lucide-react";
import heroImage from "../assets/hero-photo.png";
import farmImage from "../assets/farm-photo.png";
import cropCardImage from "../assets/crop-photo.png";
import centreImage from "../assets/centre-photo.png";
import FarmerSectionPage from "./FarmerSectionPage";
import FarmerAiChatView from "./FarmerAiChatView";
import FarmMapPanel from "../components/FarmMapPanel";
import ErrorBoundary from "../components/common/ErrorBoundary";
import farmerApi from "../api/farmerApi";
import krishiAiCardBg from "../assets/krishi_ai_card_bg.jpg";
import krishiMascotImg from "../assets/krishi_ai_mascot.png";

const safeText = (value, fallback = "Not set") => {
  if (value === undefined || value === null || value === "") return fallback;

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (typeof value === "object") {
    if (value.crop_name != null) return String(value.crop_name);
    if (value.farm_name != null) return String(value.farm_name);
    if (value.name != null) return String(value.name);
    if (value.label != null) return String(value.label);

    return fallback;
  }

  return fallback;
};

function formatDate(value) {
  if (!value) return "Not set";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusLabel(status) {
  return String(status || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
  const found = candidates.find((item) => item !== undefined && item !== null && item !== "" && Number.isFinite(Number(item)));
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
  return value?.condition || value?.description || value?.weather || value?.current?.condition || value?.current?.description || value?.current_weather?.condition || value?.current_weather?.description || value?.data?.condition || value?.data?.description || "Clear Sky (साफ मौसम)";
}

function NavItem({ icon: Icon, label, active, badge, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[14px] font-medium transition ${
        active
          ? "bg-[#dff3e7] text-[#12633a] shadow-[inset_0_0_0_1px_rgba(30,125,75,.08)]"
          : "text-[#405149] hover:bg-white/70 hover:text-[#12633a]"
      }`}
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? "bg-white/75" : "bg-white/55"}`}>
        <Icon size={19} strokeWidth={1.9} />
      </span>
      <span className="flex-1">{label}</span>
      {badge && <span className="rounded-full bg-[#e94d52] px-1.5 py-0.5 text-[9px] font-bold text-white">{badge}</span>}
    </button>
  );
}

function GlassCard({ children, className = "", ...props }) {
  return (
    <section
      className={`rounded-[24px] border border-white/80 bg-white/72 shadow-[0_18px_50px_rgba(44,83,60,.07)] backdrop-blur-xl ${className}`}
      {...props}
    >
      {children}
    </section>
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
  const [mapMode, setMapMode] = useState("3D View");
  const [mapZoom, setMapZoom] = useState(1);
  const [weather, setWeather] = useState(null);
  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiBusy, setAiBusy] = useState(false);
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

  const token = localStorage.getItem("krishisetu_access_token");

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
      const cropList = Array.isArray(cropsResponse.data) ? cropsResponse.data : cropsResponse.data?.items || [];
      setData(dashboard);
      setFarms(farmList);
      setCrops(cropList);

      const [centreResult, marketResult] = await Promise.allSettled([
        farmerApi.centres(),
        farmerApi.marketPrices(),
      ]);
      setCentres(centreResult.status === "fulfilled" ? (Array.isArray(centreResult.value.data) ? centreResult.value.data : centreResult.value.data?.items || []) : []);
      setMarketPrices(marketResult.status === "fulfilled" ? (Array.isArray(marketResult.value.data) ? marketResult.value.data : marketResult.value.data?.items || []) : []);

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
        localStorage.removeItem("krishisetu_access_token");
        localStorage.removeItem("krishisetu_role");
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
    localStorage.removeItem("krishisetu_access_token");
    localStorage.removeItem("krishisetu_role");
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

  const openCropModal = (farmId = farms[0]?.id || "") => {
    setFormError("");
    setCropForm({
      farm_id: String(farmId),
      crop_name: "",
      season: "",
      sowing_date: "",
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
    if (!cropForm.farm_id || !cropForm.crop_name.trim() || Number(cropForm.expected_quantity) <= 0) {
      setFormError("Select a farm and fill the required crop details.");
      return;
    }
    try {
      setSaving(true);
      await farmerApi.createCrop(cropForm.farm_id, {
        crop_name: cropForm.crop_name.trim(),
        season: cropForm.season || null,
        sowing_date: cropForm.sowing_date || null,
        expected_harvest_date: cropForm.expected_harvest_date || null,
        expected_quantity: Number(cropForm.expected_quantity),
        quantity_unit: cropForm.quantity_unit,
        status: cropForm.status,
      });
      setModal(null);
      await loadData();
    } catch (requestError) {
      setFormError(requestError.message || "Could not add crop.");
    } finally {
      setSaving(false);
    }
  };

  const firstName = (data?.farmer_name || "Farmer").split(" ")[0];
  const farmerName = data?.farmer_name || "Farmer";
  const upcoming = data?.upcoming_harvests || [];
  const totalArea =
  typeof data?.total_area === "number"
    ? data.total_area
    : farms.reduce((sum, farm) => sum + Number(farm.area || 0), 0);

const activeCrops =
  typeof data?.active_crops === "number"
    ? data.active_crops
    : Array.isArray(data?.active_crops)
      ? data.active_crops.length
      : crops.length;

const harvestReady =
  typeof data?.harvest_ready === "number"
    ? data.harvest_ready
    : Array.isArray(data?.harvest_ready)
      ? data.harvest_ready.length
      : crops.filter(
          (crop) =>
            String(crop.status || "").toUpperCase() === "HARVEST_READY"
        ).length;

const upcomingBookings =
  typeof data?.upcoming_bookings === "number"
    ? data.upcoming_bookings
    : Array.isArray(data?.upcoming_bookings)
      ? data.upcoming_bookings.length
      : 0;
  const activities = [
    { icon: Sprout, title: crops[0] ? `Crop added: ${crops[0].crop_name}` : "Crop activity", time: "Latest backend record" },
    { icon: Tractor, title: farms[0] ? `Farm updated: ${farms[0].farm_name}` : "Farm activity", time: "3 hours ago" },
    { icon: MapPin, title: "Centre search near Mohra", time: "5 hours ago" },
    { icon: CalendarDays, title: "Checked booking slots", time: "1 day ago" },
  ];

  const filteredSearch = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return [
      ...farms.filter(f => `${f.farm_name || ""} ${f.village || ""} ${f.district || ""}`.toLowerCase().includes(q)).map(f => ({ type: "Farm", title: f.farm_name || "Farm", detail: `${f.village || ""}${f.district ? `, ${f.district}` : ""}`, action: "My Farms" })),
      ...crops.filter(c => `${c.crop_name || ""} ${c.season || ""}`.toLowerCase().includes(q)).map(c => ({ type: "Crop", title: c.crop_name || "Crop", detail: c.season || "Crop record", action: "My Crops" })),
      ...centres.filter(c => `${c.name || ""} ${c.centre_name || ""} ${c.district || ""} ${c.address || ""}`.toLowerCase().includes(q)).map(c => ({ type: "Centre", title: c.name || c.centre_name || "Procurement Centre", detail: c.district || c.address || "Centre", action: "Find Centre" })),
      ...marketPrices.filter(p => `${p.commodity || ""} ${p.crop_name || ""} ${p.name || ""}`.toLowerCase().includes(q)).map(p => ({ type: "Market", title: p.commodity || p.crop_name || p.name || "Market price", detail: p.price != null ? `₹${p.price} / quintal` : "Market record", action: "Market Prices" })),
    ].slice(0, 8);
  }, [search, farms, crops, centres, marketPrices]);

  const submitAiQuestion = async (customQuery) => {
    const question = (typeof customQuery === "string" ? customQuery : aiQuestion).trim();
    if (!question) return;
    setAiBusy(true);
    setAiAnswer("");
    if (typeof customQuery === "string") setAiQuestion(customQuery);
    try {
      const response = await farmerApi.assistantQuery({ query: question });
      const answer = response.data?.answer || response.data?.response || response.data?.message || response.data?.text;
      setAiAnswer(answer || "KrishiSetu AI received your question. Please check the connected farmer data for the latest result.");
      if (response.data?.suggestions && Array.isArray(response.data.suggestions)) {
        setAiSuggestions(response.data.suggestions);
      }
    } catch (e) {
      setAiAnswer(e?.message || "AI assistant could not connect to the backend right now.");
    } finally {
      setAiBusy(false);
    }
  };

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
      setSectionPage(null);
      setModal("notifications");
      loadNotifications();
      return;
    }
    if (["My Farms", "My Crops", "Find Centre", "My Bookings", "Live Queue", "Procurement", "Payments", "Market Prices", "Settings", "Advisory", "Schemes", "KrishiSetu AI"].includes(label)) {
      setModal(null);
      setSectionPage(label);
      return;
    }
    if (label === "Profile") {
      setProfileOpen(false);
      setModal("profile");
      return;
    }
    setModal(`info:${label}`);
  };

  if (sectionPage) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_70%_5%,#ffffff_0,#e9f6ef_32%,#dceee5_68%,#d3e6dc_100%)] text-[#10251a]">
      <div className="flex min-h-screen">
        <aside className="fixed left-4 top-4 z-30 hidden h-[calc(100vh-32px)] w-[218px] flex-col overflow-hidden rounded-[26px] border border-white/80 bg-white/58 p-3 shadow-[0_20px_55px_rgba(40,79,58,.08)] backdrop-blur-2xl lg:flex">
          <div className="flex items-center gap-3 px-3 pb-5 pt-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#dff3e7] text-[#176c42]">
              <Leaf size={25} strokeWidth={2.2} />
            </div>

            <div>
              <p className="text-[20px] font-extrabold tracking-[-.055em] text-[#113d28]">
                KrishiSetu
              </p>
              <p className="text-[9px] text-[#6d7c73]">
                Farm Easier, Grow Better
              </p>
            </div>
          </div>

          <nav className="space-y-1">
            <NavItem
              icon={House}
              label="Dashboard"
              active={false}
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
              onClick={() => handleNav("My Bookings")}
            />
            <NavItem
              icon={IndianRupee}
              label="Market Prices"
              onClick={() => handleNav("Market Prices")}
            />
            <NavItem
              icon={Bot}
              label="KrishiSetu AI"
              badge="AI"
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

          <div className="mt-auto rounded-[22px] bg-gradient-to-br from-[#effaf2] to-[#d9f0df] p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/75 text-[#16804a]">
              <Sprout size={21} />
            </div>

            <p className="mt-3 text-[14px] font-bold leading-tight text-[#24543a]">
              Better Farms
              <br />
              Brighter Futures
            </p>

            <button
              type="button"
              onClick={() => handleNav("Advisory")}
              className="mt-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#1b8a51] text-white"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 lg:pl-[250px]">
          <header className="sticky top-0 z-20 px-4 pt-4 sm:px-6 lg:px-7">
            <div className="mx-auto flex h-[70px] max-w-[1280px] items-center gap-4 rounded-[22px] border border-white/85 bg-white/65 px-4 shadow-[0_12px_35px_rgba(43,77,57,.07)] backdrop-blur-2xl sm:px-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#dff3e7] text-[#176c42] lg:hidden">
                <Leaf size={21} />
              </div>

              <div data-search-container="true" className="relative max-w-[590px] flex-1">
                <Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#61736a]" />
                <input value={search} onChange={event => setSearch(event.target.value)} className="w-full rounded-full border border-white/70 bg-white/65 py-3 pl-11 pr-4 text-sm outline-none placeholder:text-[#718078] focus:ring-2 focus:ring-[#4a9b70]/20" placeholder="Search farms, crops, centres, market prices..." />
                {search.trim() && <div className="absolute left-0 right-0 top-[58px] z-[60] overflow-hidden rounded-2xl border border-[#dfe8e1] bg-white shadow-2xl">
                  {filteredSearch.length ? filteredSearch.map((item, index) => <button key={`${item.type}-${item.title}-${index}`} type="button" onClick={() => { setSearch(""); handleNav(item.action); }} className="flex w-full items-center gap-3 border-b border-[#eef2ee] px-4 py-3 text-left last:border-0 hover:bg-[#f4f8f4]"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eaf6ed] text-[#176b3e]"><Search size={14}/></span><span className="min-w-0 flex-1"><span className="block text-xs font-extrabold">{item.title}</span><span className="block truncate text-[10px] text-[#718078]">{item.type} · {item.detail}</span></span><ChevronRight size={15} className="text-[#94a198]"/></button>) : <div className="px-4 py-4 text-xs text-[#718078]">No matching farmer data found.</div>}
                </div>}
              </div>

              <div data-weather-container="true" className="relative">
                <button
                  type="button"
                  onClick={() => setWeatherOpen((v) => !v)}
                  className="flex shrink-0 items-center gap-2 rounded-full border border-[#cbe3d3] bg-white/85 px-3 py-2 text-xs font-bold text-[#1f4a2f] shadow-sm transition hover:border-[#9fcfad] hover:bg-[#eef8f1]"
                  title="Click to view live weather advisory for your farm"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#dff3e7] text-[#176c42]">
                    <CloudSun size={15} />
                  </div>
                  <span className="font-extrabold text-[#176b3e]">
                    {readWeatherTemperature(weather) != null ? `${readWeatherTemperature(weather)}°C` : "27°C"}
                  </span>
                  <span className="hidden text-[11px] font-semibold text-[#5a7163] sm:inline">
                    {readWeatherCondition(weather)}
                  </span>
                  <ChevronDown size={13} className={`text-[#728779] transition ${weatherOpen ? "rotate-180" : ""}`} />
                </button>

                {weatherOpen && (
                  <div className="absolute right-0 top-[48px] z-[85] w-72 overflow-hidden rounded-3xl border border-[#cce4d4] bg-white p-4 shadow-[0_16px_45px_rgba(23,107,62,.15)] sm:w-80">
                    <div className="flex items-center justify-between border-b border-[#edf4ee] pb-3">
                      <div className="flex items-center gap-2">
                        <MapPin size={15} className="text-[#176b3e]" />
                        <div>
                          <p className="text-xs font-extrabold text-[#173a25]">
                            {farms[0]?.village || "Chhutmalpur"}, {farms[0]?.district || "Saharanpur"}
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
                        <CloudSun size={32} className="text-[#17824b]" />
                        <div>
                          <p className="text-2xl font-black text-[#176b3e]">
                            {readWeatherTemperature(weather) != null ? `${readWeatherTemperature(weather)}°C` : "27°C"}
                          </p>
                          <p className="text-xs font-bold text-[#355642]">
                            {readWeatherCondition(weather)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-[#697f71]">
                        <p>Feels like</p>
                        <p className="font-extrabold text-[#1f3d2b]">{weather?.apparent_temperature_c ? `${Math.round(weather.apparent_temperature_c)}°C` : "31°C"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-[#f7faf7] p-2">
                        <p className="text-[9px] text-[#718779]">Humidity</p>
                        <p className="mt-0.5 text-xs font-black text-[#1d3d29]">{weather?.relative_humidity_percent != null ? `${weather.relative_humidity_percent}%` : "90%"}</p>
                      </div>
                      <div className="rounded-xl bg-[#f7faf7] p-2">
                        <p className="text-[9px] text-[#718779]">Wind Speed</p>
                        <p className="mt-0.5 text-xs font-black text-[#1d3d29]">{weather?.wind_speed_kmh != null ? `${weather.wind_speed_kmh} km/h` : "6.4 km/h"}</p>
                      </div>
                      <div className="rounded-xl bg-[#f7faf7] p-2">
                        <p className="text-[9px] text-[#718779]">Rain Chance</p>
                        <p className="mt-0.5 text-xs font-black text-[#1d3d29]">{weather?.precipitation_mm != null ? `${weather.precipitation_mm} mm` : "0 mm"}</p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl border border-[#d6ecdc] bg-[#f5fbf7] p-2.5">
                      <p className="text-[10px] font-bold text-[#1b6b3e]">🌾 कृषि मौसम सलाह (Farm Advisory):</p>
                      <p className="mt-1 text-[11px] leading-4 text-[#395644]">
                        {weather?.precipitation_mm === 0
                          ? "मौसम साफ व अनुकूल है। सिंचाई एवं खाद/दवा छिड़काव किया जा सकता है।"
                          : "हल्की बारिश के संकेत हैं। छिड़काव कार्य रोकें और खेत में जल निकास सुनिश्चित करें।"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleNav("Notifications")}
                className="relative rounded-full p-2 text-[#3c5147] hover:bg-white/70"
              >
                <Bell size={21} />
                <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#e94d52] text-[9px] font-bold text-white">
                  3
                </span>
              </button>

              <div data-profile-container="true" className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setProfileOpen((value) => !value)}
                  className="flex items-center gap-3 rounded-full bg-white/65 px-3 py-2"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#254c3a] text-sm font-bold text-white">
                    {firstName[0]}
                  </span>
                  <span className="text-left">
                    <span className="block text-sm font-bold">{farmerName}</span>
                    <span className="block text-[10px] text-[#748178]">Farmer</span>
                  </span>
                  <ChevronDown size={16} className={`text-[#56665d] transition ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-[56px] z-[80] w-60 overflow-hidden rounded-2xl border border-[#dfe8e1] bg-white p-2 shadow-2xl">
                    <div className="border-b border-[#edf1ed] px-3 py-2.5">
                      <p className="text-sm font-extrabold">{farmerName}</p>
                      <p className="text-[10px] text-[#718078]">Farmer account</p>
                    </div>
                    <button type="button" onClick={() => { setProfileOpen(false); setSectionPage(null); setModal("profile"); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-[#f3f7f3]"><UserRound size={16}/>Profile</button>
                    <button type="button" onClick={() => { setProfileOpen(false); setSectionPage(null); setFormError(""); setModal("change-password"); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-[#f3f7f3]"><Settings size={16}/>Change password</button>
                    <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#b83b42] hover:bg-[#fff1f1]"><LogOut size={16}/>Logout</button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <section className="mx-auto w-full max-w-[1280px] px-4 pb-10 pt-5 sm:px-6 lg:px-7">
            <div className="pt-1">
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
                  />
                )}
              </ErrorBoundary>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_70%_5%,#ffffff_0,#e9f6ef_32%,#dceee5_68%,#d3e6dc_100%)] text-[#10251a]">
      <div className="flex min-h-screen">
        <aside className="fixed left-4 top-4 z-30 hidden h-[calc(100vh-32px)] w-[218px] flex-col overflow-hidden rounded-[26px] border border-white/80 bg-white/58 p-3 shadow-[0_20px_55px_rgba(40,79,58,.08)] backdrop-blur-2xl lg:flex">
          <div className="flex items-center gap-3 px-3 pb-5 pt-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#dff3e7] text-[#176c42]"><Leaf size={25} strokeWidth={2.2} /></div>
            <div>
              <p className="text-[20px] font-extrabold tracking-[-.055em] text-[#113d28]">KrishiSetu</p>
              <p className="text-[9px] text-[#6d7c73]">Farm Easier, Grow Better</p>
            </div>
          </div>

          <nav className="space-y-1">
            <NavItem icon={House} label="Dashboard" active onClick={() => handleNav("Dashboard")} />
            <NavItem icon={Tractor} label="My Farms" onClick={() => handleNav("My Farms")} />
            <NavItem icon={Sprout} label="My Crops" onClick={() => handleNav("My Crops")} />
            <NavItem icon={MapPin} label="Find Centre" onClick={() => handleNav("Find Centre")} />
            <NavItem icon={CalendarDays} label="My Bookings" onClick={() => handleNav("My Bookings")} />
            <NavItem icon={IndianRupee} label="Market Prices" onClick={() => handleNav("Market Prices")} />
            <NavItem icon={Bot} label="KrishiSetu AI" badge="AI" onClick={() => handleNav("KrishiSetu AI")} />
            <NavItem icon={Settings} label="Settings" onClick={() => handleNav("Settings")} />
          </nav>

          <div className="mt-auto rounded-[22px] bg-gradient-to-br from-[#effaf2] to-[#d9f0df] p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/75 text-[#16804a]"><Sprout size={21} /></div>
            <p className="mt-3 text-[14px] font-bold leading-tight text-[#24543a]">Better Farms<br />Brighter Futures</p>
            <button type="button" onClick={() => handleNav("Advisory")} className="mt-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#1b8a51] text-white"><ChevronRight size={16} /></button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 lg:pl-[250px]">
          <header className="sticky top-0 z-20 px-4 pt-4 sm:px-6 lg:px-7">
            <div className="mx-auto flex h-[70px] max-w-[1280px] items-center gap-4 rounded-[22px] border border-white/85 bg-white/65 px-4 shadow-[0_12px_35px_rgba(43,77,57,.07)] backdrop-blur-2xl sm:px-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#dff3e7] text-[#176c42] lg:hidden"><Leaf size={21} /></div>
              <div data-search-container="true" className="relative max-w-[590px] flex-1">
                <Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#61736a]" />
                <input value={search} onChange={event => setSearch(event.target.value)} className="w-full rounded-full border border-white/70 bg-white/65 py-3 pl-11 pr-4 text-sm outline-none placeholder:text-[#718078] focus:ring-2 focus:ring-[#4a9b70]/20" placeholder="Search farms, crops, centres, market prices..." />
                {search.trim() && <div className="absolute left-0 right-0 top-[58px] z-[60] overflow-hidden rounded-2xl border border-[#dfe8e1] bg-white shadow-2xl">
                  {filteredSearch.length ? filteredSearch.map((item, index) => <button key={`${item.type}-${item.title}-${index}`} type="button" onClick={() => { setSearch(""); handleNav(item.action); }} className="flex w-full items-center gap-3 border-b border-[#eef2ee] px-4 py-3 text-left last:border-0 hover:bg-[#f4f8f4]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eaf6ed] text-[#176b3e]"><Search size={14}/></span>
                    <span className="min-w-0 flex-1"><span className="block text-xs font-extrabold">{item.title}</span><span className="block truncate text-[10px] text-[#718078]">{item.type} · {item.detail}</span></span>
                    <ChevronRight size={15} className="text-[#94a198]"/>
                  </button>) : <div className="px-4 py-4 text-xs text-[#718078]">No matching farmer data found.</div>}
                </div>}
              </div>

              <div data-weather-container="true" className="relative">
                <button
                  type="button"
                  onClick={() => setWeatherOpen((v) => !v)}
                  className="flex shrink-0 items-center gap-2 rounded-full border border-[#cbe3d3] bg-white/85 px-3 py-2 text-xs font-bold text-[#1f4a2f] shadow-sm transition hover:border-[#9fcfad] hover:bg-[#eef8f1]"
                  title="Click to view live weather advisory for your farm"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#dff3e7] text-[#176c42]">
                    <CloudSun size={15} />
                  </div>
                  <span className="font-extrabold text-[#176b3e]">
                    {readWeatherTemperature(weather) != null ? `${readWeatherTemperature(weather)}°C` : "27°C"}
                  </span>
                  <span className="hidden text-[11px] font-semibold text-[#5a7163] sm:inline">
                    {readWeatherCondition(weather)}
                  </span>
                  <ChevronDown size={13} className={`text-[#728779] transition ${weatherOpen ? "rotate-180" : ""}`} />
                </button>

                {weatherOpen && (
                  <div className="absolute right-0 top-[48px] z-[85] w-72 overflow-hidden rounded-3xl border border-[#cce4d4] bg-white p-4 shadow-[0_16px_45px_rgba(23,107,62,.15)] sm:w-80">
                    <div className="flex items-center justify-between border-b border-[#edf4ee] pb-3">
                      <div className="flex items-center gap-2">
                        <MapPin size={15} className="text-[#176b3e]" />
                        <div>
                          <p className="text-xs font-extrabold text-[#173a25]">
                            {farms[0]?.village || "Chhutmalpur"}, {farms[0]?.district || "Saharanpur"}
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
                        <CloudSun size={32} className="text-[#17824b]" />
                        <div>
                          <p className="text-2xl font-black text-[#176b3e]">
                            {readWeatherTemperature(weather) != null ? `${readWeatherTemperature(weather)}°C` : "27°C"}
                          </p>
                          <p className="text-xs font-bold text-[#355642]">
                            {readWeatherCondition(weather)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-[#697f71]">
                        <p>Feels like</p>
                        <p className="font-extrabold text-[#1f3d2b]">{weather?.apparent_temperature_c ? `${Math.round(weather.apparent_temperature_c)}°C` : "31°C"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-[#f7faf7] p-2">
                        <p className="text-[9px] text-[#718779]">Humidity</p>
                        <p className="mt-0.5 text-xs font-black text-[#1d3d29]">{weather?.relative_humidity_percent != null ? `${weather.relative_humidity_percent}%` : "90%"}</p>
                      </div>
                      <div className="rounded-xl bg-[#f7faf7] p-2">
                        <p className="text-[9px] text-[#718779]">Wind Speed</p>
                        <p className="mt-0.5 text-xs font-black text-[#1d3d29]">{weather?.wind_speed_kmh != null ? `${weather.wind_speed_kmh} km/h` : "6.4 km/h"}</p>
                      </div>
                      <div className="rounded-xl bg-[#f7faf7] p-2">
                        <p className="text-[9px] text-[#718779]">Rain Chance</p>
                        <p className="mt-0.5 text-xs font-black text-[#1d3d29]">{weather?.precipitation_mm != null ? `${weather.precipitation_mm} mm` : "0 mm"}</p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl border border-[#d6ecdc] bg-[#f5fbf7] p-2.5">
                      <p className="text-[10px] font-bold text-[#1b6b3e]">🌾 कृषि मौसम सलाह (Farm Advisory):</p>
                      <p className="mt-1 text-[11px] leading-4 text-[#395644]">
                        {weather?.precipitation_mm === 0
                          ? "मौसम साफ व अनुकूल है। सिंचाई एवं खाद/दवा छिड़काव किया जा सकता है।"
                          : "हल्की बारिश के संकेत हैं। छिड़काव कार्य रोकें और खेत में जल निकास सुनिश्चित करें।"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <button type="button" onClick={() => handleNav("Notifications")} className="relative rounded-full p-2 text-[#3c5147] hover:bg-white/70">
                <Bell size={21} />
                <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#e94d52] text-[9px] font-bold text-white">3</span>
              </button>
              <div data-profile-container="true" className="relative hidden sm:block">
                <button type="button" onClick={() => setProfileOpen(v => !v)} className="flex items-center gap-3 rounded-full bg-white/65 px-3 py-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#254c3a] text-sm font-bold text-white">{firstName[0]}</span>
                  <span className="text-left"><span className="block text-sm font-bold">{farmerName}</span><span className="block text-[10px] text-[#748178]">Farmer</span></span>
                  <ChevronDown size={16} className={`text-[#56665d] transition ${profileOpen ? "rotate-180" : ""}`} />
                </button>
                {profileOpen && <div className="absolute right-0 top-[56px] z-50 w-56 overflow-hidden rounded-2xl border border-[#dfe8e1] bg-white p-2 shadow-2xl">
                  <div className="border-b border-[#edf1ed] px-3 py-2.5"><p className="text-sm font-extrabold">{farmerName}</p><p className="text-[10px] text-[#718078]">Farmer account</p></div>
                  <button type="button" onClick={() => { setProfileOpen(false); setModal("profile"); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-[#f3f7f3]"><UserRound size={16}/>Profile</button>
                  <button type="button" onClick={() => { setProfileOpen(false); setFormError(""); setModal("change-password"); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-[#f3f7f3]"><Settings size={16}/>Change password</button>
                  <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#b83b42] hover:bg-[#fff1f1]"><LogOut size={16}/>Logout</button>
                </div>}
              </div>
              <button type="button" onClick={logout} className="rounded-full p-2 text-[#56665d] sm:hidden"><LogOut size={18} /></button>
            </div>
          </header>

          <section className="mx-auto w-full max-w-[1280px] px-4 pb-10 pt-5 sm:px-6 lg:px-7">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4 px-1">
              <div>
                <p className="text-sm font-medium text-[#527065]">Good morning,</p>
                <h1 className="mt-1 text-[32px] font-extrabold tracking-[-.045em] text-[#10291d] sm:text-[38px]">Hello, {farmerName} <span className="align-middle">🌿</span></h1>
                <p className="mt-1 text-[15px] text-[#61766b]">Here's what's happening on your farms today.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden rounded-2xl border border-white/80 bg-white/60 px-4 py-2.5 sm:block">
                  <p className="text-xs font-bold">{new Date().toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</p>
                  <p className="text-[10px] text-[#7a877f]">A new day for a better harvest!</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/60 px-4 py-2.5">
                  <p className="text-xs font-bold">{data?.village || farms[0]?.village || "Chhutmalpur"}, {data?.district || "Saharanpur"}</p>
                  <p className="text-[10px] text-[#7a877f]">Your farming region</p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(390px,.95fr)]">
              <div className="space-y-5">
                <GlassCard className="overflow-hidden p-0">
                  <div className="relative h-[390px] overflow-hidden sm:h-[470px]">
                    <FarmMapPanel farms={farms} crops={crops} />
                  </div>
                </GlassCard>

                <GlassCard className="p-5">
                  <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-extrabold">My Crops</h2><button type="button" onClick={() => handleNav("My Crops")} className="text-xs font-semibold text-[#147a48]">View All →</button></div>
                  {loading ? <p className="text-sm text-[#748078]">Loading crops...</p> : crops.length === 0 ? <EmptyState text="No crops added yet." action="Add Crop" onClick={() => openCropModal()} /> : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {crops.slice(0, 3).map((crop, index) => <CropCard key={crop.id || index} crop={crop} image={cropCardImage} />)}
                    </div>
                  )}
                </GlassCard>
              </div>

              <div className="space-y-5">
                <GlassCard className="p-5">
                  <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-extrabold">Farm Overview</h2><button type="button" onClick={() => handleNav("My Farms")} className="text-xs font-semibold text-[#147a48]">View All →</button></div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <OverviewItem icon={Tractor} value={farms.length || 0} label="Total Farms" sub={`${totalArea || 0} area`} />
                    <OverviewItem icon={Sprout} value={activeCrops || 0} label="Active Crops" sub={activeCrops ? `${activeCrops} growing` : "None yet"} />
                    <OverviewItem icon={Wheat} value={harvestReady || 0} label="Harvest Ready" sub="Next step" />
                    <OverviewItem icon={CalendarDays} value={upcomingBookings || 0} label="Upcoming Bookings" sub={upcomingBookings ? "Scheduled" : "None scheduled"} />
                  </div>
                </GlassCard>

                {/* KrishiSetu AI Companion Card (High-Res Asset from User with Custom Chat Now Button) */}
                <div
                  onClick={() => handleNav("KrishiSetu AI")}
                  className="group relative cursor-pointer overflow-hidden rounded-[26px] border border-[#c4e5cf] bg-[#eef7f1] p-1 shadow-[0_12px_36px_rgba(23,107,62,.09)] transition-all duration-300 hover:shadow-[0_18px_48px_rgba(23,107,62,.18)] hover:scale-[1.012]"
                >
                  <img
                    src={krishiAiCardBg}
                    alt="KrishiSetu AI - Your farming companion"
                    className="w-full h-auto rounded-[22px] object-cover block"
                  />

                  {/* Custom 'Chat Now →' Button placed below the speech bubble */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNav("KrishiSetu AI");
                    }}
                    className="absolute left-[39.5%] right-[13.5%] top-[70%] bottom-[9.5%] flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-[#135933] hover:bg-[#0e4426] text-white font-black text-xs sm:text-sm md:text-base shadow-lg shadow-[#135933]/35 transition-all duration-200 group-hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    <span>Chat Now</span>
                    <span className="text-base font-black transition-transform group-hover:translate-x-1">→</span>
                  </button>
                </div>

                <GlassCard className="p-5">
                  <h2 className="mb-4 text-lg font-extrabold">Quick Actions</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <ActionButton icon={Plus} label="Add Farm" onClick={openFarmModal} />
                    <ActionButton icon={Sprout} label="Add Crop" onClick={() => openCropModal()} />
                    <ActionButton icon={MapPin} label="Find Centre" onClick={() => handleNav("Find Centre")} />
                    <ActionButton icon={CalendarDays} label="My Bookings" onClick={() => handleNav("My Bookings")} />
                  </div>
                </GlassCard>
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[.95fr_1.05fr]">
              <GlassCard className="p-5">
                <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-extrabold">Nearby Procurement Centres</h2><button type="button" onClick={() => handleNav("Find Centre")} className="text-xs font-semibold text-[#147a48]">View All →</button></div>
                <div className="relative h-[230px] overflow-hidden rounded-[20px] border border-white/80">
                  <img src={centreImage} alt="Procurement centre area" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#8bc8a3]/10 to-[#123e29]/10" />
                  <div className="absolute left-[37%] top-[34%] rounded-xl bg-white/90 px-3 py-2 text-xs font-bold shadow-lg backdrop-blur-md"><MapPin size={13} className="mr-1 inline text-[#17824b]" />{centres[0]?.name || centres[0]?.centre_name || "Procurement Centre"}</div>
                  <div className="absolute left-[24%] top-[60%] h-4 w-4 rounded-full border-2 border-white bg-[#16844d] shadow-lg" />
                  <div className="absolute right-[27%] top-[52%] h-4 w-4 rounded-full border-2 border-white bg-[#16844d] shadow-lg" />
                  <div className="absolute bottom-3 left-3 rounded-xl bg-white/88 px-3 py-2 text-[10px] font-semibold shadow backdrop-blur-md">Satellite + 3D terrain</div>
                </div>
              </GlassCard>

              <GlassCard className="p-5">
                <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-extrabold">Recent Activity</h2><button type="button" onClick={() => handleNav("Notifications")} className="text-xs font-semibold text-[#147a48]">View All →</button></div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {activities.map((activity, index) => <ActivityItem key={index} {...activity} />)}
                </div>
              </GlassCard>
            </div>

            {error && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          </section>
        </div>
      </div>

      {modal && modal.startsWith("info:") && (
        <Modal title={modal.slice(5)} onClose={() => setModal(null)}>
          <div className="rounded-2xl border border-[#d8ebdd] bg-[#f3fbf5] p-4">
            <p className="text-sm font-extrabold text-[#176b3e]">KrishiSetu farmer service</p>
            <p className="mt-1 text-sm leading-6 text-[#63736b]">Use the left navigation to open this module. Data is loaded through the connected backend service.</p>
          </div>
          <button type="button" onClick={() => setModal(null)} className="mt-5 w-full rounded-xl bg-[#16804b] px-4 py-3 text-sm font-bold text-white">Close</button>
        </Modal>
      )}

      {modal === "notifications" && (
        <div
          onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null); }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#10291d]/20 px-4 py-4 backdrop-blur-[2px]"
        >
          <div className="w-full max-w-md overflow-hidden rounded-[26px] border border-white/90 bg-white shadow-[0_24px_70px_rgba(20,57,35,.22)]">
            <div className="flex items-center justify-between border-b border-[#e8eee9] bg-[#f7fbf8] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e1f4e7] text-[#176b3e]"><Bell size={19}/></span>
                <div><h2 className="text-lg font-extrabold">Notifications</h2><p className="text-[10px] text-[#718078]">Live updates from KrishiSetu</p></div>
              </div>
              <button type="button" onClick={() => setModal(null)} className="rounded-xl p-2 text-[#5c6d63] hover:bg-white" aria-label="Close notifications"><X size={18}/></button>
            </div>
            <div className="max-h-[62vh] overflow-y-auto p-4">
              <div className="mb-3 flex justify-end">
                <button type="button" onClick={markAllDashboardNotificationsRead} disabled={notificationLoading || !notificationItems.some((item) => !item.is_read)} className="rounded-xl border border-[#cbd9ce] px-3 py-2 text-[10px] font-bold text-[#176b3e] disabled:opacity-40">Mark all read</button>
              </div>
              {notificationError && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">{notificationError}</div>}
              {notificationLoading ? (
                <div className="flex min-h-[160px] items-center justify-center"><div className="text-center"><Bell className="mx-auto animate-pulse text-[#176b3e]" size={28}/><p className="mt-2 text-xs font-bold text-[#63736b]">Loading notifications…</p></div></div>
              ) : notificationItems.length ? (
                <div className="space-y-2.5">
                  {notificationItems.map((notification) => (
                    <div key={notification.id} className={`rounded-2xl border p-3.5 ${notification.is_read ? "border-[#e7ece8] bg-[#fafcfa] opacity-70" : "border-[#d8eadc] bg-[#f3faf5]"}`}>
                      <div className="flex gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e1f4e7] text-[#176b3e]"><Bell size={16}/></span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2"><p className="text-sm font-extrabold">{notification.title}</p>{!notification.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#e94d52]"/>}</div>
                          <p className="mt-1 text-xs leading-5 text-[#66776d]">{notification.message}</p>
                          <div className="mt-2 flex items-center justify-between gap-2"><p className="text-[9px] text-[#8a968e]">{notification.created_at ? new Date(notification.created_at).toLocaleString("en-IN") : ""}</p>{!notification.is_read && <button type="button" onClick={() => markDashboardNotificationRead(notification.id)} className="rounded-lg bg-white px-2 py-1 text-[9px] font-bold text-[#176b3e]">Mark read</button>}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#cbd9ce] bg-[#fbfdfb] text-center"><Bell className="text-[#77a182]" size={28}/><p className="mt-2 text-sm font-bold text-[#607167]">You are all caught up.</p><p className="mt-1 text-[10px] text-[#87948c]">New farmer updates will appear here.</p></div>
              )}
            </div>
          </div>
        </div>
      )}

      {modal === "profile" && (
        <Modal title="My profile" onClose={() => setModal(null)}>
          <div className="grid grid-cols-2 gap-3">
            <ProfileValue label="Name" value={farmerName} />
            <ProfileValue label="Role" value="Farmer" />
            <ProfileValue label="District" value={data?.district || farms[0]?.district || "Not set"} />
            <ProfileValue label="State" value={data?.state || farms[0]?.state || "Not set"} />
          </div>
          <button onClick={() => setModal(null)} className="mt-4 w-full rounded-xl bg-[#16804b] px-4 py-3 text-sm font-bold text-white">Done</button>
        </Modal>
      )}

      {modal === "change-password" && (
        <Modal title="Change password" onClose={() => !saving && setModal(null)}>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <Field label="Current password" type="password" value={passwordForm.current_password} onChange={value => setPasswordForm(p => ({ ...p, current_password: value }))} />
            <Field label="New password" type="password" value={passwordForm.new_password} onChange={value => setPasswordForm(p => ({ ...p, new_password: value }))} />
            <Field label="Confirm new password" type="password" value={passwordForm.confirm_password} onChange={value => setPasswordForm(p => ({ ...p, confirm_password: value }))} />
            {formError && <p className="text-xs text-red-600">{formError}</p>}
            <button disabled={saving} className="w-full rounded-xl bg-[#16804b] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? "Changing..." : "Change password"}</button>
          </form>
        </Modal>
      )}

      {modal === "password-success" && (
        <Modal title="Password changed" onClose={() => setModal(null)}>
          <div className="rounded-2xl bg-[#eef8ef] p-5 text-center"><CheckCircle2 className="mx-auto text-[#16804b]" size={38}/><p className="mt-3 text-lg font-extrabold">Password updated successfully.</p><p className="mt-1 text-xs text-[#718078]">Your account password was updated through the connected farmer profile service.</p></div>
          <button onClick={() => setModal(null)} className="mt-4 w-full rounded-xl bg-[#16804b] px-4 py-3 text-sm font-bold text-white">Done</button>
        </Modal>
      )}

      {modal === "farm" && (
        <Modal title="Add Farm" onClose={() => setModal(null)}>
          <form onSubmit={saveFarm} className="space-y-3">
            <Field label="Farm name" value={farmForm.farm_name} onChange={(value) => setFarmForm((p) => ({ ...p, farm_name: value }))} />
            <div className="grid grid-cols-2 gap-3"><Field label="State" value={farmForm.state} onChange={(value) => setFarmForm((p) => ({ ...p, state: value }))} /><Field label="District" value={farmForm.district} onChange={(value) => setFarmForm((p) => ({ ...p, district: value }))} /></div>
            <div className="grid grid-cols-2 gap-3"><Field label="Village" value={farmForm.village} onChange={(value) => setFarmForm((p) => ({ ...p, village: value }))} /><Field label="Area" type="number" value={farmForm.area} onChange={(value) => setFarmForm((p) => ({ ...p, area: value }))} /></div>
            <Field label="Irrigation type" value={farmForm.irrigation_type} onChange={(value) => setFarmForm((p) => ({ ...p, irrigation_type: value }))} placeholder="Optional" />
            {formError && <p className="text-xs font-medium text-red-600">{formError}</p>}
            <button disabled={saving} className="w-full rounded-xl bg-[#16804b] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? "Saving..." : "Add Farm"}</button>
          </form>
        </Modal>
      )}

      {modal === "crop" && (
        <Modal title="Add Crop" onClose={() => setModal(null)}>
          <form onSubmit={saveCrop} className="space-y-3">
            <label className="block text-xs font-semibold text-[#53645b]">Farm<select value={cropForm.farm_id} onChange={(e) => setCropForm((p) => ({ ...p, farm_id: e.target.value }))} className="mt-1 w-full rounded-xl border border-[#dce6de] bg-white px-3 py-3 text-sm outline-none"><option value="">Select farm</option>{farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.farm_name}</option>)}</select></label>
            <Field label="Crop name" value={cropForm.crop_name} onChange={(value) => setCropForm((p) => ({ ...p, crop_name: value }))} />
            <div className="grid grid-cols-2 gap-3"><Field label="Season" value={cropForm.season} onChange={(value) => setCropForm((p) => ({ ...p, season: value }))} /><Field label="Expected quantity" type="number" value={cropForm.expected_quantity} onChange={(value) => setCropForm((p) => ({ ...p, expected_quantity: value }))} /></div>
            <div className="grid grid-cols-2 gap-3"><Field label="Sowing date" type="date" value={cropForm.sowing_date} onChange={(value) => setCropForm((p) => ({ ...p, sowing_date: value }))} /><Field label="Harvest date" type="date" value={cropForm.expected_harvest_date} onChange={(value) => setCropForm((p) => ({ ...p, expected_harvest_date: value }))} /></div>
            {formError && <p className="text-xs font-medium text-red-600">{formError}</p>}
            <button disabled={saving} className="w-full rounded-xl bg-[#16804b] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? "Saving..." : "Add Crop"}</button>
          </form>
        </Modal>
      )}
    </main>
  );
}

function FarmZone({ className, tone, title, subtitle, alert }) {
  const toneClass = tone === "green" ? "bg-white/88 text-[#173c2b]" : tone === "amber" ? "bg-white/88 text-[#473b17]" : "bg-white/90 text-[#3d2727]";
  return <div className={`absolute rounded-2xl border border-white/90 px-3 py-2 shadow-lg backdrop-blur-md ${toneClass} ${className}`}><p className="text-[11px] font-extrabold">{alert ? "⚠ " : "🌿 "}{title}</p><p className="mt-0.5 text-[10px] text-[#65736c]">{subtitle}</p></div>;
}

function ProfileValue({ label, value }) {
  return <div className="rounded-2xl border border-[#e0e9e1] bg-white/70 p-3"><p className="text-[9px] font-extrabold uppercase tracking-[.12em] text-[#7a877f]">{label}</p><p className="mt-1 text-sm font-extrabold text-[#20362a]">{value || "Not set"}</p></div>;
}

function CropCard({ crop, image }) {
  const status = String(crop.status || "GROWING").toUpperCase();
  const dot = status === "HEALTHY" ? "bg-[#20bf67]" : status.includes("HARVEST") ? "bg-[#f5a623]" : "bg-[#f5c52b]";
  return <div className="flex min-w-0 items-center gap-3 rounded-[18px] border border-white/90 bg-white/65 p-2.5"><img src={image} alt="" className="h-[76px] w-[68px] rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">
  {safeText(crop.crop_name, "Unnamed Crop")}
</p><p className="mt-1 text-[11px] text-[#718078]">{crop.expected_quantity || "--"} {crop.quantity_unit || "quintal"}</p><div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-[#5d6d64]"><i className={`h-2.5 w-2.5 rounded-full ${dot}`} />{statusLabel(crop.status || "GROWING")}</div></div><ChevronRight size={16} className="text-[#708077]" /></div>;
}

function Metric({ icon, value, label }) {
  return <div><p className="font-bold text-[#233a2e]"><span className="mr-1 text-[#16804b]">{icon}</span>{value}</p><p className="mt-0.5 text-[9px] text-[#78867e]">{label}</p></div>;
}

function OverviewItem({ icon: Icon, value, label, sub }) {
  return <div className="rounded-2xl bg-white/55 p-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e3f5e8] text-[#16804b]"><Icon size={18} /></span><p className="mt-2 text-xl font-extrabold">{value}</p><p className="text-[10px] font-semibold text-[#52635a]">{label}</p><p className="mt-0.5 text-[9px] text-[#87928c]">{sub}</p></div>;
}

function ActionButton({ icon: Icon, label, onClick }) {
  return <button type="button" onClick={onClick} className="flex items-center gap-3 rounded-2xl border border-white/90 bg-white/58 px-3 py-3 text-left text-xs font-bold text-[#294338] transition hover:bg-white/90"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#def3e5] text-[#16804b]"><Icon size={18} /></span>{label}</button>;
}

function ActivityItem({ icon: Icon, title, time }) {
  return <div className="flex items-center gap-3 rounded-2xl bg-white/48 px-3 py-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e3f5e8] text-[#16804b]"><Icon size={17} /></span><div className="min-w-0"><p className="truncate text-xs font-bold">{title}</p><p className="mt-0.5 text-[10px] text-[#839088]">{time}</p></div></div>;
}

function EmptyState({ text, action, onClick }) {
  return <div className="rounded-2xl border border-dashed border-[#cbd9ce] bg-white/45 p-7 text-center"><p className="text-sm text-[#718078]">{text}</p><button type="button" onClick={onClick} className="mt-3 rounded-xl bg-[#16804b] px-4 py-2 text-xs font-bold text-white">{action}</button></div>;
}

function Field({ label, value, onChange, type = "text", placeholder }) {
  return <label className="block text-xs font-semibold text-[#53645b]">{label}<input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-[#dce6de] bg-white px-3 py-3 text-sm font-normal text-[#1c3025] outline-none focus:border-[#5ba579]" /></label>;
}

function Modal({ title, children, onClose }) {
  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#183326]/30 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg rounded-[26px] border border-white bg-[#f9fcfa] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full bg-[#edf3ee] p-2"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function LayersIcon() { return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m12 3 8 4-8 4-8-4 8-4Z"/><path d="m4 12 8 4 8-4"/><path d="m4 17 8 4 8-4"/></svg>; }
function TargetIcon() { return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M22 12h-3M12 22v-3M2 12h3"/></svg>; }
function BotIcon() { return <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="6" width="16" height="14" rx="4"/><path d="M12 2v4M8 12h.01M16 12h.01M8 16h8"/><circle cx="12" cy="2" r="1"/></svg>; }

export default FarmerDashboard;
