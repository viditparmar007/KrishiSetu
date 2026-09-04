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

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <a
              href="#story"
              className="group inline-flex items-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#152018] transition hover:bg-[#eaf5e8]"
            >
              Explore the journey
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </a>
            <span className="font-mono text-[10px] tracking-[.2em] text-white/45">
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
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const wheelLock = useRef(false);
  const wheelDelta = useRef(0);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const images = scenes.map(({ image }) => {
      const img = new Image();
      img.src = image;
      return img.decode?.().catch(() => {});
    });

    Promise.all(images).catch(() => {});
  }, []);

  useEffect(() => {
    const handleWheel = (event) => {
      const section = ref.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const insideStory = rect.top <= 1 && rect.bottom >= window.innerHeight - 1;

      if (!insideStory || wheelLock.current) return;

      wheelDelta.current += event.deltaY;

      if (Math.abs(wheelDelta.current) < 35) return;

      const direction = wheelDelta.current > 0 ? 1 : -1;
      wheelDelta.current = 0;

      const current = activeRef.current;
      const next = Math.max(0, Math.min(scenes.length - 1, current + direction));

      if (next === current) return;

      event.preventDefault();

      activeRef.current = next;
      setActive(next);
      wheelLock.current = true;

      const storyTop = section.getBoundingClientRect().top + window.scrollY;
      const storyHeight = section.offsetHeight;
      const scrollRange = Math.max(0, storyHeight - window.innerHeight);

      const targetTop = storyTop + ((next + 0.5) / scenes.length) * scrollRange;

      window.scrollTo({
        top: targetTop,
        behavior: "smooth",
      });

      window.setTimeout(() => {
        wheelLock.current = false;
      }, 650);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const imageScale = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [1, 1.012, 1, 1.012, 1]);
  const cardY = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [8, -2, 6, -2, 8]);
  const cardRotate = useTransform(scrollYProgress, [0, 0.5, 1], [-0.15, 0.15, -0.15]);

  return (
    <section ref={ref} id="story" className="relative h-[400vh] bg-[#0b120d] text-white">
      <div className="sticky top-0 flex h-screen min-h-[680px] items-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_35%,rgba(90,168,91,.22),transparent_32%),radial-gradient(circle_at_15%_80%,rgba(22,107,62,.2),transparent_30%)]" />
          {scenes.map((scene, index) => (
            <img
              key={scene.kicker}
              src={scene.image}
              alt=""
              decoding="async"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out ${index === active ? "opacity-[0.28]" : "opacity-0"}`}
            />
          ))}
          <div className="absolute inset-0 bg-[#071009]/75" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center px-6 sm:px-8 lg:px-10">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div className="max-w-xl">
              <motion.p key={`kicker-${active}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="font-mono text-xs font-semibold tracking-[.22em] text-[#a8d7ae]">
                {scenes[active].kicker}
              </motion.p>
              <motion.h2 key={`title-${active}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="mt-5 max-w-2xl text-[clamp(3rem,7vw,6.6rem)] font-semibold leading-[.92] tracking-[-.055em]">
                {scenes[active].title}
              </motion.h2>
              <motion.p key={`text-${active}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.02 }} className="mt-7 max-w-lg text-base leading-7 text-white/70 sm:text-lg">
                {scenes[active].text}
              </motion.p>
              <div className="mt-9 flex items-center gap-5">
                <span className="font-mono text-xs text-white/45">SCROLL TO EXPLORE</span>
                <motion.span animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }} className="text-white/70">
                  <ArrowDownRight size={20} />
                </motion.span>
              </div>
            </div>

            <div className="relative mx-auto h-[510px] w-full max-w-[720px]">
              <motion.div className="absolute inset-6 overflow-hidden rounded-[2rem] border border-white/15 bg-black/20 shadow-[0_40px_100px_rgba(0,0,0,.4)] will-change-transform" style={{ scale: imageScale }}>
                {scenes.map((scene, index) => (
                  <img key={scene.kicker} src={scene.image} alt="" decoding="async" className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out ${index === active ? "opacity-100" : "opacity-0"}`} />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
                <motion.div className="absolute bottom-7 left-7 right-7 will-change-transform" style={{ y: cardY, rotate: cardRotate }}>
                  <div className="max-w-[340px] rounded-2xl border border-white/15 bg-black/55 p-5 backdrop-blur-xl">
                    <p className="font-mono text-[10px] uppercase tracking-[.2em] text-white/45">Live state</p>
                    <p className="mt-2 text-lg font-medium">{scenes[active].label}</p>
                  </div>
                </motion.div>
              </motion.div>

              <div className="absolute bottom-2 left-0 flex gap-2">
                {scenes.map((scene, index) => (
                  <button
                    key={scene.kicker}
                    type="button"
                    aria-label={`Go to ${scene.title}`}
                    onClick={() => {
                      const section = ref.current;
                      if (!section) return;
                      const storyTop = section.getBoundingClientRect().top + window.scrollY;
                      const storyHeight = section.offsetHeight;
                      const scrollRange = Math.max(0, storyHeight - window.innerHeight);
                      activeRef.current = index;
                      setActive(index);
                      wheelLock.current = true;
                      window.scrollTo({ top: storyTop + ((index + 0.5) / scenes.length) * scrollRange, behavior: "smooth" });
                      window.setTimeout(() => { wheelLock.current = false; }, 650);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${index === active ? "w-12 bg-white" : "w-5 bg-white/25 hover:bg-white/50"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 font-mono text-[10px] tracking-[.28em] text-white/35">
          KRISHISETU / {String(active + 1).padStart(2, "0")}
        </div>
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
        <HeroCarousel />
        <JourneyBridge />
        <ScrollExperience />

        <section id="how-it-works" className="border-t border-[#edf0ed] bg-white py-14 sm:py-16">
          <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-10">
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#51a451]">How It Works</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#111713] sm:text-4xl">Everything starts with a simpler journey</h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {steps.map(([title, text, Icon], index) => (
                <motion.div whileHover={{ y: -7 }} transition={{ type: "spring", stiffness: 300, damping: 22 }} key={title} className="relative flex min-h-[176px] flex-col rounded-2xl border border-[#e2e9e3] bg-white p-6 shadow-[0_6px_25px_rgba(20,60,35,.04)]">
                  <div className="flex items-start gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#176b3e] text-white"><Icon size={28} /></span>
                    <div><h3 className="text-lg font-bold text-[#141a15]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#68736b]">{text}</p></div>
                  </div>
                  <a href="#story" className="mt-auto pt-4 text-sm font-bold text-[#276f40]">Explore <ArrowRight size={15} className="ml-1 inline" /></a>
                  {index < 2 && <span className="pointer-events-none absolute -right-8 top-1/2 hidden text-3xl text-[#9bc8a2] md:block">→</span>}
                </motion.div>
              ))}
            </div>
            <div className="mt-9 grid overflow-hidden rounded-2xl border border-[#e2e9e3] bg-[#f9fcf8] sm:grid-cols-5">
              {stats.map(([number, first, second, Icon], index) => (
                <div key={number} className={`flex items-center gap-3 px-5 py-5 sm:justify-center ${index < 4 ? "border-b border-[#e2e9e3] sm:border-b-0 sm:border-r" : ""}`}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8f5e5] text-[#5aa85b]"><Icon size={20} /></span>
                  <div><p className="text-xl font-bold text-[#132018]">{number}</p><p className="text-xs leading-4 text-[#667168]">{first}<br />{second}</p></div>
                </div>
              ))}
            </div>
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