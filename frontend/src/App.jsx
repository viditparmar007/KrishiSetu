import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDownRight, ArrowRight, CalendarDays, ChartNoAxesCombined,
  CheckCircle2, Clock3, IndianRupee, Leaf, MapPin, Search, ShieldCheck,
  Star, UserRound,
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

const scenes = [
  {
    kicker: "01 / DISCOVER",
    title: "Find the right centre.",
    text: "Start with a clear view of procurement centres around you, then move through the journey without hunting for information.",
    image: "/scroll-farm.svg",
    label: "Nearby procurement centre",
  },
  {
    kicker: "02 / PLAN",
    title: "Turn a trip into a plan.",
    text: "Choose a date and slot before you travel. Your visit becomes a visible step instead of another uncertain wait.",
    image: "/scroll-centre.svg",
    label: "Visit slot confirmed",
  },
  {
    kicker: "03 / TRACK",
    title: "Know what happens next.",
    text: "From check-in to queue progress, the important moments stay visible so farmers are never left guessing.",
    image: "/scroll-queue.svg",
    label: "Queue moving · Token 18",
  },
  {
    kicker: "04 / PAYMENT",
    title: "Finish with clarity.",
    text: "Quality, weighment and payment become part of one transparent journey, from the first tap to the final receipt.",
    image: "/scroll-payment.svg",
    label: "Payment processed",
  },
];

function ScrollExperience() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  const [hoverCycle, setHoverCycle] = useState(0);

  const imageScale = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [1, 1.08, 1, 1.08, 1]);
  const imageX = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [0, -18, 16, -12, 0]);
  const imageY = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [0, 18, -12, 14, 0]);
  const cardY = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [70, -10, 30, -12, 70]);
  const cardRotate = useTransform(scrollYProgress, [0, 0.5, 1], [-2, 1.5, -2]);
  const blur = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8, 1], [0, 5, 0, 6, 0]);

  return (
    <section ref={ref} id="story" className="relative h-[420vh] bg-[#0b120d] text-white">
      <div className="sticky top-0 flex h-screen min-h-[680px] items-center overflow-hidden">
        <motion.div className="absolute inset-0" style={{ filter: blur.to((value) => `blur(${value}px)`) }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_35%,rgba(90,168,91,.22),transparent_32%),radial-gradient(circle_at_15%_80%,rgba(22,107,62,.2),transparent_30%)]" />
          <motion.div className="absolute inset-[-4%] opacity-40" style={{ scale: imageScale, x: imageX, y: imageY }}>
            <img src={scenes[active].image} alt="" className="h-full w-full object-cover" />
          </motion.div>
          <div className="absolute inset-0 bg-[#071009]/70" />
        </motion.div>

        <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center px-6 sm:px-8 lg:px-10">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div className="max-w-xl">
              <motion.p
                key={`kicker-${active}`}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-xs font-semibold tracking-[.22em] text-[#a8d7ae]"
              >
                {scenes[active].kicker}
              </motion.p>
              <motion.h2
                key={`title-${active}`}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="mt-5 max-w-2xl text-[clamp(3rem,7vw,6.6rem)] font-semibold leading-[.92] tracking-[-.055em]"
              >
                {scenes[active].title}
              </motion.h2>
              <motion.p
                key={`text-${active}`}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.5 }}
                className="mt-7 max-w-lg text-base leading-7 text-white/70 sm:text-lg"
              >
                {scenes[active].text}
              </motion.p>
              <div className="mt-9 flex items-center gap-5">
                <span className="font-mono text-xs text-white/45">SCROLL TO EXPLORE</span>
                <motion.span animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-white/70">
                  <ArrowDownRight size={20} />
                </motion.span>
              </div>
            </div>

            <div className="relative mx-auto h-[510px] w-full max-w-[720px]">
              <motion.div
                className="absolute inset-6 overflow-hidden rounded-[2rem] border border-white/15 bg-black/20 shadow-[0_40px_100px_rgba(0,0,0,.4)]"
                style={{ scale: imageScale, x: imageX, y: imageY }}
                onMouseEnter={() => setHoverCycle((value) => value + 1)}
              >
                <motion.img
                  key={`${active}-${hoverCycle}`}
                  src={hoverCycle % 2 === 0 ? scenes[active].image : scenes[(active + 1) % scenes.length].image}
                  alt=""
                  className="h-full w-full object-cover"
                  initial={{ opacity: 0, scale: 1.06 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7 }}
                  onMouseLeave={() => setHoverCycle((value) => value + 1)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
                <motion.div className="absolute bottom-7 left-7 right-7" style={{ y: cardY, rotate: cardRotate }}>
                  <div className="max-w-[340px] rounded-2xl border border-white/15 bg-black/55 p-5 backdrop-blur-xl">
                    <p className="font-mono text-[10px] uppercase tracking-[.2em] text-white/45">Live state</p>
                    <p className="mt-2 text-lg font-medium">{scenes[active].label}</p>
                  </div>
                </motion.div>
              </motion.div>

              <div className="absolute -right-1 top-2 hidden rounded-full border border-white/15 bg-white/10 px-4 py-2 font-mono text-[10px] tracking-[.16em] text-white/55 backdrop-blur-md sm:block">
                HOVER IMAGE
              </div>
              <div className="absolute bottom-2 left-0 flex gap-2">
                {scenes.map((scene, index) => (
                  <button
                    key={scene.kicker}
                    type="button"
                    aria-label={`Go to ${scene.title}`}
                    onClick={() => setActive(index)}
                    className={`h-1.5 rounded-full transition-all ${index === active ? "w-12 bg-white" : "w-5 bg-white/25 hover:bg-white/50"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 font-mono text-[10px] tracking-[.28em] text-white/35">KRISHISETU / {String(active + 1).padStart(2, "0")}</div>
        <div className="absolute right-5 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex">
          <span className="h-16 w-px bg-white/15" />
          <span className="font-mono text-[10px] tracking-[.2em] text-white/40 [writing-mode:vertical-rl]">JOURNEY</span>
          <span className="h-16 w-px bg-white/15" />
        </div>
      </div>
    </section>
  );
}

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
                <a href="#story" className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#176b3e] px-7 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#115832]">Explore the journey <ArrowRight size={18} /></a>
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

        <ScrollExperience />

        <section id="how-it-works" className="border-t border-[#edf0ed] bg-white py-14 sm:py-16">
          <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-10">
            <div className="text-center"><p className="text-sm font-bold uppercase tracking-[0.12em] text-[#51a451]">How It Works</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-[#111713] sm:text-4xl">Everything starts with a simpler journey</h2></div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">{steps.map(([title, text, Icon], index) => <motion.div whileHover={{ y: -7 }} transition={{ type: "spring", stiffness: 300, damping: 22 }} key={title} className="relative flex min-h-[176px] flex-col rounded-2xl border border-[#e2e9e3] bg-white p-6 shadow-[0_6px_25px_rgba(20,60,35,.04)]"><div className="flex items-start gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#176b3e] text-white"><Icon size={28} /></span><div><h3 className="text-lg font-bold text-[#141a15]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#68736b]">{text}</p></div></div><a href="#story" className="mt-auto pt-4 text-sm font-bold text-[#276f40]">Explore <ArrowRight size={15} className="ml-1 inline" /></a>{index < 2 && <span className="pointer-events-none absolute -right-8 top-1/2 hidden text-3xl text-[#9bc8a2] md:block">→</span>}</motion.div>)}</div>
            <div className="mt-9 grid overflow-hidden rounded-2xl border border-[#e2e9e3] bg-[#f9fcf8] sm:grid-cols-5">{stats.map(([number, first, second, Icon], index) => <div key={number} className={`flex items-center gap-3 px-5 py-5 sm:justify-center ${index < 4 ? "border-b border-[#e2e9e3] sm:border-b-0 sm:border-r" : ""}`}><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8f5e5] text-[#5aa85b]"><Icon size={20} /></span><div><p className="text-xl font-bold text-[#132018]">{number}</p><p className="text-xs leading-4 text-[#667168]">{first}<br />{second}</p></div></div>)}</div>
          </div>
        </section>

        <section id="contact" className="relative overflow-hidden bg-[#0c1510] px-6 py-24 text-white sm:px-8 lg:px-10">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="font-mono text-xs tracking-[.2em] text-[#9acda2]">CONTACT / KRISHISETU</p><h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-.04em] sm:text-6xl">Ready to make procurement feel simpler?</h2></div>
            <a href="#home" className="inline-flex w-fit items-center gap-3 border-b border-white/40 pb-2 text-sm font-semibold hover:border-white">Back to top <ArrowRight size={17} /></a>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}

export default App;
