import { useState } from "react";
import { ArrowRight, LockKeyhole, Phone, UserRound, X } from "lucide-react";
import Navbar from "../components/public/Navbar";

function PublicLayout({ children }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const openLogin = () => {
    setError("");
    setLoginOpen(true);
  };

  const closeLogin = () => {
    setLoginOpen(false);
    setError("");
  };

  const handleLogin = (event) => {
    event.preventDefault();
    const cleanMobile = mobile.replace(/\D/g, "");

    if (cleanMobile.length !== 10) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    if (password.trim().length < 4) {
      setError("Enter your password or PIN.");
      return;
    }

    setError("");
    closeLogin();
    alert("Farmer login successful. Account dashboard will be connected next.");
    setPassword("");
  };

  return (
    <div className="min-h-screen bg-[#F7F8F3] text-[#17251B]">
      <Navbar />
      <main>{children}</main>

      <button
        type="button"
        aria-label="Open farmer login"
        onClick={openLogin}
        className="fixed bottom-5 right-5 z-40 hidden"
      />

      {loginOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-5 py-8 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeLogin();
          }}
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-9">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f5e5] text-[#176b3e]">
                  <UserRound size={24} />
                </div>
                <p className="mt-6 font-mono text-[10px] font-semibold tracking-[.2em] text-[#718078]">
                  KRISHISETU / FARMER
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-.04em] text-[#111713]">
                  Welcome back.
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#68736b]">
                  Sign in to manage your procurement journey.
                </p>
              </div>

              <button
                type="button"
                onClick={closeLogin}
                aria-label="Close login"
                className="rounded-full p-2 text-[#69736b] transition hover:bg-[#f1f4f0] hover:text-[#111713]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#202b23]">
                  Mobile number
                </span>
                <div className="flex items-center rounded-xl border border-[#dce3dc] bg-[#fafcf9] px-4 focus-within:border-[#176b3e] focus-within:ring-2 focus-within:ring-[#176b3e]/10">
                  <Phone size={18} className="text-[#718078]" />
                  <span className="ml-3 border-r border-[#dce3dc] pr-3 text-sm text-[#68736b]">
                    +91
                  </span>
                  <input
                    value={mobile}
                    onChange={(event) =>
                      setMobile(
                        event.target.value.replace(/\D/g, "").slice(0, 10),
                      )
                    }
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="98765 43210"
                    className="w-full bg-transparent px-3 py-3.5 text-sm outline-none"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#202b23]">
                  Password / PIN
                </span>
                <div className="flex items-center rounded-xl border border-[#dce3dc] bg-[#fafcf9] px-4 focus-within:border-[#176b3e] focus-within:ring-2 focus-within:ring-[#176b3e]/10">
                  <LockKeyhole size={18} className="text-[#718078]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter password or PIN"
                    className="w-full bg-transparent px-3 py-3.5 text-sm outline-none"
                  />
                </div>
              </label>

              {error && (
                <p className="text-sm font-medium text-red-600">{error}</p>
              )}

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#176b3e] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#115832]"
              >
                Login as Farmer
                <ArrowRight size={17} />
              </button>
            </form>

            <p className="mt-5 text-center text-xs leading-5 text-[#7a847c]">
              Demo authentication for now. The real farmer account API can be connected here next.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PublicLayout;
