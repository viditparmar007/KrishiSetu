import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  FileText,
  House,
  Leaf,
  LogOut,
  MapPin,
  Menu,
  Search,
  Sprout,
  Tractor,
  UserRound,
  Users,
  Wheat,
} from "lucide-react";
import farmImage from "../assets/farm-photo.png";
import cropImage from "../assets/crop-photo.png";
import centreImage from "../assets/centre-photo.png";
import supportImage from "../assets/help-photo.png";

function DetailRow({ label, value }) {
  return (
    <div className="rounded-xl border border-[#e1e8e2] bg-[#fbfdfb] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-[#7a857d]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[#17251b]">{value || "Not set"}</p>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, badge, collapsed, onClick }) {
  return (
    <button
      type="button"
      title={collapsed ? label : undefined}
      onClick={onClick}
      className={`flex w-full items-center rounded-xl py-3 text-sm font-medium transition ${
        collapsed ? "justify-center px-2" : "gap-4 px-4"
      } ${active ? "bg-[#eaf5ec] font-bold text-[#176b3e]" : "text-[#33453a] hover:bg-[#f3f7f3]"}`}
    >
      <Icon size={19} />
      {!collapsed && <span className="flex-1 text-left">{label}</span>}
      {!collapsed && badge && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d9363e] px-1 text-[10px] font-bold text-white">{badge}</span>}
    </button>
  );
}

function PageShell({ title, subtitle, icon: Icon, onBack, section, onNavigate, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const firstName = "V";

  const navigate = (label) => {
    if (label === "Dashboard") {
      onBack();
      return;
    }
    if (["My Farms", "My Crops", "Find Centre"].includes(label)) {
      onNavigate?.(label);
      return;
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f7f2] text-[#17251b]">
      <div className="flex min-h-screen">
        <aside className={`${collapsed ? "w-[76px]" : "w-[238px]"} hidden shrink-0 border-r border-[#e1e8e2] bg-white transition-[width] duration-200 lg:flex lg:flex-col`}>
          <div className={`${collapsed ? "px-3" : "px-6"} pb-7 pt-7`}>
            <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f5e9] text-[#176b3e]"><Leaf size={25} strokeWidth={2.2} /></div>
              {!collapsed && <div><p className="text-xl font-extrabold tracking-[-.05em] text-[#176b3e]">KrishiSetu</p><p className="text-[10px] text-[#758078]">Bridging Farmers to Opportunities</p></div>}
            </div>
          </div>

          <nav className="space-y-1 px-3">
            <NavItem icon={House} label="Dashboard" active={false} collapsed={collapsed} onClick={() => navigate("Dashboard")} />
            <NavItem icon={Tractor} label="My Farms" active={section === "My Farms"} collapsed={collapsed} onClick={() => navigate("My Farms")} />
            <NavItem icon={Wheat} label="My Crops" active={section === "My Crops"} collapsed={collapsed} onClick={() => navigate("My Crops")} />
            <NavItem icon={MapPin} label="Find Centre" active={section === "Find Centre"} collapsed={collapsed} onClick={() => navigate("Find Centre")} />
            <NavItem icon={CalendarDays} label="My Bookings" collapsed={collapsed} onClick={() => {}} />
            <NavItem icon={Users} label="Live Queue" collapsed={collapsed} onClick={() => {}} />
            <NavItem icon={FileText} label="Procurement" collapsed={collapsed} onClick={() => {}} />
            <NavItem icon={FileText} label="Payments" collapsed={collapsed} onClick={() => {}} />
            <NavItem icon={Bell} label="Notifications" badge="3" collapsed={collapsed} onClick={() => {}} />
            <NavItem icon={Sprout} label="Advisory" collapsed={collapsed} onClick={() => {}} />
            <NavItem icon={FileText} label="Schemes" collapsed={collapsed} onClick={() => {}} />
            <NavItem icon={UserRound} label="Profile" collapsed={collapsed} onClick={() => {}} />
          </nav>

          {!collapsed && (
            <div className="mt-auto p-4">
              <div className="overflow-hidden rounded-2xl bg-[#edf8f0] p-4">
                <p className="text-sm font-bold text-[#176b3e]">Need Help?</p>
                <p className="mt-1 text-xs text-[#526158]">Call our support</p>
                <p className="mt-1 text-lg font-extrabold text-[#176b3e]">1800-123-4567</p>
                <img src={supportImage} alt="" className="mt-4 h-16 w-full rounded-xl object-cover" />
                <p className="mt-3 text-sm font-bold text-[#176b3e]">Kisan ka Saathi</p>
                <p className="text-xs font-semibold text-[#526158]">Har Kadam Par</p>
              </div>
            </div>
          )}
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-[#e1e8e2] bg-white/95 backdrop-blur">
            <div className="flex h-[72px] items-center gap-4 px-5 sm:px-7 xl:px-8">
              <button
                type="button"
                onClick={() => setCollapsed((value) => !value)}
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#33453a] hover:bg-[#f1f5f1] lg:flex"
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Menu size={22} />
              </button>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f5e9] text-[#176b3e] lg:hidden"><Leaf size={22} /></div>
              <div className="relative max-w-2xl flex-1">
                <Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#536158]" />
                <input placeholder="Search centres, crops, schemes..." className="w-full rounded-full bg-[#f0f4f0] py-3 pl-11 pr-4 text-sm text-[#25352a] outline-none placeholder:text-[#7b867f] focus:ring-2 focus:ring-[#176b3e]/15" />
              </div>
              <button type="button" className="relative rounded-full p-2.5 text-[#33453a] hover:bg-[#f1f5f1]" aria-label="Notifications"><Bell size={21} /><span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#d9363e] text-[9px] font-bold text-white">3</span></button>
              <span className="h-8 w-px bg-[#e2e8e2]" />
              <button type="button" className="hidden items-center gap-3 sm:flex" aria-label="Profile">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#176b3e] text-lg font-bold text-white">{firstName}</span>
                <span className="text-left"><span className="block text-sm font-bold">Vidit Parmar</span><span className="block text-xs text-[#718078]">Farmer</span></span>
                <ChevronDown size={17} className="text-[#4d5b53]" />
              </button>
              <button type="button" onClick={onBack} className="rounded-xl border border-[#d6e0d7] p-2.5 text-[#526158] hover:bg-[#f4f7f4] sm:hidden" aria-label="Back"><LogOut size={17} /></button>
            </div>
          </header>

          <section className="mx-auto w-full max-w-[1280px] px-5 py-6 sm:px-7 xl:px-8 xl:py-8">
            <button type="button" onClick={onBack} className="mb-5 inline-flex items-center gap-2 rounded-xl border border-[#d8e3da] bg-white px-4 py-2.5 text-sm font-bold text-[#176b3e] hover:bg-[#f2f7f3]">
              <ArrowLeft size={17} /> Back to Dashboard
            </button>
            <div className="mb-6 rounded-[22px] border border-[#dce6de] bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f5e9] text-[#176b3e]"><Icon size={25} /></div>
                <div><h1 className="text-2xl font-extrabold tracking-[-.03em] sm:text-3xl">{title}</h1><p className="mt-1 text-sm text-[#68756c]">{subtitle}</p></div>
              </div>
            </div>
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}

function FarmsPage({ farms, crops, onBack, onNavigate }) {
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const selectedFarm = farms.find((farm) => String(farm.id) === String(selectedFarmId));
  const farmCrops = selectedFarm ? crops.filter((crop) => String(crop.farm_id) === String(selectedFarm.id)) : [];

  if (selectedFarm) {
    return (
      <PageShell title={selectedFarm.farm_name || "Farm details"} subtitle="Complete details of your selected farm" icon={Tractor} section="My Farms" onBack={onBack} onNavigate={onNavigate}>
        <button type="button" onClick={() => setSelectedFarmId(null)} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#176b3e] hover:underline"><ArrowLeft size={16} /> Back to My Farms</button>
        <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <div className="overflow-hidden rounded-2xl border border-[#dce6de] bg-white">
            <img src={farmImage} alt="Farm" className="h-56 w-full object-cover" />
            <div className="p-5"><p className="text-lg font-extrabold text-[#176b3e]">{selectedFarm.farm_name || "My Farm"}</p><p className="mt-1 text-sm text-[#68756c]">{selectedFarm.village}, {selectedFarm.district}, {selectedFarm.state}</p></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Farm name" value={selectedFarm.farm_name} />
            <DetailRow label="Area" value={`${selectedFarm.area ?? "Not set"} ${selectedFarm.area_unit || "acre"}`} />
            <DetailRow label="State" value={selectedFarm.state} />
            <DetailRow label="District" value={selectedFarm.district} />
            <DetailRow label="Village" value={selectedFarm.village} />
            <DetailRow label="Irrigation" value={selectedFarm.irrigation_type} />
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-[#dce6de] bg-white p-5">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold">Crops on this farm</h2><p className="text-xs text-[#718078]">Every crop linked to this farm appears here.</p></div><Wheat className="text-[#176b3e]" size={23}/></div>
          {farmCrops.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{farmCrops.map((crop) => <CropMini key={crop.id} crop={crop} />)}</div> : <p className="mt-4 rounded-xl bg-[#f5f8f5] p-5 text-sm text-[#68756c]">No crops have been added to this farm yet.</p>}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="My Farms" subtitle="Manage your farms and open any farm to see all its details." icon={Tractor} section="My Farms" onBack={onBack} onNavigate={onNavigate}>
      {farms.length ? <div className="grid gap-4 md:grid-cols-2">{farms.map((farm) => <button key={farm.id} type="button" onClick={() => setSelectedFarmId(farm.id)} className="group overflow-hidden rounded-2xl border border-[#dce6de] bg-white text-left transition hover:-translate-y-0.5 hover:border-[#176b3e] hover:shadow-md"><img src={farmImage} alt="" className="h-44 w-full object-cover" /><div className="p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-extrabold">{farm.farm_name || "My Farm"}</h2><p className="mt-1 text-sm text-[#68756c]">{farm.village}, {farm.district}, {farm.state}</p></div><ChevronRight className="mt-1 text-[#176b3e]" size={20}/></div><div className="mt-4 grid grid-cols-2 gap-2 text-xs"><span className="rounded-lg bg-[#eef7ef] px-3 py-2 font-semibold text-[#176b3e]">{farm.area ?? "-"} {farm.area_unit || "acre"}</span><span className="rounded-lg bg-[#f5f8f5] px-3 py-2 font-semibold text-[#526158]">{crops.filter((crop) => String(crop.farm_id) === String(farm.id)).length} crops</span></div></div></button>)}</div> : <Empty title="No farms added yet" text="Add your first farm from the dashboard to see its complete details here." />}
    </PageShell>
  );
}

function CropMini({ crop }) {
  return <div className="rounded-xl border border-[#e1e8e2] bg-[#fbfdfb] p-4"><div className="flex items-center gap-3"><img src={cropImage} alt="" className="h-12 w-12 rounded-lg object-cover" /><div><p className="font-bold">{crop.crop_name}</p><p className="text-xs text-[#718078]">{crop.season || "Season not set"}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><DetailRow label="Status" value={statusLabel(crop.status)} /><DetailRow label="Expected quantity" value={`${crop.expected_quantity ?? "-"} ${crop.quantity_unit || "quintal"}`} /></div></div>;
}

function CropsPage({ crops, farms, onBack, onNavigate }) {
  const [selectedCropId, setSelectedCropId] = useState(null);
  const selectedCrop = crops.find((crop) => String(crop.id) === String(selectedCropId));
  const selectedFarm = selectedCrop ? farms.find((farm) => String(farm.id) === String(selectedCrop.farm_id)) : null;

  if (selectedCrop) {
    return (
      <PageShell title={selectedCrop.crop_name || "Crop details"} subtitle="Complete details of your selected crop" icon={Wheat} section="My Crops" onBack={onBack} onNavigate={onNavigate}>
        <button type="button" onClick={() => setSelectedCropId(null)} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#176b3e] hover:underline"><ArrowLeft size={16} /> Back to My Crops</button>
        <div className="grid gap-5 lg:grid-cols-[.7fr_1.3fr]">
          <div className="overflow-hidden rounded-2xl border border-[#dce6de] bg-white"><img src={cropImage} alt="Crop" className="h-64 w-full object-cover" /><div className="p-5"><p className="text-xl font-extrabold text-[#176b3e]">{selectedCrop.crop_name}</p><p className="mt-1 text-sm text-[#68756c]">Farm: {selectedFarm?.farm_name || "Not linked"}</p></div></div>
          <div className="grid gap-3 sm:grid-cols-2"><DetailRow label="Crop" value={selectedCrop.crop_name} /><DetailRow label="Farm" value={selectedFarm?.farm_name} /><DetailRow label="Season" value={selectedCrop.season} /><DetailRow label="Status" value={statusLabel(selectedCrop.status)} /><DetailRow label="Sowing date" value={selectedCrop.sowing_date} /><DetailRow label="Expected harvest" value={selectedCrop.expected_harvest_date} /><DetailRow label="Expected quantity" value={`${selectedCrop.expected_quantity ?? "-"} ${selectedCrop.quantity_unit || "quintal"}`} /></div>
        </div>
      </PageShell>
    );
  }

  return <PageShell title="My Crops" subtitle="See every crop, then open it for complete farm and crop details." icon={Wheat} section="My Crops" onBack={onBack} onNavigate={onNavigate}>{crops.length ? <div className="grid gap-4 md:grid-cols-2">{crops.map((crop) => { const farm = farms.find((item) => String(item.id) === String(crop.farm_id)); return <button key={crop.id} type="button" onClick={() => setSelectedCropId(crop.id)} className="flex items-center gap-4 rounded-2xl border border-[#dce6de] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#176b3e] hover:shadow-md"><img src={cropImage} alt="" className="h-20 w-20 rounded-xl object-cover" /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><div><h2 className="font-extrabold">{crop.crop_name}</h2><p className="mt-1 text-xs text-[#68756c]">{farm?.farm_name || "Farm not linked"}</p></div><ChevronRight className="shrink-0 text-[#176b3e]" size={19}/></div><div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold"><span className="rounded-full bg-[#eef7ef] px-3 py-1 text-[#176b3e]">{statusLabel(crop.status)}</span><span className="rounded-full bg-[#f5f8f5] px-3 py-1 text-[#526158]">{crop.season || "Season not set"}</span></div></div></button>; })}</div> : <Empty title="No crops added yet" text="Add a crop from the dashboard after creating a farm." />}</PageShell>;
}

function CentrePage({ onBack, onNavigate }) {
  return <PageShell title="Find Centre" subtitle="Your procurement-centre discovery page is ready for centre data and booking integration." icon={MapPin} section="Find Centre" onBack={onBack} onNavigate={onNavigate}><div className="overflow-hidden rounded-2xl border border-[#dce6de] bg-white"><div className="relative h-72"><img src={centreImage} alt="Procurement centre" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" /><div className="absolute bottom-6 left-6 text-white"><p className="text-xs font-semibold uppercase tracking-[.16em] text-white/70">PROCUREMENT</p><h2 className="mt-1 text-2xl font-extrabold">Find a procurement centre</h2><p className="mt-1 max-w-xl text-sm text-white/85">Centre listing and booking can plug into this page without changing your farm and crop data.</p></div></div><div className="grid gap-3 p-5 sm:grid-cols-3"><DetailRow label="Your location" value="Use your saved farm location" /><DetailRow label="Next step" value="Choose a nearby centre" /><DetailRow label="Booking" value="Select an available slot" /></div></div></PageShell>;
}

function Empty({ title, text }) {
  return <div className="rounded-2xl border border-dashed border-[#cfdacf] bg-white p-10 text-center"><Leaf className="mx-auto text-[#176b3e]" size={30}/><h2 className="mt-3 font-extrabold">{title}</h2><p className="mx-auto mt-1 max-w-md text-sm text-[#68756c]">{text}</p></div>;
}

function statusLabel(status) {
  return String(status || "").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function FarmerSectionPage({ section, farms, crops, onBack }) {
  const [activeSection, setActiveSection] = useState(section);
  const Component = useMemo(() => ({ "My Farms": FarmsPage, "My Crops": CropsPage, "Find Centre": CentrePage }[activeSection] || FarmsPage), [activeSection]);
  return <Component farms={farms} crops={crops} onBack={onBack} onNavigate={setActiveSection} />;
}
