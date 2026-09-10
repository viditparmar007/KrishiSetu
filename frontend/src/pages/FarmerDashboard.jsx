import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CloudSun,
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
} from "lucide-react";
import heroImage from "../assets/hero-photo.png";
import farmImage from "../assets/farm-photo.png";
import cropCardImage from "../assets/crop-photo.png";
import centreImage from "../assets/centre-photo.png";
import FarmerSectionPage from "./FarmerSectionPage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [sectionPage, setSectionPage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [mapMode, setMapMode] = useState("3D View");
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
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const loadData = useCallback(async () => {
    if (!token) {
      onLogout?.();
      return;
    }

    try {
      setLoading(true);
      setError("");
      const [dashboardResponse, farmsResponse, cropsResponse] = await Promise.all([
        fetch(`${API_URL}/api/v1/dashboard/farmer`, { headers: authHeaders }),
        fetch(`${API_URL}/api/v1/farms`, { headers: authHeaders }),
        fetch(`${API_URL}/api/v1/crops`, { headers: authHeaders }),
      ]);

      if ([dashboardResponse, farmsResponse, cropsResponse].some((response) => response.status === 401)) {
        localStorage.removeItem("krishisetu_access_token");
        localStorage.removeItem("krishisetu_role");
        onLogout?.();
        return;
      }

      if (!dashboardResponse.ok || !farmsResponse.ok || !cropsResponse.ok) {
        throw new Error("Unable to load your farmer data right now.");
      }

      const [dashboard, farmsData, cropsData] = await Promise.all([
        dashboardResponse.json(),
        farmsResponse.json(),
        cropsResponse.json(),
      ]);

      setData(dashboard);
      setFarms(farmsData);
      setCrops(cropsData);
    } catch (requestError) {
      setError(requestError.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, onLogout, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    if (
      !farmForm.farm_name.trim() ||
      !farmForm.state.trim() ||
      !farmForm.district.trim() ||
      !farmForm.village.trim() ||
      Number(farmForm.area) <= 0
    ) {
      setFormError("Please fill all required farm details.");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/api/v1/farms`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...farmForm,
          area: Number(farmForm.area),
          irrigation_type: farmForm.irrigation_type || null,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || "Could not add farm.");
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
      const response = await fetch(`${API_URL}/api/v1/farms/${cropForm.farm_id}/crops`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          crop_name: cropForm.crop_name.trim(),
          season: cropForm.season || null,
          sowing_date: cropForm.sowing_date || null,
          expected_harvest_date: cropForm.expected_harvest_date || null,
          expected_quantity: Number(cropForm.expected_quantity),
          quantity_unit: cropForm.quantity_unit,
          status: cropForm.status,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || "Could not add crop.");
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
  const totalArea = data?.total_area ?? farms.reduce((sum, farm) => sum + Number(farm.area || 0), 0);
  const activeCrops = data?.active_crops ?? crops.length;
  const harvestReady = data?.harvest_ready ?? crops.filter((crop) => String(crop.status).toUpperCase() === "HARVEST_READY").length;
  const upcomingBookings = data?.upcoming_bookings ?? 0;
  const weather = data?.weather || {};
  const temperature = weather.temperature ?? weather.temp ?? "32";
  const maxTemp = weather.max_temperature ?? weather.max_temp ?? "34";
  const minTemp = weather.min_temperature ?? weather.min_temp ?? "24";
  const rain = weather.rain_probability ?? weather.rain ?? "0";
  const wind = weather.wind_speed ?? weather.wind ?? "12";

  const activities = [
    { icon: Sprout, title: crops[0] ? `Crop added: ${crops[0].crop_name}` : "Crop activity", time: "2 hours ago" },
    { icon: Tractor, title: farms[0] ? `Farm updated: ${farms[0].farm_name}` : "Farm activity", time: "3 hours ago" },
    { icon: MapPin, title: "Centre search near Mohra", time: "5 hours ago" },
    { icon: CalendarDays, title: "Checked booking slots", time: "1 day ago" },
  ];

  const handleNav = (label) => {
    if (label === "Dashboard") {
      setSectionPage(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (["My Farms", "My Crops", "Find Centre"].includes(label)) {
      setSectionPage(label);
      return;
    }
    setModal(`info:${label}`);
  };

  if (sectionPage) {
    return <FarmerSectionPage section={sectionPage} farms={farms} crops={crops} onBack={() => setSectionPage(null)} />;
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
            <NavItem icon={Bell} label="Notifications" badge="3" onClick={() => handleNav("Notifications")} />
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
              <div className="relative max-w-[590px] flex-1">
                <Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#61736a]" />
                <input className="w-full rounded-full border border-white/70 bg-white/65 py-3 pl-11 pr-4 text-sm outline-none placeholder:text-[#718078] focus:ring-2 focus:ring-[#4a9b70]/20" placeholder="Search farms, crops, centres, market prices..." />
              </div>
              <div className="hidden items-center gap-3 xl:flex">
                <CloudSun size={28} className="text-[#e2a51a]" />
                <div><p className="text-sm font-bold">{temperature}°C</p><p className="text-[11px] text-[#68776f]">Saharanpur, UP</p></div>
              </div>
              <button type="button" onClick={() => handleNav("Notifications")} className="relative rounded-full p-2 text-[#3c5147] hover:bg-white/70">
                <Bell size={21} />
                <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#e94d52] text-[9px] font-bold text-white">3</span>
              </button>
              <button type="button" onClick={() => handleNav("Profile")} className="hidden items-center gap-3 rounded-full bg-white/65 px-3 py-2 sm:flex">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#254c3a] text-sm font-bold text-white">{firstName[0]}</span>
                <span className="text-left"><span className="block text-sm font-bold">{farmerName}</span><span className="block text-[10px] text-[#748178]">Farmer</span></span>
                <ChevronDown size={16} className="text-[#56665d]" />
              </button>
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
                  <p className="text-xs font-bold">Wed, 10 Sep 2026</p>
                  <p className="text-[10px] text-[#7a877f]">A new day for a better harvest!</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/60 px-4 py-2.5">
                  <p className="text-xs font-bold">{data?.district || "Saharanpur"}, UP</p>
                  <p className="text-[10px] text-[#7a877f]">Your farming region</p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(390px,.95fr)]">
              <div className="space-y-5">
                <GlassCard className="overflow-hidden p-0">
                  <div className="relative h-[390px] overflow-hidden sm:h-[470px]">
                    <img src={farmImage} alt="Farm aerial view" className={`absolute inset-0 h-full w-full object-cover transition duration-500 ${mapMode === "3D View" ? "scale-[1.05]" : "scale-100"}`} />
                    <div className={`absolute inset-0 ${mapMode === "3D View" ? "bg-[linear-gradient(145deg,rgba(17,91,55,.06),rgba(0,0,0,.18))]" : mapMode === "Satellite" ? "bg-[rgba(25,65,44,.08)]" : "bg-[rgba(244,248,244,.18)]"}`} />

                    <div className="absolute left-4 top-4 flex overflow-hidden rounded-full border border-white/70 bg-white/80 p-1 shadow-lg backdrop-blur-md">
                      {["Map", "Satellite", "3D View"].map((mode) => (
                        <button key={mode} type="button" onClick={() => setMapMode(mode)} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${mapMode === mode ? "bg-[#16814a] text-white" : "text-[#31483d] hover:bg-white"}`}>{mode}</button>
                      ))}
                    </div>

                    <div className="absolute right-4 top-4 flex flex-col gap-2">
                      <button type="button" className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/85 text-[#24493a] shadow-lg backdrop-blur-md"><LayersIcon /></button>
                      <button type="button" className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/85 text-[#24493a] shadow-lg backdrop-blur-md"><TargetIcon /></button>
                    </div>

                    <FarmZone className="left-[12%] top-[25%]" tone="green" title={farms[0]?.farm_name || "Black Lentil Farm"} subtitle={`${farms[0]?.area || 8} ${farms[0]?.area_unit || "bigha"} · Healthy`} />
                    <FarmZone className="right-[12%] top-[27%]" tone="amber" title={crops[0]?.crop_name || "Corn Field"} subtitle={`${crops[0]?.expected_quantity || 5} acre · Growing`} />
                    <FarmZone className="bottom-[17%] left-[29%]" tone="red" title="Field 3" subtitle="3 bigha · Attention" alert />

                    <div className="absolute bottom-4 right-4 flex flex-col gap-1 overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-lg backdrop-blur-md">
                      <button type="button" className="flex h-10 w-11 items-center justify-center text-xl">+</button>
                      <button type="button" className="flex h-10 w-11 items-center justify-center border-t border-[#dbe4dd] text-xl">−</button>
                    </div>
                    <div className="absolute bottom-4 left-4 rounded-full border border-white/70 bg-white/85 px-3 py-2 text-[11px] font-medium shadow-lg backdrop-blur-md">
                      <span className="mr-3 inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-[#20bf67]" />Healthy</span>
                      <span className="mr-3 inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-[#f5c52b]" />Growing</span>
                      <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-[#f04b4f]" />Attention</span>
                    </div>
                    <div className="absolute bottom-4 right-16 rounded-xl border border-white/70 bg-white/85 px-3 py-2 text-[11px] font-semibold text-[#24483a] shadow-lg backdrop-blur-md">3D farm view</div>
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
                  <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-extrabold">Weather Conditions</h2><button type="button" className="text-xs font-semibold text-[#147a48]">View Details →</button></div>
                  <div className="grid grid-cols-[1.1fr_1fr] items-center gap-4">
                    <div className="flex items-center gap-3"><CloudSun size={61} strokeWidth={1.25} className="text-[#e4aa1c]" /><div><p className="text-3xl font-extrabold tracking-tight">{temperature}°C</p><p className="text-sm text-[#61736a]">Mostly clear</p><p className="mt-1 text-xs text-[#75837b]"><MapPin size={12} className="mr-1 inline" />Saharanpur, UP</p></div></div>
                    <div className="grid grid-cols-2 gap-3 border-l border-[#dfe8e1] pl-4 text-xs">
                      <Metric icon="↑" value={`${maxTemp}°C`} label="Max" />
                      <Metric icon="↓" value={`${minTemp}°C`} label="Min" />
                      <Metric icon="💧" value={`${rain}%`} label="Rain" />
                      <Metric icon="≋" value={`${wind} km/h`} label="Wind" />
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-5">
                  <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-extrabold">Farm Overview</h2><button type="button" className="text-xs font-semibold text-[#147a48]">View All →</button></div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <OverviewItem icon={Tractor} value={farms.length || 0} label="Total Farms" sub={`${totalArea || 0} area`} />
                    <OverviewItem icon={Sprout} value={activeCrops || 0} label="Active Crops" sub={activeCrops ? `${activeCrops} growing` : "None yet"} />
                    <OverviewItem icon={Wheat} value={harvestReady || 0} label="Harvest Ready" sub="Next step" />
                    <OverviewItem icon={CalendarDays} value={upcomingBookings || 0} label="Upcoming Bookings" sub={upcomingBookings ? "Scheduled" : "None scheduled"} />
                  </div>
                </GlassCard>

                <GlassCard className="overflow-hidden bg-gradient-to-br from-white/80 via-[#edf9f0]/80 to-[#d9f1df]/80 p-5">
                  <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dff4e5] text-[#157a48]"><BotIcon /></span><div><h2 className="text-lg font-extrabold">KrishiSetu AI</h2><p className="text-xs text-[#708078]">Your farming companion</p></div></div><button type="button" onClick={() => handleNav("Advisory")} className="text-xs font-semibold text-[#147a48]">View All →</button></div>
                  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/70 p-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e5f7e9] text-[#1a8b50]"><Leaf size={21} /></span>
                    <p className="flex-1 text-xs leading-relaxed text-[#405149]">Based on current weather, you should irrigate your <strong className="text-[#142d20]">{crops[0]?.crop_name || "Sweet Corn"} field within 2 days.</strong></p>
                    <ChevronRight size={19} className="text-[#16804b]" />
                  </div>
                </GlassCard>

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
                  <div className="absolute left-[37%] top-[34%] rounded-xl bg-white/90 px-3 py-2 text-xs font-bold shadow-lg backdrop-blur-md"><MapPin size={13} className="mr-1 inline text-[#17824b]" />Saharanpur Centre</div>
                  <div className="absolute left-[24%] top-[60%] h-4 w-4 rounded-full border-2 border-white bg-[#16844d] shadow-lg" />
                  <div className="absolute right-[27%] top-[52%] h-4 w-4 rounded-full border-2 border-white bg-[#16844d] shadow-lg" />
                  <div className="absolute bottom-3 left-3 rounded-xl bg-white/88 px-3 py-2 text-[10px] font-semibold shadow backdrop-blur-md">Satellite + 3D terrain</div>
                </div>
              </GlassCard>

              <GlassCard className="p-5">
                <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-extrabold">Recent Activity</h2><button type="button" className="text-xs font-semibold text-[#147a48]">View All →</button></div>
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
          <p className="text-sm leading-6 text-[#63736b]">This section is connected to the existing dashboard navigation and can use the existing farmer modules.</p>
          <button type="button" onClick={() => setModal(null)} className="mt-5 w-full rounded-xl bg-[#16804b] px-4 py-3 text-sm font-bold text-white">Close</button>
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

function CropCard({ crop, image }) {
  const status = String(crop.status || "GROWING").toUpperCase();
  const dot = status === "HEALTHY" ? "bg-[#20bf67]" : status.includes("HARVEST") ? "bg-[#f5a623]" : "bg-[#f5c52b]";
  return <div className="flex min-w-0 items-center gap-3 rounded-[18px] border border-white/90 bg-white/65 p-2.5"><img src={image} alt="" className="h-[76px] w-[68px] rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{crop.crop_name}</p><p className="mt-1 text-[11px] text-[#718078]">{crop.expected_quantity || "--"} {crop.quantity_unit || "quintal"}</p><div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-[#5d6d64]"><i className={`h-2.5 w-2.5 rounded-full ${dot}`} />{statusLabel(crop.status || "GROWING")}</div></div><ChevronRight size={16} className="text-[#708077]" /></div>;
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
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#183326]/30 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-[26px] border border-white bg-[#f9fcfa] p-5 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-extrabold">{title}</h2><button type="button" onClick={onClose} className="rounded-full bg-[#edf3ee] p-2"><X size={18} /></button></div>{children}</div></div>;
}

function LayersIcon() { return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m12 3 8 4-8 4-8-4 8-4Z"/><path d="m4 12 8 4 8-4"/><path d="m4 17 8 4 8-4"/></svg>; }
function TargetIcon() { return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M22 12h-3M12 22v-3M2 12h3"/></svg>; }
function BotIcon() { return <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="6" width="16" height="14" rx="4"/><path d="M12 2v4M8 12h.01M16 12h.01M8 16h8"/><circle cx="12" cy="2" r="1"/></svg>; }

export default FarmerDashboard;
