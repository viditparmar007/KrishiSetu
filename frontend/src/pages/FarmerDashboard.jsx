import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  House,
  Leaf,
  LogOut,
  MapPin,
  Plus,
  Search,
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
import supportImage from "../assets/help-photo.png";
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
  return String(status || "").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function FarmerDashboard({ onLogout }) {
  const [data, setData] = useState(null);
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [farmForm, setFarmForm] = useState({ farm_name: "", state: "", district: "", village: "", area: "", area_unit: "acre", irrigation_type: "" });
  const [cropForm, setCropForm] = useState({ farm_id: "", crop_name: "", season: "", sowing_date: "", expected_harvest_date: "", expected_quantity: "", quantity_unit: "quintal", status: "GROWING" });

  const token = localStorage.getItem("krishisetu_access_token");
  const authHeaders = { Authorization: `Bearer ${token}` };

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
      if (!dashboardResponse.ok || !farmsResponse.ok || !cropsResponse.ok) throw new Error("Unable to load your farmer data right now.");
      const [dashboard, farmsData, cropsData] = await Promise.all([dashboardResponse.json(), farmsResponse.json(), cropsResponse.json()]);
      setData(dashboard);
      setFarms(farmsData);
      setCrops(cropsData);
    } catch (requestError) {
      setError(requestError.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [token, onLogout]);

  useEffect(() => { loadData(); }, [loadData]);

  const logout = () => {
    localStorage.removeItem("krishisetu_access_token");
    localStorage.removeItem("krishisetu_role");
    onLogout?.();
  };

  const openFarmModal = () => {
    setFormError("");
    setFarmForm({ farm_name: "", state: "", district: "", village: "", area: "", area_unit: "acre", irrigation_type: "" });
    setModal("farm");
  };

  const openCropModal = (farmId = farms[0]?.id || "") => {
    setFormError("");
    setCropForm({ farm_id: String(farmId), crop_name: "", season: "", sowing_date: "", expected_harvest_date: "", expected_quantity: "", quantity_unit: "quintal", status: "GROWING" });
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
      const response = await fetch(`${API_URL}/api/v1/farms`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ ...farmForm, area: Number(farmForm.area), irrigation_type: farmForm.irrigation_type || null }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || "Could not add farm.");
      setModal(null);
      await loadData();
    } catch (requestError) {
      setFormError(requestError.message || "Could not add farm.");
    } finally { setSaving(false); }
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
        body: JSON.stringify({ crop_name: cropForm.crop_name.trim(), season: cropForm.season || null, sowing_date: cropForm.sowing_date || null, expected_harvest_date: cropForm.expected_harvest_date || null, expected_quantity: Number(cropForm.expected_quantity), quantity_unit: cropForm.quantity_unit, status: cropForm.status }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || "Could not add crop.");
      setModal(null);
      await loadData();
    } catch (requestError) {
      setFormError(requestError.message || "Could not add crop.");
    } finally { setSaving(false); }
  };

  const firstName = (data?.farmer_name || "Farmer").split(" ")[0];
  const heroMessages = [
  "Manage your farms, track your crops, and move towards a better tomorrow.",
  "Grow smarter, plan better, and make every acre count.",
  "Stay on top of your crops and take the next step with confidence.",
  "Your farm, your progress, your opportunities, all in one place.",
  "Better planning today, stronger farming tomorrow.",
];

const [heroMessage] = useState(
  () => heroMessages[Math.floor(Math.random() * heroMessages.length)]
);
  const upcoming = data?.upcoming_harvests || [];

  return (
    <main className="min-h-screen bg-[#f4f7f2] text-[#17251b]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[238px] shrink-0 border-r border-[#e1e8e2] bg-white lg:flex lg:flex-col">
          <div className="px-6 pb-7 pt-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f5e9] text-[#176b3e]"><Leaf size={25} strokeWidth={2.2} /></div>
              <div><p className="text-xl font-extrabold tracking-[-.05em] text-[#176b3e]">KrishiSetu</p><p className="text-[10px] text-[#758078]">Bridging Farmers to Opportunities</p></div>
            </div>
          </div>
          <nav className="space-y-1 px-3">
            <NavItem icon={House} label="Dashboard" active />
            <NavItem icon={Tractor} label="My Farms" />
            <NavItem icon={Wheat} label="My Crops" />
            <NavItem icon={MapPin} label="Find Centre" />
            <NavItem icon={CalendarDays} label="My Bookings" />
            <NavItem icon={Users} label="Live Queue" />
            <NavItem icon={FileText} label="Procurement" />
            <NavItem icon={IndianRupeeIcon} label="Payments" />
            <NavItem icon={Bell} label="Notifications" badge="3" />
            <NavItem icon={Sprout} label="Advisory" />
            <NavItem icon={FileText} label="Schemes" />
            <NavItem icon={UserRound} label="Profile" />
          </nav>
          <div className="mt-auto p-4">
            <div className="overflow-hidden rounded-2xl bg-[#edf8f0] p-4">
              <p className="text-sm font-bold text-[#176b3e]">Need Help?</p>
              <p className="mt-1 text-xs text-[#526158]">Call our support</p>
              <p className="mt-1 text-lg font-extrabold text-[#176b3e]">1800-123-4567</p>
              <img src={supportImage} alt="" className="mt-4 h-16 w-full rounded-xl object-cover" />
              <p className="mt-3 text-sm font-bold text-[#176b3e]">Kisan ka Saathi </p>
              <p className="text-xs font-semibold text-[#526158]">Har Kadam Par</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-[#e1e8e2] bg-white/95 backdrop-blur">
            <div className="flex h-[72px] items-center gap-4 px-5 sm:px-7 xl:px-8">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f5e9] text-[#176b3e] lg:hidden"><Leaf size={22} /></div>
              <div className="relative max-w-2xl flex-1">
                <Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#536158]" />
                <input placeholder="Search centres, crops, schemes..." className="w-full rounded-full bg-[#f0f4f0] py-3 pl-11 pr-4 text-sm text-[#25352a] outline-none placeholder:text-[#7b867f] focus:ring-2 focus:ring-[#176b3e]/15" />
              </div>
              <button type="button" className="relative rounded-full p-2.5 text-[#33453a] hover:bg-[#f1f5f1]"><Bell size={21} /><span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#d9363e] text-[9px] font-bold text-white">3</span></button>
              <span className="h-8 w-px bg-[#e2e8e2]" />
              <button type="button" className="hidden items-center gap-3 sm:flex">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#176b3e] text-lg font-bold text-white">{firstName[0]}</span>
                <span className="text-left"><span className="block text-sm font-bold">{data?.farmer_name || "Farmer"}</span><span className="block text-xs text-[#718078]">Farmer</span></span>
                <ChevronDown size={17} className="text-[#4d5b53]" />
              </button>
              <button type="button" onClick={logout} className="rounded-xl border border-[#d6e0d7] p-2.5 text-[#526158] hover:bg-[#f4f7f4] sm:hidden"><LogOut size={17} /></button>
            </div>
          </header>

          <section className="mx-auto w-full max-w-[1280px] px-5 py-6 sm:px-7 xl:px-8 xl:py-7">
            <div className="relative overflow-hidden rounded-[22px] bg-[#145d37] shadow-sm">
              <img src={heroImage} alt="Agricultural field" className="absolute inset-0 h-full w-full object-cover opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0d4e2d]/95 via-[#126238]/75 to-transparent" />
              <div className="relative flex min-h-[210px] items-center justify-between gap-6 px-7 py-8 sm:px-9">
                <div className="max-w-xl text-white">
                  <p className="text-sm font-semibold text-white/80">Good Morning,</p>
                  <h1 className="mt-1 text-3xl font-extrabold tracking-[-.045em] sm:text-4xl">
                    {data?.farmer_name || "Farmer"} <span aria-hidden="true">&#x1F60A;</span>
                  </h1>
                  <p className="mt-3 max-w-md text-sm leading-6 text-white/85">{heroMessage}</p>
                  <div className="mt-4 inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-semibold backdrop-blur">Better farming today, a stronger tomorrow.👍</div>
                </div>
                <div className="hidden w-[220px] shrink-0 rounded-2xl border border-white/30 bg-white/90 p-4 text-[#24372b] shadow-xl md:block">
                  <div className="flex items-center gap-3"><span className="text-3xl">☀️</span><div><p className="text-2xl font-extrabold">31°C</p><p className="text-xs text-[#536158]">Saharanpur, U.P.</p></div></div>
                  <div className="mt-4 rounded-xl bg-[#eaf6eb] px-3 py-3 text-xs font-semibold text-[#176b3e]">🌱 Good weather for field activities today!</div>
                </div>
              </div>
            </div>

            {loading && <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl border border-[#e0e7e0] bg-white" />)}</div>}
            {!loading && error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}<button type="button" onClick={loadData} className="ml-2 font-semibold underline">Try again</button></div>}

            {!loading && data && <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric icon={Leaf} label="Farms" value={data.total_farms} sub={data.total_farms ? `Total land: ${farms.reduce((sum, farm) => sum + Number(farm.area || 0), 0)} acres` : "Add your first farm"} />
                <Metric icon={Leaf} label="Crops" value={data.total_crops} sub={data.total_crops ? "Crops in your farms" : "Add your first crop"} tone="green" />
                <Metric icon={Sprout} label="Growing" value={data.growing_crops} sub="Crops in field" tone="amber" />
                <Metric icon={Wheat} label="Harvest ready" value={data.harvest_ready_crops} sub="Ready for procurement" tone="purple" />
              </div>

              <div className="mt-6 grid gap-5 xl:grid-cols-[1.05fr_1fr_190px]">
                <Panel title="My Farms" subtitle="Manage your farm land and details" icon={Leaf} action={<button type="button" onClick={openFarmModal} className="inline-flex items-center gap-1.5 rounded-lg bg-[#176b3e] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#115832]"><Plus size={16}/> Add Farm</button>}>
                  {farms.length ? farms.map((farm) => <FarmCard key={farm.id} farm={farm} onAddCrop={() => openCropModal(farm.id)} />) : <EmptyState text="No farms added yet." action="Add farm" onAction={openFarmModal} />}
                </Panel>

                <Panel title="My Crops" subtitle="Track what you are growing" icon={Leaf} action={<button type="button" onClick={() => farms.length && openCropModal()} disabled={!farms.length} className="inline-flex items-center gap-1.5 rounded-lg bg-[#176b3e] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#115832] disabled:opacity-40"><Plus size={16}/> Add Crop</button>}>
                  {crops.length ? crops.map((crop) => <CropRow key={crop.id} crop={crop} farmName={farms.find((farm) => farm.id === crop.farm_id)?.farm_name} />) : <EmptyState text="No crops added yet" sub="Start by adding crops to your farm." action={farms.length ? "Add your first crop" : undefined} onAction={farms.length ? () => openCropModal() : undefined} />}
                </Panel>

                <div className="hidden overflow-hidden rounded-2xl border border-[#e1e8e2] bg-gradient-to-b from-[#edf8dd] to-[#f8fcf4] xl:block">
                  <div className="relative h-[170px] overflow-hidden bg-[#eaf4e5] p-5 text-center"><img src={cropCardImage} alt="" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#dff0d7]/55 via-transparent to-transparent" /></div>
                  <div className="p-5"><p className="text-xl font-extrabold leading-tight text-[#176b3e]">Healthy Crops<br/>Brighter Futures</p><p className="mt-2 text-center text-xs text-[#536158]">Track Â· Plan Â· Prosper</p></div>
                </div>
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_1fr_.9fr]">
                <Panel title="Upcoming Harvests" subtitle="Your planned harvests and procurement opportunities" icon={CalendarDays}>
                  {upcoming.length ? upcoming.slice(0, 3).map((crop) => <div key={crop.id} className="flex items-center justify-between rounded-xl border border-[#e3e9e3] bg-[#fbfdfb] p-4"><div><p className="font-bold">{crop.crop_name}</p><p className="mt-1 text-xs text-[#718078]">{crop.farm_name}</p></div><div className="text-right"><p className="text-xs font-semibold text-[#176b3e]">{formatDate(crop.expected_harvest_date)}</p></div></div>) : <EmptyState text="No upcoming harvests yet" sub="Add crops with expected harvest dates to see them here." action={farms.length ? "Add Crop" : undefined} onAction={farms.length ? () => openCropModal() : undefined} />}
                </Panel>

                <button type="button" onClick={() => window.alert("Procurement centre discovery will be connected to the centre module next.")} className="group overflow-hidden rounded-2xl border border-[#d8e4da] bg-white text-left transition hover:border-[#176b3e]">
                  <div className="relative h-full min-h-[230px] overflow-hidden bg-[#e7f3e6] p-5"><img src={centreImage} alt="" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent" /><div className="relative z-10"><p className="font-mono text-[10px] tracking-[.18em] text-[#7a847c]">NEXT STEP</p><p className="mt-2 text-xl font-extrabold">Find a procurement centre</p><p className="mt-2 max-w-xs text-sm leading-5 text-[#65736a]">Discover nearby centres, check available slots and book your visit.</p><span className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#176b3e] px-4 py-2.5 text-xs font-bold text-white">Explore Centres <ChevronRight size={15}/></span></div><MapPin className="absolute bottom-6 right-7 text-[#176b3e]/30" size={78}/></div>
                </button>

                <Panel title="Quick Actions" subtitle="Common tasks" icon={Sprout}>
                  <div className="grid grid-cols-2 gap-3"><QuickAction icon={CalendarDays} label="Book a Slot" /><QuickAction icon={FileText} label="View Bookings" /><QuickAction icon={Users} label="Check Queue" /><QuickAction icon={RupeeIcon} label="Payment Status" /></div>
                </Panel>
              </div>

              <div className="mt-5 flex items-center justify-between gap-5 overflow-hidden rounded-2xl border border-[#dce7de] bg-white px-5 py-4"><div className="flex items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f5e9] text-[#176b3e]"><Leaf size={23}/></div><div><p className="font-bold">Government Schemes for You</p><p className="text-xs text-[#718078]">Explore schemes you may be eligible for based on your profile.</p></div></div><button type="button" className="hidden items-center gap-2 rounded-lg border border-[#9db9a4] px-4 py-2.5 text-xs font-bold text-[#176b3e] sm:inline-flex">Explore Schemes <ChevronRight size={15}/></button></div>
            </>}
          </section>
        </div>
      </div>

      {modal === "farm" && <Modal title="Add your farm" onClose={() => !saving && setModal(null)}><form onSubmit={saveFarm} className="space-y-3.5"><Field label="Farm name" value={farmForm.farm_name} onChange={(v) => setFarmForm({ ...farmForm, farm_name: v })} placeholder="My farm" /><div className="grid gap-3 sm:grid-cols-2"><Field label="State" value={farmForm.state} onChange={(v) => setFarmForm({ ...farmForm, state: v })} placeholder="Jharkhand" /><Field label="District" value={farmForm.district} onChange={(v) => setFarmForm({ ...farmForm, district: v })} placeholder="Ranchi" /></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Village" value={farmForm.village} onChange={(v) => setFarmForm({ ...farmForm, village: v })} placeholder="Village name" /><Field label="Area" type="number" value={farmForm.area} onChange={(v) => setFarmForm({ ...farmForm, area: v })} placeholder="2.5" /></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Area unit" value={farmForm.area_unit} onChange={(v) => setFarmForm({ ...farmForm, area_unit: v })} placeholder="acre" /><Field label="Irrigation type" value={farmForm.irrigation_type} onChange={(v) => setFarmForm({ ...farmForm, irrigation_type: v })} placeholder="Borewell / Rainfed" /></div>{formError && <p className="text-xs font-medium text-red-600">{formError}</p>}<SubmitButton loading={saving} label="Save farm" /></form></Modal>}
      {modal === "crop" && <Modal title="Add a crop" onClose={() => !saving && setModal(null)}><form onSubmit={saveCrop} className="space-y-3.5"><label className="block"><span className="mb-1.5 block text-xs font-semibold">Farm</span><select value={cropForm.farm_id} onChange={(e) => setCropForm({ ...cropForm, farm_id: e.target.value })} className="w-full rounded-lg border border-[#dce3dc] bg-[#fafcf9] px-3 py-2.5 text-sm outline-none focus:border-[#176b3e]"><option value="">Select farm</option>{farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.farm_name}</option>)}</select></label><Field label="Crop name" value={cropForm.crop_name} onChange={(v) => setCropForm({ ...cropForm, crop_name: v })} placeholder="Wheat" /><div className="grid gap-3 sm:grid-cols-2"><Field label="Season" value={cropForm.season} onChange={(v) => setCropForm({ ...cropForm, season: v })} placeholder="Rabi" /><Field label="Expected quantity" type="number" value={cropForm.expected_quantity} onChange={(v) => setCropForm({ ...cropForm, expected_quantity: v })} placeholder="20" /></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Sowing date" type="date" value={cropForm.sowing_date} onChange={(v) => setCropForm({ ...cropForm, sowing_date: v })} /><Field label="Expected harvest" type="date" value={cropForm.expected_harvest_date} onChange={(v) => setCropForm({ ...cropForm, expected_harvest_date: v })} /></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Quantity unit" value={cropForm.quantity_unit} onChange={(v) => setCropForm({ ...cropForm, quantity_unit: v })} placeholder="quintal" /><label className="block"><span className="mb-1.5 block text-xs font-semibold">Status</span><select value={cropForm.status} onChange={(e) => setCropForm({ ...cropForm, status: e.target.value })} className="w-full rounded-lg border border-[#dce3dc] bg-[#fafcf9] px-3 py-2.5 text-sm outline-none focus:border-[#176b3e]"><option value="GROWING">Growing</option><option value="HARVEST_READY">Harvest ready</option></select></label></div>{formError && <p className="text-xs font-medium text-red-600">{formError}</p>}<SubmitButton loading={saving} label="Save crop" /></form></Modal>}
    </main>
  );
}

function NavItem({ icon: Icon, label, active, badge }) {
  return <button type="button" className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition ${active ? "bg-[#eaf5ec] font-bold text-[#176b3e]" : "text-[#33453a] hover:bg-[#f3f7f3]"}`}><Icon size={19} /> <span className="flex-1 text-left">{label}</span>{badge && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d9363e] px-1 text-[10px] font-bold text-white">{badge}</span>}</button>;
}

function Metric({ icon: Icon, label, value, sub, tone = "green" }) {
  const tones = { green: "bg-[#e5f4e7] text-[#176b3e]", amber: "bg-[#fff2d9] text-[#a26712]", purple: "bg-[#eee8ff] text-[#6941a5]" };
  return <div className="group flex min-h-[116px] items-center justify-between rounded-2xl border border-[#dfe7df] bg-white p-5 shadow-[0_3px_14px_rgba(26,52,34,.025)]"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}><Icon size={24}/></div><div className="ml-4 flex-1"><p className="text-3xl font-extrabold tracking-[-.05em] text-[#111a14]">{value ?? 0}</p><p className="font-medium text-[#26362b]">{label}</p><p className="mt-1 text-xs text-[#718078]">{sub}</p></div><ChevronRight size={20} className="text-[#526158] transition group-hover:translate-x-0.5"/></div>;
}

function Panel({ title, subtitle, icon: Icon, action, children }) {
  return <section className="rounded-2xl border border-[#dfe7df] bg-white p-5 shadow-[0_3px_14px_rgba(26,52,34,.025)]"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9f5ea] text-[#176b3e]"><Icon size={21}/></div><div><h2 className="text-lg font-extrabold tracking-[-.025em]">{title}</h2><p className="text-xs text-[#718078]">{subtitle}</p></div></div>{action}</div><div className="mt-5">{children}</div></section>;
}

function FarmCard({ farm, onAddCrop }) {
  return <div className="group rounded-xl border border-[#cfe0d2] bg-[#fbfdfb] p-4 transition hover:border-[#72a980]"><div className="flex items-center gap-4"><img src={farmImage} alt="" className="hidden h-[86px] w-[110px] shrink-0 rounded-lg object-cover sm:block" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{farm.farm_name}</p><p className="mt-1 flex items-center gap-1 text-xs text-[#718078]"><MapPin size={13}/>{farm.village}, {farm.district}, {farm.state}</p><p className="mt-2 text-xs font-medium text-[#536158]">{farm.area} {farm.area_unit} Â· {farm.irrigation_type || "Irrigation not set"}</p></div><ChevronRight size={20} className="text-[#176b3e]"/></div><button type="button" onClick={onAddCrop} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#bfd2c3] bg-white px-3 py-2 text-xs font-semibold text-[#176b3e] hover:bg-[#edf7ef]"><Plus size={14}/> Add crop</button></div></div></div>;
}

function CropRow({ crop, farmName }) {
  return <div className="flex items-center justify-between rounded-xl border border-[#e3e9e3] bg-[#fbfdfb] p-4"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e9f6ea] text-[#176b3e]"><Sprout size={21}/></div><div className="min-w-0"><p className="truncate font-bold">{crop.crop_name}</p><p className="mt-1 truncate text-xs text-[#718078]">{farmName || "Farm"}{crop.season ? ` Â· ${crop.season}` : ""}</p></div></div><span className="rounded-full bg-[#e8f5ea] px-2.5 py-1 text-[10px] font-bold text-[#176b3e]">{statusLabel(crop.status)}</span></div>;
}

function EmptyState({ text, sub, action, onAction }) {
  return <div className="rounded-xl border border-dashed border-[#ccd9ce] bg-[#fbfdfb] px-5 py-7 text-center"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#eef6ef] text-[#7c8d82]"><Leaf size={20}/></div><p className="mt-3 text-sm font-semibold text-[#39483f]">{text}</p>{sub && <p className="mx-auto mt-1 max-w-sm text-xs text-[#7a867f]">{sub}</p>}{action && <button type="button" onClick={onAction} className="mt-4 rounded-lg border border-[#afd0b6] bg-white px-4 py-2 text-xs font-bold text-[#176b3e] hover:bg-[#eff8f0]">{action}</button>}</div>;
}

function QuickAction({ icon: Icon, label }) {
  return <button type="button" onClick={() => window.alert(`${label} will be connected to the next dashboard module.`)} className="flex items-center gap-2 rounded-xl border border-[#e1e8e2] bg-[#fbfdfb] px-3 py-3 text-left text-xs font-semibold transition hover:border-[#9dbba3] hover:bg-[#f3f8f3]"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e9f5ea] text-[#176b3e]"><Icon size={16}/></span>{label}</button>;
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#202b23]">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-[#dce3dc] bg-[#fafcf9] px-3 py-2.5 text-sm outline-none focus:border-[#176b3e] focus:ring-2 focus:ring-[#176b3e]/10" /></label>;
}

function SubmitButton({ loading, label }) {
  return <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#176b3e] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#115832] disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Saving..." : label}<ChevronRight size={17}/></button>;
}

function Modal({ title, onClose, children }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132017]/45 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-7"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold tracking-[-.03em]">{title}</h2><button type="button" onClick={onClose} className="rounded-lg p-2 text-[#718078] hover:bg-[#f2f5f2]"><X size={19}/></button></div>{children}</div></div>;
}

function IndianRupeeIcon({ size = 19 }) { return <span style={{ fontSize: size, lineHeight: 1, fontWeight: 700 }}>â‚¹</span>; }
function RupeeIcon({ size = 16 }) { return <span style={{ fontSize: size, lineHeight: 1, fontWeight: 800 }}>â‚¹</span>; }

export default FarmerDashboard;



