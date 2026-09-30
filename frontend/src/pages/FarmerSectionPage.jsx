import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, CheckCircle2, FileText, IndianRupee, Loader2, MapPin, RefreshCw, Sprout, Tractor, Users, Wheat, X, Settings, Shield, Lock, User, Smartphone, Check, Globe, Sliders } from "lucide-react";
import farmerApi from "../api/farmerApi";
import CentreMap from "../components/CentreMap";

const pretty = (value) => String(value || "Not set").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const date = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Not set";
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const list = (value) => Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : [];
const errText = (error) => Array.isArray(error?.response?.data?.detail)
  ? error.response.data.detail.map((item) => item?.msg || item?.message || String(item)).join(" ")
  : error?.response?.data?.detail || error?.message || "Unable to complete this request.";

function Shell({ children }) {
  return <div className="min-h-[520px] w-full">{children}</div>;
}

function Card({ children, className = "" }) { return <div className={`rounded-2xl border border-[#dfe8e0] bg-white p-5 shadow-[0_8px_30px_rgba(31,71,43,.035)] ${className}`}>{children}</div>; }
function Row({ label, value }) { return <div className="rounded-xl bg-[#f7faf7] p-3.5"><p className="text-[10px] font-bold uppercase tracking-[.11em] text-[#7b887f]">{label}</p><p className="mt-1 text-sm font-extrabold">{value ?? "Not set"}</p></div>; }
function Empty({ text }) { return <div className="rounded-2xl border border-dashed border-[#ccd8ce] bg-white p-10 text-center text-sm text-[#718078]"><Sprout className="mx-auto text-[#77a182]" size={28}/><p className="mt-2">{text}</p></div>; }
function FormModal({ title, onClose, children, wide = false }) {
  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
    >
      <div className={`max-h-[90vh] w-full ${wide ? "max-w-3xl" : "max-w-lg"} overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7`}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-[#f1f5f1]"><X size={18}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function FarmerSectionPage({ section, farms = [], crops = [], onBack, onRefreshData }) {
  const [items, setItems] = useState([]);
  const [centres, setCentres] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [slots, setSlots] = useState([]);
  const [booking, setBooking] = useState({ crop_id: "", slot_id: "", declared_quantity: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null);
  const [farmForm, setFarmForm] = useState({ farm_name: "", state: "", district: "", village: "", area: "", area_unit: "acre", irrigation_type: "", latitude: "", longitude: "" });
  const [cropForm, setCropForm] = useState({ farm_id: "", crop_name: "", season: "", sowing_date: "", expected_harvest_date: "", expected_quantity: "", quantity_unit: "quintal", status: "GROWING" });
  const [profile, setProfile] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    setLoading(true); setError("");
    try {
      if (section === "My Farms") {
        try {
          const res = await farmerApi.farms();
          const listData = Array.isArray(res.data) ? res.data : res.data?.items || [];
          setItems(listData);
        } catch {
          setItems(farms);
        }
        return;
      }
      if (section === "My Crops") {
        try {
          const res = await farmerApi.crops();
          const listData = Array.isArray(res.data) ? res.data : res.data?.items || [];
          setItems(listData);
        } catch {
          setItems(crops);
        }
        return;
      }
      if (section === "Find Centre") {
        const [centreResult, recommendationResult] = await Promise.all([farmerApi.centres(), farmerApi.recommendations(8)]);
        setCentres(list(centreResult.data));
        setRecommendations(list(recommendationResult.data));
        return;
      }
      if (section === "Settings") {
        const result = await farmerApi.farmer();
        setProfile(result.data);
        setItems([result.data]);
        return;
      }

      const calls = {
        "My Bookings": farmerApi.bookings,
        "Live Queue": farmerApi.queue,
        "Procurement": farmerApi.procurements,
        "Payments": farmerApi.payments,
        "Notifications": farmerApi.notifications,
        "Market Prices": farmerApi.marketPrices,
        "Advisory": farmerApi.schemes,
        "Schemes": farmerApi.schemes,
      };
      const call = calls[section];
      if (!call) { setItems([]); return; }
      const result = await call();
      if (section === "Live Queue") setItems(result?.data && !Array.isArray(result.data) ? [result.data] : list(result?.data));
      else setItems(list(result?.data));
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [section]);

  useEffect(() => {
    if (section === "My Farms") setItems(farms);
  }, [farms, section]);

  useEffect(() => {
    if (section === "My Crops") setItems(crops);
  }, [crops, section]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (modal && !busy) setModal(null);
        if (selectedCentre && !busy) setSelectedCentre(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [modal, selectedCentre, busy]);

  const saveFarm = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await farmerApi.createFarm({
        ...farmForm,
        area: Number(farmForm.area),
        latitude: farmForm.latitude === "" ? null : Number(farmForm.latitude),
        longitude: farmForm.longitude === "" ? null : Number(farmForm.longitude),
      });
      setModal(null);
      await load();
      onRefreshData?.();
    } catch (e) { setError(errText(e)); } finally { setBusy(false); }
  };

  const saveCrop = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    let targetFarmId = cropForm.farm_id || (farms.length > 0 ? String(farms[0].id) : "");
    const name = cropForm.crop_name.trim();
    if (!name) {
      setError("Please enter crop name.");
      setBusy(false);
      return;
    }
    try {
      if (!targetFarmId) {
        const farmRes = await farmerApi.createFarm({
          farm_name: `${name} Farm`,
          state: "Uttar Pradesh",
          district: "Saharanpur",
          village: "Chhutmalpur",
          area: 5,
          area_unit: "acre",
          irrigation_type: "Tube Well",
          latitude: 30.0363,
          longitude: 77.7518,
        });
        targetFarmId = String(farmRes.data.id);
      }

      await farmerApi.createCrop(targetFarmId, {
        crop_name: name,
        expected_quantity: Number(cropForm.expected_quantity) || 10,
        quantity_unit: cropForm.quantity_unit || "quintal",
        season: cropForm.season || "Kharif",
        sowing_date: cropForm.sowing_date || new Date().toISOString().split("T")[0],
        expected_harvest_date: cropForm.expected_harvest_date || null,
        status: cropForm.status || "GROWING",
      });
      setModal(null);
      await load();
      onRefreshData?.();
    } catch (e) { setError(errText(e)); } finally { setBusy(false); }
  };

  const openCentre = async (centre) => {
    const centreId = centre.id ?? centre.centre_id;
    setSelectedCentre(centre); setSlots([]); setError("");
    setBooking({ crop_id: crops[0]?.id || "", slot_id: "", declared_quantity: "" });
    try {
      const result = await farmerApi.recommendedSlots(centreId, 8);
      setSlots(list(result.data));
    } catch {
      try {
        const result = await farmerApi.slots(centreId);
        setSlots(list(result.data));
      } catch (e) { setError(errText(e)); }
    }
  };

  const createBooking = async () => {
    if (!booking.crop_id || !booking.slot_id || Number(booking.declared_quantity) <= 0) {
      setError("Select a crop, slot and valid quantity."); return;
    }
    setBusy(true); setError("");
    try {
      await farmerApi.createBooking({ crop_id: Number(booking.crop_id), slot_id: Number(booking.slot_id), declared_quantity: Number(booking.declared_quantity) });
      setSelectedCentre(null); setModal("booked");
      onRefreshData?.();
    } catch (e) { setError(errText(e)); } finally { setBusy(false); }
  };

  const checkIn = async (bookingId) => {
    setBusy(true); setError("");
    try { await farmerApi.checkIn(bookingId); await load(); onRefreshData?.(); } catch (e) { setError(errText(e)); } finally { setBusy(false); }
  };

  const markRead = async (id) => {
    try { await farmerApi.markNotificationRead(id); await load(); onRefreshData?.(); } catch (e) { setError(errText(e)); }
  };

  const deleteFarm = async (farm) => {
    if (!window.confirm(`Delete farm "${farm.farm_name}"? This cannot be undone.`)) return;
    setDeletingId(`farm-${farm.id}`); setError("");
    try { await farmerApi.deleteFarm(farm.id); await load(); onRefreshData?.(); } catch (e) { setError(errText(e)); } finally { setDeletingId(null); }
  };

  const deleteCrop = async (crop) => {
    if (!window.confirm(`Delete crop "${crop.crop_name}"? This cannot be undone.`)) return;
    setDeletingId(`crop-${crop.id}`); setError("");
    try { await farmerApi.deleteCrop(crop.id); await load(); onRefreshData?.(); } catch (e) { setError(errText(e)); } finally { setDeletingId(null); }
  };

  const mergedCentres = useMemo(() => {
    const combined = [...recommendations.map((item) => ({ ...item, id: item.centre_id ?? item.id })), ...centres];
    return combined.filter((item, index, all) => all.findIndex((x) => String(x.id ?? x.centre_id) === String(item.id ?? item.centre_id)) === index)
      .filter((item) => JSON.stringify(item).toLowerCase().includes(query.trim().toLowerCase()));
  }, [centres, recommendations, query]);

  const titleMap = {
    "My Farms": [Tractor, "Registered farm records and your digital farm workspace."],
    "My Crops": [Wheat, "Crop lifecycle information linked to your farms."],
    "Find Centre": [MapPin, "Smart recommendation, real map and slot booking."],
    "My Bookings": [CalendarDays, "Digital tokens and procurement visits from the backend."],
    "Live Queue": [Users, "Your queue status is driven by the backend queue service."],
    "Procurement": [FileText, "Stage-by-stage procurement progress."],
    "Payments": [IndianRupee, "Payment tracking from the backend."],
    "Notifications": [Bell, "Updates generated by the notification service."],
    "Market Prices": [IndianRupee, "Live market prices loaded from the backend market service."],
    "Settings": [Settings, "Your connected farmer profile and account settings."],
    "Advisory": [Sprout, "Farmer services and scheme information."],
    "Schemes": [FileText, "Government scheme information from the connected service."],
  };
  const [Icon, subtitle] = titleMap[section] || [Sprout, "KrishiSetu farmer information."];

  if (loading) return <Shell title={section} subtitle="Loading live backend data…" icon={Icon} ><div className="flex min-h-[55vh] items-center justify-center"><div className="text-center"><Loader2 className="mx-auto animate-spin text-[#176b3e]" size={34}/><p className="mt-3 font-extrabold">Loading {section}…</p></div></div></Shell>;

  return (
    <Shell title={section} subtitle={subtitle} icon={Icon} >
      {error && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><b>Backend:</b> {error}</div>}

      {section === "My Farms" && <>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-extrabold">My Farms</h2><p className="mt-1 text-sm text-[#718078]">Manage the farms used by recommendations, weather and the map.</p></div><button type="button" onClick={() => { setError(""); setFarmForm({ farm_name: "", state: "", district: "", village: "", area: "", area_unit: "acre", irrigation_type: "", latitude: "", longitude: "" }); setModal("farm"); }} className="inline-flex items-center gap-2 rounded-xl bg-[#176b3e] px-4 py-2.5 text-sm font-bold text-white"><span>＋</span>Add farm</button></div>
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((farm) => (
            <Card key={farm.id}>
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf7ee] text-[#176b3e]">
                  <Tractor size={21}/>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#176b3e]">Farm #{farm.id}</span>
                  <button type="button" onClick={() => deleteFarm(farm)} disabled={deletingId === `farm-${farm.id}`} className="rounded-lg bg-[#fff0f0] px-2.5 py-1.5 text-[10px] font-bold text-[#b33d43]">
                    {deletingId === `farm-${farm.id}` ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
              <h3 className="mt-4 text-lg font-extrabold">{farm.farm_name}</h3>
              <p className="mt-1 flex items-center gap-1 text-sm text-[#718078]">
                <MapPin size={14}/>{farm.village}, {farm.district}, {farm.state}
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Row label="Area" value={`${farm.area} ${farm.area_unit || "acre"}`}/>
                <Row label="Irrigation" value={farm.irrigation_type}/>
                <Row label="Latitude" value={farm.latitude}/>
                <Row label="Longitude" value={farm.longitude}/>
              </div>
            </Card>
          ))}
          {!items.length && <div className="md:col-span-2"><Empty text="No farms are registered yet. Add your first farm."/></div>}
        </div>
        {modal === "farm" && <FormModal title="Add a farm" onClose={() => setModal(null)}><form onSubmit={saveFarm} className="space-y-3">{[["Farm name","farm_name"],["State","state"],["District","district"],["Village","village"],["Area","area"]].map(([label,key]) => <label key={key} className="block"><span className="mb-1.5 block text-xs font-bold">{label}</span><input required value={farmForm[key]} onChange={(e) => setFarmForm({ ...farmForm, [key]: e.target.value })} type={key === "area" ? "number" : "text"} className="w-full rounded-xl border border-[#d9e3da] bg-[#fafcf9] px-3 py-2.5 text-sm outline-none focus:border-[#176b3e]"/></label>)}<div className="grid grid-cols-2 gap-3"><label className="block"><span className="mb-1.5 block text-xs font-bold">Area unit</span><select value={farmForm.area_unit} onChange={(e) => setFarmForm({ ...farmForm, area_unit: e.target.value })} className="w-full rounded-xl border px-3 py-2.5 text-sm"><option>acre</option><option>bigha</option><option>hectare</option></select></label><label className="block"><span className="mb-1.5 block text-xs font-bold">Irrigation</span><input value={farmForm.irrigation_type} onChange={(e) => setFarmForm({ ...farmForm, irrigation_type: e.target.value })} className="w-full rounded-xl border px-3 py-2.5 text-sm" placeholder="Borewell"/></label></div><div className="grid grid-cols-2 gap-3"><input value={farmForm.latitude} onChange={(e) => setFarmForm({ ...farmForm, latitude: e.target.value })} placeholder="Latitude (optional)" className="rounded-xl border px-3 py-2.5 text-sm"/><input value={farmForm.longitude} onChange={(e) => setFarmForm({ ...farmForm, longitude: e.target.value })} placeholder="Longitude (optional)" className="rounded-xl border px-3 py-2.5 text-sm"/></div><button disabled={busy} className="w-full rounded-xl bg-[#176b3e] py-3 text-sm font-bold text-white">{busy ? "Saving…" : "Save farm"}</button></form></FormModal>}
      </>}

      {section === "My Crops" && <>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-extrabold">My Crops</h2><p className="mt-1 text-sm text-[#718078]">Keep crop records ready for procurement booking.</p></div><button type="button" onClick={() => { setError(""); setCropForm({ farm_id: farms[0]?.id || "", crop_name: "", season: "Kharif", sowing_date: new Date().toISOString().split("T")[0], expected_harvest_date: "", expected_quantity: "", quantity_unit: "quintal", status: "GROWING" }); setModal("crop"); }} className="inline-flex items-center gap-2 rounded-xl bg-[#176b3e] px-4 py-2.5 text-sm font-bold text-white"><span>＋</span>Add crop</button></div>
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((crop) => (
            <Card key={crop.id}>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf7ee] text-[#176b3e]">
                  <Wheat size={21}/>
                </span>
                <div>
                  <h3 className="font-extrabold">{crop.crop_name}</h3>
                  <p className="text-xs text-[#718078]">Farm #{crop.farm_id} · {crop.season || "Season not set"}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="rounded-full bg-[#edf7ee] px-2.5 py-1 text-[10px] font-bold text-[#176b3e]">{pretty(crop.status)}</span>
                  <button type="button" onClick={() => deleteCrop(crop)} disabled={deletingId === `crop-${crop.id}`} className="rounded-lg bg-[#fff0f0] px-2.5 py-1.5 text-[10px] font-bold text-[#b33d43]">
                    {deletingId === `crop-${crop.id}` ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Row label="Expected quantity" value={`${crop.expected_quantity} ${crop.quantity_unit || "quintal"}`}/>
                <Row label="Sowing" value={date(crop.sowing_date)}/>
                <Row label="Harvest" value={date(crop.expected_harvest_date)}/>
                <Row label="Crop ID" value={crop.id}/>
              </div>
            </Card>
          ))}
          {!items.length && <div className="md:col-span-2"><Empty text="No crops are linked yet. Add your first crop."/></div>}
        </div>
        {modal === "crop" && <FormModal title="Add a crop" onClose={() => setModal(null)}><form onSubmit={saveCrop} className="space-y-3"><label className="block"><span className="mb-1.5 block text-xs font-bold">Farm</span><select value={cropForm.farm_id} onChange={(e) => setCropForm({ ...cropForm, farm_id: e.target.value })} className="w-full rounded-xl border px-3 py-2.5 text-sm">{farms.length === 0 ? <option value="">Default Farm (Chhutmalpur, Saharanpur)</option> : farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.farm_name} ({farm.village || "Farm"})</option>)}</select></label><input required value={cropForm.crop_name} onChange={(e) => setCropForm({ ...cropForm, crop_name: e.target.value })} placeholder="Crop name (e.g. Rice, Wheat)" className="w-full rounded-xl border px-3 py-2.5 text-sm"/><input value={cropForm.season} onChange={(e) => setCropForm({ ...cropForm, season: e.target.value })} placeholder="Season (e.g. Kharif, Rabi)" className="w-full rounded-xl border px-3 py-2.5 text-sm"/><div className="grid grid-cols-2 gap-3"><input value={cropForm.sowing_date} onChange={(e) => setCropForm({ ...cropForm, sowing_date: e.target.value })} type="date" className="rounded-xl border px-3 py-2.5 text-sm"/><input value={cropForm.expected_harvest_date} onChange={(e) => setCropForm({ ...cropForm, expected_harvest_date: e.target.value })} type="date" className="rounded-xl border px-3 py-2.5 text-sm"/></div><div className="grid grid-cols-2 gap-3"><input required value={cropForm.expected_quantity} onChange={(e) => setCropForm({ ...cropForm, expected_quantity: e.target.value })} type="number" min="0.01" placeholder="Quantity" className="rounded-xl border px-3 py-2.5 text-sm"/><input value={cropForm.quantity_unit} onChange={(e) => setCropForm({ ...cropForm, quantity_unit: e.target.value })} placeholder="quintal" className="rounded-xl border px-3 py-2.5 text-sm"/></div><button disabled={busy} className="w-full rounded-xl bg-[#176b3e] py-3 text-sm font-bold text-white">{busy ? "Saving…" : "Save crop"}</button></form></FormModal>}
      </>}

      {section === "Find Centre" && <>
        <div className="grid gap-5 xl:grid-cols-[.78fr_1.22fr]"><div><div className="mb-4 flex gap-2"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search centre or district" className="min-w-0 flex-1 rounded-xl border border-[#d9e3da] bg-white px-4 py-3 text-sm outline-none focus:border-[#176b3e]"/><button type="button" onClick={load} className="rounded-xl border border-[#cbd9ce] bg-white px-3"><RefreshCw size={17}/></button></div><div className="space-y-3">{mergedCentres.map((centre, index) => <button type="button" key={centre.id ?? centre.centre_id ?? index} onClick={() => openCentre(centre)} className="w-full rounded-2xl border border-[#dfe8e0] bg-white p-4 text-left shadow-[0_6px_25px_rgba(31,71,43,.03)] hover:border-[#8eb79a]"><div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf7ee] text-[#176b3e]"><MapPin size={20}/></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="truncate text-sm font-extrabold">{centre.centre_name || centre.name || "Procurement Centre"}</h3>{index === 0 && <span className="rounded-full bg-[#e8f7eb] px-2 py-1 text-[9px] font-bold text-[#267447]">RECOMMENDED</span>}</div><p className="mt-1 text-xs text-[#718078]">{centre.district || centre.address || centre.state || "Centre"}</p><div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-[#5f7165]"><span>{centre.distance_km != null ? `${Number(centre.distance_km).toFixed(1)} km` : "Distance unavailable"}</span>{centre.estimated_wait_minutes != null && <span>Wait {centre.estimated_wait_minutes}m</span>}{centre.open_slot_count != null && <span>{centre.open_slot_count} slots</span>}</div></div></div></button>)}{!mergedCentres.length && <Empty text="No procurement centres match your search."/>}</div></div><div className="min-h-[520px]"><CentreMap centres={centres} recommendations={recommendations} farms={farms} selected={selectedCentre} onSelect={openCentre}/></div></div>
        {selectedCentre && <FormModal title={selectedCentre.centre_name || selectedCentre.name || "Procurement Centre"} onClose={() => setSelectedCentre(null)} wide><p className="text-sm text-[#718078]">{selectedCentre.address || selectedCentre.district || selectedCentre.state}</p><div className="mt-4 grid gap-2 sm:grid-cols-3"><Row label="Distance" value={selectedCentre.distance_km != null ? `${Number(selectedCentre.distance_km).toFixed(1)} km` : "Not available"}/><Row label="Expected wait" value={selectedCentre.estimated_wait_minutes != null ? `${selectedCentre.estimated_wait_minutes} min` : "Not available"}/><Row label="Open slots" value={selectedCentre.open_slot_count ?? slots.length}/></div><h3 className="mt-5 font-extrabold">Choose a slot</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{slots.map((slot) => <button type="button" key={slot.slot_id ?? slot.id} onClick={() => setBooking({ ...booking, slot_id: slot.slot_id ?? slot.id })} className={`rounded-xl border p-3 text-left ${String(booking.slot_id) === String(slot.slot_id ?? slot.id) ? "border-[#176b3e] bg-[#eef8ef]" : "border-[#e1e8e2] bg-white"}`}><p className="text-sm font-extrabold">{date(slot.slot_date)}</p><p className="mt-1 text-xs text-[#718078]">{slot.start_time} – {slot.end_time}</p><p className="mt-2 text-[10px] font-bold text-[#176b3e]">{slot.available_farmer_capacity ?? "--"} farmer capacity · {slot.available_quantity_capacity ?? "--"} qty left</p></button>)}{!slots.length && <p className="text-sm text-[#718078]">No available slots returned by the backend.</p>}</div><div className="mt-5 grid gap-3 sm:grid-cols-2"><label><span className="mb-1.5 block text-xs font-bold">Crop</span><select value={booking.crop_id} onChange={(e) => setBooking({ ...booking, crop_id: e.target.value })} className="w-full rounded-xl border px-3 py-2.5 text-sm"><option value="">Select crop</option>{crops.map((crop) => <option key={crop.id} value={crop.id}>{crop.crop_name}</option>)}</select></label><label><span className="mb-1.5 block text-xs font-bold">Declared quantity</span><input value={booking.declared_quantity} onChange={(e) => setBooking({ ...booking, declared_quantity: e.target.value })} type="number" min="0.01" placeholder="12.5" className="w-full rounded-xl border px-3 py-2.5 text-sm"/></label></div><button type="button" onClick={createBooking} disabled={busy} className="mt-4 w-full rounded-xl bg-[#176b3e] py-3 text-sm font-bold text-white">{busy ? "Booking…" : "Book this slot"}</button></FormModal>}
        {modal === "booked" && <FormModal title="Booking confirmed" onClose={() => { setModal(null); onBack(); }}><div className="rounded-2xl bg-[#eef8ef] p-5 text-center"><CheckCircle2 className="mx-auto text-[#176b3e]" size={38}/><p className="mt-3 text-xl font-extrabold">Your digital token is ready</p><p className="mt-1 text-sm text-[#718078]">Open My Bookings to see the backend-generated token and visit details.</p></div><button type="button" onClick={() => { setModal(null); onBack(); }} className="mt-4 w-full rounded-xl bg-[#176b3e] py-3 text-sm font-bold text-white">Back to dashboard</button></FormModal>}
      </>}

      {section === "My Bookings" && <div className="space-y-3">{items.map((bookingItem) => <Card key={bookingItem.id}><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf7ee] text-[#176b3e]"><CalendarDays size={20}/></span><div className="flex-1"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#7a877f]">Digital token</p><p className="mt-1 text-3xl font-extrabold text-[#176b3e]">{bookingItem.token || "Pending"}</p><p className="mt-1 text-sm text-[#718078]">Booking #{bookingItem.id} · {bookingItem.declared_quantity} {bookingItem.quantity_unit || "unit"}</p></div><span className="rounded-full bg-[#eef5ef] px-3 py-1.5 text-xs font-bold text-[#176b3e]">{pretty(bookingItem.status)}</span></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => checkIn(bookingItem.id)} disabled={busy} className="rounded-xl bg-[#176b3e] px-4 py-2.5 text-xs font-bold text-white">Check in</button><button type="button" onClick={() => farmerApi.booking(bookingItem.id).then((result) => alert(`Centre: ${result.data.centre_name || result.data.name || "Not set"}\nSlot: ${date(result.data.slot_date)} ${result.data.start_time || ""}-${result.data.end_time || ""}`)).catch((e) => setError(errText(e)))} className="rounded-xl border px-4 py-2.5 text-xs font-bold text-[#31543f]">View visit</button></div></Card>)}{!items.length && <Empty text="No procurement bookings yet. Find a centre and book a slot."/>}</div>}

      {section === "Live Queue" && <>{items.length ? <div className="grid gap-5 lg:grid-cols-[1fr_.7fr]">{items.map((queue) => <Card key={queue.queue_entry_id || queue.id}><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#728078]">{queue.centre_name || "Centre"}</p><p className="mt-2 text-5xl font-extrabold text-[#176b3e]">#{queue.queue_number ?? queue.queue_position ?? "—"}</p></div><span className="rounded-full bg-[#eef8ef] px-3 py-1.5 text-xs font-bold text-[#267447]">{pretty(queue.queue_status || queue.status)}</span></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><Row label="Farmers ahead" value={queue.farmers_ahead}/><Row label="Estimated wait" value={queue.estimated_wait_minutes != null ? `${queue.estimated_wait_minutes} min` : "Not set"}/><Row label="Current token" value={queue.current_token || "—"}/><Row label="Avg service" value={queue.average_service_minutes != null ? `${queue.average_service_minutes} min` : "Not set"}/></div><div className="mt-5 rounded-2xl bg-[#f2f7f2] p-4"><p className="text-xs font-bold">Queue progress</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dfe8e1]"><div className="h-full rounded-full bg-[#55a86e]" style={{ width: `${Math.max(5, 100 - Number(queue.farmers_ahead || 0) * 5)}%` }}/></div><p className="mt-2 text-[11px] text-[#718078]">Stay ready. Your token will move as the centre processes the queue.</p></div></Card>)}</div> : <Empty text="No active queue right now. Book a slot and check in to join the queue."/>}</>}

      {section === "Procurement" && <div className="space-y-4">{items.map((item) => { const stages = ["DOCUMENT_VERIFICATION", "QUALITY_CHECK", "WEIGHING", "DECISION", "COMPLETED"]; const current = stages.indexOf(String(item.stage)); return <Card key={item.id}><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#728078]">Procurement #{item.id}</p><h2 className="mt-1 text-xl font-extrabold">{pretty(item.stage)}</h2></div>{item.total_value != null && <p className="text-lg font-extrabold text-[#176b3e]">{money(item.total_value)}</p>}</div><div className="mt-6 space-y-3">{stages.map((stage, index) => <div key={stage} className="flex items-start gap-3"><span className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full ${index <= current ? "bg-[#176b3e] text-white" : "bg-[#e9efea] text-[#87948b]"}`}>{index <= current ? <CheckCircle2 size={15}/> : index + 1}</span><div><p className="text-sm font-bold">{pretty(stage)}</p><p className="text-[11px] text-[#718078]">{stage === "DOCUMENT_VERIFICATION" ? item.document_notes || "Document verification" : stage === "QUALITY_CHECK" ? item.quality_notes || item.quality_grade || "Quality check" : stage === "WEIGHING" ? `${item.accepted_quantity ?? "--"} ${item.quantity_unit || "unit"} accepted` : stage === "DECISION" ? item.decision || "Decision pending" : "Journey complete"}</p></div></div>)}</div></Card>; })}{!items.length && <Empty text="No procurement records yet."/>}</div>}

      {section === "Payments" && <div className="grid gap-4 md:grid-cols-2">{items.map((payment) => <Card key={payment.id}><div className="flex items-center justify-between"><p className="text-3xl font-extrabold">{money(payment.amount)}</p><span className="rounded-full bg-[#eef8ef] px-3 py-1.5 text-xs font-bold text-[#176b3e]">{pretty(payment.status)}</span></div><p className="mt-2 text-sm text-[#718078]">Payment #{payment.id}</p><div className="mt-4 grid gap-2"><Row label="Reference" value={payment.reference_number || "Pending"}/><Row label="Updated" value={payment.updated_at ? new Date(payment.updated_at).toLocaleString("en-IN") : "Not set"}/></div></Card>)}{!items.length && <div className="md:col-span-2"><Empty text="No payment records yet."/></div>}</div>}

      {section === "Notifications" && <><div className="mb-5 flex justify-end"><button type="button" onClick={async () => { await farmerApi.markAllNotificationsRead(); await load(); }} className="rounded-xl border px-4 py-2.5 text-xs font-bold text-[#176b3e]">Mark all read</button></div><div className="space-y-3">{items.map((notification) => <Card key={notification.id} className={notification.is_read ? "opacity-70" : ""}><div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf7ee] text-[#176b3e]"><Bell size={18}/></span><div className="flex-1"><div className="flex items-start justify-between gap-3"><div><p className="font-extrabold">{notification.title}</p><p className="mt-1 text-sm leading-6 text-[#718078]">{notification.message}</p></div>{!notification.is_read && <button type="button" onClick={() => markRead(notification.id)} className="shrink-0 rounded-lg bg-[#eef8ef] px-2.5 py-1.5 text-[10px] font-bold text-[#176b3e]">Mark read</button>}</div><p className="mt-2 text-[10px] text-[#8a968e]">{notification.created_at ? new Date(notification.created_at).toLocaleString("en-IN") : ""}</p></div></div></Card>)}{!items.length && <Empty text="You are all caught up."/>}</div></>}

      {section === "Settings" && (
        <FarmerSettingsView profile={profile} onUpdated={load} onBack={onBack} />
      )}


      {(section === "Market Prices" || section === "Advisory" || section === "Schemes") && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => {
            const name = item.commodity || item.crop_name || item.name || item.scheme_name || item.title || item.code || `${section} item ${index + 1}`;
            const price = item.modal_price ?? item.price ?? item.min_price ?? item.max_price;
            const detail = section === "Market Prices" && price != null
              ? `₹${Number(price).toLocaleString("en-IN")} per ${item.unit || item.price_unit || "quintal"}`
              : item.summary || item.description || item.advisory || item.market || item.details || "Information available from the connected backend service.";

            return (
              <Card key={item.id || index}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-extrabold">{name}</h3>
                  {section === "Market Prices" && (
                    <span className="rounded-full bg-[#edf7ee] px-2.5 py-1 text-[9px] font-extrabold text-[#176b3e]">LIVE</span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-6 text-[#718078]">{detail}</p>
                {(item.market || item.mandi || item.updated_at || item.date) && (
                  <p className="mt-3 text-[10px] text-[#8a968e]">
                    {item.market || item.mandi || "Updated"}
                    {item.updated_at ? ` · ${new Date(item.updated_at).toLocaleString("en-IN")}` : item.date ? ` · ${item.date}` : ""}
                  </p>
                )}
              </Card>
            );
          })}
          {!items.length && (
            <div className="md:col-span-2 xl:col-span-3">
              <Empty text={`No ${section.toLowerCase()} data was returned by the backend right now.`} />
            </div>
          )}
        </div>
      )}
    </Shell>
  );
}

function FarmerSettingsView({ profile, onUpdated, onBack }) {
  const [tab, setTab] = useState("profile");
  const [profileForm, setProfileForm] = useState({
    name: profile?.name || "",
    state: profile?.state || "Uttar Pradesh",
    district: profile?.district || "Saharanpur",
    village: profile?.village || "Mohra",
    preferred_language: profile?.preferred_language || "hi",
  });
  const [farmingPrefs, setFarmingPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem("krishisetu_farming_prefs");
      return saved ? JSON.parse(saved) : {
        unit: "acre",
        season: "Rabi",
        irrigation: "Tube-well",
        mandiRadius: "25",
      };
    } catch {
      return { unit: "acre", season: "Rabi", irrigation: "Tube-well", mandiRadius: "25" };
    }
  });
  const [alertPrefs, setAlertPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem("krishisetu_alert_prefs");
      return saved ? JSON.parse(saved) : {
        weatherSms: true,
        mandiWhatsapp: true,
        tokenAlerts: true,
        appSounds: true,
      };
    } catch {
      return { weatherSms: true, mandiWhatsapp: true, tokenAlerts: true, appSounds: true };
    }
  });
  const [securityForm, setSecurityForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || "",
        state: profile.state || "Uttar Pradesh",
        district: profile.district || "Saharanpur",
        village: profile.village || "Mohra",
        preferred_language: profile.preferred_language || "hi",
      });
    }
  }, [profile]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      await farmerApi.updateFarmer(profileForm);
      setMsg({ type: "success", text: "प्रोफाइल सफलतापूर्वक अपडेट हो गई है! (Profile updated successfully)" });
      if (onUpdated) onUpdated();
    } catch (err) {
      setMsg({ type: "error", text: errText(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFarmingPrefs = (e) => {
    e.preventDefault();
    localStorage.setItem("krishisetu_farming_prefs", JSON.stringify(farmingPrefs));
    setMsg({ type: "success", text: "कृषि प्राथमिकताएं सुरक्षित कर ली गई हैं! (Farming preferences saved)" });
  };

  const handleSaveAlertPrefs = (e) => {
    e.preventDefault();
    localStorage.setItem("krishisetu_alert_prefs", JSON.stringify(alertPrefs));
    setMsg({ type: "success", text: "अलर्ट सेटिंग्स सुरक्षित कर ली गई हैं! (Notification preferences saved)" });
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: "", text: "" });
    if (securityForm.new_password.length < 6) {
      setMsg({ type: "error", text: "नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।" });
      setSaving(false);
      return;
    }
    if (securityForm.new_password !== securityForm.confirm_password) {
      setMsg({ type: "error", text: "नया पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।" });
      setSaving(false);
      return;
    }
    try {
      await farmerApi.updateFarmer({
        current_password: securityForm.current_password,
        password: securityForm.new_password,
      });
      setSecurityForm({ current_password: "", new_password: "", confirm_password: "" });
      setMsg({ type: "success", text: "पासवर्ड सफलतापूर्वक बदल दिया गया है! (Password changed successfully)" });
    } catch (err) {
      setMsg({ type: "error", text: errText(err) });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile & Identity", hindi: "प्रोफाइल विवरण", icon: User },
    { id: "farming", label: "Farming & Units", hindi: "कृषि एवं इकाइयां", icon: Sliders },
    { id: "alerts", label: "Alerts & Notifications", hindi: "अलर्ट एवं सूचनाएं", icon: Smartphone },
    { id: "security", label: "Security & Password", hindi: "सुरक्षा एवं पासवर्ड", icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-[#cbe4d2] bg-gradient-to-r from-[#e9f7ee] via-[#f5fbf7] to-white p-6 shadow-[0_8px_30px_rgba(23,107,62,.06)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#176b3e] text-white shadow-lg shadow-[#176b3e]/20">
            <Settings size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-[#1a3826]">Farmer Account Settings</h2>
              <span className="rounded-full bg-[#176b3e] px-2.5 py-0.5 text-[10px] font-bold text-white">ACTIVE</span>
            </div>
            <p className="mt-0.5 text-xs text-[#5f7367]">
              अपनी किसान प्रोफाइल, भाषा, कृषि प्राथमिकताएं और पासवर्ड प्रबंधित करें
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {profile?.phone && (
            <div className="rounded-xl border border-[#cfe3d5] bg-white px-3 py-1.5 text-xs font-bold text-[#2d523c]">
              📱 +91 {profile.phone}
            </div>
          )}
        </div>
      </div>

      {msg.text && (
        <div
          className={`flex items-center gap-3 rounded-2xl border p-4 text-xs font-bold ${
            msg.type === "success"
              ? "border-[#b6e5c5] bg-[#edf8f1] text-[#146b3b]"
              : "border-[#f5c6cb] bg-[#fff5f5] text-[#b92c3a]"
          }`}
        >
          {msg.type === "success" ? <Check size={18} /> : <X size={18} />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Main Card with Tabs */}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Navigation Tabs */}
        <div className="flex flex-row gap-2 overflow-x-auto rounded-2xl border border-[#dfe8e1] bg-white p-3 shadow-sm lg:flex-col lg:overflow-x-visible">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => { setTab(t.id); setMsg({ type: "", text: "" }); }}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                  active
                    ? "bg-[#176b3e] text-white shadow-md shadow-[#176b3e]/20"
                    : "text-[#415549] hover:bg-[#f1f6f2] hover:text-[#176b3e]"
                }`}
              >
                <Icon size={18} className={active ? "text-white" : "text-[#718779]"} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold leading-tight">{t.label}</p>
                  <p className={`text-[10px] ${active ? "text-white/80" : "text-[#829288]"}`}>{t.hindi}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-sm sm:p-8">
          {tab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="border-b border-[#edf2ee] pb-4">
                <h3 className="text-base font-extrabold text-[#1a3826]">Personal Information (व्यक्तिगत जानकारी)</h3>
                <p className="text-xs text-[#718078]">Update your farmer identity, native village, and preferred app language.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[#35493e]">Full Name (किसान का पूरा नाम)</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-[#d8e2da] bg-white px-3.5 py-2.5 text-xs outline-none focus:border-[#176b3e] focus:ring-2 focus:ring-[#176b3e]/15"
                    placeholder="e.g. Ramesh Tyagi"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#35493e]">Preferred Language (भाषा)</label>
                  <select
                    value={profileForm.preferred_language}
                    onChange={(e) => setProfileForm({ ...profileForm, preferred_language: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-[#d8e2da] bg-white px-3.5 py-2.5 text-xs outline-none focus:border-[#176b3e] focus:ring-2 focus:ring-[#176b3e]/15"
                  >
                    <option value="hi">हिंदी (Hindi)</option>
                    <option value="en">English</option>
                    <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#35493e]">State (राज्य)</label>
                  <input
                    type="text"
                    required
                    value={profileForm.state}
                    onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-[#d8e2da] bg-white px-3.5 py-2.5 text-xs outline-none focus:border-[#176b3e] focus:ring-2 focus:ring-[#176b3e]/15"
                    placeholder="e.g. Uttar Pradesh"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#35493e]">District (ज़िला)</label>
                  <input
                    type="text"
                    required
                    value={profileForm.district}
                    onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-[#d8e2da] bg-white px-3.5 py-2.5 text-xs outline-none focus:border-[#176b3e] focus:ring-2 focus:ring-[#176b3e]/15"
                    placeholder="e.g. Saharanpur"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#35493e]">Village / Town (गांव / कस्बा)</label>
                  <input
                    type="text"
                    required
                    value={profileForm.village}
                    onChange={(e) => setProfileForm({ ...profileForm, village: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-[#d8e2da] bg-white px-3.5 py-2.5 text-xs outline-none focus:border-[#176b3e] focus:ring-2 focus:ring-[#176b3e]/15"
                    placeholder="e.g. Mohra"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#176b3e] px-6 py-2.5 text-xs font-extrabold text-white shadow-md shadow-[#176b3e]/20 hover:bg-[#125832] disabled:opacity-60"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Save Profile Changes (प्रोफाइल सुरक्षित करें)
                </button>
              </div>
            </form>
          )}

          {tab === "farming" && (
            <form onSubmit={handleSaveFarmingPrefs} className="space-y-5">
              <div className="border-b border-[#edf2ee] pb-4">
                <h3 className="text-base font-extrabold text-[#1a3826]">Farming Preferences (कृषि प्राथमिकताएं)</h3>
                <p className="text-xs text-[#718078]">Customize your default land measurement units, current cropping season, and irrigation methods.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[#35493e]">Default Land Unit (भूमि माप इकाई)</label>
                  <select
                    value={farmingPrefs.unit}
                    onChange={(e) => setFarmingPrefs({ ...farmingPrefs, unit: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-[#d8e2da] bg-white px-3.5 py-2.5 text-xs outline-none focus:border-[#176b3e]"
                  >
                    <option value="acre">Acre (एकड़)</option>
                    <option value="bigha">Bigha (बीघा - पक्का)</option>
                    <option value="hectare">Hectare (हेक्टेयर)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#35493e]">Primary Cropping Season (मुख्य मौसम)</label>
                  <select
                    value={farmingPrefs.season}
                    onChange={(e) => setFarmingPrefs({ ...farmingPrefs, season: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-[#d8e2da] bg-white px-3.5 py-2.5 text-xs outline-none focus:border-[#176b3e]"
                  >
                    <option value="Rabi">रबी (Rabi - Gehun, Sarson, Chana)</option>
                    <option value="Kharif">खरीफ (Kharif - Dhaan, Makka, Bajra)</option>
                    <option value="Zaid">जायद (Zaid - Tarbooz, Moong, Sabzi)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#35493e]">Primary Irrigation Facility (सिंचाई साधन)</label>
                  <select
                    value={farmingPrefs.irrigation}
                    onChange={(e) => setFarmingPrefs({ ...farmingPrefs, irrigation: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-[#d8e2da] bg-white px-3.5 py-2.5 text-xs outline-none focus:border-[#176b3e]"
                  >
                    <option value="Tube-well">ट्यूबवेल / बोरवेल (Tube-well / Motor)</option>
                    <option value="Canal">नहर / माइनर (Canal Irrigation)</option>
                    <option value="Drip">ड्रिप / स्प्रिंकलर (Drip / Micro Irrigation)</option>
                    <option value="Rainfed">वर्षा आधारित (Rainfed / Barani)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#35493e]">Mandi Search Radius (मंडी खोज दायरा)</label>
                  <select
                    value={farmingPrefs.mandiRadius}
                    onChange={(e) => setFarmingPrefs({ ...farmingPrefs, mandiRadius: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-[#d8e2da] bg-white px-3.5 py-2.5 text-xs outline-none focus:border-[#176b3e]"
                  >
                    <option value="15">15 km (आस-पास)</option>
                    <option value="25">25 km (ज़िला केंद्र)</option>
                    <option value="50">50 km (बड़ी मंडियां)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#176b3e] px-6 py-2.5 text-xs font-extrabold text-white shadow-md shadow-[#176b3e]/20 hover:bg-[#125832]"
                >
                  <Check size={16} />
                  Save Farming Preferences (प्राथमिकताएं सुरक्षित करें)
                </button>
              </div>
            </form>
          )}

          {tab === "alerts" && (
            <form onSubmit={handleSaveAlertPrefs} className="space-y-5">
              <div className="border-b border-[#edf2ee] pb-4">
                <h3 className="text-base font-extrabold text-[#1a3826]">Alerts & Notifications (अलर्ट और सूचनाएं)</h3>
                <p className="text-xs text-[#718078]">Choose how and when you receive automated alerts for weather changes, mandi bhav, and procurement queues.</p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between rounded-2xl border border-[#e0ece2] bg-[#f9fbf9] p-4 cursor-pointer hover:bg-[#f2f8f3]">
                  <div>
                    <p className="text-xs font-bold text-[#1f3b2a]">🌦️ Weather Warnings & Advisory (मौसम अलर्ट)</p>
                    <p className="text-[11px] text-[#718078]">Receive immediate SMS warnings for severe rain, frost, or heatwave before spraying.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={alertPrefs.weatherSms}
                    onChange={(e) => setAlertPrefs({ ...alertPrefs, weatherSms: e.target.checked })}
                    className="h-4 w-4 rounded accent-[#176b3e]"
                  />
                </label>

                <label className="flex items-center justify-between rounded-2xl border border-[#e0ece2] bg-[#f9fbf9] p-4 cursor-pointer hover:bg-[#f2f8f3]">
                  <div>
                    <p className="text-xs font-bold text-[#1f3b2a]">📈 Daily Mandi Bhav on WhatsApp (दैनिक मंडी भाव)</p>
                    <p className="text-[11px] text-[#718078]">Get daily morning market prices for your registered crops directly on WhatsApp.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={alertPrefs.mandiWhatsapp}
                    onChange={(e) => setAlertPrefs({ ...alertPrefs, mandiWhatsapp: e.target.checked })}
                    className="h-4 w-4 rounded accent-[#176b3e]"
                  />
                </label>

                <label className="flex items-center justify-between rounded-2xl border border-[#e0ece2] bg-[#f9fbf9] p-4 cursor-pointer hover:bg-[#f2f8f3]">
                  <div>
                    <p className="text-xs font-bold text-[#1f3b2a]">🎫 Slot Token & Live Queue Tracker (टोकन एवं लाइन अलर्ट)</p>
                    <p className="text-[11px] text-[#718078]">Live notification when your token number is called or when 3 farmers are ahead of you.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={alertPrefs.tokenAlerts}
                    onChange={(e) => setAlertPrefs({ ...alertPrefs, tokenAlerts: e.target.checked })}
                    className="h-4 w-4 rounded accent-[#176b3e]"
                  />
                </label>

                <label className="flex items-center justify-between rounded-2xl border border-[#e0ece2] bg-[#f9fbf9] p-4 cursor-pointer hover:bg-[#f2f8f3]">
                  <div>
                    <p className="text-xs font-bold text-[#1f3b2a]">🔔 In-App Sound Notifications (ध्वनि सूचना)</p>
                    <p className="text-[11px] text-[#718078]">Play pleasant chime when a procurement approval or payment is received.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={alertPrefs.appSounds}
                    onChange={(e) => setAlertPrefs({ ...alertPrefs, appSounds: e.target.checked })}
                    className="h-4 w-4 rounded accent-[#176b3e]"
                  />
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#176b3e] px-6 py-2.5 text-xs font-extrabold text-white shadow-md shadow-[#176b3e]/20 hover:bg-[#125832]"
                >
                  <Check size={16} />
                  Save Alert Settings (अलर्ट सेटिंग्स सुरक्षित करें)
                </button>
              </div>
            </form>
          )}

          {tab === "security" && (
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div className="border-b border-[#edf2ee] pb-4">
                <h3 className="text-base font-extrabold text-[#1a3826]">Security & Password (सुरक्षा एवं पासवर्ड)</h3>
                <p className="text-xs text-[#718078]">Update your account password to protect your bookings, crops, and payments.</p>
              </div>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-[#35493e]">Current Password (वर्तमान पासवर्ड)</label>
                  <input
                    type="password"
                    required
                    value={securityForm.current_password}
                    onChange={(e) => setSecurityForm({ ...securityForm, current_password: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-[#d8e2da] bg-white px-3.5 py-2.5 text-xs outline-none focus:border-[#176b3e]"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#35493e]">New Password (नया पासवर्ड)</label>
                  <input
                    type="password"
                    required
                    value={securityForm.new_password}
                    onChange={(e) => setSecurityForm({ ...securityForm, new_password: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-[#d8e2da] bg-white px-3.5 py-2.5 text-xs outline-none focus:border-[#176b3e]"
                    placeholder="At least 6 characters"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#35493e]">Confirm New Password (पुष्टि करें)</label>
                  <input
                    type="password"
                    required
                    value={securityForm.confirm_password}
                    onChange={(e) => setSecurityForm({ ...securityForm, confirm_password: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-[#d8e2da] bg-white px-3.5 py-2.5 text-xs outline-none focus:border-[#176b3e]"
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#176b3e] px-6 py-2.5 text-xs font-extrabold text-white shadow-md shadow-[#176b3e]/20 hover:bg-[#125832] disabled:opacity-60"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                  Update Password (पासवर्ड बदलें)
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

