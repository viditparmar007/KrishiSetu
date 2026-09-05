$ErrorActionPreference = "Stop"
$root = "D:\KrishiSetu"
$dashboard = Join-Path $root "frontend\src\pages\FarmerDashboard.jsx"
$section = Join-Path $root "frontend\src\pages\FarmerSectionPage.jsx"

if (-not (Test-Path $dashboard)) { throw "FarmerDashboard.jsx not found." }
if (-not (Test-Path $section)) { throw "FarmerSectionPage.jsx not found. Run git pull origin main first." }

$content = Get-Content $dashboard -Raw -Encoding UTF8

if ($content -notmatch 'FarmerSectionPage') {
  $content = $content.Replace(
    'import supportImage from "../assets/help-photo.png";',
    'import supportImage from "../assets/help-photo.png";`r`nimport FarmerSectionPage from "./FarmerSectionPage";'
  )
}

if ($content -notmatch 'const \[sectionPage, setSectionPage\]') {
  $content = $content.Replace(
    'const [modal, setModal] = useState(null);',
    'const [modal, setModal] = useState(null);`r`n  const [sectionPage, setSectionPage] = useState(null);'
  )
}

$content = $content.Replace(
  '<NavItem icon={House} label="Dashboard" active onClick={() => window.alert("You are already on the Dashboard.")} />',
  '<NavItem icon={House} label="Dashboard" active onClick={() => setSectionPage(null)} />'
)
$content = $content.Replace(
  '<NavItem icon={Tractor} label="My Farms" onClick={() => window.alert("My Farms section is ready.")} />',
  '<NavItem icon={Tractor} label="My Farms" onClick={() => setSectionPage("My Farms")} />'
)
$content = $content.Replace(
  '<NavItem icon={Wheat} label="My Crops" onClick={() => window.alert("My Crops section is ready.")} />',
  '<NavItem icon={Wheat} label="My Crops" onClick={() => setSectionPage("My Crops")} />'
)
$content = $content.Replace(
  '<NavItem icon={MapPin} label="Find Centre" onClick={() => window.alert("Find Centre section is ready.")} />',
  '<NavItem icon={MapPin} label="Find Centre" onClick={() => setSectionPage("Find Centre")} />'
)

if ($content -notmatch 'if \(sectionPage\)') {
  $content = $content.Replace(
    '  return (\r\n    <main',
    '  if (sectionPage) {`r`n    return <FarmerSectionPage section={sectionPage} farms={farms} crops={crops} onBack={() => setSectionPage(null)} />;`r`n  }`r`n`r`n  return (`r`n    <main'
  )
  if ($content -notmatch 'if \(sectionPage\)') {
    $content = $content.Replace(
      '  return (\n    <main',
      '  if (sectionPage) {`n    return <FarmerSectionPage section={sectionPage} farms={farms} crops={crops} onBack={() => setSectionPage(null)} />;`n  }`n`n  return (`n    <main'
    )
  }
}

# Make the two main dashboard panels clickable while keeping their action buttons intact.
if ($content -notmatch 'function Panel\(\{ title, subtitle, icon: Icon, action, children, onClick \}\)') {
  $content = $content.Replace(
    'function Panel({ title, subtitle, icon: Icon, action, children }) {',
    'function Panel({ title, subtitle, icon: Icon, action, children, onClick }) {'
  )
  $content = $content.Replace(
    'return <section className="rounded-2xl border border-[#dfe7df] bg-white p-5 shadow-[0_3px_14px_rgba(26,52,34,.025)]">',
    'return <section onClick={onClick} className={`rounded-2xl border border-[#dfe7df] bg-white p-5 shadow-[0_3px_14px_rgba(26,52,34,.025)] ${onClick ? "cursor-pointer transition hover:border-[#9dbba3] hover:shadow-md" : ""}`}>'
  )
}

$content = $content.Replace(
  '<Panel title="My Farms" subtitle="Manage your farm land and details" icon={Leaf} action={<button type="button" onClick={openFarmModal}',
  '<Panel title="My Farms" subtitle="Manage your farm land and details" icon={Leaf} onClick={() => setSectionPage("My Farms")} action={<button type="button" onClick={(event) => { event.stopPropagation(); openFarmModal(); }}'
)
$content = $content.Replace(
  '<Panel title="My Crops" subtitle="Track what you are growing" icon={Leaf} action={<button type="button" onClick={() => farms.length && openCropModal()} disabled={!farms.length}',
  '<Panel title="My Crops" subtitle="Track what you are growing" icon={Leaf} onClick={() => setSectionPage("My Crops")} action={<button type="button" onClick={(event) => { event.stopPropagation(); farms.length && openCropModal(); }} disabled={!farms.length}'
)

# Make the dashboard centre card open the centre page instead of an alert.
$content = $content.Replace(
  'onClick={() => window.alert("Procurement centre discovery will be connected to the centre module next.")}',
  'onClick={() => setSectionPage("Find Centre")}'
)

Set-Content $dashboard $content -Encoding UTF8
Write-Host "Farmer detail pages enabled."
