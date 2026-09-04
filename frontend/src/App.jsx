import {
  ArrowRight, CalendarDays, ChartNoAxesCombined, CheckCircle2, Clock3,
  IndianRupee, Leaf, MapPin, Search, ShieldCheck, Star, UserRound,
} from "lucide-react";
import PublicLayout from "./layouts/PublicLayout";

const journey = [
  ["1", "Choose Centre", "Find a suitable procurement centre", MapPin, true],
  ["2", "Plan Your Visit", "Pick a convenient date & slot", CalendarDays, true],
  ["3", "Reach & Check-in", "Get token and join the queue", CheckCircle2, false],
  ["4", "Track Your Queue", "See live status & estimated time", Clock3, false],
  ["5", "Complete & Get Paid", "Quality check, weighment & payment", IndianRupee, false],
];

const steps = [
  ["Discover", "Find procurement information and suitable centres without searching everywhere.", Search],
  ["Plan", "Prepare your visit with the information you need before travelling to the centre.", CalendarDays],
  ["Track", "Understand what is happening next and keep your journey visible from start to finish.", ChartNoAxesCombined],
];

const stats = [
  ["10K+", "Farmers", "Onboarded", UserRound],
  ["250+", "Procurement", "Centres", MapPin],
  ["1.2L+", "Quintals", "Procured", Leaf],
  ["₹320Cr+", "Payments", "Processed", IndianRupee],
  ["4.8/5", "Farmer", "Satisfaction", Star],
];

function App() {
  return (
    <PublicLayout>
      <main>
        <section id="home" className="relative overflow-hidden bg-white">
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#eef8e9] to-transparent" />
          <div className="relative mx-auto grid min-h-[620px] w-full max-w-7xl items-center gap-10 px-6 py-12 sm:px-8 lg:grid-cols-[1fr_1fr] lg:px-10 lg:py-14">
            <div className="relative z-10 max-w-2xl lg:pr-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#edf8e9] px-4 py-2 text-sm font-semibold text-[#256d3e]"><Leaf size={15} />Digital Procurement, Made Simple</div>
              <h1 className="mt-7 text-[clamp(3.2rem,6vw,5.5rem)] font-bold leading-[.98] tracking-[-0.045em] text-[#101712]">From farm to payment,<span className="block text-[#176b3e]">without the waiting.</span></h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-[#68736b] sm:text-lg">KrishiSetu helps farmers discover procurement centres, plan their visit, manage queues, and get paid transparently, all in one place.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#how-it-works" className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#176b3e] px-7 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#115832]">Get Started <ArrowRight size={18} /></a>
                <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#c9d5cd] bg-white px-7 py-3.5 text-sm font-bold text-[#23402e] transition hover:bg-[#f4f8f4]">Farmer Login <UserRound size={17} /></button>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm text-[#667168]">
                <span className="inline-flex items-center gap-2"><ShieldCheck size={17} className="text-[#23804b]" />Secure</span>
                <span className="inline-flex items-center gap-2"><Clock3 size={17} className="text-[#23804b]" />Real-time Updates</span>
                <span className="inline-flex items-center gap-2"><IndianRupee size={17} className="text-[#23804b]" />Transparent Payments</span>
              </div>
            </div>

            <div className="relative z-10 mx-auto flex w-full max-w-xl items-end justify-center lg:min-h-[600px]">
              <div className="absolute inset-x-4 bottom-4 top-16 rounded-full bg-[#e8f6e5] blur-3xl" />
              <img src="/farmer.svg" alt="Farmer using KrishiSetu on a mobile phone" className="relative z-10 h-[430px] w-auto object-contain sm:h-[500px] lg:h-[560px]" />
              <div className="absolute bottom-7 left-0 z-20 flex max-w-[270px] items-center gap-3 rounded-2xl border border-[#e0e9e1] bg-white px-4 py-3 shadow-[0_14px_40px_rgba(23,107,62,.12)]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e9f6e7] text-[#23804b]"><Leaf size={22} /></span>
                <span className="text-sm font-bold leading-5 text-[#193021]">Empowering Farmers,<br />Strengthening Bharat</span>
              </div>
            </div>

            <div className="relative z-20 lg:absolute lg:right-0 lg:top-1/2 lg:w-[380px] lg:-translate-y-1/2 xl:right-2">
              <div className="rounded-3xl border border-[#e0e7e1] bg-white p-4 shadow-[0_22px_65px_rgba(26,67,41,.13)] sm:p-5">
                <div className="flex items-center justify-between border-b border-[#e5ebe6] pb-4"><p className="text-lg font-bold text-[#121914]">Procurement Journey</p><span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf8ed] px-3 py-1 text-xs font-semibold text-[#32834c]"><span className="h-2 w-2 rounded-full bg-[#4ca45e]" />Live</span></div>
                <div className="mt-3">{journey.map(([number, title, text, Icon, done]) => <div key={number} className="flex gap-3 border-b border-[#e7ece8] py-3 last:border-0"><div className="flex w-9 shrink-0 justify-center"><span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${done ? "bg-[#e6f4e4] text-[#27733f]" : "bg-[#f2f5f2] text-[#626b64]"}`}>{number}</span></div><div className="min-w-0 flex-1"><p className="text-sm font-bold text-[#1a211c]">{title}</p><p className="mt-0.5 text-xs leading-5 text-[#717a73]">{text}</p></div><Icon size={17} className={`mt-1 shrink-0 ${done ? "text-[#27733f]" : "text-[#77a181]"}`} /></div>)}</div>
                <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#176b3e] px-4 py-4 text-white"><div><p className="text-xs font-medium text-[#cde8d4]">Your Status</p><p className="mt-1 text-sm font-bold">Not Booked Yet</p><p className="mt-0.5 text-xs text-[#dceee1]">Book your slot to get started</p></div><span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"><ArrowRight size={19} /></span></div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-t border-[#edf0ed] bg-white py-14 sm:py-16">
          <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-10">
            <div className="text-center"><p className="text-sm font-bold uppercase tracking-[0.12em] text-[#51a451]">How It Works</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-[#111713] sm:text-4xl">Everything starts with a simpler journey</h2></div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">{steps.map(([title, text, Icon], index) => <div key={title} className="relative flex min-h-[176px] flex-col rounded-2xl border border-[#e2e9e3] bg-white p-6 shadow-[0_6px_25px_rgba(20,60,35,.04)]"><div className="flex items-start gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#176b3e] text-white"><Icon size={28} /></span><div><h3 className="text-lg font-bold text-[#141a15]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#68736b]">{text}</p></div></div><a href="#home" className="mt-auto pt-4 text-sm font-bold text-[#276f40]">Learn more <ArrowRight size={15} className="ml-1 inline" /></a>{index < 2 && <span className="pointer-events-none absolute -right-8 top-1/2 hidden text-3xl text-[#9bc8a2] md:block">→</span>}</div>)}</div>
            <div className="mt-9 grid overflow-hidden rounded-2xl border border-[#e2e9e3] bg-[#f9fcf8] sm:grid-cols-5">{stats.map(([number, first, second, Icon], index) => <div key={number} className={`flex items-center gap-3 px-5 py-5 sm:justify-center ${index < 4 ? "border-b border-[#e2e9e3] sm:border-b-0 sm:border-r" : ""}`}><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8f5e5] text-[#5aa85b]"><Icon size={20} /></span><div><p className="text-xl font-bold text-[#132018]">{number}</p><p className="text-xs leading-4 text-[#667168]">{first}<br />{second}</p></div></div>)}</div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}

export default App;
