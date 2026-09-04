import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Leaf,
  LogOut,
  MapPin,
  Sprout,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      const token = localStorage.getItem("krishisetu_access_token");
      if (!token) {
        onLogout?.();
        return;
      }

      try {
        setLoading(true);
        setError("");
        const response = await fetch(`${API_URL}/api/v1/dashboard/farmer`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
          localStorage.removeItem("krishisetu_access_token");
          localStorage.removeItem("krishisetu_role");
          onLogout?.();
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load your dashboard right now.");
        }

        const payload = await response.json();
        if (!cancelled) setData(payload);
      } catch (requestError) {
        if (!cancelled) setError(requestError.message || "Something went wrong.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();
    return () => { cancelled = true; };
  }, [onLogout]);

  const logout = () => {
    localStorage.removeItem("krishisetu_access_token");
    localStorage.removeItem("krishisetu_role");
    onLogout?.();
  };

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#17251b]">
      <header className="border-b border-[#e2e8e2] bg-white">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-10">
          <div>
            <p className="text-base font-extrabold tracking-[-.03em] text-[#176b3e]">KrishiSetu</p>
            <p className="text-[10px] font-mono tracking-[.18em] text-[#7a847c]">FARMER DASHBOARD</p>
          </div>
          <button type="button" onClick={logout} className="inline-flex items-center gap-2 rounded-lg border border-[#d5ded6] px-3.5 py-2 text-xs font-semibold text-[#405046] transition hover:bg-[#f3f7f3]">
            <LogOut size={15} /> Logout
          </button>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="rounded-3xl bg-[#176b3e] px-6 py-7 text-white sm:px-8 sm:py-8">
          <p className="font-mono text-[10px] font-semibold tracking-[.2em] text-white/65">YOUR PROCUREMENT JOURNEY</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">
            {loading ? "Welcome back." : `Welcome, ${data?.farmer_name || "Farmer"}.`}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">Your farms, crops and upcoming harvests in one place.</p>
        </div>

        {loading && (
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl border border-[#e0e7e0] bg-white" />)}
          </div>
        )}

        {!loading && error && (
          <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
            <button type="button" onClick={() => window.location.reload()} className="ml-2 font-semibold underline">Try again</button>
          </div>
        )}

        {!loading && data && (
          <>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric icon={MapPin} label="Farms" value={data.total_farms} />
              <Metric icon={Leaf} label="Crops" value={data.total_crops} />
              <Metric icon={Sprout} label="Growing" value={data.growing_crops} />
              <Metric icon={CheckCircle2} label="Harvest ready" value={data.harvest_ready_crops} />
            </div>

            <div className="mt-10 grid gap-7 lg:grid-cols-[1.15fr_.85fr]">
              <section className="rounded-2xl border border-[#e0e7e0] bg-white p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] tracking-[.18em] text-[#7a847c]">ACTIVE CROPS</p>
                    <h2 className="mt-1 text-xl font-semibold tracking-[-.03em]">What is growing now</h2>
                  </div>
                  <Sprout size={20} className="text-[#176b3e]" />
                </div>
                <div className="mt-5 space-y-3">
                  {data.active_crops?.length ? data.active_crops.map((crop) => (
                    <CropRow key={crop.id} crop={crop} />
                  )) : <EmptyState text="No active crops yet." />}
                </div>
              </section>

              <section className="rounded-2xl border border-[#e0e7e0] bg-white p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] tracking-[.18em] text-[#7a847c]">UPCOMING HARVESTS</p>
                    <h2 className="mt-1 text-xl font-semibold tracking-[-.03em]">Plan ahead</h2>
                  </div>
                  <CalendarDays size={20} className="text-[#176b3e]" />
                </div>
                <div className="mt-5 space-y-3">
                  {data.upcoming_harvests?.length ? data.upcoming_harvests.map((crop) => (
                    <div key={crop.id} className="rounded-xl border border-[#e6ebe6] bg-[#fafcf9] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#18231c]">{crop.crop_name}</p>
                          <p className="mt-1 text-xs text-[#718078]">{crop.farm_name}</p>
                        </div>
                        <Clock3 size={16} className="mt-0.5 text-[#718078]" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-[#176b3e]">{formatDate(crop.expected_harvest_date)}</p>
                    </div>
                  )) : <EmptyState text="No upcoming harvests yet." />}
                </div>
              </section>
            </div>

            <button type="button" className="mt-7 flex w-full items-center justify-between rounded-2xl border border-[#cddbcf] bg-white p-5 text-left transition hover:border-[#176b3e] hover:bg-[#f7fbf6] sm:p-6">
              <div>
                <p className="font-mono text-[10px] tracking-[.18em] text-[#7a847c]">NEXT STEP</p>
                <p className="mt-1 font-semibold">Find a procurement centre</p>
                <p className="mt-1 text-xs text-[#718078]">Discover centres, timings and available slots.</p>
              </div>
              <ArrowRight size={20} className="shrink-0 text-[#176b3e]" />
            </button>
          </>
        )}
      </section>
    </main>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[#e0e7e0] bg-white p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9f5e7] text-[#176b3e]"><Icon size={19} /></span>
        <p className="text-sm font-semibold text-[#526057]">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-[-.04em] text-[#142019]">{value}</p>
    </div>
  );
}

function CropRow({ crop }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[#e6ebe6] bg-[#fafcf9] p-4">
      <div className="min-w-0">
        <p className="truncate font-semibold text-[#18231c]">{crop.crop_name}</p>
        <p className="mt-1 truncate text-xs text-[#718078]">{crop.farm_name} · {crop.expected_quantity} {crop.quantity_unit}</p>
      </div>
      <span className="shrink-0 rounded-full bg-[#e9f5e7] px-2.5 py-1 text-[10px] font-semibold text-[#176b3e]">{statusLabel(crop.status)}</span>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="rounded-xl border border-dashed border-[#d7e0d8] p-5 text-sm text-[#718078]">{text}</div>;
}

export default FarmerDashboard;
