import { useEffect, useState } from "react";
import { ArrowRight, Building2, LockKeyhole, Phone, UserRound, UserPlus, X } from "lucide-react";
import Navbar from "../components/public/Navbar";

function PublicLayout({ children }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [role, setRole] = useState("farmer");
  const [mobile, setMobile] = useState("");
  const [officerId, setOfficerId] = useState("");
  const [password, setPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupMobile, setSignupMobile] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const openFarmerLogin = () => {
      setRole("farmer"); setSignupOpen(false); setError(""); setLoginOpen(true);
    };
    window.addEventListener("open-farmer-login", openFarmerLogin);
    return () => window.removeEventListener("open-farmer-login", openFarmerLogin);
  }, []);

  const closeAuth = () => { setLoginOpen(false); setSignupOpen(false); setError(""); };
  const chooseRole = (nextRole) => {
    setRole(nextRole); setSignupOpen(false); setError(""); setMobile(""); setOfficerId(""); setPassword("");
  };

  const handleLogin = (event) => {
    event.preventDefault();
    if (role === "farmer") {
      if (mobile.replace(/\D/g, "").length !== 10) { setError("Enter a valid 10-digit mobile number."); return; }
    } else if (officerId.trim().length < 3) { setError("Enter your Officer ID / User ID."); return; }
    if (password.trim().length < 4) { setError("Enter your password or PIN."); return; }
    setError(""); closeAuth();
    alert(`${role === "farmer" ? "Farmer" : "Officer"} login successful. Dashboard API will be connected next.`);
    setMobile(""); setOfficerId(""); setPassword("");
  };

  const handleSignup = (event) => {
    event.preventDefault();
    if (signupName.trim().length < 2) { setError("Enter your name."); return; }
    if (signupMobile.replace(/\D/g, "").length !== 10) { setError("Enter a valid 10-digit mobile number."); return; }
    if (signupPassword.trim().length < 4) { setError("Password must be at least 4 characters."); return; }
    setError("");
    alert("Signup details captured. MySQL account storage will be connected next.");
    setSignupName(""); setSignupMobile(""); setSignupPassword(""); setSignupOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F8F3] text-[#17251B]">
      <Navbar />
      <main>{children}</main>
      {loginOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/55 px-4 py-5 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) closeAuth(); }}>
          <div className="w-full max-w-lg rounded-[24px] bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-[9px] font-semibold tracking-[.22em] text-[#718078]">KRISHISETU / ACCOUNT</p>
                <h2 className="mt-1.5 text-2xl font-semibold tracking-[-.04em] text-[#111713] sm:text-3xl">{signupOpen ? "Create your account." : "Welcome back."}</h2>
                <p className="mt-1.5 text-xs leading-5 text-[#68736b]">{signupOpen ? "Create your KrishiSetu account to manage your procurement journey." : "Choose how you want to continue."}</p>
              </div>
              <button type="button" onClick={closeAuth} aria-label="Close account dialog" className="rounded-full p-1.5 text-[#69736b] transition hover:bg-[#f1f4f0] hover:text-[#111713]"><X size={18} /></button>
            </div>

            {!signupOpen ? <>
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <button type="button" onClick={() => chooseRole("farmer")} className={`rounded-xl border p-3 text-left transition ${role === "farmer" ? "border-[#176b3e] bg-[#edf8e9] ring-2 ring-[#176b3e]/10" : "border-[#dce3dc] bg-[#fafcf9] hover:border-[#aebcaf]"}`}>
                  <div className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#176b3e] shadow-sm"><UserRound size={18} /></span><div><p className="text-sm font-semibold text-[#18231c]">Farmer</p><p className="mt-0.5 text-[11px] text-[#718078]">Farmer account</p></div></div>
                </button>
                <button type="button" onClick={() => chooseRole("officer")} className={`rounded-xl border p-3 text-left transition ${role === "officer" ? "border-[#176b3e] bg-[#edf8e9] ring-2 ring-[#176b3e]/10" : "border-[#dce3dc] bg-[#fafcf9] hover:border-[#aebcaf]"}`}>
                  <div className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#176b3e] shadow-sm"><Building2 size={18} /></span><div><p className="text-sm font-semibold text-[#18231c]">Officer</p><p className="mt-0.5 text-[11px] text-[#718078]">Centre / department</p></div></div>
                </button>
              </div>

              <form onSubmit={handleLogin} className="mt-5 space-y-4">
                <div><p className="text-sm font-semibold text-[#202b23]">{role === "farmer" ? "Farmer login" : "Officer login"}</p><p className="mt-0.5 text-[11px] text-[#7a847c]">{role === "farmer" ? "Use your registered mobile number and password / PIN." : "Use your Officer ID / User ID and password / PIN."}</p></div>
                {role === "farmer" ? <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#202b23]">Mobile number</span><div className="flex items-center rounded-lg border border-[#dce3dc] bg-[#fafcf9] px-3 focus-within:border-[#176b3e] focus-within:ring-2 focus-within:ring-[#176b3e]/10"><Phone size={16} className="text-[#718078]" /><span className="ml-2 border-r border-[#dce3dc] pr-2.5 text-xs text-[#68736b]">+91</span><input value={mobile} onChange={(event) => setMobile(event.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" autoComplete="tel" placeholder="98765 43210" className="w-full bg-transparent px-2.5 py-3 text-sm outline-none" /></div></label> : <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#202b23]">Officer ID / User ID</span><div className="flex items-center rounded-lg border border-[#dce3dc] bg-[#fafcf9] px-3 focus-within:border-[#176b3e] focus-within:ring-2 focus-within:ring-[#176b3e]/10"><Building2 size={16} className="text-[#718078]" /><input value={officerId} onChange={(event) => setOfficerId(event.target.value)} autoComplete="username" placeholder="Enter your Officer ID / User ID" className="w-full bg-transparent px-2.5 py-3 text-sm outline-none" /></div></label>}
                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#202b23]">Password / PIN</span><div className="flex items-center rounded-lg border border-[#dce3dc] bg-[#fafcf9] px-3 focus-within:border-[#176b3e] focus-within:ring-2 focus-within:ring-[#176b3e]/10"><LockKeyhole size={16} className="text-[#718078]" /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter password or PIN" className="w-full bg-transparent px-2.5 py-3 text-sm outline-none" /></div></label>
                {error && <p className="text-xs font-medium text-red-600">{error}</p>}
                <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#176b3e] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#115832]">Login as {role === "farmer" ? "Farmer" : "Officer"}<ArrowRight size={16} /></button>
              </form>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#e6ebe6] pt-4"><div><p className="text-xs font-semibold text-[#202b23]">New to KrishiSetu?</p><p className="mt-0.5 text-[11px] text-[#7a847c]">Create an account below.</p></div><button type="button" onClick={() => { setSignupOpen(true); setError(""); }} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#b9c8bd] bg-white px-3.5 py-2 text-xs font-bold text-[#23402e] transition hover:bg-[#f4f8f4]"><UserPlus size={15} />Sign up</button></div>
            </> : <form onSubmit={handleSignup} className="mt-5 space-y-4">
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#202b23]">Full name</span><input value={signupName} onChange={(event) => setSignupName(event.target.value)} autoComplete="name" placeholder="Enter your full name" className="w-full rounded-lg border border-[#dce3dc] bg-[#fafcf9] px-3 py-3 text-sm outline-none focus:border-[#176b3e] focus:ring-2 focus:ring-[#176b3e]/10" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#202b23]">Mobile number</span><div className="flex items-center rounded-lg border border-[#dce3dc] bg-[#fafcf9] px-3"><Phone size={16} className="text-[#718078]" /><span className="ml-2 border-r border-[#dce3dc] pr-2.5 text-xs text-[#68736b]">+91</span><input value={signupMobile} onChange={(event) => setSignupMobile(event.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" autoComplete="tel" placeholder="98765 43210" className="w-full bg-transparent px-2.5 py-3 text-sm outline-none" /></div></label>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#202b23]">Create password / PIN</span><div className="flex items-center rounded-lg border border-[#dce3dc] bg-[#fafcf9] px-3"><LockKeyhole size={16} className="text-[#718078]" /><input type="password" value={signupPassword} onChange={(event) => setSignupPassword(event.target.value)} autoComplete="new-password" placeholder="Create password or PIN" className="w-full bg-transparent px-2.5 py-3 text-sm outline-none" /></div></label>
              {error && <p className="text-xs font-medium text-red-600">{error}</p>}
              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#176b3e] px-4 py-3 text-sm font-bold text-white">Create account<ArrowRight size={16} /></button>
              <button type="button" onClick={() => { setSignupOpen(false); setError(""); }} className="w-full text-xs font-semibold text-[#176b3e] hover:underline">Back to login</button>
              <p className="text-center text-[11px] leading-5 text-[#7a847c]">This is the UI flow for now. The account data will be stored in MySQL when the backend is connected.</p>
            </form>}
          </div>
        </div>
      )}
    </div>
  );
}

export default PublicLayout;
