import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Leaf,
  LogOut,
  MapPin,
  Plus,
  Sprout,
  X,
} from "lucide-react";

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
  }, [token, onLogout]);

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

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#17251b]">
      <header className="border-b border-[#e2e8e2] bg-white">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-10">
          <div>
            <p className="text-base font-extrabold tracking-[-.03em] text-[#176b3e]">KrishiSetu</p>
            <p className="text-[10px] font-mono tracking-[.18em] text-[#7a847c]">FARMER DASHBOARD</p>
          </div>
          <button type="button" onClick={logout} className="inline-flex items-center gap-2 rounded-lg border border-[#d5ded6] px-3.5 py-2 text-xs font-semibold text-[#405046] transition hover:bg-[#f3f7f3]"><LogOut size={15} /> Logout</button>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="rounded-3xl bg-[#176b3e] px-6 py-7 text-white sm:px-8 sm:py-8">
          <p className="font-mono text-[10px] font-semibold tracking-[.2em] text-white/65">YOUR PROCUREMENT JOURNEY</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">{loading ? "Welcome back." : `Welcome, ${data?.farmer_name || "Farmer"}.`}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">Manage your farms and crops, then move towards your next procurement visit.</p>
        </div>

        {loading && <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl border border-[#e0e7e0] bg-white" />)}</div>}
        {!loading && error && <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}<button type="button" onClick={loadData} className="ml-2 font-semibold underline">Try again</button></div>}

        {!loading && data && (
          <>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric icon={MapPin} label="Farms" value={data.total_farms} />
              <Metric icon={Leaf} label="Crops" value={data.total_crops} />
              <Metric icon={Sprout} label="Growing" value={data.growing_crops} />
              <Metric icon={CheckCircle2} label="Harvest ready" value={data.harvest_ready_crops} />
            </div>

            <div className="mt-10 grid gap-7 lg:grid-cols-[1.1fr_.9fr]">
              <section className="rounded-2xl border border-[#e0e7e0] bg-white p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div><p className="font-mono text-[10px] tracking-[.18em] text-[#7a847c]">MY FARMS</p><h2 className="mt-1 text-xl font-semibold tracking-[-.03em]">Your farm profile</h2></div>
                  <button type="button" onClick={openFarmModal} className="inline-flex items-center gap-1.5 rounded-lg bg-[#176b3e] px-3 py-2 text-xs font-bold text-white hover:bg-[#115832]"><Plus size={15} /> Add farm</button>
                </div>
                <div className="mt-5 space-y-3">
                  {farms.length ? farms.map((farm) => <FarmCard key={farm.id} farm={farm} onAddCrop={() => openCropModal(farm.id)} />) : <EmptyState text="No farms added yet. Add your first farm to start your procurement journey." action="Add farm" onAction={openFarmModal} />}
                </div>
              </section>

              <section className="rounded-2xl border border-[#e0e7e0] bg-white p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.18em] text-[#7a847c]">ACTIVE CROPS</p><h2 className="mt-1 text-xl font-semibold tracking-[-.03em]">What is growing now</h2></div><Sprout size={20} className="text-[#176b3e]" /></div>
                <div className="mt-5 space-y-3">
                  {crops.length ? crops.map((crop) => <CropRow key={crop.id} crop={crop} farmName={farms.find((farm) => farm.id === crop.farm_id)?.farm_name} />) : <EmptyState text="No crops added yet." action={farms.length ? "Add crop" : undefined} onAction={farms.length ? () => openCropModal() : undefined} />}
                </div>
              </section>
            </div>

            <section className="mt-7 rounded-2xl border border-[#e0e7e0] bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.18em] text-[#7a847c]">UPCOMING HARVESTS</p><h2 className="mt-1 text-xl font-semibold tracking-[-.03em]">Plan ahead</h2></div><CalendarDays size={20} className="text-[#176b3e]" /></div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {data.upcoming_harvests?.length ? data.upcoming_harvests.map((crop) => <div key={crop.id} className="rounded-xl border border-[#e6ebe6] bg-[#fafcf9] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-[#18231c]">{crop.crop_name}</p><p className="mt-1 text-xs text-[#718078]">{crop.farm_name}</p></div><Clock3 size={16} className="mt-0.5 text-[#718078]" /></div><p className="mt-3 text-sm font-semibold text-[#176b3e]">{formatDate(crop.expected_harvest_date)}</p></div>) : <EmptyState text="No upcoming harvests yet." />}
              </div>
            </section>

            <button type="button" onClick={() => window.alert("Procurement centre discovery is the next dashboard module. The backend centre APIs are ready to connect.")} className="mt-7 flex w-full items-center justify-between rounded-2xl border border-[#cddbcf] bg-white p-5 text-left transition hover:border-[#176b3e] hover:bg-[#f7fbf6] sm:p-6">
              <div><p className="font-mono text-[10px] tracking-[.18em] text-[#7a847c]">NEXT STEP</p><p className="mt-1 font-semibold">Find a procurement centre</p><p className="mt-1 text-xs text-[#718078]">Discover centres, timings and available slots.</p></div><ArrowRight size={20} className="shrink-0 text-[#176b3e]" />
            </button>
          </>
        )}
      </section>

      {modal === "farm" && <Modal title="Add your farm" onClose={() => !saving && setModal(null)}><form onSubmit={saveFarm} className="space-y-3.5"><Field label="Farm name" value={farmForm.farm_name} onChange={(v) => setFarmForm({ ...farmForm, farm_name: v })} placeholder="My farm" /><div className="grid gap-3 sm:grid-cols-2"><Field label="State" value={farmForm.state} onChange={(v) => setFarmForm({ ...farmForm, state: v })} placeholder="Jharkhand" /><Field label="District" value={farmForm.district} onChange={(v) => setFarmForm({ ...farmForm, district: v })} placeholder="Ranchi" /></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Village" value={farmForm.village} onChange={(v) => setFarmForm({ ...farmForm, village: v })} placeholder="Village name" /><Field label="Area" type="number" value={farmForm.area} onChange={(v) => setFarmForm({ ...farmForm, area: v })} placeholder="2.5" /></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Area unit" value={farmForm.area_unit} onChange={(v) => setFarmForm({ ...farmForm, area_unit: v })} placeholder="acre" /><Field label="Irrigation type" value={farmForm.irrigation_type} onChange={(v) => setFarmForm({ ...farmForm, irrigation_type: v })} placeholder="Borewell / Rainfed" /></div>{formError && <p className="text-xs font-medium text-red-600">{formError}</p>}<SubmitButton loading={saving} label="Save farm" /></form></Modal>}

      {modal === "crop" && <Modal title="Add a crop" onClose={() => !saving && setModal(null)}><form onSubmit={saveCrop} className="space-y-3.5"><label className="block"><span className="mb-1.5 block text-xs font-semibold">Farm</span><select value={cropForm.farm_id} onChange={(e) => setCropForm({ ...cropForm, farm_id: e.target.value })} className="w-full rounded-lg border border-[#dce3dc] bg-[#fafcf9] px-3 py-2.5 text-sm outline-none focus:border-[#176b3e]"><option value="">Select a farm</option>{farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.farm_name}</option>)}</select></label><Field label="Crop name" value={cropForm.crop_name} onChange={(v) => setCropForm({ ...cropForm, crop_name: v })} placeholder="Wheat" /><div className="grid gap-3 sm:grid-cols-2"><Field label="Season" value={cropForm.season} onChange={(v) => setCropForm({ ...cropForm, season: v })} placeholder="Rabi" /><Field label="Expected quantity" type="number" value={cropForm.expected_quantity} onChange={(v) => setCropForm({ ...cropForm, expected_quantity: v })} placeholder="10" /></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Sowing date" type="date" value={cropForm.sowing_date} onChange={(v) => setCropForm({ ...cropForm, sowing_date: v })} /><Field label="Expected harvest" type="date" value={cropForm.expected_harvest_date} onChange={(v) => setCropForm({ ...cropForm, expected_harvest_date: v })} /></div><label className="block"><span className="mb-1.5 block text-xs font-semibold">Status</span><select value={cropForm.status} onChange={(e) => setCropForm({ ...cropForm, status: e.target.value })} className="w-full rounded-lg border border-[#dce3dc] bg-[#fafcf9] px-3 py-2.5 text-sm outline-none focus:border-[#176b3e]"><option value="PLANNED">Planned</option><option value="GROWING">Growing</option><option value="HARVEST_READY">Harvest ready</option><option value="HARVESTED">Harvested</option></select></label>{formError && <p className="text-xs font-medium text-red-600">{formError}</p>}<SubmitButton loading={saving} label="Save crop" /></form></Modal>}
    </main>
  );
}

function Metric({ icon: Icon, label, value }) { return <div className="rounded-2xl border border-[#e0e7e0] bg-white p-5"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9f5e7] text-[#176b3e]"><Icon size={19} /></span><p className="text-sm font-semibold text-[#526057]">{label}</p></div><p className="mt-4 text-3xl font-semibold tracking-[-.04em] text-[#142019]">{value}</p></div>; }
function FarmCard({ farm, onAddCrop }) { return <div className="rounded-xl border border-[#e6ebe6] bg-[#fafcf9] p-4"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="font-semibold text-[#18231c]">{farm.farm_name}</p><p className="mt-1 flex items-center gap-1 text-xs text-[#718078]"><MapPin size={13} /> {farm.village}, {farm.district}, {farm.state}</p><p className="mt-2 text-xs text-[#526057]">{farm.area} {farm.area_unit}{farm.irrigation_type ? ` · ${farm.irrigation_type}` : ""}</p></div><button type="button" onClick={onAddCrop} className="shrink-0 rounded-lg border border-[#cddbcf] px-3 py-2 text-xs font-bold text-[#176b3e] hover:bg-white">Add crop</button></div></div>; }
function CropRow({ crop, farmName }) { return <div className="flex items-center justify-between gap-4 rounded-xl border border-[#e6ebe6] bg-[#fafcf9] p-4"><div className="min-w-0"><p className="truncate font-semibold text-[#18231c]">{crop.crop_name}</p><p className="mt-1 truncate text-xs text-[#718078]">{farmName || `Farm #${crop.farm_id}`} · {crop.expected_quantity} {crop.quantity_unit}</p></div><span className="shrink-0 rounded-full bg-[#e9f5e7] px-2.5 py-1 text-[10px] font-semibold text-[#176b3e]">{statusLabel(crop.status)}</span></div>; }
function EmptyState({ text, action, onAction }) { return <div className="rounded-xl border border-dashed border-[#d7e0d8] p-5 text-sm text-[#718078]">{text}{action && <button type="button" onClick={onAction} className="ml-2 font-semibold text-[#176b3e] hover:underline">{action}</button>}</div>; }
function Field({ label, value, onChange, placeholder, type = "text" }) { return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#202b23]">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-[#dce3dc] bg-[#fafcf9] px-3 py-2.5 text-sm outline-none focus:border-[#176b3e] focus:ring-2 focus:ring-[#176b3e]/10" /></label>; }
function Modal({ title, onClose, children }) { return <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-5 backdrop-blur-sm"><div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6"><div className="mb-5 flex items-start justify-between gap-4"><div><p className="font-mono text-[9px] tracking-[.2em] text-[#718078]">KRISHISETU / FARMER</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.04em]">{title}</h2></div><button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-[#f1f4f0]"><X size={18} /></button></div>{children}</div></div>; }
function SubmitButton({ loading, label }) { return <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#176b3e] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#115832] disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Saving..." : label}{!loading && <ArrowRight size={16} />}</button>; }

export default FarmerDashboard;
