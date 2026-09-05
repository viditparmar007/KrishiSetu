import { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Leaf, MapPin, Tractor, Wheat } from "lucide-react";
import farmImage from "../assets/farm-photo.png";
import cropImage from "../assets/crop-photo.png";
import centreImage from "../assets/centre-photo.png";

function DetailRow({ label, value }) {
  return (
    <div className="rounded-xl border border-[#e1e8e2] bg-[#fbfdfb] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-[#7a857d]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[#17251b]">{value || "Not set"}</p>
    </div>
  );
}

function PageShell({ title, subtitle, icon: Icon, onBack, children }) {
  return (
    <main className="min-h-screen bg-[#f4f7f2] text-[#17251b]">
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
    </main>
  );
}

function FarmsPage({ farms, crops, onBack }) {
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const selectedFarm = farms.find((farm) => String(farm.id) === String(selectedFarmId));
  const farmCrops = selectedFarm ? crops.filter((crop) => String(crop.farm_id) === String(selectedFarm.id)) : [];

  if (selectedFarm) {
    return (
      <PageShell title={selectedFarm.farm_name || "Farm details"} subtitle="Complete details of your selected farm" icon={Tractor} onBack={() => setSelectedFarmId(null)}>
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
    <PageShell title="My Farms" subtitle="Manage your farms and open any farm to see all its details." icon={Tractor} onBack={onBack}>
      {farms.length ? <div className="grid gap-4 md:grid-cols-2">{farms.map((farm) => <button key={farm.id} type="button" onClick={() => setSelectedFarmId(farm.id)} className="group overflow-hidden rounded-2xl border border-[#dce6de] bg-white text-left transition hover:-translate-y-0.5 hover:border-[#176b3e] hover:shadow-md"><img src={farmImage} alt="" className="h-44 w-full object-cover" /><div className="p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-extrabold">{farm.farm_name || "My Farm"}</h2><p className="mt-1 text-sm text-[#68756c]">{farm.village}, {farm.district}, {farm.state}</p></div><ChevronRight className="mt-1 text-[#176b3e]" size={20}/></div><div className="mt-4 grid grid-cols-2 gap-2 text-xs"><span className="rounded-lg bg-[#eef7ef] px-3 py-2 font-semibold text-[#176b3e]">{farm.area ?? "-"} {farm.area_unit || "acre"}</span><span className="rounded-lg bg-[#f5f8f5] px-3 py-2 font-semibold text-[#526158]">{crops.filter((crop) => String(crop.farm_id) === String(farm.id)).length} crops</span></div></div></button>)}</div> : <Empty title="No farms added yet" text="Add your first farm from the dashboard to see its complete details here." />}
    </PageShell>
  );
}

function CropMini({ crop }) {
  return <div className="rounded-xl border border-[#e1e8e2] bg-[#fbfdfb] p-4"><div className="flex items-center gap-3"><img src={cropImage} alt="" className="h-12 w-12 rounded-lg object-cover" /><div><p className="font-bold">{crop.crop_name}</p><p className="text-xs text-[#718078]">{crop.season || "Season not set"}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><DetailRow label="Status" value={statusLabel(crop.status)} /><DetailRow label="Expected quantity" value={`${crop.expected_quantity ?? "-"} ${crop.quantity_unit || "quintal"}`} /></div></div>;
}

function CropsPage({ crops, farms, onBack }) {
  const [selectedCropId, setSelectedCropId] = useState(null);
  const selectedCrop = crops.find((crop) => String(crop.id) === String(selectedCropId));
  const selectedFarm = selectedCrop ? farms.find((farm) => String(farm.id) === String(selectedCrop.farm_id)) : null;

  if (selectedCrop) {
    return (
      <PageShell title={selectedCrop.crop_name || "Crop details"} subtitle="Complete details of your selected crop" icon={Wheat} onBack={() => setSelectedCropId(null)}>
        <div className="grid gap-5 lg:grid-cols-[.7fr_1.3fr]">
          <div className="overflow-hidden rounded-2xl border border-[#dce6de] bg-white"><img src={cropImage} alt="Crop" className="h-64 w-full object-cover" /><div className="p-5"><p className="text-xl font-extrabold text-[#176b3e]">{selectedCrop.crop_name}</p><p className="mt-1 text-sm text-[#68756c]">Farm: {selectedFarm?.farm_name || "Not linked"}</p></div></div>
          <div className="grid gap-3 sm:grid-cols-2"><DetailRow label="Crop" value={selectedCrop.crop_name} /><DetailRow label="Farm" value={selectedFarm?.farm_name} /><DetailRow label="Season" value={selectedCrop.season} /><DetailRow label="Status" value={statusLabel(selectedCrop.status)} /><DetailRow label="Sowing date" value={selectedCrop.sowing_date} /><DetailRow label="Expected harvest" value={selectedCrop.expected_harvest_date} /><DetailRow label="Expected quantity" value={`${selectedCrop.expected_quantity ?? "-"} ${selectedCrop.quantity_unit || "quintal"}`} /></div>
        </div>
      </PageShell>
    );
  }

  return <PageShell title="My Crops" subtitle="See every crop, then open it for complete farm and crop details." icon={Wheat} onBack={onBack}>{crops.length ? <div className="grid gap-4 md:grid-cols-2">{crops.map((crop) => { const farm = farms.find((item) => String(item.id) === String(crop.farm_id)); return <button key={crop.id} type="button" onClick={() => setSelectedCropId(crop.id)} className="flex items-center gap-4 rounded-2xl border border-[#dce6de] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#176b3e] hover:shadow-md"><img src={cropImage} alt="" className="h-20 w-20 rounded-xl object-cover" /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><div><h2 className="font-extrabold">{crop.crop_name}</h2><p className="mt-1 text-xs text-[#68756c]">{farm?.farm_name || "Farm not linked"}</p></div><ChevronRight className="shrink-0 text-[#176b3e]" size={19}/></div><div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold"><span className="rounded-full bg-[#eef7ef] px-3 py-1 text-[#176b3e]">{statusLabel(crop.status)}</span><span className="rounded-full bg-[#f5f8f5] px-3 py-1 text-[#526158]">{crop.season || "Season not set"}</span></div></div></button>; })}</div> : <Empty title="No crops added yet" text="Add a crop from the dashboard after creating a farm." />}</PageShell>;
}

function CentrePage({ onBack }) {
  return <PageShell title="Find Centre" subtitle="Your procurement-centre discovery page is ready for centre data and booking integration." icon={MapPin} onBack={onBack}><div className="overflow-hidden rounded-2xl border border-[#dce6de] bg-white"><div className="relative h-72"><img src={centreImage} alt="Procurement centre" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" /><div className="absolute bottom-6 left-6 text-white"><p className="text-xs font-semibold uppercase tracking-[.16em] text-white/70">PROCUREMENT</p><h2 className="mt-1 text-2xl font-extrabold">Find a procurement centre</h2><p className="mt-1 max-w-xl text-sm text-white/85">Centre listing and booking can plug into this page without changing your farm and crop data.</p></div></div><div className="grid gap-3 p-5 sm:grid-cols-3"><DetailRow label="Your location" value="Use your saved farm location" /><DetailRow label="Next step" value="Choose a nearby centre" /><DetailRow label="Booking" value="Select an available slot" /></div></div></PageShell>;
}

function Empty({ title, text }) {
  return <div className="rounded-2xl border border-dashed border-[#cfdacf] bg-white p-10 text-center"><Leaf className="mx-auto text-[#176b3e]" size={30}/><h2 className="mt-3 font-extrabold">{title}</h2><p className="mx-auto mt-1 max-w-md text-sm text-[#68756c]">{text}</p></div>;
}

function statusLabel(status) {
  return String(status || "").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function FarmerSectionPage({ section, farms, crops, onBack }) {
  const Component = useMemo(() => ({ "My Farms": FarmsPage, "My Crops": CropsPage, "Find Centre": CentrePage }[section] || FarmsPage), [section]);
  return <Component farms={farms} crops={crops} onBack={onBack} />;
}
