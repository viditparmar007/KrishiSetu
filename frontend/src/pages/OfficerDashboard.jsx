import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  Filter,
  IndianRupee,
  Leaf,
  LogOut,
  MapPin,
  Megaphone,
  Plus,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import officerApi from "../api/officerApi";

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
  return "₹" + num.toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

function GlassCard({ children, className = "", ...props }) {
  return (
    <section
      className={`rounded-[26px] border border-white/85 bg-white/75 shadow-[0_18px_50px_rgba(44,83,60,.07)] backdrop-blur-2xl ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}

export default function OfficerDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("queue");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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
        if (activePaymentModal && !submittingPayment) {
          setActivePaymentModal(null);
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activePaymentModal, submittingPayment]);

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
      setActiveProcurementModal(res.data);
      showToast("Documents verification recorded.");
      await loadData();
    } catch (err) {
      showToast(err.message || "Error verifying documents.", true);
    } finally {
      setSubmittingStep(false);
    }
  };

  // Step 2: Submit Quality Check
  const handleSubmitQuality = async () => {
    if (!activeProcurementModal) return;
    setSubmittingStep(true);
    try {
      const res = await officerApi.qualityCheck(activeProcurementModal.id, {
        quality_grade: qualityGrade,
        quality_notes: qualityNotes,
      });
      setActiveProcurementModal(res.data);
      showToast("Quality inspection recorded.");
      await loadData();
    } catch (err) {
      showToast(err.message || "Error saving quality check.", true);
    } finally {
      setSubmittingStep(false);
    }
  };

  // Step 3: Submit Weighing Scale
  const handleSubmitWeighing = async () => {
    if (!activeProcurementModal) return;
    const mQty = parseFloat(measuredWeight);
    const aQty = parseFloat(acceptedWeight || measuredWeight);
    if (isNaN(mQty) || mQty <= 0) {
      showToast("Please enter a valid measured weight (> 0).", true);
      return;
    }
    if (isNaN(aQty) || aQty <= 0 || aQty > mQty) {
      showToast("Accepted weight must be greater than 0 and cannot exceed measured weight.", true);
      return;
    }

    setSubmittingStep(true);
    try {
      const res = await officerApi.recordWeighing(activeProcurementModal.id, {
        measured_quantity: mQty,
        accepted_quantity: aQty,
      });
      setActiveProcurementModal(res.data);
      showToast("Weighbridge measurements recorded.");
      await loadData();
    } catch (err) {
      showToast(err.message || "Error saving weighing data.", true);
    } finally {
      setSubmittingStep(false);
    }
  };

  // Step 4: Submit Final Decision & Generate Payment
  const handleSubmitDecision = async () => {
    if (!activeProcurementModal) return;
    if (decisionType === "REJECTED" && !rejectReason.trim()) {
      showToast("Please provide a rejection reason.", true);
      return;
    }

    const rate = parseFloat(mspRate);
    if (decisionType === "APPROVED" && (isNaN(rate) || rate <= 0)) {
      showToast("Please enter a valid procurement rate per unit (MSP).", true);
      return;
    }

    setSubmittingStep(true);
    try {
      const payload = {
        decision: decisionType,
        rate_per_unit: decisionType === "APPROVED" ? rate : null,
        rejection_reason: decisionType === "REJECTED" ? rejectReason : null,
      };
      const res = await officerApi.decideProcurement(activeProcurementModal.id, payload);
      setActiveProcurementModal(res.data);
      showToast(
        decisionType === "APPROVED"
          ? `🎉 Procurement APPROVED! Total Payout of ₹${res.data.total_value} credited to DBT payment ledger.`
          : "Procurement marked as REJECTED."
      );
      await loadData();
    } catch (err) {
      showToast(err.message || "Error submitting decision.", true);
    } finally {
      setSubmittingStep(false);
    }
  };

  // Payment status update (Mark Paid or Processing)
  const handleUpdatePayment = async (paymentId, status, refNumber = "") => {
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

  const filteredQueue = useMemo(() => {
    return queueList.filter((item) => {
      const matchSearch =
        !searchTerm ||
        item.token?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.crop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.queue_number).includes(searchTerm);
      const matchStatus = filterStatus === "ALL" || item.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [queueList, searchTerm, filterStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_70%_5%,#ffffff_0,#e9f6ef_32%,#dceee5_68%,#d3e6dc_100%)] flex flex-col items-center justify-center text-[#10251a]">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/80 text-[#176c42] shadow-xl backdrop-blur-xl mb-4 border border-white">
          <RefreshCw className="w-8 h-8 animate-spin text-[#176b3e]" />
        </div>
        <h2 className="text-xl font-extrabold text-[#113d28]">Connecting to KrishiSetu Mandi Portal...</h2>
        <p className="text-[#597565] text-sm mt-1">Loading centre queue, procurement records, and DBT ledger.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_70%_5%,#ffffff_0,#e9f6ef_32%,#dceee5_68%,#d3e6dc_100%)] text-[#10251a] font-sans pb-12">
      {/* Floating Glassmorphic Header */}
      <header className="sticky top-3 z-40 mx-auto max-w-7xl px-4 sm:px-6 mb-5">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-white/85 bg-white/70 px-5 py-3.5 shadow-[0_14px_35px_rgba(43,77,57,.08)] backdrop-blur-2xl">
          {/* Logo & Centre Title */}
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#dff3e7] text-[#176c42] shadow-xs border border-[#cde8d7]">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-tight text-[#113d28]">
                  KrishiSetu <span className="text-[#176b3e]">Officer Desk</span>
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#edf8f1] text-[#176b3e] border border-[#cbe6d4] shadow-2xs">
                  MANDI PORTAL
                </span>
              </div>
              <p className="text-xs text-[#527060] flex items-center gap-1.5 mt-0.5 font-medium">
                <Building2 className="w-3.5 h-3.5 text-[#17824b]" />
                <span className="font-bold text-[#1a442e]">{centre?.name || "Procurement Hub"}</span>
                <span className="text-[#9cb5a5]">·</span>
                <span className="text-[#628070] font-mono text-[11px]">{centre?.code || "UP-SAH-001"}</span>
              </p>
            </div>
          </div>

          {/* Officer Details & Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 rounded-full bg-white/80 border border-white px-3.5 py-1.5 shadow-xs backdrop-blur-md">
              <div className="w-8 h-8 rounded-full bg-[#1b5e39] text-white flex items-center justify-center font-bold text-xs">
                {officer?.name ? officer.name[0] : "O"}
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-[#143d26] leading-tight">
                  {officer?.name || "Procurement Officer"}
                </span>
                <span className="block text-[10px] text-[#176b3e] font-mono font-bold">
                  {officer?.employee_code || "OFFICER01"}
                </span>
              </div>
            </div>

            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              title="Refresh Data"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 hover:bg-white text-[#3c5e4b] hover:text-[#176b3e] border border-white shadow-xs transition backdrop-blur-md cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#176b3e]" : ""}`} />
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#fff0f1] hover:bg-[#ffe2e5] text-[#b83b42] border border-[#ffd2d6] text-xs font-extrabold shadow-xs transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Operational Glass KPI Strip */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 rounded-[22px] border border-white/85 bg-white/60 p-3 shadow-[0_10px_30px_rgba(44,83,60,.06)] backdrop-blur-xl text-xs">
          <div className="flex items-center gap-2 px-2 py-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-[#5f7869] font-semibold">Queue Waiting:</span>
            <span className="font-extrabold text-amber-700 text-sm">{analytics?.waiting ?? waitingCount}</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
            <span className="text-[#5f7869] font-semibold">In Counter:</span>
            <span className="font-extrabold text-sky-700 text-sm">
              {(analytics?.called || 0) + (analytics?.processing || 0)}
            </span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-[#5f7869] font-semibold">Completed:</span>
            <span className="font-extrabold text-[#176b3e] text-sm">
              {analytics?.procurements_completed ?? 0}
            </span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1">
            <span className="text-[#5f7869] font-semibold">Procured:</span>
            <span className="font-extrabold text-[#113822] text-sm">
              {(analytics?.procured_quantity ?? 0).toFixed(1)} Qtl
            </span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1">
            <span className="text-[#5f7869] font-semibold">Disbursed:</span>
            <span className="font-extrabold text-[#176b3e] text-sm">
              {formatCurrency(analytics?.procurement_value ?? 0)}
            </span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1">
            <span className="text-[#5f7869] font-semibold">Avg Time:</span>
            <span className="font-extrabold text-[#1f4a30] text-sm">
              {(analytics?.average_service_minutes ?? 10).toFixed(0)} min
            </span>
          </div>
        </div>
      </header>

      {/* Toast notifications */}
      {successMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full mb-4">
          <div className="bg-[#edf9f1] border border-[#bce8cb] text-[#135933] px-4 py-3 rounded-2xl flex items-center gap-3 shadow-[0_8px_25px_rgba(23,107,62,.08)] backdrop-blur-md">
            <CheckCircle2 className="w-5 h-5 text-[#17824b] shrink-0" />
            <span className="text-xs sm:text-sm font-extrabold">{successMsg}</span>
          </div>
        </div>
      )}
      {errorMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full mb-4">
          <div className="bg-[#fff1f2] border border-[#fecdd3] text-[#9f1239] px-4 py-3 rounded-2xl flex items-center gap-3 shadow-[0_8px_25px_rgba(159,18,57,.08)] backdrop-blur-md">
            <AlertCircle className="w-5 h-5 text-[#be123c] shrink-0" />
            <span className="text-xs sm:text-sm font-extrabold">{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Main Navigation Glass Pills */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6">
        <nav className="flex space-x-2 overflow-x-auto rounded-[22px] border border-white/85 bg-white/65 p-2 shadow-[0_10px_30px_rgba(44,83,60,.05)] backdrop-blur-xl">
          {[
            { id: "queue", label: "Live Queue & Calling", icon: Megaphone, badge: waitingCount },
            {
              id: "procurement",
              label: "Inspection & Weighbridge Desk",
              icon: Scale,
              badge: procurements.filter((x) => x.stage !== "COMPLETED" && x.stage !== "REJECTED").length,
            },
            {
              id: "payments",
              label: "DBT Payment Clearance",
              icon: IndianRupee,
              badge: payments.filter((x) => x.status === "PENDING").length,
            },
            { id: "bookings", label: "Slot & Bookings", icon: Calendar, badge: bookings.length },
            { id: "analytics", label: "Centre Reports & Quota", icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? "bg-[#176b3e] text-white shadow-md shadow-[#176b3e]/25"
                    : "text-[#335641] hover:bg-white/80 hover:text-[#113d28]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? "bg-white text-[#176b3e]" : "bg-[#dff3e7] text-[#176c42]"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Contents */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 space-y-6">
        {/* TAB 1: LIVE QUEUE & CALLING */}
        {activeTab === "queue" && (
          <div className="space-y-6">
            {/* Calling Hero Glass Card */}
            <div className="relative overflow-hidden rounded-[26px] border border-white/90 bg-gradient-to-br from-white/95 via-[#f0faf4]/90 to-[#daf2e3]/90 p-6 sm:p-7 shadow-[0_18px_50px_rgba(44,83,60,.08)] backdrop-blur-2xl text-[#10251a]">
              {/* Subtle foliage watermark */}
              <div className="pointer-events-none absolute -right-6 -bottom-6 opacity-15">
                <Leaf size={160} className="text-[#176b3e]" />
              </div>

              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#dff3e7] text-[#176c42] border border-[#cbe6d4] shadow-2xs">
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>LIVE TOKEN CONTROLLER</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#0f3820] tracking-tight">
                    {activeFarmer ? (
                      <span>
                        Currently Serving: <span className="text-[#176b3e]">Token #{activeFarmer.token}</span>
                      </span>
                    ) : (
                      "No Farmer Currently at Counter"
                    )}
                  </h2>
                  <p className="text-[#436450] text-xs sm:text-sm max-w-xl font-medium leading-relaxed">
                    {activeFarmer
                      ? `Farmer with Token ${activeFarmer.token} has declared ${activeFarmer.declared_quantity} ${activeFarmer.quantity_unit} of ${activeFarmer.crop_name}. Proceed to inspection & weighbridge desk.`
                      : `There are ${waitingCount} farmers waiting in the centre yard. Click the button to announce and call the next farmer.`}
                  </p>
                </div>

                <div className="relative z-10 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleCallNext}
                    disabled={refreshing || waitingCount === 0}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#176b3e] to-[#1f844e] hover:from-[#115832] hover:to-[#176b3e] text-white font-black text-sm shadow-lg shadow-[#176b3e]/30 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                  >
                    <Megaphone className="w-4 h-4" />
                    <span>Call Next Farmer</span>
                  </button>

                  {activeFarmer && activeFarmer.status === "CALLED" && (
                    <button
                      onClick={() => handleStartProcessing(activeFarmer.queue_entry_id, activeFarmer.booking_id)}
                      className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-extrabold text-sm shadow-md shadow-sky-600/20 transition cursor-pointer active:scale-95"
                    >
                      <Scale className="w-4 h-4" />
                      <span>Start Inspection Desk</span>
                    </button>
                  )}

                  {activeFarmer && activeFarmer.status === "PROCESSING" && (
                    <>
                      <button
                        onClick={() => handleOpenInspectionForBooking(activeFarmer.booking_id)}
                        className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-[#0f766e] hover:bg-[#115e59] text-white font-extrabold text-sm shadow-md transition cursor-pointer active:scale-95"
                      >
                        <FileCheck className="w-4 h-4" />
                        <span>Open Inspection Desk</span>
                      </button>
                      <button
                        onClick={() => handleCompleteQueue(activeFarmer.queue_entry_id)}
                        className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-[#176b3e] hover:bg-[#115832] text-white font-extrabold text-sm shadow-md transition cursor-pointer active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Done</span>
                      </button>
                    </>
                  )}

                  {activeFarmer && (
                    <button
                      onClick={() => handleNoShow(activeFarmer.queue_entry_id)}
                      className="flex items-center gap-1.5 px-3.5 py-3.5 rounded-2xl bg-[#fff0f1] hover:bg-[#ffe0e3] text-[#be123c] border border-[#fecdd3] text-xs font-bold transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>No-Show</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Queue Table Glass Card */}
            <GlassCard className="p-6">
              <div className="border-b border-[#e7f0e9] pb-4 mb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-[#10291d] text-base sm:text-lg">
                    Today&apos;s Center Queue ({filteredQueue.length})
                  </h3>
                  <p className="text-xs text-[#5f7869] font-medium">Live arrival sequence of registered farmers</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#758e80] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search token / crop..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-3 py-2 text-xs bg-white/80 border border-[#d6e5db] rounded-xl focus:outline-[#176b3e] text-[#10251a] font-medium w-48 shadow-2xs"
                    />
                  </div>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="py-2 px-3 text-xs bg-white/80 border border-[#d6e5db] rounded-xl text-[#10251a] font-bold focus:outline-[#176b3e] shadow-2xs"
                  >
                    <option value="ALL">All Status</option>
                    <option value="WAITING">Waiting</option>
                    <option value="CALLED">Called</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="NO_SHOW">No Show</option>
                  </select>
                </div>
              </div>

              {filteredQueue.length === 0 ? (
                <div className="py-12 text-center text-[#668273]">
                  <Users className="w-12 h-12 text-[#9abfb0] mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#1a442e]">No queue entries found for today.</p>
                  <p className="text-xs text-[#708c7c] mt-1">
                    When farmers check-in with their booking token, they appear here instantly.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-[#edf6f0]/80 text-[#1f4a30] text-[11px] font-extrabold uppercase tracking-wider border-b border-[#dce8df]">
                        <th className="py-3 px-4 rounded-l-xl">Seq #</th>
                        <th className="py-3 px-4">Token</th>
                        <th className="py-3 px-4">Crop & Declared Qty</th>
                        <th className="py-3 px-4">Check-In Time</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right rounded-r-xl">Counter Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ebf3ed]">
                      {filteredQueue.map((item) => {
                        const isProcessing = item.status === "PROCESSING";
                        const isCalled = item.status === "CALLED";
                        const isWaiting = item.status === "WAITING";
                        return (
                          <tr
                            key={item.queue_entry_id}
                            className={`hover:bg-[#f3faf5]/80 transition ${
                              isProcessing ? "bg-[#eaf6ee]/60" : isCalled ? "bg-[#f0f9ff]/60" : ""
                            }`}
                          >
                            <td className="py-3.5 px-4 font-black text-[#10291d]">#{item.queue_number}</td>
                            <td className="py-3.5 px-4">
                              <span className="font-mono font-black text-[#113d28] bg-white px-2.5 py-1 rounded-lg border border-[#cfe2d5] shadow-2xs">
                                {item.token}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-extrabold text-[#10291d]">{item.crop_name}</div>
                              <div className="text-xs text-[#627d6d] font-medium">
                                {item.declared_quantity} {item.quantity_unit}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-[#436450] font-medium">
                              {formatDateTime(item.checked_in_at)}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black ${
                                  item.status === "WAITING"
                                    ? "bg-[#fff8e6] text-[#b45309] border border-[#fde68a]"
                                    : item.status === "CALLED"
                                    ? "bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]"
                                    : item.status === "PROCESSING"
                                    ? "bg-[#ede9fe] text-[#6d28d9] border border-[#ddd6fe]"
                                    : item.status === "COMPLETED"
                                    ? "bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]"
                                    : "bg-[#ffe4e6] text-[#be123c] border border-[#fecdd3]"
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-1.5">
                              {isWaiting && (
                                <button
                                  onClick={handleCallNext}
                                  className="px-3 py-1.5 bg-[#176b3e] hover:bg-[#115832] text-white rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
                                >
                                  Call
                                </button>
                              )}
                              {isCalled && (
                                <button
                                  onClick={() => handleStartProcessing(item.queue_entry_id, item.booking_id)}
                                  className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
                                >
                                  Start Desk
                                </button>
                              )}
                              {isProcessing && (
                                <button
                                  onClick={() => handleOpenInspectionForBooking(item.booking_id)}
                                  className="px-3 py-1.5 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
                                >
                                  Inspection Desk
                                </button>
                              )}
                              {(isCalled || isProcessing) && (
                                <button
                                  onClick={() => handleNoShow(item.queue_entry_id)}
                                  className="px-2.5 py-1.5 bg-white hover:bg-[#ffe5e8] text-[#be123c] rounded-xl text-xs font-bold border border-[#fecdd3] transition cursor-pointer"
                                >
                                  No-Show
                                </button>
                              )}
                              {item.status === "COMPLETED" && (
                                <span className="text-xs text-[#176b3e] font-bold flex items-center justify-end gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Done
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </div>
        )}

        {/* TAB 2: INSPECTION & WEIGHBRIDGE WORKFLOW */}
        {activeTab === "procurement" && (
          <div className="space-y-6">
            {/* Active Procurement Stepper Workflow */}
            {activeProcurementModal ? (
              <GlassCard className="p-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#e7f0e9]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-0.5 rounded-full text-xs font-black bg-[#dff3e7] text-[#176c42] border border-[#cbe6d4]">
                        Procurement Record #{activeProcurementModal.id}
                      </span>
                      <span className="text-xs text-[#527060] font-mono font-bold">
                        Booking ID: {activeProcurementModal.booking_id}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-[#10291d] mt-1">
                      Mandi Quality Inspection & Weighbridge Desk
                    </h2>
                  </div>

                  <button
                    onClick={() => setActiveProcurementModal(null)}
                    className="p-1.5 rounded-xl bg-white/80 hover:bg-white text-[#436450] transition border border-white shadow-xs"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 4-Step Stepper Header */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                  {[
                    {
                      id: "DOCS",
                      num: "1",
                      title: "Document Verification",
                      done: activeProcurementModal.documents_verified,
                      current: activeProcurementModal.stage === "DOCUMENT_VERIFICATION",
                    },
                    {
                      id: "QUALITY",
                      num: "2",
                      title: "Quality Check (FAQ)",
                      done: Boolean(activeProcurementModal.quality_grade),
                      current: activeProcurementModal.stage === "QUALITY_CHECK",
                    },
                    {
                      id: "WEIGH",
                      num: "3",
                      title: "Weighbridge Scale",
                      done: Boolean(activeProcurementModal.measured_quantity),
                      current: activeProcurementModal.stage === "WEIGHING",
                    },
                    {
                      id: "DECISION",
                      num: "4",
                      title: "MSP Payout & Decision",
                      done: Boolean(activeProcurementModal.decision),
                      current:
                        activeProcurementModal.stage === "DECISION" ||
                        activeProcurementModal.stage === "COMPLETED",
                    },
                  ].map((step) => (
                    <div
                      key={step.id}
                      className={`p-3.5 rounded-2xl border flex items-center gap-3 backdrop-blur-md transition ${
                        step.current
                          ? "bg-[#eaf6ee] border-[#a5d8b6] text-[#0f3820] font-extrabold shadow-sm"
                          : step.done
                          ? "bg-white/80 border-white text-[#335641]"
                          : "bg-white/40 border-white/60 text-[#7d9989]"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          step.done
                            ? "bg-[#176b3e] text-white"
                            : step.current
                            ? "bg-[#258250] text-white"
                            : "bg-[#d4e4db] text-[#527060]"
                        }`}
                      >
                        {step.done ? "✓" : step.num}
                      </div>
                      <div className="truncate">
                        <div className="truncate text-[10px] font-bold uppercase tracking-wider text-[#648472]">
                          Step {step.num}
                        </div>
                        <div className="truncate font-extrabold">{step.title}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Step Interactive Forms */}
                <div className="bg-white/80 rounded-2xl p-6 border border-white shadow-xs backdrop-blur-md">
                  {/* Step 1: Document Verification */}
                  {activeProcurementModal.stage === "DOCUMENT_VERIFICATION" && (
                    <div className="space-y-4 max-w-xl">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-[#176b3e]" />
                        <h3 className="font-black text-[#10291d] text-base">Step 1: Verify Farmer Documents</h3>
                      </div>
                      <p className="text-xs text-[#527060] font-medium">
                        Confirm government ID, Aadhaar linking, land ownership (Khasra/Khatauni), and active bank account passbook.
                      </p>

                      <label className="flex items-center gap-2.5 cursor-pointer pt-2">
                        <input
                          type="checkbox"
                          checked={docVerified}
                          onChange={(e) => setDocVerified(e.target.checked)}
                          className="w-4 h-4 text-[#176b3e] rounded focus:ring-[#176b3e]"
                        />
                        <span className="text-sm font-bold text-[#10291d]">
                          All mandatory documents presented and verified
                        </span>
                      </label>

                      <div>
                        <label className="block text-xs font-bold text-[#355642] mb-1.5">
                          Verification Remarks / Notes
                        </label>
                        <input
                          type="text"
                          value={docNotes}
                          onChange={(e) => setDocNotes(e.target.value)}
                          placeholder="e.g. Aadhaar 4892 verified, Saharanpur Khasra 142/3 matched."
                          className="w-full text-xs p-3 rounded-xl border border-[#cfe0d5] bg-white font-medium focus:outline-[#176b3e]"
                        />
                      </div>

                      <button
                        onClick={handleSubmitDocuments}
                        disabled={submittingStep}
                        className="px-6 py-3 bg-[#176b3e] hover:bg-[#115832] text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                      >
                        {submittingStep ? "Saving..." : "Verify Documents & Proceed to Quality Check →"}
                      </button>
                    </div>
                  )}

                  {/* Step 2: Quality Check */}
                  {activeProcurementModal.stage === "QUALITY_CHECK" && (
                    <div className="space-y-4 max-w-xl">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-[#176b3e]" />
                        <h3 className="font-black text-[#10291d] text-base">Step 2: Grain & Produce Quality Check (FAQ)</h3>
                      </div>
                      <p className="text-xs text-[#527060] font-medium">
                        Inspect moisture content, foreign matter %, damaged grains against Fair Average Quality (FAQ) standards.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-bold text-[#355642] mb-1.5">
                            Quality Grade
                          </label>
                          <select
                            value={qualityGrade}
                            onChange={(e) => setQualityGrade(e.target.value)}
                            className="w-full text-xs p-3 rounded-xl border border-[#cfe0d5] bg-white font-bold text-[#10291d] focus:outline-[#176b3e]"
                          >
                            <option value="Grade A (FAQ)">Grade A (FAQ Standard)</option>
                            <option value="Grade B">Grade B (Acceptable with deduction)</option>
                            <option value="Grade C">Grade C (Below Standard)</option>
                            <option value="Rejection Grade">Below FAQ / Rejection</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#355642] mb-1.5">
                            Moisture Content & Parameters
                          </label>
                          <input
                            type="text"
                            value={qualityNotes}
                            onChange={(e) => setQualityNotes(e.target.value)}
                            placeholder="e.g. Moisture 11.8%, Lustre good."
                            className="w-full text-xs p-3 rounded-xl border border-[#cfe0d5] bg-white font-medium focus:outline-[#176b3e]"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleSubmitQuality}
                        disabled={submittingStep}
                        className="px-6 py-3 bg-[#176b3e] hover:bg-[#115832] text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                      >
                        {submittingStep ? "Saving..." : "Confirm Quality & Proceed to Weighbridge →"}
                      </button>
                    </div>
                  )}

                  {/* Step 3: Weighing Scale */}
                  {activeProcurementModal.stage === "WEIGHING" && (
                    <div className="space-y-4 max-w-xl">
                      <div className="flex items-center gap-2">
                        <Scale className="w-5 h-5 text-[#176b3e]" />
                        <h3 className="font-black text-[#10291d] text-base">Step 3: Weighbridge Scale Entry</h3>
                      </div>
                      <p className="text-xs text-[#527060] font-medium">
                        Enter gross and tare weighbridge reading in Quintals to calculate net accepted produce.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-bold text-[#355642] mb-1.5">
                            Measured Weight (Gross - Tare) in Qtl *
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={measuredWeight}
                            onChange={(e) => setMeasuredWeight(e.target.value)}
                            placeholder="e.g. 15.2"
                            className="w-full text-xs p-3 rounded-xl border border-[#cfe0d5] bg-white font-black text-[#10291d] focus:outline-[#176b3e]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#355642] mb-1.5">
                            Accepted Weight in Qtl *
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={acceptedWeight || measuredWeight}
                            onChange={(e) => setAcceptedWeight(e.target.value)}
                            placeholder="e.g. 15.0"
                            className="w-full text-xs p-3 rounded-xl border border-[#cfe0d5] bg-white font-black text-[#176b3e] focus:outline-[#176b3e]"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleSubmitWeighing}
                        disabled={submittingStep}
                        className="px-6 py-3 bg-[#176b3e] hover:bg-[#115832] text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                      >
                        {submittingStep ? "Saving..." : "Record Official Weight & Proceed to Decision →"}
                      </button>
                    </div>
                  )}

                  {/* Step 4: Final Procurement Decision & Disbursal */}
                  {(activeProcurementModal.stage === "DECISION" ||
                    activeProcurementModal.stage === "COMPLETED") && (
                    <div className="space-y-4 max-w-xl">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="w-5 h-5 text-[#176b3e]" />
                        <h3 className="font-black text-[#10291d] text-base">
                          Step 4: Official MSP Procurement Decision
                        </h3>
                      </div>

                      {activeProcurementModal.stage === "COMPLETED" ? (
                        <div className="bg-[#edf9f1] border border-[#bce8cb] rounded-2xl p-5 text-[#135933] space-y-2">
                          <div className="flex items-center gap-2 font-black text-[#113d28]">
                            <CheckCircle2 className="w-5 h-5 text-[#17824b]" />
                            <span>Procurement Officially Approved & Completed!</span>
                          </div>
                          <div className="text-xs space-y-1">
                            <p>
                              Accepted Weight: <b>{activeProcurementModal.accepted_quantity} Qtl</b>
                            </p>
                            <p>
                              MSP Rate: <b>₹{activeProcurementModal.rate_per_unit} / Qtl</b>
                            </p>
                            <p className="text-sm font-black text-[#113d28]">
                              Total Disbursal Value: {formatCurrency(activeProcurementModal.total_value)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-4 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="decision"
                                value="APPROVED"
                                checked={decisionType === "APPROVED"}
                                onChange={() => setDecisionType("APPROVED")}
                                className="text-[#176b3e]"
                              />
                              <span className="text-xs font-black text-[#176b3e]">
                                APPROVE (Accept at MSP)
                              </span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="decision"
                                value="REJECTED"
                                checked={decisionType === "REJECTED"}
                                onChange={() => setDecisionType("REJECTED")}
                                className="text-red-600"
                              />
                              <span className="text-xs font-black text-red-700">REJECT PRODUCE</span>
                            </label>
                          </div>

                          {decisionType === "APPROVED" ? (
                            <div className="space-y-3 pt-2">
                              <div>
                                <label className="block text-xs font-bold text-[#355642] mb-1.5">
                                  Government MSP Rate (₹ per Quintal) *
                                </label>
                                <input
                                  type="number"
                                  value={mspRate}
                                  onChange={(e) => setMspRate(e.target.value)}
                                  placeholder="e.g. 2275"
                                  className="w-full text-xs p-3 rounded-xl border border-[#cfe0d5] bg-white font-black text-[#10291d] focus:outline-[#176b3e]"
                                />
                              </div>

                              <div className="p-4 bg-[#edf9f1] rounded-2xl border border-[#c5e8d2] text-xs text-[#135933]">
                                <span>Calculated Payout to Farmer: </span>
                                <span className="font-black text-base text-[#113d28] ml-1">
                                  {formatCurrency(
                                    (parseFloat(activeProcurementModal.accepted_quantity || 0) || 0) *
                                      (parseFloat(mspRate || 0) || 0)
                                  )}
                                </span>
                              </div>

                              <button
                                onClick={handleSubmitDecision}
                                disabled={submittingStep}
                                className="w-full py-3.5 bg-[#176b3e] hover:bg-[#115832] text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                              >
                                {submittingStep
                                  ? "Finalizing..."
                                  : "Confirm Approval & Issue DBT Payout Receipt ✓"}
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3 pt-2">
                              <div>
                                <label className="block text-xs font-bold text-[#355642] mb-1.5">
                                  Official Rejection Reason *
                                </label>
                                <input
                                  type="text"
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  placeholder="e.g. Moisture exceeds maximum threshold (>16%), infested grains."
                                  className="w-full text-xs p-3 rounded-xl border border-[#fecdd3] bg-white focus:outline-red-500 font-medium"
                                />
                              </div>

                              <button
                                onClick={handleSubmitDecision}
                                disabled={submittingStep}
                                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                              >
                                {submittingStep ? "Rejecting..." : "Confirm Rejection"}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </GlassCard>
            ) : null}

            {/* Procurements List Glass Card */}
            <GlassCard className="p-6">
              <div className="border-b border-[#e7f0e9] pb-4 mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-[#10291d] text-base sm:text-lg">
                    Procurement Ledgers ({procurements.length})
                  </h3>
                  <p className="text-xs text-[#5f7869] font-medium">Inspection and weighbridge records for this centre</p>
                </div>
              </div>

              {procurements.length === 0 ? (
                <div className="py-12 text-center text-[#668273]">
                  <Scale className="w-12 h-12 text-[#9abfb0] mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#1a442e]">No procurement records initiated yet.</p>
                  <p className="text-xs text-[#708c7c] mt-1">
                    Call a farmer from the queue tab and click &apos;Start Desk&apos; to begin procurement.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-[#edf6f0]/80 text-[#1f4a30] text-[11px] font-extrabold uppercase tracking-wider border-b border-[#dce8df]">
                        <th className="py-3 px-4 rounded-l-xl">Procurement ID</th>
                        <th className="py-3 px-4">Booking ID</th>
                        <th className="py-3 px-4">Stage</th>
                        <th className="py-3 px-4">Quality Grade</th>
                        <th className="py-3 px-4">Accepted Qty</th>
                        <th className="py-3 px-4">Total Value</th>
                        <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ebf3ed]">
                      {procurements.map((p) => (
                        <tr key={p.id} className="hover:bg-[#f3faf5]/80 transition">
                          <td className="py-3.5 px-4 font-black text-[#10291d]">#{p.id}</td>
                          <td className="py-3.5 px-4 text-[#436450] font-mono font-bold">BKG-{p.booking_id}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black ${
                                p.stage === "COMPLETED"
                                  ? "bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]"
                                  : p.stage === "REJECTED"
                                  ? "bg-[#ffe4e6] text-[#be123c] border border-[#fecdd3]"
                                  : "bg-[#ede9fe] text-[#6d28d9] border border-[#ddd6fe]"
                              }`}
                            >
                              {p.stage}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#10291d] font-semibold">{p.quality_grade || "Pending Check"}</td>
                          <td className="py-3.5 px-4 font-bold text-[#10291d]">
                            {p.accepted_quantity ? `${p.accepted_quantity} ${p.quantity_unit}` : "Pending Weight"}
                          </td>
                          <td className="py-3.5 px-4 font-black text-[#176b3e]">
                            {p.total_value ? formatCurrency(p.total_value) : "—"}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => openProcurementModal(p)}
                              className="px-3.5 py-1.5 bg-[#176b3e] hover:bg-[#115832] text-white rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
                            >
                              Open Desk
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </div>
        )}

        {/* TAB 3: DBT PAYMENT CLEARANCE */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <GlassCard className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#e7f0e9]">
                <div>
                  <h3 className="font-black text-[#10291d] text-base sm:text-lg">Direct Benefit Transfer (DBT) Ledger</h3>
                  <p className="text-xs text-[#5f7869] font-medium">
                    Approved procurement disbursements linked to farmer bank accounts
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-[#edf9f1] border border-[#cbe8d6] px-3.5 py-1.5 rounded-full">
                  <span className="text-xs text-[#436450] font-bold">Total Disbursals:</span>
                  <span className="text-sm font-black text-[#176b3e]">
                    {formatCurrency(payments.reduce((acc, curr) => acc + (curr.amount || 0), 0))}
                  </span>
                </div>
              </div>

              {payments.length === 0 ? (
                <div className="py-12 text-center text-[#668273]">
                  <IndianRupee className="w-12 h-12 text-[#9abfb0] mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#1a442e]">No payment records found.</p>
                  <p className="text-xs text-[#708c7c] mt-1">
                    When you approve a procurement decision, a DBT payment ledger entry is generated here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-[#edf6f0]/80 text-[#1f4a30] text-[11px] font-extrabold uppercase tracking-wider border-b border-[#dce8df]">
                        <th className="py-3 px-4 rounded-l-xl">Payment ID</th>
                        <th className="py-3 px-4">Procurement Ref</th>
                        <th className="py-3 px-4">Farmer ID</th>
                        <th className="py-3 px-4">Disbursal Amount</th>
                        <th className="py-3 px-4">Bank UTR / Ref</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right rounded-r-xl">Settlement Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ebf3ed]">
                      {payments.map((pay) => (
                        <tr key={pay.id} className="hover:bg-[#f3faf5]/80 transition">
                          <td className="py-3.5 px-4 font-black text-[#10291d]">#PAY-{pay.id}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-[#436450]">PROC-{pay.procurement_id}</td>
                          <td className="py-3.5 px-4 text-[#10291d] font-semibold">Farmer #{pay.farmer_id}</td>
                          <td className="py-3.5 px-4 font-black text-[#176b3e]">
                            {formatCurrency(pay.amount)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs font-bold text-[#527060]">
                            {pay.reference_number || "Awaiting UTR"}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black ${
                                pay.status === "PAID"
                                  ? "bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]"
                                  : pay.status === "PROCESSING"
                                  ? "bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]"
                                  : pay.status === "FAILED"
                                  ? "bg-[#ffe4e6] text-[#be123c] border border-[#fecdd3]"
                                  : "bg-[#fff8e6] text-[#b45309] border border-[#fde68a]"
                              }`}
                            >
                              {pay.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            {pay.status === "PENDING" && (
                              <button
                                onClick={() => handleUpdatePayment(pay.id, "PROCESSING")}
                                className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                              >
                                Mark Processing
                              </button>
                            )}
                            {pay.status === "PROCESSING" && (
                              <button
                                onClick={() => {
                                  setActivePaymentModal(pay);
                                  setUtrNumber(`UTR${Date.now().toString().slice(-8)}`);
                                }}
                                className="px-3 py-1.5 bg-[#176b3e] hover:bg-[#115832] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                              >
                                Disburse (Mark Paid)
                              </button>
                            )}
                            {pay.status === "PAID" && (
                              <span className="text-xs text-[#176b3e] font-extrabold flex items-center justify-end gap-1">
                                <ShieldCheck className="w-4 h-4" /> Settled
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>

            {/* Payment Settlement Modal */}
            {activePaymentModal && (
              <div
                onMouseDown={(e) => { if (e.target === e.currentTarget && !submittingPayment) setActivePaymentModal(null); }}
                className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md flex items-center justify-center p-4"
              >
                <div className="bg-white/95 rounded-[28px] max-w-md w-full p-6 space-y-4 shadow-2xl border border-white backdrop-blur-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-[#10291d] text-base">Authorize Bank DBT Disbursal</h3>
                    <button
                      onClick={() => setActivePaymentModal(null)}
                      className="p-1 text-[#627d6d] hover:text-[#10291d]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-[#527060]">
                    Disbursing <b>{formatCurrency(activePaymentModal.amount)}</b> for Farmer #{activePaymentModal.farmer_id} (Procurement #{activePaymentModal.procurement_id}).
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-[#355642] mb-1.5">
                      Bank UTR / Transaction Reference Number
                    </label>
                    <input
                      type="text"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      placeholder="e.g. UTR89234812"
                      className="w-full text-xs p-3 rounded-xl border border-[#cfe0d5] bg-white font-mono font-bold focus:outline-[#176b3e]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setActivePaymentModal(null)}
                      className="px-4 py-2 text-xs font-bold text-[#527060] hover:bg-[#eef5f0] rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdatePayment(activePaymentModal.id, "PAID", utrNumber)}
                      disabled={submittingPayment}
                      className="px-5 py-2.5 text-xs font-black text-white bg-[#176b3e] hover:bg-[#115832] rounded-xl shadow-md transition"
                    >
                      {submittingPayment ? "Authorizing..." : "Confirm Payout ✓"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: BOOKINGS & SLOTS */}
        {activeTab === "bookings" && (
          <div className="space-y-6">
            <GlassCard className="p-6">
              <div className="border-b border-[#e7f0e9] pb-4 mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-[#10291d] text-base sm:text-lg">
                    Centre Bookings Scheduled ({bookings.length})
                  </h3>
                  <p className="text-xs text-[#5f7869] font-medium">Farmers scheduled to deliver produce to this centre</p>
                </div>
              </div>

              {bookings.length === 0 ? (
                <div className="py-12 text-center text-[#668273]">
                  <Calendar className="w-12 h-12 text-[#9abfb0] mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#1a442e]">No bookings scheduled for this centre yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-[#edf6f0]/80 text-[#1f4a30] text-[11px] font-extrabold uppercase tracking-wider border-b border-[#dce8df]">
                        <th className="py-3 px-4 rounded-l-xl">Booking ID</th>
                        <th className="py-3 px-4">Token</th>
                        <th className="py-3 px-4">Farmer ID</th>
                        <th className="py-3 px-4">Declared Quantity</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right rounded-r-xl">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ebf3ed]">
                      {bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-[#f3faf5]/80 transition">
                          <td className="py-3.5 px-4 font-black text-[#10291d]">#BKG-{b.id}</td>
                          <td className="py-3.5 px-4 font-mono font-black text-[#176b3e]">{b.token}</td>
                          <td className="py-3.5 px-4 text-[#10291d] font-semibold">Farmer #{b.farmer_id}</td>
                          <td className="py-3.5 px-4 font-bold text-[#10291d]">
                            {b.declared_quantity} {b.quantity_unit}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black ${
                                b.status === "COMPLETED"
                                  ? "bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]"
                                  : b.status === "CHECKED_IN"
                                  ? "bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]"
                                  : "bg-[#f1f5f2] text-[#41604f]"
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleOpenInspectionForBooking(b.id)}
                              className="px-3.5 py-1.5 bg-[#176b3e] hover:bg-[#115832] text-white rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
                            >
                              Open Procurement
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </div>
        )}

        {/* TAB 5: ANALYTICS & REPORTS */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <GlassCard className="p-5 space-y-1">
                <span className="text-xs text-[#5f7869] font-bold">Total Bookings Today</span>
                <div className="text-2xl font-black text-[#10291d]">{analytics?.bookings_today ?? bookings.length}</div>
                <div className="text-[11px] text-[#789383]">Scheduled arrival capacity</div>
              </GlassCard>

              <GlassCard className="p-5 space-y-1">
                <span className="text-xs text-[#5f7869] font-bold">Checked-in & Queue</span>
                <div className="text-2xl font-black text-amber-700">{analytics?.checked_in_today ?? queueList.length}</div>
                <div className="text-[11px] text-[#789383]">Tokens issued at yard gate</div>
              </GlassCard>

              <GlassCard className="p-5 space-y-1">
                <span className="text-xs text-[#5f7869] font-bold">Total Quantity Procured</span>
                <div className="text-2xl font-black text-[#176b3e]">
                  {(analytics?.procured_quantity ?? 0).toFixed(1)} Qtl
                </div>
                <div className="text-[11px] text-[#789383]">Official weighed and accepted produce</div>
              </GlassCard>

              <GlassCard className="p-5 space-y-1">
                <span className="text-xs text-[#5f7869] font-bold">Total Disbursal Value</span>
                <div className="text-2xl font-black text-[#176b3e]">
                  {formatCurrency(analytics?.procurement_value ?? 0)}
                </div>
                <div className="text-[11px] text-[#789383]">Government MSP payout committed</div>
              </GlassCard>
            </div>

            {/* Operational Efficiency Card */}
            <GlassCard className="p-6 space-y-4">
              <h3 className="font-black text-[#10291d] text-base sm:text-lg">Operational Efficiency & Metrics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-white/70 rounded-2xl border border-white">
                  <div className="text-[#5f7869] font-bold">Average Service Time</div>
                  <div className="text-xl font-black text-[#10291d] mt-1">
                    {(analytics?.average_service_minutes ?? 10).toFixed(1)} Minutes
                  </div>
                  <div className="text-[#789383] mt-1">Per farmer gate-to-receipt cycle</div>
                </div>

                <div className="p-4 bg-white/70 rounded-2xl border border-white">
                  <div className="text-[#5f7869] font-bold">No-Show Rate</div>
                  <div className="text-xl font-black text-[#10291d] mt-1">
                    {(analytics?.no_show_rate_percent ?? 0).toFixed(1)}%
                  </div>
                  <div className="text-[#789383] mt-1">Skipped or unattended tokens</div>
                </div>

                <div className="p-4 bg-white/70 rounded-2xl border border-white">
                  <div className="text-[#5f7869] font-bold">Mandi Daily Quota Utilization</div>
                  <div className="text-xl font-black text-[#176b3e] mt-1">
                    {centre?.max_daily_quantity
                      ? `${(((analytics?.procured_quantity || 0) / centre.max_daily_quantity) * 100).toFixed(1)}%`
                      : "0.0%"}
                  </div>
                  <div className="text-[#789383] mt-1">Capacity: {centre?.max_daily_quantity || 5000} Qtl/day</div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </main>
    </div>
  );
}
