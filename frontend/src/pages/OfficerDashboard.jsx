import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart3,
  Building2,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  Filter,
  House,
  IndianRupee,
  Leaf,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  Package,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sprout,
  TrendingUp,
  UserCheck,
  UserRound,
  Users,
  X,
  Zap,
} from "lucide-react";
import officerApi from "../api/officerApi";
import sidebarFoliageImg from "../assets/dashboard/sidebar_foliage_clean.png";
import { clearAuthSession } from "../utils/authStorage";

const formatDateTime = (isoStr) => {
  if (!isoStr) return "—";
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoStr;
  }
};

const formatCurrency = (val) => {
  const num = Number(val || 0);
  return "₹" + num.toLocaleString("en-IN", { maximumFractionDigits: 0 });
};

function NavItem({ icon: Icon, label, active, badge, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] transition cursor-pointer ${
        active
          ? "bg-[#dcf2e3] font-black text-[#156534]"
          : "font-medium text-[#415649] hover:bg-[#eef6f1] hover:text-[#156534]"
      }`}
    >
      <span
        className={`flex items-center justify-center shrink-0 ${
          active ? "text-[#156534]" : "text-[#556d5e] group-hover:text-[#156534]"
        }`}
      >
        <Icon size={18} strokeWidth={active ? 2.4 : 1.9} />
      </span>
      <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="flex h-4 min-w-[18px] px-1 items-center justify-center rounded-full bg-[#16a34a] text-[9px] font-bold text-white shrink-0">
          {badge}
        </span>
      )}
    </button>
  );
}

export default function OfficerDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Officer Profile & Centre State
  const [officer, setOfficer] = useState(null);
  const [centre, setCentre] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  // Operational Data
  const [queueList, setQueueList] = useState([]);
  const [procurements, setProcurements] = useState([]);
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Inspection / Procurement Modal & Active Item
  const [activeProcurementModal, setActiveProcurementModal] = useState(null);
  const [docNotes, setDocNotes] = useState("");
  const [docVerified, setDocVerified] = useState(true);
  const [qualityGrade, setQualityGrade] = useState("Grade A (FAQ)");
  const [qualityNotes, setQualityNotes] = useState("Moisture 11.5%, within standard threshold.");
  const [measuredWeight, setMeasuredWeight] = useState("");
  const [acceptedWeight, setAcceptedWeight] = useState("");
  const [decisionType, setDecisionType] = useState("APPROVED");
  const [mspRate, setMspRate] = useState("2275");
  const [rejectReason, setRejectReason] = useState("");
  const [submittingStep, setSubmittingStep] = useState(false);

  // Payment Settlement Modal
  const [activePaymentModal, setActivePaymentModal] = useState(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Quick Action Modals
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [weighbridgeModalOpen, setWeighbridgeModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);

  // Manual Token Form State
  const [manualForm, setManualForm] = useState({
    farmer_name: "",
    farmer_phone: "",
    crop_name: "Wheat (गेहूं)",
    declared_quantity: "15",
    quantity_unit: "quintal",
    village: "Saharanpur Rural",
  });
  const [submittingManual, setSubmittingManual] = useState(false);

  // Weighbridge Form State
  const [weighForm, setWeighForm] = useState({
    selectedToken: "",
    gross_weight: "16.8",
    tare_weight: "1.8",
    moisture_percentage: "11.5",
    quality_grade: "Grade A (FAQ)",
    rate_per_unit: "2275",
    notes: "Verified on electronic weighbridge #01.",
  });
  const [submittingWeigh, setSubmittingWeigh] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const showToast = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(""), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setErrorMsg(""), 4000);
    }
  };

  // Fetch all officer data
  const loadData = useCallback(async (showIndicator = false) => {
    if (showIndicator) setRefreshing(true);
    try {
      const [meRes, centreRes, statsRes, qRes, procRes, payRes, bookRes] = await Promise.all([
        officerApi.getMe().catch(() => ({ data: null })),
        officerApi.getCentre().catch(() => ({ data: null })),
        officerApi.getAnalyticsSummary().catch(() => ({ data: null })),
        officerApi.getQueue().catch(() => ({ data: [] })),
        officerApi.getProcurements().catch(() => ({ data: [] })),
        officerApi.getPayments().catch(() => ({ data: [] })),
        officerApi.getBookings().catch(() => ({ data: [] })),
      ]);

      if (meRes?.data) setOfficer(meRes.data);
      if (centreRes?.data) setCentre(centreRes.data);
      if (statsRes?.data) setAnalytics(statsRes.data);
      if (Array.isArray(qRes?.data)) setQueueList(qRes.data);
      if (Array.isArray(procRes?.data)) setProcurements(procRes.data);
      if (Array.isArray(payRes?.data)) setPayments(payRes.data);
      if (Array.isArray(bookRes?.data)) setBookings(bookRes.data);
    } catch (err) {
      showToast("Error updating dashboard data: " + err.message, true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(false), 20000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setActivePaymentModal(null);
        setActiveProcurementModal(null);
        setManualModalOpen(false);
        setWeighbridgeModalOpen(false);
        setSummaryModalOpen(false);
        setSidebarOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    onLogout?.();
  };

  // Handle Call Next Farmer
  const handleCallNext = async () => {
    setRefreshing(true);
    try {
      const res = await officerApi.callNext();
      showToast(`📢 Called next farmer successfully! Token #${res?.data?.token || res?.data?.queue_number || "CALLED"}`);
      await loadData();
    } catch (err) {
      showToast(err.message || "Failed to call next farmer in queue.", true);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle Start Processing on a queue entry
  const handleStartProcessing = async (queueEntryId, bookingId) => {
    try {
      await officerApi.startProcessing(queueEntryId);
      showToast("Processing started. Proceeding to inspection desk.");
      await loadData();
      if (bookingId) {
        handleOpenInspectionForBooking(bookingId);
      }
    } catch (err) {
      showToast(err.message || "Could not start processing.", true);
    }
  };

  // Handle Mark Complete on queue entry
  const handleCompleteQueue = async (queueEntryId) => {
    try {
      await officerApi.completeQueue(queueEntryId);
      showToast("Farmer token marked COMPLETED.");
      await loadData();
    } catch (err) {
      showToast(err.message || "Failed to complete token.", true);
    }
  };

  // Handle Mark No-Show on queue entry
  const handleNoShow = async (queueEntryId) => {
    if (!window.confirm("Mark this token as NO-SHOW? The farmer will be skipped.")) return;
    try {
      await officerApi.markNoShow(queueEntryId);
      showToast("Token marked as NO-SHOW.");
      await loadData();
    } catch (err) {
      showToast(err.message || "Failed to mark no-show.", true);
    }
  };

  // Manual Token Entry Submission
  const handleManualEntrySubmit = async (e) => {
    e?.preventDefault();
    if (!manualForm.farmer_name.trim()) {
      showToast("Please enter farmer name.", true);
      return;
    }
    const cleanPhone = manualForm.farmer_phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      showToast("Please enter a valid 10-digit mobile number.", true);
      return;
    }
    setSubmittingManual(true);
    try {
      await officerApi.manualEntry({
        farmer_name: manualForm.farmer_name.trim(),
        farmer_phone: cleanPhone,
        crop_name: manualForm.crop_name,
        declared_quantity: Number(manualForm.declared_quantity) || 10,
        quantity_unit: manualForm.quantity_unit || "quintal",
        village: manualForm.village || "Local Village",
      });
      showToast("Gate token issued and added to queue successfully!");
      setManualModalOpen(false);
      setManualForm({
        farmer_name: "",
        farmer_phone: "",
        crop_name: "Wheat (गेहूं)",
        declared_quantity: "15",
        quantity_unit: "quintal",
        village: "Saharanpur Rural",
      });
      await loadData(true);
    } catch (err) {
      showToast(err.message || "Failed to issue manual token.", true);
    } finally {
      setSubmittingManual(false);
    }
  };

  // Check-In existing booking at gate
  const handleCheckInBooking = async (bookingId) => {
    try {
      await officerApi.checkInBooking(bookingId);
      showToast("Farmer checked in! Token issued and added to queue.");
      await loadData(true);
    } catch (err) {
      showToast(err.message || "Failed to check in booking.", true);
    }
  };

  // Weighbridge submission
  const handleWeighbridgeSubmit = async (decision = "APPROVED") => {
    setSubmittingWeigh(true);
    try {
      const targetQueueItem =
        queueList.find((x) => x.token === weighForm.selectedToken) ||
        queueList.find((x) => x.status === "PROCESSING" || x.status === "CALLED") ||
        queueList[0];

      if (!targetQueueItem) {
        showToast("No active farmer in queue to record weight for.", true);
        return;
      }

      const gross = Number(weighForm.gross_weight) || 0;
      const tare = Number(weighForm.tare_weight) || 0;
      const net = Math.max(0.1, gross - tare || targetQueueItem.declared_quantity || 10);

      let p = procurements.find((x) => x.booking_id === targetQueueItem.booking_id);
      if (!p) {
        const startRes = await officerApi.startProcurement(targetQueueItem.booking_id);
        p = startRes.data;
      }

      await officerApi.recordWeighing(p.id, {
        gross_weight: gross || net,
        tare_weight: tare || 0,
        net_weight: net,
        weighing_slip_number: `WS-${Date.now().toString().slice(-6)}`,
        scale_operator_notes: weighForm.notes,
      });

      await officerApi.qualityCheck(p.id, {
        grade: weighForm.quality_grade,
        moisture_percentage: Number(weighForm.moisture_percentage) || 11.5,
        notes: "Moisture within permissible limit.",
      });

      await officerApi.decideProcurement(p.id, {
        decision,
        rate_per_unit: Number(weighForm.rate_per_unit) || 2275,
        accepted_quantity: net,
        rejection_reason: decision === "REJECTED" ? "High moisture / foreign matter" : undefined,
      });

      await officerApi.completeQueue(targetQueueItem.queue_entry_id).catch(() => {});

      showToast(`Weighbridge reading recorded & produce ${decision.toLowerCase()}!`);
      setWeighbridgeModalOpen(false);
      await loadData(true);
    } catch (err) {
      showToast(err.message || "Failed to record weighbridge data.", true);
    } finally {
      setSubmittingWeigh(false);
    }
  };

  // Start Procurement workflow for a booking
  const handleOpenInspectionForBooking = async (bookingId) => {
    try {
      let p = procurements.find((x) => x.booking_id === bookingId);
      if (!p) {
        const startRes = await officerApi.startProcurement(bookingId);
        p = startRes.data;
        await loadData();
      }
      openProcurementModal(p);
    } catch (err) {
      showToast(err.message || "Failed to initiate procurement for booking.", true);
    }
  };

  const openProcurementModal = (procurementItem) => {
    setActiveProcurementModal(procurementItem);
    setDocVerified(procurementItem.documents_verified ?? true);
    setDocNotes(procurementItem.document_notes || "Aadhaar, Khasra, Bank Passbook verified.");
    setQualityGrade(procurementItem.quality_grade || "Grade A (FAQ)");
    setQualityNotes(procurementItem.quality_notes || "Moisture 11.8%, optimal grain lustre.");
    setMeasuredWeight(procurementItem.measured_quantity ? String(procurementItem.measured_quantity) : "");
    setAcceptedWeight(procurementItem.accepted_quantity ? String(procurementItem.accepted_quantity) : "");
    setDecisionType(procurementItem.decision || "APPROVED");
    setMspRate(procurementItem.rate_per_unit ? String(procurementItem.rate_per_unit) : "2275");
    setRejectReason(procurementItem.rejection_reason || "");
    setActiveTab("procurement");
  };

  // Step 1: Submit Documents Verification
  const handleSubmitDocuments = async () => {
    if (!activeProcurementModal) return;
    setSubmittingStep(true);
    try {
      const res = await officerApi.verifyDocuments(activeProcurementModal.id, {
        verified: docVerified,
        notes: docNotes,
      });
      showToast("Documents verified successfully.");
      setActiveProcurementModal(res.data);
      await loadData();
    } catch (err) {
      showToast(err.message || "Error verifying documents.", true);
    } finally {
      setSubmittingStep(false);
    }
  };

  // Step 2: Quality Inspection Submit
  const handleSubmitQuality = async () => {
    if (!activeProcurementModal) return;
    setSubmittingStep(true);
    try {
      const res = await officerApi.qualityCheck(activeProcurementModal.id, {
        grade: qualityGrade,
        moisture_percentage: 11.5,
        notes: qualityNotes,
      });
      showToast("Quality inspection recorded.");
      setActiveProcurementModal(res.data);
      await loadData();
    } catch (err) {
      showToast(err.message || "Error recording quality check.", true);
    } finally {
      setSubmittingStep(false);
    }
  };

  // Step 3: Weighing Submit
  const handleSubmitWeighing = async () => {
    if (!activeProcurementModal) return;
    const gross = Number(measuredWeight);
    if (!gross || gross <= 0) {
      showToast("Enter a valid weight in quintals.", true);
      return;
    }
    setSubmittingStep(true);
    try {
      const res = await officerApi.recordWeighing(activeProcurementModal.id, {
        gross_weight: gross,
        tare_weight: 0,
        net_weight: gross,
        weighing_slip_number: `WS-${Date.now().toString().slice(-6)}`,
        scale_operator_notes: "Weighed on digital weighbridge.",
      });
      showToast("Gross & Tare Weight recorded.");
      setActiveProcurementModal(res.data);
      setAcceptedWeight(String(gross));
      await loadData();
    } catch (err) {
      showToast(err.message || "Error recording weight.", true);
    } finally {
      setSubmittingStep(false);
    }
  };

  // Step 4: Decision & MSP Approval Submit
  const handleSubmitDecision = async () => {
    if (!activeProcurementModal) return;
    const finalQty = Number(acceptedWeight || measuredWeight);
    const rate = Number(mspRate);
    if (decisionType === "APPROVED" && (!finalQty || finalQty <= 0)) {
      showToast("Please specify accepted produce quantity.", true);
      return;
    }
    setSubmittingStep(true);
    try {
      const res = await officerApi.decideProcurement(activeProcurementModal.id, {
        decision: decisionType,
        rate_per_unit: rate,
        accepted_quantity: decisionType === "APPROVED" ? finalQty : 0,
        rejection_reason: decisionType === "REJECTED" ? rejectReason : undefined,
      });
      showToast(`Procurement ${decisionType.toLowerCase()}! Payment voucher created.`);
      setActiveProcurementModal(null);
      await loadData();
    } catch (err) {
      showToast(err.message || "Error finalizing decision.", true);
    } finally {
      setSubmittingStep(false);
    }
  };

  // Settle Payment
  const handleSettlePayment = async (paymentId, status, refNumber) => {
    setSubmittingPayment(true);
    try {
      await officerApi.updatePayment(paymentId, {
        status,
        reference_number: refNumber || `UTR-${Date.now()}`,
      });
      showToast(`Payment marked as ${status}.`);
      setActivePaymentModal(null);
      await loadData();
    } catch (err) {
      showToast(err.message || "Error updating payment status.", true);
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Computed metrics
  const activeFarmer = useMemo(() => {
    return queueList.find((x) => x.status === "PROCESSING" || x.status === "CALLED");
  }, [queueList]);

  const waitingCount = useMemo(() => {
    return queueList.filter((x) => x.status === "WAITING").length;
  }, [queueList]);

  const inCounterCount = useMemo(() => {
    return queueList.filter((x) => x.status === "PROCESSING" || x.status === "CALLED").length;
  }, [queueList]);

  const completedCount = useMemo(() => {
    return queueList.filter((x) => x.status === "COMPLETED").length;
  }, [queueList]);

  const disbursedTotal = useMemo(() => {
    return payments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [payments]);

  const filteredQueue = useMemo(() => {
    return queueList.filter((item) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        item.token?.toLowerCase().includes(term) ||
        item.crop_name?.toLowerCase().includes(term) ||
        item.farmer_name?.toLowerCase().includes(term) ||
        String(item.queue_number).includes(term);
      const matchStatus = filterStatus === "ALL" || item.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [queueList, searchTerm, filterStatus]);

  // Unchecked Bookings arrived for today
  const todayUncheckedBookings = useMemo(() => {
    const checkedInIds = new Set(queueList.map((q) => q.booking_id));
    return bookings.filter((b) => !checkedInIds.has(b.id) && b.status !== "CANCELLED");
  }, [bookings, queueList]);

  const officerCleanName = useMemo(() => {
    const raw = officer?.name || "Rajesh Sharma";
    return raw.replace(/\s*\([^)]*\)/g, "").trim() || "Rajesh Sharma";
  }, [officer?.name]);

  const renderSidebar = () => (
    <aside
      className={`fixed left-4 top-4 z-40 h-[calc(100vh-32px)] w-[264px] flex flex-col justify-between overflow-hidden rounded-[26px] border border-[#e4ece5] bg-white shadow-[0_8px_30px_rgba(20,60,35,0.035)] transition-transform duration-300 lg:flex ${
        sidebarOpen ? "flex translate-x-0" : "hidden -translate-x-full lg:translate-x-0"
      }`}
    >
      {/* Top Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#f0f4f1]/80 shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e6f7ec] text-[#16a34a] shadow-xs shrink-0">
          <Leaf size={22} strokeWidth={2.4} className="rotate-[-10deg]" />
        </div>
        <div>
          <p className="text-[20px] font-black tracking-[-0.035em] text-[#0e2618]">KrishiSetu</p>
          <p className="text-[10px] font-bold text-[#71887a] tracking-wide">Mandi Portal</p>
        </div>
      </div>

      {/* Nav List - All 7 items fully visible, no scrollbar */}
      <nav className="space-y-1 px-3 py-2 flex-1 flex flex-col justify-start">
        <NavItem
          icon={House}
          label="Dashboard"
          active={activeTab === "dashboard"}
          onClick={() => {
            setActiveTab("dashboard");
            setSidebarOpen(false);
          }}
        />
        <NavItem
          icon={Megaphone}
          label="Live Queue & Calling"
          active={activeTab === "queue"}
          onClick={() => {
            setActiveTab("queue");
            setSidebarOpen(false);
          }}
        />
        <NavItem
          icon={Scale}
          label="Inspection & Weighbridge"
          active={activeTab === "procurement"}
          onClick={() => {
            setActiveTab("procurement");
            setSidebarOpen(false);
          }}
        />
        <NavItem
          icon={IndianRupee}
          label="DBT Payment Clearance"
          active={activeTab === "payments"}
          onClick={() => {
            setActiveTab("payments");
            setSidebarOpen(false);
          }}
        />
        <NavItem
          icon={CalendarDays}
          label="Slot & Bookings"
          active={activeTab === "bookings"}
          onClick={() => {
            setActiveTab("bookings");
            setSidebarOpen(false);
          }}
        />
        <NavItem
          icon={BarChart3}
          label="Centre Reports & Quota"
          active={activeTab === "analytics"}
          onClick={() => {
            setActiveTab("analytics");
            setSidebarOpen(false);
          }}
        />
        <div className="my-1 border-t border-[#edf2ee]" />
        <NavItem
          icon={Settings}
          label="Settings"
          active={activeTab === "settings"}
          onClick={() => {
            setActiveTab("settings");
            setSidebarOpen(false);
          }}
        />
      </nav>

      {/* Bottom Cottage Illustration & Branding */}
      <div className="shrink-0 overflow-hidden pointer-events-none bg-white border-t border-[#edf3ee]">
        <div className="h-[120px] w-full overflow-hidden bg-[#eaf6ef]">
          <img
            src={sidebarFoliageImg}
            alt="KrishiSetu Farmland Illustration"
            className="w-full h-full object-cover object-center block"
          />
        </div>
        <div className="px-4.5 pb-4 pt-2.5 flex flex-col items-start gap-0.5 bg-white">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#064e3b] text-white shadow-xs shrink-0">
              <Leaf size={12} strokeWidth={2.4} />
            </div>
            <p className="text-[15px] font-black tracking-tight text-[#0e2618]">KrishiSetu</p>
          </div>
          <p className="text-[10px] font-medium text-[#526d5d] leading-tight">Empowering Farmers</p>
          <p className="text-[10px] font-medium text-[#526d5d] leading-tight">Strengthening Mandis</p>
        </div>
      </div>
    </aside>
  );

  const renderHeader = () => (
    <header className="rounded-[20px] border border-[#e2eae4] bg-white px-4 sm:px-6 py-3 shadow-sm flex items-center justify-between gap-3 sm:gap-4 mb-5 flex-nowrap">
      {/* Left: Officer Desk Title & Mandi badge */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 shrink">
        <button
          type="button"
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="lg:hidden p-2 rounded-xl border border-[#dfe7e1] text-[#374d40] hover:bg-[#f6faf7] shrink-0"
        >
          <Menu size={18} />
        </button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e6f7ec] text-[#15803d]">
          <Scale size={22} strokeWidth={2.4} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] sm:text-[17px] font-black tracking-tight text-[#0e2618] whitespace-nowrap">
              KrishiSetu Officer Desk
            </h1>
            <span className="hidden sm:inline-flex rounded-full border border-[#bbf7d0] bg-[#dcfce7] px-2.5 py-0.5 text-[9px] font-black tracking-wider text-[#15803d] shrink-0">
              MANDI PORTAL
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-[#526d5d] truncate">
            <Building2 size={13} className="text-[#15803d] shrink-0" />
            <span className="font-semibold text-[#1e3b2b] truncate">
              {centre?.name || "Mandi Samiti Saharanpur Hub"}
            </span>
            <span className="text-[#a4b8ab] shrink-0">|</span>
            <span className="font-mono text-[#789383] shrink-0">{centre?.code || "UP-SAH-001"}</span>
          </div>
        </div>
      </div>

      {/* Right: Officer Profile, Refresh, Logout */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#064e3b] text-[14px] sm:text-[15px] font-bold text-white shadow-xs shrink-0">
            {officerCleanName[0].toUpperCase()}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-[#0e2618] whitespace-nowrap">
              {officerCleanName} <span className="text-[#556d5e] font-semibold">({officer?.designation || "Senior Procurement Officer"})</span>
            </p>
            <p className="font-mono text-[10px] font-medium text-[#789383]">
              {officer?.employee_code || "OFFICER01"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing}
          title="Refresh Data"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#dce5df] bg-white text-[#415d4d] shadow-xs transition hover:bg-[#f6faf7] hover:text-[#15803d] cursor-pointer"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin text-[#15803d]" : ""} />
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 shrink-0 rounded-xl border border-[#fecaca] bg-white px-3 sm:px-3.5 py-2 text-xs font-bold text-[#ef4444] shadow-xs transition hover:bg-[#fef2f2] cursor-pointer"
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );

  const renderStatCards = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5 mb-5">
      {/* Card 1: Queue Waiting */}
      <div className="rounded-[20px] border border-[#fed7aa]/70 bg-[#fff7ed] p-3.5 shadow-xs flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#ffedd5] text-[#ea580c]">
          <Users size={18} strokeWidth={2.4} />
        </div>
        <div>
          <p className="text-[11px] font-medium text-[#9a3412]">Queue Waiting</p>
          <p className="my-0.5 text-[22px] font-black leading-none text-[#431407]">
            {analytics?.waiting ?? waitingCount}
          </p>
          <p className="text-[10px] text-[#9a3412]/80">Farmers in yard</p>
        </div>
      </div>

      {/* Card 2: In Counter */}
      <div className="rounded-[20px] border border-[#bfdbfe]/70 bg-[#eff6ff] p-3.5 shadow-xs flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#dbeafe] text-[#2563eb]">
          <Clock size={18} strokeWidth={2.4} />
        </div>
        <div>
          <p className="text-[11px] font-medium text-[#1e40af]">In Counter</p>
          <p className="my-0.5 text-[22px] font-black leading-none text-[#172554]">
            {analytics?.processing != null || analytics?.called != null
              ? (analytics?.processing || 0) + (analytics?.called || 0)
              : inCounterCount}
          </p>
          <p className="text-[10px] text-[#1e40af]/80">Being processed</p>
        </div>
      </div>

      {/* Card 3: Completed */}
      <div className="rounded-[20px] border border-[#bbf7d0]/70 bg-[#f0fdf4] p-3.5 shadow-xs flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#dcfce7] text-[#16a34a]">
          <CheckCircle2 size={18} strokeWidth={2.4} />
        </div>
        <div>
          <p className="text-[11px] font-medium text-[#166534]">Completed</p>
          <p className="my-0.5 text-[22px] font-black leading-none text-[#052e16]">
            {analytics?.queue_completed ?? completedCount}
          </p>
          <p className="text-[10px] text-[#166534]/80">Today's completed</p>
        </div>
      </div>

      {/* Card 4: Total Procured */}
      <div className="rounded-[20px] border border-[#e9d5ff]/70 bg-[#faf5ff] p-3.5 shadow-xs flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f3e8ff] text-[#9333ea]">
          <Package size={18} strokeWidth={2.4} />
        </div>
        <div>
          <p className="text-[11px] font-medium text-[#6b21a8]">Total Procured</p>
          <p className="my-0.5 text-[20px] font-black leading-none text-[#3b0764]">
            {analytics?.procured_quantity != null
              ? `${Number(analytics.procured_quantity).toFixed(1)} Qtl`
              : "0.0 Qtl"}
          </p>
          <p className="text-[10px] text-[#6b21a8]/80">Today's procurement</p>
        </div>
      </div>

      {/* Card 5: Disbursed */}
      <div className="rounded-[20px] border border-[#a7f3d0]/70 bg-[#ecfdf5] p-3.5 shadow-xs flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#d1fae5] text-[#059669]">
          <IndianRupee size={18} strokeWidth={2.4} />
        </div>
        <div>
          <p className="text-[11px] font-medium text-[#065f46]">Disbursed</p>
          <p className="my-0.5 text-[22px] font-black leading-none text-[#022c22]">
            {formatCurrency(disbursedTotal || analytics?.procurement_value || 0)}
          </p>
          <p className="text-[10px] text-[#065f46]/80">DBT payments</p>
        </div>
      </div>

      {/* Card 6: Avg Time */}
      <div className="rounded-[20px] border border-[#fecdd3]/70 bg-[#fff1f2] p-3.5 shadow-xs flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#ffe4e6] text-[#e11d48]">
          <TrendingUp size={18} strokeWidth={2.4} />
        </div>
        <div>
          <p className="text-[11px] font-medium text-[#9f1239]">Avg Time</p>
          <p className="my-0.5 text-[22px] font-black leading-none text-[#4c0519]">
            {analytics?.average_service_minutes ? Math.round(analytics.average_service_minutes) : 10} min
          </p>
          <p className="text-[10px] text-[#9f1239]/80">Per farmer</p>
        </div>
      </div>
    </div>
  );

  const renderDashboardMain = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left Column: Today's Center Queue (Col 8) */}
      <div className="lg:col-span-8 rounded-[24px] border border-[#e2eae4] bg-white p-6 shadow-sm min-h-[460px] flex flex-col justify-between">
        <div>
          {/* Header Row: Title & Search/Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
            <div>
              <h2 className="text-[18px] font-black tracking-tight text-[#0e2618]">
                Today's Center Queue ({filteredQueue.length})
              </h2>
              <p className="text-xs text-[#627d6d] mt-0.5">
                Live arrival sequence of registered farmers
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Search box */}
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-3 text-[#8ca395]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search token / crop..."
                  className="w-[185px] rounded-xl border border-[#dce5df] bg-[#f9fbf9] pl-8.5 pr-3 py-1.5 text-xs text-[#0e2618] outline-none placeholder:text-[#8ca395] focus:border-[#16a34a] focus:bg-white transition"
                />
              </div>

              {/* Status Dropdown */}
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none rounded-xl border border-[#dce5df] bg-white pl-3.5 pr-8 py-1.5 text-xs font-bold text-[#2e4738] shadow-xs outline-none hover:bg-gray-50 cursor-pointer focus:border-[#16a34a]"
                >
                  <option value="ALL">All Status</option>
                  <option value="WAITING">Waiting</option>
                  <option value="CALLED">Called</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="NO_SHOW">No Show</option>
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#647c6e]"
                />
              </div>
            </div>
          </div>

          {/* Table Headers */}
          <div className="rounded-xl bg-[#f7faf8] px-4 py-2.5 text-[11px] font-black text-[#476353] grid grid-cols-12 gap-2">
            <span className="col-span-1">#</span>
            <span className="col-span-2">Token No.</span>
            <span className="col-span-3">Farmer Name</span>
            <span className="col-span-2">Crop</span>
            <span className="col-span-2">Arrival Time</span>
            <span className="col-span-1">Status</span>
            <span className="col-span-1 text-right">Action</span>
          </div>

          {/* Table Content */}
          {filteredQueue.length === 0 ? (
            /* Exact Empty State matching media_1790774214754.png */
            <div className="my-auto py-20 flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center text-[#9ca3af]">
                <Users size={56} strokeWidth={1.4} />
              </div>
              <h3 className="mt-3 text-[17px] font-bold text-[#1f2937]">
                No farmers in queue
              </h3>
              <p className="mt-1 text-xs text-[#6b7280]">
                When farmers arrive, they will appear here.
              </p>
            </div>
          ) : (
            /* Populated Table Rows with Real Data */
            <div className="divide-y divide-[#eef4f0] mt-1">
              {filteredQueue.map((item, index) => {
                const status = item.status;
                let badgeBg = "bg-[#fef3c7] text-[#b45309]";
                let badgeText = "Waiting";
                if (status === "CALLED") {
                  badgeBg = "bg-[#dbeafe] text-[#1d4ed8]";
                  badgeText = "Called";
                } else if (status === "PROCESSING") {
                  badgeBg = "bg-[#e0e7ff] text-[#4338ca]";
                  badgeText = "In Counter";
                } else if (status === "COMPLETED") {
                  badgeBg = "bg-[#dcfce7] text-[#15803d]";
                  badgeText = "Completed";
                } else if (status === "NO_SHOW") {
                  badgeBg = "bg-[#fee2e2] text-[#b91c1c]";
                  badgeText = "Skipped";
                }

                return (
                  <div
                    key={item.queue_entry_id || index}
                    className="grid grid-cols-12 gap-2 items-center px-4 py-3 text-xs transition hover:bg-[#fbfdfc]"
                  >
                    <span className="col-span-1 font-bold text-[#627d6d]">{index + 1}</span>
                    <span className="col-span-2 font-mono font-black text-[#15803d] text-[13px]">
                      {item.token || `UP-${item.queue_number}`}
                    </span>
                    <div className="col-span-3">
                      <p className="font-bold text-[#0e2618]">
                        {item.farmer_name || "Registered Farmer"}
                      </p>
                      {item.farmer_phone && (
                        <p className="text-[10px] text-[#718a7a] font-mono">{item.farmer_phone}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <p className="font-bold text-[#0e2618]">{item.crop_name || "Wheat"}</p>
                      <p className="text-[10px] text-[#718a7a]">
                        {item.declared_quantity} {item.quantity_unit || "Qtl"}
                      </p>
                    </div>
                    <span className="col-span-2 text-[#466050] font-medium">
                      {formatDateTime(item.checked_in_at)}
                    </span>
                    <span className="col-span-1">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${badgeBg}`}>
                        {badgeText}
                      </span>
                    </span>
                    <div className="col-span-1 text-right">
                      {status === "WAITING" && (
                        <button
                          type="button"
                          onClick={handleCallNext}
                          className="px-2.5 py-1 rounded-lg bg-[#15803d] hover:bg-[#0f602c] text-white font-bold text-[11px] shadow-xs cursor-pointer transition"
                        >
                          Call
                        </button>
                      )}
                      {status === "CALLED" && (
                        <button
                          type="button"
                          onClick={() => handleStartProcessing(item.queue_entry_id, item.booking_id)}
                          className="px-2.5 py-1 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-[11px] shadow-xs cursor-pointer transition"
                        >
                          Start
                        </button>
                      )}
                      {status === "PROCESSING" && (
                        <button
                          type="button"
                          onClick={() => {
                            setWeighForm((prev) => ({ ...prev, selectedToken: item.token }));
                            setWeighbridgeModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#d97706] hover:bg-[#b45309] text-white font-bold text-[11px] shadow-xs cursor-pointer transition"
                        >
                          Weigh
                        </button>
                      )}
                      {status === "COMPLETED" && (
                        <span className="text-[#15803d] font-bold text-[11px]">Done</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Quick Actions (Col 4) */}
      <div className="lg:col-span-4 rounded-[24px] border border-[#e2eae4] bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-start">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-[#16a34a] fill-[#16a34a]" />
          <h2 className="text-[17px] font-black text-[#0e2618]">Quick Actions</h2>
        </div>

        {/* Action 1: Manual Token Entry */}
        <button
          type="button"
          onClick={() => setManualModalOpen(true)}
          className="mt-4 flex w-full items-center justify-between rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] hover:bg-[#e0f2fe] p-4 text-left transition cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#dbeafe] text-[#2563eb] shadow-xs">
              <Plus size={18} strokeWidth={2.6} />
            </div>
            <div>
              <p className="text-[14px] font-bold text-[#1e40af]">Manual Token Entry</p>
              <p className="text-[11px] text-[#3b82f6]">Add farmer manually</p>
            </div>
          </div>
          <ChevronRight size={18} strokeWidth={2.4} className="text-[#2563eb]" />
        </button>

        {/* Action 2: Open Weighbridge */}
        <button
          type="button"
          onClick={() => {
            const current = activeFarmer || queueList[0];
            if (current) {
              setWeighForm((prev) => ({ ...prev, selectedToken: current.token }));
            }
            setWeighbridgeModalOpen(true);
          }}
          className="mt-3 flex w-full items-center justify-between rounded-2xl border border-[#fde68a] bg-[#fffbeb] hover:bg-[#fef3c7] p-4 text-left transition cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fef3c7] text-[#d97706] shadow-xs">
              <Scale size={18} strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-[14px] font-bold text-[#92400e]">Open Weighbridge</p>
              <p className="text-[11px] text-[#b45309]">View weighbridge status</p>
            </div>
          </div>
          <ChevronRight size={18} strokeWidth={2.4} className="text-[#d97706]" />
        </button>

        {/* Action 3: View Today's Summary */}
        <button
          type="button"
          onClick={() => setSummaryModalOpen(true)}
          className="mt-3 flex w-full items-center justify-between rounded-2xl border border-[#e9d5ff] bg-[#faf5ff] hover:bg-[#f3e8ff] p-4 text-left transition cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f3e8ff] text-[#9333ea] shadow-xs">
              <FileText size={18} strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-[14px] font-bold text-[#581c87]">View Today's Summary</p>
              <p className="text-[11px] text-[#7e22ce]">Check today's reports</p>
            </div>
          </div>
          <ChevronRight size={18} strokeWidth={2.4} className="text-[#9333ea]" />
        </button>
      </div>
    </div>
  );

  // Manual Token Entry Modal
  const renderManualModal = () => {
    if (!manualModalOpen) return null;
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs"
        onClick={(e) => {
          if (e.target === e.currentTarget) setManualModalOpen(false);
        }}
      >
        <div className="w-full max-w-lg rounded-[26px] bg-white p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#edf3ee] pb-3">
            <div>
              <h3 className="text-lg font-black text-[#0e2618]">Manual Token Entry (Gate Desk)</h3>
              <p className="text-xs text-[#556d5e]">Add walk-in farmer or check-in today's booked arrival</p>
            </div>
            <button
              type="button"
              onClick={() => setManualModalOpen(false)}
              className="p-1 rounded-xl text-[#789383] hover:bg-[#f2f7f4] cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Check-in of Booked Arrivals */}
          {todayUncheckedBookings.length > 0 && (
            <div className="rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] p-3.5 space-y-2">
              <p className="text-xs font-bold text-[#15803d] flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Registered Farmers Arrived at Mandi ({todayUncheckedBookings.length}):
              </p>
              <div className="max-h-28 overflow-y-auto divide-y divide-[#dcfce7]">
                {todayUncheckedBookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-1.5 text-xs">
                    <div>
                      <span className="font-bold text-[#0e2618]">{b.crop?.crop_name || "Wheat"}</span>
                      <span className="text-[#556d5e] ml-1">({b.declared_quantity} {b.quantity_unit})</span>
                      <span className="font-mono text-[#789383] ml-2 text-[10px]">Token: {b.token}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCheckInBooking(b.id)}
                      className="px-2.5 py-1 rounded-lg bg-[#15803d] hover:bg-[#0f602c] text-white font-bold text-[11px] shadow-xs cursor-pointer"
                    >
                      Gate Check-In
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Walk-in Form */}
          <form onSubmit={handleManualEntrySubmit} className="space-y-3 pt-1">
            <p className="text-xs font-bold text-[#0e2618] uppercase tracking-wider text-[11px]">
              Or Register Direct Walk-In Farmer
            </p>
            <div>
              <label className="block text-xs font-bold text-[#2e4738] mb-1">Farmer Full Name *</label>
              <input
                type="text"
                required
                value={manualForm.farmer_name}
                onChange={(e) => setManualForm({ ...manualForm, farmer_name: e.target.value })}
                placeholder="e.g. Ram Kumar"
                className="w-full text-xs p-2.5 rounded-xl border border-[#dce5df] bg-[#fbfdfb] font-medium outline-none focus:border-[#16a34a]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#2e4738] mb-1">Mobile Number *</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={manualForm.farmer_phone}
                  onChange={(e) => setManualForm({ ...manualForm, farmer_phone: e.target.value.replace(/\D/g, "") })}
                  placeholder="10-digit number"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#dce5df] bg-[#fbfdfb] font-medium outline-none focus:border-[#16a34a]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2e4738] mb-1">Crop *</label>
                <select
                  value={manualForm.crop_name}
                  onChange={(e) => setManualForm({ ...manualForm, crop_name: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#dce5df] bg-[#fbfdfb] font-medium outline-none focus:border-[#16a34a]"
                >
                  <option value="Wheat (गेहूं)">Wheat (गेहूं)</option>
                  <option value="Rice (धान)">Rice (धान)</option>
                  <option value="Sugarcane (गन्ना)">Sugarcane (गन्ना)</option>
                  <option value="Mustard (सरसों)">Mustard (सरसों)</option>
                  <option value="Maize (मक्का)">Maize (मक्का)</option>
                  <option value="Gram (चना)">Gram (चना)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#2e4738] mb-1">Estimated Qty (Quintals) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={manualForm.declared_quantity}
                  onChange={(e) => setManualForm({ ...manualForm, declared_quantity: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#dce5df] bg-[#fbfdfb] font-medium outline-none focus:border-[#16a34a]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2e4738] mb-1">Village / District</label>
                <input
                  type="text"
                  value={manualForm.village}
                  onChange={(e) => setManualForm({ ...manualForm, village: e.target.value })}
                  placeholder="e.g. Saharanpur"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#dce5df] bg-[#fbfdfb] font-medium outline-none focus:border-[#16a34a]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#edf3ee]">
              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#556d5e] hover:bg-[#f2f7f4] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingManual}
                className="px-5 py-2.5 rounded-xl bg-[#15803d] hover:bg-[#0f602c] text-white text-xs font-bold shadow-md cursor-pointer transition disabled:opacity-50"
              >
                {submittingManual ? "Generating..." : "Generate Token & Add to Queue"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Weighbridge Modal
  const renderWeighbridgeModal = () => {
    if (!weighbridgeModalOpen) return null;
    const gross = Number(weighForm.gross_weight) || 0;
    const tare = Number(weighForm.tare_weight) || 0;
    const net = Math.max(0, gross - tare);
    const msp = Number(weighForm.rate_per_unit) || 2275;
    const totalPayout = net * msp;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs"
        onClick={(e) => {
          if (e.target === e.currentTarget) setWeighbridgeModalOpen(false);
        }}
      >
        <div className="w-full max-w-lg rounded-[26px] bg-white p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#edf3ee] pb-3">
            <div className="flex items-center gap-2">
              <Scale size={20} className="text-[#15803d]" />
              <h3 className="text-lg font-black text-[#0e2618]">Digital Weighbridge Scale</h3>
            </div>
            <button
              type="button"
              onClick={() => setWeighbridgeModalOpen(false)}
              className="p-1 rounded-xl text-[#789383] hover:bg-[#f2f7f4] cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-3">
            {/* Farmer / Token select */}
            <div>
              <label className="block text-xs font-bold text-[#2e4738] mb-1">Select Farmer Token in Yard</label>
              <select
                value={weighForm.selectedToken}
                onChange={(e) => setWeighForm({ ...weighForm, selectedToken: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-[#dce5df] bg-[#fbfdfb] font-medium outline-none focus:border-[#16a34a]"
              >
                {queueList.length === 0 ? (
                  <option value="">No farmers currently in queue</option>
                ) : (
                  queueList.map((q) => (
                    <option key={q.token} value={q.token}>
                      Token #{q.token} — {q.farmer_name || "Farmer"} ({q.crop_name}, {q.declared_quantity} Qtl)
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Weighbridge Electronic Readings */}
            <div className="grid grid-cols-3 gap-2.5 rounded-2xl border border-[#dce5df] bg-[#f7faf8] p-3">
              <div>
                <label className="block text-[11px] font-bold text-[#556d5e]">Gross Wt (Qtl)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weighForm.gross_weight}
                  onChange={(e) => setWeighForm({ ...weighForm, gross_weight: e.target.value })}
                  placeholder="0.0"
                  className="mt-1 w-full text-xs p-2 rounded-lg border border-[#cfe0d5] bg-white font-black"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#556d5e]">Tare / Trolley (Qtl)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weighForm.tare_weight}
                  onChange={(e) => setWeighForm({ ...weighForm, tare_weight: e.target.value })}
                  placeholder="0.0"
                  className="mt-1 w-full text-xs p-2 rounded-lg border border-[#cfe0d5] bg-white font-black"
                />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-[11px] font-bold text-[#15803d]">Net Produce Wt</span>
                <span className="text-base font-black text-[#15803d] mt-1">{net.toFixed(2)} Qtl</span>
              </div>
            </div>

            {/* Quality & MSP */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#2e4738] mb-1">Quality Grade</label>
                <select
                  value={weighForm.quality_grade}
                  onChange={(e) => setWeighForm({ ...weighForm, quality_grade: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-[#dce5df] bg-[#fbfdfb] font-medium"
                >
                  <option value="Grade A (FAQ)">Grade A (FAQ Standard)</option>
                  <option value="Grade B">Grade B</option>
                  <option value="Substandard">Substandard</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2e4738] mb-1">Moisture Level (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weighForm.moisture_percentage}
                  onChange={(e) => setWeighForm({ ...weighForm, moisture_percentage: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-[#dce5df] bg-[#fbfdfb] font-medium"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[#dcfce7] bg-[#f0fdf4] p-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#166534]">Government MSP Rate: ₹{msp} / Qtl</p>
                <p className="text-xs text-[#527060]">Calculated Total DBT Payout</p>
              </div>
              <p className="text-lg font-black text-[#15803d]">{formatCurrency(totalPayout)}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#edf3ee]">
              <button
                type="button"
                onClick={() => setWeighbridgeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#556d5e] hover:bg-[#f2f7f4] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingWeigh}
                onClick={() => handleWeighbridgeSubmit("REJECTED")}
                className="px-3.5 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold cursor-pointer"
              >
                Reject Consignment
              </button>
              <button
                type="button"
                disabled={submittingWeigh}
                onClick={() => handleWeighbridgeSubmit("APPROVED")}
                className="px-5 py-2.5 rounded-xl bg-[#15803d] hover:bg-[#0f602c] text-white text-xs font-bold shadow-md cursor-pointer transition"
              >
                {submittingWeigh ? "Recording..." : "Approve & Complete Procurement"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Today's Summary Modal
  const renderSummaryModal = () => {
    if (!summaryModalOpen) return null;
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs"
        onClick={(e) => {
          if (e.target === e.currentTarget) setSummaryModalOpen(false);
        }}
      >
        <div className="w-full max-w-lg rounded-[26px] bg-white p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#edf3ee] pb-3">
            <div>
              <h3 className="text-lg font-black text-[#0e2618]">Today's Mandi Summary Report</h3>
              <p className="text-xs text-[#556d5e]">
                {centre?.name || "Mandi Samiti Saharanpur Hub"} — {new Date().toLocaleDateString("en-IN")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSummaryModalOpen(false)}
              className="p-1 rounded-xl text-[#789383] hover:bg-[#f2f7f4] cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#fed7aa] bg-[#fff7ed] p-3">
                <span className="text-[#9a3412] font-bold">Waiting in Yard</span>
                <p className="text-2xl font-black text-[#431407] mt-1">{waitingCount}</p>
              </div>
              <div className="rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] p-3">
                <span className="text-[#166534] font-bold">Completed Today</span>
                <p className="text-2xl font-black text-[#052e16] mt-1">{completedCount}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#e9d5ff] bg-[#faf5ff] p-3">
                <span className="text-[#6b21a8] font-bold">Total Procured Produce</span>
                <p className="text-xl font-black text-[#3b0764] mt-1">
                  {analytics?.procured_quantity != null ? `${Number(analytics.procured_quantity).toFixed(1)} Qtl` : "0.0 Qtl"}
                </p>
              </div>
              <div className="rounded-2xl border border-[#a7f3d0] bg-[#ecfdf5] p-3">
                <span className="text-[#065f46] font-bold">Total Disbursed (DBT)</span>
                <p className="text-xl font-black text-[#022c22] mt-1">
                  {formatCurrency(disbursedTotal || analytics?.procurement_value || 0)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#dce5df] bg-[#f7faf8] p-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#556d5e]">Scheduled Arrival Bookings:</span>
                <span className="font-bold text-[#0e2618]">{bookings.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#556d5e]">Average Turnaround Time:</span>
                <span className="font-bold text-[#0e2618]">10 minutes per farmer</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#556d5e]">Official Weighbridge Status:</span>
                <span className="font-bold text-[#15803d]">Online & Calibrated</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#edf3ee]">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl border border-[#dce5df] bg-white text-xs font-bold text-[#0e2618] hover:bg-gray-50 cursor-pointer shadow-xs"
              >
                Print Report
              </button>
              <button
                type="button"
                onClick={() => setSummaryModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#15803d] hover:bg-[#0f602c] text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2f7f4] flex flex-col items-center justify-center text-[#10251a]">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-[#15803d] shadow-xl mb-4 border border-[#e2eae4]">
          <RefreshCw className="w-8 h-8 animate-spin text-[#15803d]" />
        </div>
        <h2 className="text-xl font-extrabold text-[#0e2618]">Connecting to KrishiSetu Mandi Portal...</h2>
        <p className="text-[#597565] text-sm mt-1">Loading centre queue, procurement records, and DBT ledger.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f2f7f4] text-[#0e2618] font-sans">
      {/* Background Soft Green Wave Decorator */}
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#dcf0e2]/60 via-[#edf6f0]/40 to-transparent z-0" />

      {/* Left Sidebar */}
      {renderSidebar()}

      {/* Main Content Pane */}
      <div className="relative z-10 min-w-0 flex-1 lg:pl-[284px]">
        <div className="mx-auto w-full max-w-[1360px] px-4 py-4 sm:px-6 lg:px-8">
          {/* Header */}
          {renderHeader()}

          {/* Toast notifications */}
          {successMsg && (
            <div className="mb-4 rounded-2xl border border-[#bce8cb] bg-[#edf9f1] px-4 py-3 text-xs sm:text-sm font-bold text-[#135933] shadow-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#17824b] shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="mb-4 rounded-2xl border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-xs sm:text-sm font-bold text-[#9f1239] shadow-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#be123c] shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sub-Views based on activeTab */}
          {activeTab === "dashboard" && (
            <>
              {/* 6 Stat Cards Row */}
              {renderStatCards()}

              {/* Main Center Queue and Quick Actions */}
              {renderDashboardMain()}
            </>
          )}

          {/* TAB: Live Queue & Calling */}
          {activeTab === "queue" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab("dashboard")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#15803d] hover:underline cursor-pointer"
                >
                  ← Back to Main Dashboard
                </button>
              </div>

              {/* Calling Controller Card */}
              <div className="rounded-[24px] border border-[#e2eae4] bg-white p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#dff3e7] text-[#176c42] mb-2">
                      <Megaphone size={14} /> LIVE TOKEN CONTROLLER
                    </div>
                    <h2 className="text-2xl font-black text-[#0e2618]">
                      {activeFarmer ? (
                        <span>Currently Serving: <span className="text-[#15803d]">Token #{activeFarmer.token}</span></span>
                      ) : (
                        "No Farmer Currently at Counter"
                      )}
                    </h2>
                    <p className="text-xs text-[#527060] mt-1">
                      {activeFarmer
                        ? `Farmer ${activeFarmer.farmer_name || "in yard"} with Token ${activeFarmer.token} declared ${activeFarmer.declared_quantity} ${activeFarmer.quantity_unit} of ${activeFarmer.crop_name}.`
                        : `There are ${waitingCount} farmers waiting in the centre yard. Click below to announce next token.`}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCallNext}
                      disabled={refreshing || waitingCount === 0}
                      className="px-6 py-3 rounded-2xl bg-[#15803d] hover:bg-[#0f602c] text-white font-bold text-sm shadow-md transition cursor-pointer disabled:opacity-50"
                    >
                      📢 Call Next Farmer
                    </button>
                    {activeFarmer && (
                      <button
                        type="button"
                        onClick={() => handleCompleteQueue(activeFarmer.queue_entry_id)}
                        className="px-5 py-3 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm shadow-md transition cursor-pointer"
                      >
                        ✓ Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Queue List */}
              <div className="rounded-[24px] border border-[#e2eae4] bg-white p-6 shadow-sm">
                <h3 className="text-lg font-black text-[#0e2618] mb-4">Complete Centre Queue Sequence</h3>
                {renderDashboardMain()}
              </div>
            </div>
          )}

          {/* TAB: Inspection & Weighbridge Desk */}
          {activeTab === "procurement" && (
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => setActiveTab("dashboard")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#15803d] hover:underline cursor-pointer"
              >
                ← Back to Main Dashboard
              </button>

              <div className="rounded-[24px] border border-[#e2eae4] bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#edf3ee]">
                  <div>
                    <h2 className="text-xl font-black text-[#0e2618]">Inspection & Digital Weighbridge Desk</h2>
                    <p className="text-xs text-[#527060]">4-step verification, moisture test, and MSP approval</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWeighbridgeModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#15803d] text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    + Open Quick Weighbridge
                  </button>
                </div>

                {/* 4-Step Stepper if active procurement */}
                {activeProcurementModal ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                      {[
                        { id: "1", title: "1. Document Check", done: activeProcurementModal.documents_verified },
                        { id: "2", title: "2. Quality & Moisture", done: Boolean(activeProcurementModal.quality_grade) },
                        { id: "3", title: "3. Weighbridge Scale", done: Boolean(activeProcurementModal.measured_quantity) },
                        { id: "4", title: "4. MSP Payout Decision", done: Boolean(activeProcurementModal.decision) },
                      ].map((step) => (
                        <div
                          key={step.id}
                          className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                            step.done ? "bg-[#f0fdf4] border-[#bbf7d0] text-[#15803d] font-bold" : "bg-[#f9fbf9] text-[#789383]"
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${step.done ? "bg-[#15803d]" : "bg-[#9ca3af]"}`}>
                            {step.done ? "✓" : step.id}
                          </span>
                          <span>{step.title}</span>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-2xl border border-[#dce5df] bg-[#fbfdfb] p-5 space-y-4">
                      {activeProcurementModal.stage === "DOCUMENT_VERIFICATION" && (
                        <div className="space-y-3">
                          <h4 className="font-bold text-sm text-[#0e2618]">Verify Farmer Land & Bank Credentials</h4>
                          <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={docVerified}
                              onChange={(e) => setDocVerified(e.target.checked)}
                              className="w-4 h-4 text-[#15803d] rounded"
                            />
                            Aadhaar, Khasra land record, and Bank Passbook verified
                          </label>
                          <button
                            type="button"
                            onClick={handleSubmitDocuments}
                            disabled={submittingStep}
                            className="px-5 py-2.5 rounded-xl bg-[#15803d] text-white text-xs font-bold shadow-xs cursor-pointer"
                          >
                            Verify & Proceed to Quality Check →
                          </button>
                        </div>
                      )}

                      {activeProcurementModal.stage === "QUALITY_CHECK" && (
                        <div className="space-y-3">
                          <h4 className="font-bold text-sm text-[#0e2618]">Quality & Moisture Inspection</h4>
                          <div className="grid grid-cols-2 gap-3 max-w-md">
                            <div>
                              <label className="block text-xs font-bold text-[#556d5e] mb-1">Grade</label>
                              <select
                                value={qualityGrade}
                                onChange={(e) => setQualityGrade(e.target.value)}
                                className="w-full text-xs p-2 rounded-xl border border-[#dce5df]"
                              >
                                <option value="Grade A (FAQ)">Grade A (FAQ Standard)</option>
                                <option value="Grade B">Grade B</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-[#556d5e] mb-1">Moisture %</label>
                              <input
                                type="text"
                                value={qualityNotes}
                                onChange={(e) => setQualityNotes(e.target.value)}
                                className="w-full text-xs p-2 rounded-xl border border-[#dce5df]"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleSubmitQuality}
                            disabled={submittingStep}
                            className="px-5 py-2.5 rounded-xl bg-[#15803d] text-white text-xs font-bold shadow-xs cursor-pointer"
                          >
                            Save Quality & Proceed to Weighing →
                          </button>
                        </div>
                      )}

                      {activeProcurementModal.stage === "WEIGHING" && (
                        <div className="space-y-3">
                          <h4 className="font-bold text-sm text-[#0e2618]">Weighbridge Measurement</h4>
                          <div className="max-w-xs">
                            <label className="block text-xs font-bold text-[#556d5e] mb-1">Net Produce Weight (Qtl)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={measuredWeight}
                              onChange={(e) => setMeasuredWeight(e.target.value)}
                              placeholder="e.g. 24.5"
                              className="w-full text-xs p-2 rounded-xl border border-[#dce5df]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleSubmitWeighing}
                            disabled={submittingStep}
                            className="px-5 py-2.5 rounded-xl bg-[#15803d] text-white text-xs font-bold shadow-xs cursor-pointer"
                          >
                            Save Weight & Proceed to Payout →
                          </button>
                        </div>
                      )}

                      {(activeProcurementModal.stage === "DECISION" || activeProcurementModal.stage === "COMPLETED") && (
                        <div className="space-y-3">
                          <h4 className="font-bold text-sm text-[#0e2618]">MSP Payment Approval</h4>
                          <div className="rounded-xl bg-[#f0fdf4] p-3 text-xs">
                            <p>Quantity: <span className="font-black text-[#15803d]">{acceptedWeight || measuredWeight} Qtl</span></p>
                            <p>MSP Rate: <span className="font-black text-[#15803d]">₹{mspRate} / Qtl</span></p>
                            <p className="text-sm font-black text-[#0e2618] mt-1">
                              Payout Total: {formatCurrency((Number(acceptedWeight || measuredWeight) || 0) * (Number(mspRate) || 2275))}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleSubmitDecision}
                            disabled={submittingStep}
                            className="px-5 py-2.5 rounded-xl bg-[#15803d] text-white text-xs font-bold shadow-xs cursor-pointer"
                          >
                            Finalize & Disburse Voucher
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-[#edf3ee]">
                    {procurements.length === 0 ? (
                      <p className="text-xs text-[#718a7a] py-6 text-center">No active procurement workflows right now.</p>
                    ) : (
                      procurements.map((p) => (
                        <div key={p.id} className="flex items-center justify-between py-3 text-xs">
                          <div>
                            <span className="font-bold text-[#0e2618]">Procurement Record #{p.id}</span>
                            <span className="text-[#556d5e] ml-2">Booking #{p.booking_id}</span>
                            <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-[#f0fdf4] text-[#15803d] font-bold text-[10px]">
                              {p.stage}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => openProcurementModal(p)}
                            className="px-3 py-1.5 rounded-xl bg-[#15803d] text-white font-bold text-xs"
                          >
                            Open Desk
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: DBT Payment Clearance */}
          {activeTab === "payments" && (
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => setActiveTab("dashboard")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#15803d] hover:underline cursor-pointer"
              >
                ← Back to Main Dashboard
              </button>

              <div className="rounded-[24px] border border-[#e2eae4] bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#edf3ee] pb-3">
                  <div>
                    <h2 className="text-xl font-black text-[#0e2618]">Direct Benefit Transfer (DBT) Ledger</h2>
                    <p className="text-xs text-[#527060]">Bank clearing and UTR disbursement verification</p>
                  </div>
                  <div className="rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] px-3.5 py-1.5 text-xs font-black text-[#065f46]">
                    Disbursed Today: {formatCurrency(disbursedTotal)}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#f7faf8] text-[#476353] font-black border-b border-[#eef4f0]">
                        <th className="py-2.5 px-3">Voucher #</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">UTR Reference</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eef4f0]">
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-[#789383]">
                            No payments in ledger for today.
                          </td>
                        </tr>
                      ) : (
                        payments.map((pay) => (
                          <tr key={pay.id} className="hover:bg-[#fbfdfc]">
                            <td className="py-3 px-3 font-mono font-bold text-[#0e2618]">PAY-{pay.id}</td>
                            <td className="py-3 px-3 font-black text-[#15803d] text-sm">
                              {formatCurrency(pay.amount)}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  pay.status === "PAID"
                                    ? "bg-[#dcfce7] text-[#15803d]"
                                    : "bg-[#fef3c7] text-[#b45309]"
                                }`}
                              >
                                {pay.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-[#556d5e]">
                              {pay.reference_number || "Awaiting Clearing"}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {pay.status !== "PAID" && (
                                <button
                                  type="button"
                                  disabled={submittingPayment}
                                  onClick={() => handleSettlePayment(pay.id, "PAID", `UTR-${Date.now()}`)}
                                  className="px-3 py-1 rounded-lg bg-[#15803d] hover:bg-[#0f602c] text-white text-[11px] font-bold shadow-xs cursor-pointer"
                                >
                                  Clear Payout
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Slot & Bookings */}
          {activeTab === "bookings" && (
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => setActiveTab("dashboard")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#15803d] hover:underline cursor-pointer"
              >
                ← Back to Main Dashboard
              </button>

              <div className="rounded-[24px] border border-[#e2eae4] bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#edf3ee] pb-3">
                  <div>
                    <h2 className="text-xl font-black text-[#0e2618]">Mandi Slots & Arrival Schedule</h2>
                    <p className="text-xs text-[#527060]">Farmer bookings and yard gate capacity management</p>
                  </div>
                  <span className="rounded-xl bg-[#eff6ff] text-[#2563eb] font-bold text-xs px-3 py-1.5">
                    {bookings.length} Total Bookings
                  </span>
                </div>

                <div className="divide-y divide-[#edf3ee]">
                  {bookings.length === 0 ? (
                    <p className="text-xs text-[#718a7a] py-8 text-center">No bookings registered for this centre yet.</p>
                  ) : (
                    bookings.map((b) => (
                      <div key={b.id} className="flex items-center justify-between py-3 text-xs">
                        <div>
                          <p className="font-bold text-[#0e2618]">
                            Token: <span className="font-mono text-[#15803d]">{b.token}</span>
                          </p>
                          <p className="text-[#556d5e] text-[11px]">
                            {b.crop?.crop_name || "Wheat"} — {b.declared_quantity} {b.quantity_unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-[#f0fdf4] text-[#15803d] font-bold text-[10px]">
                            {b.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCheckInBooking(b.id)}
                            className="px-2.5 py-1 rounded-lg bg-[#15803d] text-white text-[11px] font-bold cursor-pointer"
                          >
                            Check In
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Centre Reports & Quota */}
          {activeTab === "analytics" && (
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => setActiveTab("dashboard")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#15803d] hover:underline cursor-pointer"
              >
                ← Back to Main Dashboard
              </button>

              <div className="rounded-[24px] border border-[#e2eae4] bg-white p-6 shadow-sm space-y-4">
                <h2 className="text-xl font-black text-[#0e2618]">Centre Reports & Target Quotas</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
                  <div className="rounded-2xl border border-[#dce5df] bg-[#fbfdfb] p-4">
                    <p className="text-[#556d5e] font-bold">Daily Procurement Capacity</p>
                    <p className="text-2xl font-black text-[#0e2618] mt-1">{centre?.max_daily_quantity || 5000} Qtl</p>
                    <p className="text-[11px] text-[#718a7a] mt-1">Official mandate for {centre?.district || "Saharanpur"}</p>
                  </div>
                  <div className="rounded-2xl border border-[#dce5df] bg-[#fbfdfb] p-4">
                    <p className="text-[#556d5e] font-bold">Current Utilization</p>
                    <p className="text-2xl font-black text-[#15803d] mt-1">
                      {centre?.max_daily_quantity
                        ? `${(((analytics?.procured_quantity || 0) / centre.max_daily_quantity) * 100).toFixed(1)}%`
                        : "0.0%"}
                    </p>
                    <p className="text-[11px] text-[#718a7a] mt-1">Procured: {(analytics?.procured_quantity || 0).toFixed(1)} Qtl</p>
                  </div>
                  <div className="rounded-2xl border border-[#dce5df] bg-[#fbfdfb] p-4">
                    <p className="text-[#556d5e] font-bold">Average Turnaround</p>
                    <p className="text-2xl font-black text-[#2563eb] mt-1">
                      {analytics?.average_service_minutes ? Math.round(analytics.average_service_minutes) : 10} min
                    </p>
                    <p className="text-[11px] text-[#718a7a] mt-1">Gate arrival to slip generation</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Settings */}
          {activeTab === "settings" && (
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => setActiveTab("dashboard")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#15803d] hover:underline cursor-pointer"
              >
                ← Back to Main Dashboard
              </button>

              <div className="rounded-[24px] border border-[#e2eae4] bg-white p-6 shadow-sm space-y-4 max-w-2xl">
                <h2 className="text-xl font-black text-[#0e2618]">Mandi & Officer Desk Settings</h2>
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl border border-[#dce5df] bg-[#fbfdfb]">
                    <p className="font-bold text-[#0e2618]">Procurement Centre</p>
                    <p className="text-[#556d5e]">{centre?.name || "Mandi Samiti Saharanpur Hub"}</p>
                    <p className="font-mono text-[11px] text-[#789383] mt-0.5">Code: {centre?.code || "UP-SAH-001"}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl border border-[#dce5df] bg-[#fbfdfb]">
                    <p className="font-bold text-[#0e2618]">Designated Officer</p>
                    <p className="text-[#556d5e]">{officerCleanName} ({officer?.designation || "Senior Procurement Officer"})</p>
                    <p className="font-mono text-[11px] text-[#789383] mt-0.5">ID: {officer?.employee_code || "OFFICER01"}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl border border-[#dce5df] bg-[#fbfdfb]">
                    <p className="font-bold text-[#0e2618]">Operating Hours</p>
                    <p className="text-[#556d5e]">09:00 AM — 06:00 PM (Monday to Saturday)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {renderManualModal()}
      {renderWeighbridgeModal()}
      {renderSummaryModal()}
    </div>
  );
}
