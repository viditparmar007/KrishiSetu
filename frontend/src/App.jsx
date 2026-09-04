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
  ["â‚¹320Cr+", "Payments", "Processed", IndianRupee],
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
    label: "Queue moving Â· Token 18",
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

function GroundedContent() {
  return (
    <>
      {/* OUR WHY */}
      <section
        id="why"
        className="relative overflow-hidden bg-white px-6 py-24 text-[#101510] sm:px-8 lg:px-10"
      >
        <div className="mx-auto grid w-full max-w-7xl gap-14 lg:grid-cols-[0.3fr_1fr] lg:gap-20">
          <div>
            <p className="font-mono text-xs tracking-[.22em] text-[#7b847d]">
              OUR WHY
            </p>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <h2 className="max-w-5xl text-[clamp(3rem,6.5vw,6.5rem)] font-medium leading-[.92] tracking-[-.055em]">
                Procurement should feel clear from the first step.
              </h2>

              <p className="mt-8 max-w-3xl text-lg leading-8 text-[#69736b] sm:text-xl">
                Farmers should not have to hunt for information, guess when
                to visit, or wonder what happens next. KrishiSetu brings the
                journey into one connected experience.
              </p>
            </div>

            <div className="relative h-[280px] overflow-hidden rounded-sm bg-[#e8ece7]">
              <img
                src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=85"
                alt="Farmland and agricultural landscape"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* OUR SERVICES */}
      <section
        id="services"
        className="relative overflow-hidden bg-[#f4f6f2] px-6 py-24 text-[#101510] sm:px-8 lg:px-10"
      >
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid gap-14 lg:grid-cols-[0.3fr_1fr] lg:gap-20">
            <div>
              <p className="font-mono text-xs tracking-[.22em] text-[#7b847d]">
                OUR SERVICES
              </p>
            </div>

            <div>
              <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-start">
                <div>
                  <h2 className="max-w-5xl text-[clamp(3rem,6.5vw,6.5rem)] font-medium leading-[.92] tracking-[-.055em]">
                    Discover / Plan / Track / Get Paid
                  </h2>

                  <p className="mt-8 max-w-3xl text-lg leading-8 text-[#69736b] sm:text-xl">
                    One connected experience for discovering a procurement
                    centre, planning a visit, tracking progress and receiving
                    payment.
                  </p>
                </div>

                <div className="overflow-hidden rounded-sm">
                  <img
                    src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=85"
                    alt="Fresh vegetables at a local market"
                    className="h-[300px] w-full object-cover"
                  />
                </div>
              </div>

              <div className="mt-16 grid gap-px overflow-hidden rounded-sm bg-[#d8ded8] md:grid-cols-3">
                <div className="bg-[#f4f6f2] p-8">
                  <p className="font-mono text-xs tracking-[.18em] text-[#7b847d]">01</p>
                  <h3 className="mt-12 text-3xl font-medium">Discover</h3>
                  <p className="mt-4 leading-7 text-[#69736b]">
                    Find procurement centres, timings and the information you
                    need before leaving the farm.
                  </p>
                </div>

                <div className="bg-[#f4f6f2] p-8">
                  <p className="font-mono text-xs tracking-[.18em] text-[#7b847d]">02</p>
                  <h3 className="mt-12 text-3xl font-medium">Plan</h3>
                  <p className="mt-4 leading-7 text-[#69736b]">
                    Choose your visit and arrive knowing what the next step of
                    the journey looks like.
                  </p>
                </div>

                <div className="bg-[#f4f6f2] p-8">
                  <p className="font-mono text-xs tracking-[.18em] text-[#7b847d]">03</p>
                  <h3 className="mt-12 text-3xl font-medium">Track</h3>
                  <p className="mt-4 leading-7 text-[#69736b]">
                    Follow your queue and procurement progress without
                    constantly asking what happens next.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ScrollExperience() {
  const ref = useRef(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (value) => {
      const next = Math.min(
        scenes.length - 1,
        Math.max(0, Math.floor(value * scenes.length))
      );

      if (next !== activeRef.current) {
        activeRef.current = next;
        setActive(next);
      }
    });

    return unsubscribe;
  }, [scrollYProgress]);

  return (
    <section
      ref={ref}
      id="story"
      className="relative h-[400vh] bg-[#071009] text-white"
    >
      <div className="sticky top-0 h-screen min-h-[680px] overflow-hidden">
        <div className="absolute inset-0 bg-[#071009]" />

        <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl items-center px-6 sm:px-8 lg:px-10">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">

            <div className="max-w-xl">
              <p className="font-mono text-xs font-semibold tracking-[.24em] text-[#a8d7ae]">
                {scenes[active].kicker}
              </p>

              <motion.h2
                key={scenes[active].title}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="mt-5 max-w-xl text-[clamp(3rem,6.5vw,6.4rem)] font-semibold leading-[.9] tracking-[-.055em]"
              >
                {scenes[active].title}
              </motion.h2>

              <motion.p
                key={scenes[active].text}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="mt-7 max-w-lg text-base leading-7 text-white/70 sm:text-lg"
              >
                {scenes[active].text}
              </motion.p>

              <div className="mt-10 flex items-center gap-4">
                <span className="font-mono text-[10px] tracking-[.22em] text-white/45">
                  SCROLL TO EXPLORE
                </span>
                <ArrowDownRight size={19} className="text-white/65" />
              </div>
            </div>

            <div className="relative h-[430px] w-full sm:h-[510px]">
              <motion.div
                className="absolute inset-0 overflow-hidden rounded-[2rem] border border-white/15 shadow-[0_40px_100px_rgba(0,0,0,.45)]"
              >
                {scenes.map((scene, index) => (
                  <motion.img
                    key={scene.kicker}
                    src={scene.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    initial={false}
                    animate={{
                      opacity: index === active ? 1 : 0,
                      scale: index === active ? 1 : 1.04,
                    }}
                    transition={{ duration: 0.65 }}
                  />
                ))}

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />

                <div className="absolute bottom-7 left-7">
                  <motion.div
                    key={scenes[active].label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-white/15 bg-[#071009]/80 px-5 py-4 backdrop-blur-xl"
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[.2em] text-white/45">
                      Live state
                    </p>
                    <p className="mt-2 text-lg font-medium">
                      {scenes[active].label}
                    </p>
                  </motion.div>
                </div>

                <span className="absolute right-7 top-7 rounded-full border border-white/20 bg-black/25 px-4 py-2 font-mono text-[10px] tracking-[.2em]">
                  {String(active + 1).padStart(2, "0")}
                </span>
              </motion.div>

              <div className="absolute -bottom-10 left-0 flex items-center gap-2">
                {scenes.map((scene, index) => (
                  <span
                    key={scene.kicker}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      index === active
                        ? "w-12 bg-white"
                        : "w-5 bg-white/25"
                    }`}
                  />
                ))}

                <span className="ml-3 font-mono text-[10px] tracking-[.2em] text-white/40">
                  {String(active + 1).padStart(2, "0")} / {String(scenes.length).padStart(2, "0")}
                </span>
              </div>
            </div>

          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[.28em] text-white/30">
          KRISHISETU / JOURNEY
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

        <GroundedContent />

        <ScrollExperience />

        <section
          id="how-it-works"
          className="border-t border-[#edf0ed] bg-white py-14 sm:py-16"
        >
          <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-10">
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#51a451]">
                How It Works
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#111713] sm:text-4xl">
                Everything starts with a simpler journey
              </h2>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {steps.map(([title, text, Icon], index) => (
                <motion.div
                  key={title}
                  whileHover={{ y: -7 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 22,
                  }}
                  className="relative flex min-h-[176px] flex-col rounded-2xl border border-[#e2e9e3] bg-white p-6 shadow-[0_6px_25px_rgba(20,60,35,.04)]"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#176b3e] text-white">
                      <Icon size={28} />
                    </span>

                    <div>
                      <h3 className="text-lg font-bold text-[#141a15]">
                        {title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-[#68736b]">
                        {text}
                      </p>
                    </div>
                  </div>

                  <a
                    href="#story"
                    className="mt-auto pt-4 text-sm font-bold text-[#276f40]"
                  >
                    Explore <ArrowRight size={15} className="ml-1 inline" />
                  </a>

                  {index < 2 && (
                    <span className="pointer-events-none absolute -right-8 top-1/2 hidden text-3xl text-[#9bc8a2] md:block">
                      â†’
                    </span>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="mt-9 grid overflow-hidden rounded-2xl border border-[#e2e9e3] bg-[#f9fcf8] sm:grid-cols-5">
              {stats.map(([number, first, second, Icon], index) => (
                <div
                  key={number}
                  className={`flex items-center gap-3 px-5 py-5 sm:justify-center ${
                    index < 4
                      ? "border-b border-[#e2e9e3] sm:border-b-0 sm:border-r"
                      : ""
                  }`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8f5e5] text-[#5aa85b]">
                    <Icon size={20} />
                  </span>

                  <div>
                    <p className="text-xl font-bold text-[#132018]">
                      {number}
                    </p>

                    <p className="text-xs leading-4 text-[#667168]">
                      {first}
                      <br />
                      {second}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="contact"
          className="relative overflow-hidden bg-[#0c1510] px-6 py-24 text-white sm:px-8 lg:px-10"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs tracking-[.2em] text-[#9acda2]">
                CONTACT / KRISHISETU
              </p>

              <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-.04em] sm:text-6xl">
                Ready to make procurement feel simpler?
              </h2>
            </div>

            <a
              href="#home"
              className="inline-flex w-fit items-center gap-3 border-b border-white/40 pb-2 text-sm font-semibold hover:border-white"
            >
              Back to top <ArrowRight size={17} />
            </a>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}

export default App;

