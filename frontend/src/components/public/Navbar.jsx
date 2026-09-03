function Navbar() {
  return (
    <header className="border-b border-[#DCE4DE] bg-[#F7F8F3]/95 backdrop-blur">
      <nav
        className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-6 px-6 sm:px-8 lg:px-10"
        aria-label="Main navigation"
      >
        <a
          href="#home"
          className="text-lg font-bold tracking-tight text-[#1F6B45] focus:outline-none focus:ring-2 focus:ring-[#1F6B45] focus:ring-offset-2"
        >
          KrishiSetu
        </a>

        <div className="hidden items-center gap-7 text-sm font-medium text-[#526057] sm:flex">
          <a className="transition-colors hover:text-[#1F6B45]" href="#home">
            Home
          </a>
          <a className="transition-colors hover:text-[#1F6B45]" href="#content">
            Explore
          </a>
        </div>

        <a
          href="#content"
          className="inline-flex items-center justify-center rounded-xl bg-[#1F6B45] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#185638] focus:outline-none focus:ring-2 focus:ring-[#1F6B45] focus:ring-offset-2"
        >
          Get started
        </a>
      </nav>
    </header>
  );
}

export default Navbar;
