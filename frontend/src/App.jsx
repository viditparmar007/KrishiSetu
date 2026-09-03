import PublicLayout from "./layouts/PublicLayout";

function App() {
  return (
    <PublicLayout>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <section
          id="home"
          className="flex flex-1 flex-col justify-center py-16 lg:py-24"
        >
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1F6B45]">
              KrishiSetu
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#17251B] sm:text-5xl lg:text-6xl">
              Connecting farmers with a simpler procurement journey.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-[#667168] sm:text-lg">
              A clear public experience for discovering the KrishiSetu platform.
            </p>
          </div>
        </section>

        <section
          id="content"
          className="border-t border-[#DCE4DE] py-12"
          aria-label="Landing page content"
        >
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-[#DCE4DE] bg-white p-6">
              <p className="text-sm font-semibold text-[#1F6B45]">01</p>
              <h2 className="mt-3 text-lg font-bold">Discover</h2>
              <p className="mt-2 text-sm leading-6 text-[#667168]">
                Find the right procurement information in one place.
              </p>
            </div>

            <div className="rounded-2xl border border-[#DCE4DE] bg-white p-6">
              <p className="text-sm font-semibold text-[#1F6B45]">02</p>
              <h2 className="mt-3 text-lg font-bold">Plan</h2>
              <p className="mt-2 text-sm leading-6 text-[#667168]">
                Prepare for the next step with a simple, focused experience.
              </p>
            </div>

            <div className="rounded-2xl border border-[#DCE4DE] bg-white p-6">
              <p className="text-sm font-semibold text-[#1F6B45]">03</p>
              <h2 className="mt-3 text-lg font-bold">Track</h2>
              <p className="mt-2 text-sm leading-6 text-[#667168]">
                Keep the procurement journey easy to understand from start to finish.
              </p>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}

export default App;
