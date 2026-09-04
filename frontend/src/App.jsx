import { useEffect, useRef, useState } from "react";
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
    image: "https://images.pexels.com/photos/29039798/pexels-photo-29039798.jpeg?auto=compress&cs=tinysrgb&w=1200",
    label: "Nearby procurement centre",
  },
  {
    kicker: "02 / PLAN",
    title: "Turn a trip into a plan.",
    text: "Choose a date and slot before you travel. Your visit becomes a visible step instead of another uncertain wait.",
    image: "https://images.pexels.com/photos/20344348/pexels-photo-20344348.jpeg?auto=compress&cs=tinysrgb&w=1200",
    label: "Visit slot confirmed",
  },
  {
    kicker: "03 / TRACK",
    title: "Know what happens next.",
    text: "From check-in to queue progress, the important moments stay visible so farmers are never left guessing.",
    image: "https://images.pexels.com/photos/29798199/pexels-photo-29798199.jpeg?auto=compress&cs=tinysrgb&w=1200",
    label: "Queue moving · Token 18",
  },
  {
    kicker: "04 / PAYMENT",
    title: "Finish with clarity.",
    text: "Quality, weighment and payment become part of one transparent journey, from the first tap to the final receipt.",
    image: "https://images.pexels.com/photos/16564262/pexels-photo-16564262.jpeg?auto=compress&cs=tinysrgb&w=1200",
    label: "Payment processed",
  },
];

// Hero uses a separate image set so the existing scroll story keeps its original imagery.
const heroScenes = scenes.map((scene, index) => ({
  ...scene,
  image: [
    "https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?auto=format&fit=crop&w=1800&q=85",
  ][index],
}));

function HeroCarousel() {
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const timerRef = useRef(null);

  const changeScene = (direction) => {
    const next = (activeRef.current + direction + heroScenes.length) % heroScenes.length;
    activeRef.current = next;
    setActive(next);
  };

  useEffect(() => {
    const preload = heroScenes.map(({ image }) => {
      const img = new Image();
      img.src = image;
      return img.decode?.().catch(() => {});
    });

    Promise.all(preload).catch(() => {});

    timerRef.current = window.setInterval(() => {
      const next = (activeRef.current + 1) % heroScenes.length;
      activeRef.current = next;
      setActive(next);
    }, 10000);

    return () => window.clearInterval(timerRef.current);
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-[calc(100vh-76px)] overflow-hidden bg-[#071009] text-white"
    >
      <div className="absolute inset-0">
        {heroScenes.map((scene, index) => (
          <motion.img
            key={scene.kicker}
            src={scene.image}
            alt=""
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
            initial={false}
            animate={{
              opacity: index === active ? 1 : 0,
              scale: index === active ? 1 : 1.045,
            }}
            transition={{
              opacity: { duration: 1.05, ease: [0.22, 1, 0.36, 1] },
              scale: { duration: 10, ease: "linear" },
            }}
          />
        ))}

        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/15" />
      </div>

      <div
        className="absolute inset-y-0 left-0 z-20 hidden w-[32%] lg:block"
        onMouseEnter={() => changeScene(-1)}
        aria-hidden="true"
      />
      <div
        className="absolute inset-y-0 right-0 z-20 hidden w-[32%] lg:block"
        onMouseEnter={() => changeScene(1)}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-76px)] w-full max-w-7xl items-end px-6 pb-14 pt-28 sm:px-8 sm:pb-16 lg:px-10 lg:pb-20">
        <div className="w-full max-w-4xl">
          <motion.p
            key={`hero-kicker-${active}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="font-mono text-xs font-semibold tracking-[.24em] text-white/70"
          >
            {heroScenes[active].kicker}
          </motion.p>

          <motion.h1
            key={`hero-title-${active}`}
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 max-w-4xl text-[clamp(3.2rem,8vw,7rem)] font-semibold leading-[.9] tracking-[-.055em]"
          >
            {heroScenes[active].title}
          </motion.h1>

          <motion.p
            key={`hero-text-${active}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="mt-6 max-w-xl text-base leading-7 text-white/72 sm:text-lg"
          >
            {heroScenes[active].text}
          </motion.p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
          href="#story"
          className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#176b3e] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#115832]"
          >
          Get Started
          <ArrowRight size={18} />
          </a>

         <button
         type="button"
         onClick={() => window.dispatchEvent(new CustomEvent("open-farmer-login"))}
         className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white hover:text-[#152018]"
         >
         Farmer Login
         <UserRound size={17} />
         </button>

         <span className="ml-2 font-mono text-[10px] tracking-[.2em] text-white/45">
         MOVE LEFT / RIGHT TO EXPLORE
         </span>
         </div>

          <div className="mt-10 flex items-center gap-3">
            {heroScenes.map((scene, index) => (
              <button
                key={scene.kicker}
                type="button"
                aria-label={`Show ${scene.title}`}
                onClick={() => {
                  activeRef.current = index;
                  setActive(index);
                }}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  index === active ? "w-14 bg-white" : "w-7 bg-white/30 hover:bg-white/55"
                }`}
              />
            ))}
            <span className="ml-3 font-mono text-[10px] tracking-[.2em] text-white/45">
              {String(active + 1).padStart(2, "0")} / {String(heroScenes.length).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-7 right-6 z-30 hidden items-center gap-3 font-mono text-[10px] tracking-[.22em] text-white/40 lg:flex">
        <span className="h-px w-12 bg-white/20" />
        KRISHISETU / JOURNEY
      </div>
    </section>
  );
}

const GroundedContent = () => null;

function JourneyBridge() {
  return (
    <section className="relative overflow-hidden bg-[#050805] text-white">
      <div className="relative mx-auto h-[72vh] min-h-[560px] max-h-[760px] w-full max-w-[1500px] overflow-hidden">
        <motion.img
          src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1800&q=88"
          alt="Fresh produce ready for procurement"
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ scale: 1.06 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/15" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#050805] to-transparent" />

        <div className="absolute inset-x-0 bottom-12 px-6 sm:px-10 lg:px-16">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <p className="font-mono text-[10px] font-semibold tracking-[.28em] text-white/60">
                THE JOURNEY / FROM FARM TO PAYMENT
              </p>
              <h2 className="mt-4 max-w-4xl text-[clamp(2.8rem,7vw,6.5rem)] font-semibold leading-[.9] tracking-[-.055em]">
                Less uncertainty.
                <br />
                More control.
              </h2>
            </div>
            <div className="max-w-xs pb-1 text-sm leading-6 text-white/65">
              One connected experience for discovering a centre, planning a visit, tracking the queue and getting paid.
            </div>
          </div>
        </div>

        <div className="absolute right-6 top-6 hidden items-center gap-3 font-mono text-[10px] tracking-[.2em] text-white/50 sm:flex lg:right-10 lg:top-8">
          <span className="h-px w-10 bg-white/25" />
          KRISHISETU / 01
        </div>
      </div>
    </section>
  );
}

function ScrollExperience() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);

  return (
    <section id="story" ref={ref} className="relative bg-[#071009] text-white">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div style={{ x }} className="flex w-max gap-6 px-6 sm:px-10 lg:px-16">
          {scenes.map((scene, index) => (
            <article key={scene.kicker} className="relative h-[72vh] w-[82vw] max-w-[1120px] overflow-hidden rounded-[28px] sm:w-[72vw] lg:w-[62vw]">
              <img src={scene.image} alt={scene.label} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 sm:p-10 lg:p-14">
                <p className="font-mono text-xs tracking-[.2em] text-white/60">{scene.kicker}</p>
                <h3 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-.04em] sm:text-6xl">{scene.title}</h3>
                <p className="mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg">{scene.text}</p>
              </div>
              <div className="absolute right-7 top-7 rounded-full border border-white/20 bg-black/20 px-4 py-2 font-mono text-[10px] tracking-[.18em] text-white/60 backdrop-blur-sm">0{index + 1}</div>
            </article>
          ))}
        </motion.div>
      </div>
      <div className="h-[300vh]" />
    </section>
  );
}

function App() {
  return (
    <PublicLayout>
      <main>
        <HeroCarousel />
        <JourneyBridge />
        <ScrollExperience />
        <section id="how-it-works" className="border-t border-[#edf0ed] bg-white px-6 py-24 sm:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.3fr_1fr] lg:gap-20">
              <div>
                <p className="font-mono text-xs font-semibold tracking-[.22em] text-[#6d786f]">HOW IT WORKS</p>
              </div>
              <div>
                <h2 className="max-w-5xl text-[clamp(2.7rem,5.5vw,5.5rem)] font-semibold leading-[.95] tracking-[-.055em] text-[#101711]">Everything starts with a simpler journey.</h2>
                <div className="mt-14 grid gap-5 md:grid-cols-3">
                  {steps.map(([title, text, Icon], index) => (
                    <motion.div key={title} whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 22 }} className="relative min-h-[230px] rounded-2xl border border-[#e1e7e1] bg-[#fafcf9] p-7">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#176b3e] text-white"><Icon size={22} /></span>
                      <p className="mt-8 font-mono text-[10px] tracking-[.18em] text-[#7a847c]">0{index + 1}</p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-[-.03em] text-[#141a15]">{title}</h3>
                      <p className="mt-3 text-sm leading-6 text-[#68736b]">{text}</p>
                      {index < 2 && <span className="absolute -right-4 top-1/2 hidden text-2xl text-[#8fba96] md:block">→</span>}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="contact" className="relative overflow-hidden bg-[#0c1510] px-6 py-28 text-white sm:px-8 lg:px-10">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs tracking-[.2em] text-[#9acda2]">CONTACT / KRISHISETU</p>
              <h2 className="mt-5 max-w-3xl text-[clamp(2.8rem,6vw,6rem)] font-semibold leading-[.95] tracking-[-.05em]">Ready to make procurement feel simpler?</h2>
            </div>
            <a href="#home" className="inline-flex w-fit items-center gap-3 border-b border-white/40 pb-2 text-sm font-semibold transition hover:border-white">Back to top <ArrowRight size={17} /></a>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}

export default App;
