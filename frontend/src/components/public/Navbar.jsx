function Navbar() {
  const openFarmerLogin = () => {
    window.dispatchEvent(new CustomEvent("open-farmer-login"));
  };

  const openStory = (event) => {
    event.preventDefault();
    document.getElementById("story")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="border-b border-[#e3e9e4] bg-white/95 backdrop-blur">
      <nav className="mx-auto flex min-h-[74px] w-full max-w-7xl items-center justify-between gap-6 px-6 sm:px-8 lg:px-10" aria-label="Main navigation">
        <a href="#home" className="flex items-center gap-2 text-xl font-bold tracking-tight text-[#176b3e] focus:outline-none focus:ring-2 focus:ring-[#176b3e] focus:ring-offset-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf8e9]"><span className="text-xl">🌿</span></span>
          KrishiSetu
        </a>

        <div className="hidden items-center gap-8 text-sm font-medium text-[#313a34] lg:flex">
          <a className="transition-colors hover:text-[#176b3e]" href="#home">Home</a>
          <a className="transition-colors hover:text-[#176b3e]" href="#centres">Centres</a>
          <a className="transition-colors hover:text-[#176b3e]" href="#how-it-works">How it works</a>
          <a className="transition-colors hover:text-[#176b3e]" href="#farmers">For Farmers</a>
          <a className="transition-colors hover:text-[#176b3e]" href="#about">About us</a>
          <a className="transition-colors hover:text-[#176b3e]" href="#contact">Contact</a>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openFarmerLogin}
            className="hidden rounded-2xl border border-[#b9c8bd] bg-white px-6 py-2.5 text-sm font-bold text-[#23402e] transition hover:bg-[#f4f8f4] sm:inline-flex"
          >
            Farmer Login
          </button>
          <a
            href="#story"
            onClick={openStory}
            className="inline-flex items-center justify-center rounded-2xl bg-[#176b3e] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#115832]"
          >
            Get Started
          </a>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
