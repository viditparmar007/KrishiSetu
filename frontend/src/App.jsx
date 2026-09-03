import { ArrowRight, CheckCircle2, Clock3, MapPin } from "lucide-react";
import PublicLayout from "./layouts/PublicLayout";

function App() {
  return (
    <PublicLayout>
      <main>
        {/* HERO */}
        <section
          id="home"
          className="relative overflow-hidden border-b border-[#DCE4DE]"
        >
          {/* Soft background decoration */}
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#E6F1E9] opacity-70 blur-3xl"
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[#F0F5E9] opacity-80 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto grid min-h-[calc(100vh-73px)] w-full max-w-7xl items-center gap-14 px-6 py-16 sm:px-8 lg:grid-cols-2 lg:px-10 lg:py-20">
            {/* Left content */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#CFE0D4] bg-white px-4 py-2 text-sm font-medium text-[#1F6B45] shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[#1F6B45]" />
                A simpler procurement journey
              </div>

              <p className="mt-7 text-sm font-semibold uppercase tracking-[0.2em] text-[#1F6B45]">
                KRISHISETU
              </p>

              <h1 className="mt-4 text-5xl font-bold leading-[1.05] tracking-tight text-[#17251B] sm:text-6xl lg:text-7xl">
                From farm to payment,
                <span className="block text-[#1F6B45]">
                  without the waiting.
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-base leading-7 text-[#667168] sm:text-lg">
                One digital platform to help farmers discover procurement
                centres, plan their visit, manage queues, and track their
                procurement journey.
              </p>

              {/* Actions */}
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#content"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F6B45] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#185737] focus:outline-none focus:ring-2 focus:ring-[#1F6B45] focus:ring-offset-2"
                >
                  Get Started
                  <ArrowRight size={17} />
                </a>

                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-xl border border-[#C9D6CD] bg-white px-6 py-3.5 text-sm font-semibold text-[#243128] transition hover:bg-[#F5F8F5] focus:outline-none focus:ring-2 focus:ring-[#1F6B45] focus:ring-offset-2"
                >
                  Farmer Login
                </button>
              </div>

              {/* Small trust points */}
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#667168]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#1F6B45]" />
                  Simple digital experience
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#1F6B45]" />
                  Track your journey
                </div>
              </div>
            </div>

            {/* Right visual */}
            <div className="relative mx-auto w-full max-w-xl lg:justify-self-end">
              <div className="relative rounded-[2rem] border border-[#D6E1D9] bg-white p-4 shadow-[0_25px_70px_rgba(31,107,69,0.10)] sm:p-6">
                {/* Top bar */}
                <div className="flex items-center justify-between border-b border-[#E5EBE6] pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#1F6B45]">
                      Procurement journey
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#17251B]">
                      Today's plan
                    </p>
                  </div>

                  <div className="rounded-full bg-[#EAF4ED] px-3 py-1 text-xs font-semibold text-[#1F6B45]">
                    Ready
                  </div>
                </div>

                {/* Journey */}
                <div className="mt-6 space-y-4">
                  {/* Step 1 */}
                  <div className="flex gap-4 rounded-2xl border border-[#DCE4DE] bg-[#FAFCFA] p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F2EB] text-sm font-bold text-[#1F6B45]">
                      01
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#17251B]">
                            Choose centre
                          </p>
                          <p className="mt-1 text-xs text-[#667168]">
                            Find a suitable procurement centre
                          </p>
                        </div>

                        <MapPin
                          size={18}
                          className="shrink-0 text-[#1F6B45]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-4 rounded-2xl border border-[#DCE4DE] bg-[#FAFCFA] p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F2EB] text-sm font-bold text-[#1F6B45]">
                      02
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#17251B]">
                            Plan your visit
                          </p>
                          <p className="mt-1 text-xs text-[#667168]">
                            Pick a convenient procurement slot
                          </p>
                        </div>

                        <Clock3
                          size={18}
                          className="shrink-0 text-[#1F6B45]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="rounded-2xl bg-[#1F6B45] p-5 text-white shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#CFE8D8]">
                          Next
                        </p>
                        <p className="mt-1 text-base font-semibold">
                          Track your queue
                        </p>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                        <Clock3 size={19} />
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-white/10 p-3">
                        <p className="text-xs text-[#D9EEE0]">
                          Farmers ahead
                        </p>
                        <p className="mt-1 text-xl font-bold">08</p>
                      </div>

                      <div className="rounded-xl bg-white/10 p-3">
                        <p className="text-xs text-[#D9EEE0]">
                          Estimated wait
                        </p>
                        <p className="mt-1 text-xl font-bold">32 min</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom status */}
                <div className="mt-5 flex items-center justify-between rounded-xl border border-[#DCE4DE] px-4 py-3">
                  <div>
                    <p className="text-xs text-[#667168]">Journey status</p>
                    <p className="mt-0.5 text-sm font-semibold text-[#17251B]">
                      Ready to begin
                    </p>
                  </div>

                  <span className="h-2.5 w-2.5 rounded-full bg-[#1F6B45]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* THREE CORE STEPS */}
        <section
          id="content"
          className="bg-[#F7F9F6] py-16 sm:py-20 lg:py-24"
          aria-label="How KrishiSetu starts the procurement journey"
        >
          <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-10">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1F6B45]">
                Simple by design
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#17251B] sm:text-4xl">
                Everything starts with a clearer journey.
              </h2>

              <p className="mt-4 text-base leading-7 text-[#667168]">
                KrishiSetu brings the important steps together so farmers can
                discover, plan, and track their procurement journey from one
                place.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <article className="rounded-2xl border border-[#DCE4DE] bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg">
                <p className="text-sm font-bold text-[#1F6B45]">01</p>

                <h3 className="mt-4 text-xl font-bold text-[#17251B]">
                  Discover
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#667168]">
                  Find procurement information and suitable centres without
                  searching through scattered information.
                </p>
              </article>

              <article className="rounded-2xl border border-[#DCE4DE] bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg">
                <p className="text-sm font-bold text-[#1F6B45]">02</p>

                <h3 className="mt-4 text-xl font-bold text-[#17251B]">
                  Plan
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#667168]">
                  Prepare your visit with the information you need before
                  travelling to the procurement centre.
                </p>
              </article>

              <article className="rounded-2xl border border-[#DCE4DE] bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg">
                <p className="text-sm font-bold text-[#1F6B45]">03</p>

                <h3 className="mt-4 text-xl font-bold text-[#17251B]">
                  Track
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#667168]">
                  Understand what is happening next and keep your procurement
                  journey visible from start to finish.
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}

export default App;