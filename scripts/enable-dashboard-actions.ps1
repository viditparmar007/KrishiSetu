$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$dashboard = Join-Path $root "frontend\src\pages\FarmerDashboard.jsx"

if (-not (Test-Path $dashboard)) { throw "FarmerDashboard.jsx not found at $dashboard" }

$content = Get-Content $dashboard -Raw -Encoding UTF8

# 1) Wire sidebar navigation without changing the existing layout.
$navMap = @{
  'Dashboard' = 'Dashboard'
  'My Farms' = 'My Farms'
  'My Crops' = 'My Crops'
  'Find Centre' = 'Find Centre'
  'My Bookings' = 'My Bookings'
  'Live Queue' = 'Live Queue'
  'Procurement' = 'Procurement'
  'Payments' = 'Payments'
  'Notifications' = 'Notifications'
  'Advisory' = 'Advisory'
  'Schemes' = 'Schemes'
  'Profile' = 'Profile'
}
foreach ($label in $navMap.Keys) {
  $old = "<NavItem icon="
}

$content = $content.Replace('<NavItem icon={House} label="Dashboard" active />', '<NavItem icon={House} label="Dashboard" active onClick={() => handleNav("Dashboard")} />')
$content = $content.Replace('<NavItem icon={Tractor} label="My Farms" />', '<NavItem icon={Tractor} label="My Farms" onClick={() => handleNav("My Farms")} />')
$content = $content.Replace('<NavItem icon={Wheat} label="My Crops" />', '<NavItem icon={Wheat} label="My Crops" onClick={() => handleNav("My Crops")} />')
$content = $content.Replace('<NavItem icon={MapPin} label="Find Centre" />', '<NavItem icon={MapPin} label="Find Centre" onClick={() => handleNav("Find Centre")} />')
$content = $content.Replace('<NavItem icon={CalendarDays} label="My Bookings" />', '<NavItem icon={CalendarDays} label="My Bookings" onClick={() => handleNav("My Bookings")} />')
$content = $content.Replace('<NavItem icon={Users} label="Live Queue" />', '<NavItem icon={Users} label="Live Queue" onClick={() => handleNav("Live Queue")} />')
$content = $content.Replace('<NavItem icon={FileText} label="Procurement" />', '<NavItem icon={FileText} label="Procurement" onClick={() => handleNav("Procurement")} />')
$content = $content.Replace('<NavItem icon={IndianRupeeIcon} label="Payments" />', '<NavItem icon={IndianRupeeIcon} label="Payments" onClick={() => handleNav("Payments")} />')
$content = $content.Replace('<NavItem icon={Bell} label="Notifications" badge="3" />', '<NavItem icon={Bell} label="Notifications" badge="3" onClick={() => handleNav("Notifications")} />')
$content = $content.Replace('<NavItem icon={Sprout} label="Advisory" />', '<NavItem icon={Sprout} label="Advisory" onClick={() => handleNav("Advisory")} />')
$content = $content.Replace('<NavItem icon={FileText} label="Schemes" />', '<NavItem icon={FileText} label="Schemes" onClick={() => handleNav("Schemes")} />')
$content = $content.Replace('<NavItem icon={UserRound} label="Profile" />', '<NavItem icon={UserRound} label="Profile" onClick={() => handleNav("Profile")} />')

# 2) Add action state/handler before the dashboard return.
$marker = '  const upcoming = data?.upcoming_harvests || [];\n\n  return ('
$insert = @'
  const upcoming = data?.upcoming_harvests || [];

  const actionCopy = {
    "My Bookings": "Your booking area is ready for the booking module. From here you will be able to review upcoming and past procurement visits.",
    "Live Queue": "Your live queue area is ready. Once a procurement visit is booked, queue progress can be shown here.",
    "Procurement": "Your procurement journey starts from a centre and booking. This action is now connected to the dashboard interaction layer.",
    "Payments": "Your payment status area is ready for payment and settlement details from the procurement journey.",
    "Notifications": "Your latest farmer notifications will appear here.",
    "Advisory": "Farming advisories will appear here based on your crops and profile.",
    "Schemes": "Government schemes matched to your farmer profile will appear here.",
    "Profile": "Your farmer profile and account details will appear here."
  };

  const handleNav = (label) => {
    const targets = {
      "Dashboard": null,
      "My Farms": "my-farms",
      "My Crops": "my-farms",
      "Find Centre": "find-centre"
    };
    const target = targets[label];
    if (target) {
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (label === "Dashboard") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setModal(`info:${label}`);
  };

  return (
'@
if (-not $content.Contains($marker)) { throw "Dashboard insertion marker not found." }
$content = $content.Replace($marker, $insert)

# 3) Give the existing dashboard sections stable scroll targets.
$content = $content.Replace('<div className="mt-6 grid gap-5 xl:grid-cols-[1.05fr_1fr_190px]">', '<div id="my-farms" className="mt-6 scroll-mt-24 grid gap-5 xl:grid-cols-[1.05fr_1fr_190px]">')
$content = $content.Replace('<button type="button" onClick={() => window.alert("Procurement centre discovery will be connected to the centre module next.")}', '<button type="button" onClick={() => handleNav("Find Centre") }')

# 4) Make quick actions perform the same real dashboard interaction instead of alerts.
$content = $content.Replace('<QuickAction icon={CalendarDays} label="Book a Slot" />', '<QuickAction icon={CalendarDays} label="Book a Slot" onClick={() => handleNav("Find Centre")} />')
$content = $content.Replace('<QuickAction icon={FileText} label="View Bookings" />', '<QuickAction icon={FileText} label="View Bookings" onClick={() => handleNav("My Bookings")} />')
$content = $content.Replace('<QuickAction icon={Users} label="Check Queue" />', '<QuickAction icon={Users} label="Check Queue" onClick={() => handleNav("Live Queue")} />')
$content = $content.Replace('<QuickAction icon={RupeeIcon} label="Payment Status" />', '<QuickAction icon={RupeeIcon} label="Payment Status" onClick={() => handleNav("Payments")} />')

# 5) Government schemes button and top notification become functional.
$content = $content.Replace('<button type="button" className="hidden items-center gap-2 rounded-lg border border-[#9db9a4] px-4 py-2.5 text-xs font-bold text-[#176b3e] sm:inline-flex">Explore Schemes', '<button type="button" onClick={() => handleNav("Schemes")} className="hidden items-center gap-2 rounded-lg border border-[#9db9a4] px-4 py-2.5 text-xs font-bold text-[#176b3e] sm:inline-flex">Explore Schemes')
$content = $content.Replace('<button type="button" className="relative rounded-full p-2.5 text-[#33453a] hover:bg-[#f1f5f1]"><Bell', '<button type="button" onClick={() => handleNav("Notifications")} className="relative rounded-full p-2.5 text-[#33453a] hover:bg-[#f1f5f1]"><Bell')
$content = $content.Replace('<button type="button" className="hidden items-center gap-3 sm:flex">', '<button type="button" onClick={() => handleNav("Profile")} className="hidden items-center gap-3 sm:flex">')

# 6) Replace QuickAction with a reusable real click target.
$oldQuick = @'
function QuickAction({ icon: Icon, label }) {
  return <button type="button" onClick={() => window.alert(`${label} will be connected to the next dashboard module.`)} className="flex items-center gap-2 rounded-xl border border-[#e1e8e2] bg-[#fbfdfb] px-3 py-3 text-left text-xs font-semibold transition hover:border-[#9dbba3] hover:bg-[#f3f8f3]"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e9f5ea] text-[#176b3e]"><Icon size={16}/></span>{label}</button>;
}
'@
$newQuick = @'
function QuickAction({ icon: Icon, label, onClick }) {
  return <button type="button" onClick={onClick} className="flex items-center gap-2 rounded-xl border border-[#e1e8e2] bg-[#fbfdfb] px-3 py-3 text-left text-xs font-semibold transition hover:border-[#9dbba3] hover:bg-[#f3f8f3]"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e9f5ea] text-[#176b3e]"><Icon size={16}/></span>{label}</button>;
}
'@
if (-not $content.Contains($oldQuick)) { throw "QuickAction definition not found." }
$content = $content.Replace($oldQuick, $newQuick)

# 7) Let NavItem receive the click handler.
$oldNav = 'function NavItem({ icon: Icon, label, active, badge }) {\n  return <button type="button" className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition ${active ? "bg-[#eaf5ec] font-bold text-[#176b3e]" : "text-[#33453a] hover:bg-[#f3f7f3]"}`}><Icon size={19} /> <span className="flex-1 text-left">{label}</span>{badge && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d9363e] px-1 text-[10px] font-bold text-white">{badge}</span>}</button>;\n}'
$newNav = 'function NavItem({ icon: Icon, label, active, badge, onClick }) {\n  return <button type="button" onClick={onClick} className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition ${active ? "bg-[#eaf5ec] font-bold text-[#176b3e]" : "text-[#33453a] hover:bg-[#f3f7f3]"}`}><Icon size={19} /> <span className="flex-1 text-left">{label}</span>{badge && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d9363e] px-1 text-[10px] font-bold text-white">{badge}</span>}</button>;\n}'
if (-not $content.Contains($oldNav)) { throw "NavItem definition not found." }
$content = $content.Replace($oldNav, $newNav)

# 8) Add the information modal before the existing farm/crop modals.
$modalMarker = '      {modal === "farm" && <Modal title="Add your farm"'
$infoModal = @'
      {typeof modal === "string" && modal.startsWith("info:") && <Modal title={modal.slice(5)} onClose={() => setModal(null)}><div className="space-y-4"><div className="rounded-xl bg-[#edf8f0] p-4 text-sm leading-6 text-[#31523d]">{actionCopy[modal.slice(5)] || "This dashboard action is connected and ready for its module."}</div><button type="button" onClick={() => setModal(null)} className="w-full rounded-lg bg-[#176b3e] px-4 py-3 text-sm font-bold text-white hover:bg-[#115832]">Done</button></div></Modal>}
'@
if (-not $content.Contains($modalMarker)) { throw "Modal insertion marker not found." }
$content = $content.Replace($modalMarker, $infoModal + $modalMarker)

Set-Content $dashboard $content -Encoding UTF8
Write-Host "Dashboard action wiring applied successfully."
