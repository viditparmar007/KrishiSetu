import { getAuthToken } from "../utils/authStorage";

const API_ENV = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const API_URL = API_ENV.endsWith("/api/v1") ? API_ENV : `${API_ENV}/api/v1`;

function headers(extra = {}) {
  const token = getAuthToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path.startsWith("/") ? path : `/${path}`}`, {
    ...options,
    headers: headers(options.headers || {}),
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }

  if (!response.ok) {
    const detail = Array.isArray(data?.detail)
      ? data.detail.map((x) => x?.msg || x?.message || String(x)).join(" ")
      : data?.detail || data?.message || `Request failed (${response.status})`;
    const error = new Error(detail);
    error.response = { status: response.status, data };
    throw error;
  }
  return { data, status: response.status, ok: true };
}

const json = (method, path, body) =>
  request(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export const officerApi = {
  // Officer Profile & Assigned Centre
  getMe: () => request("/officer/me"),
  getCentre: () => request("/officer/centre"),
  getAnalyticsSummary: () => request("/officer/analytics/summary"),

  // Live Token & Queue Desk
  getQueue: (dateStr) =>
    request(`/officer/queue${dateStr ? `?queue_date=${dateStr}` : ""}`),
  getQueueSummary: (dateStr) =>
    request(`/officer/queue/summary${dateStr ? `?queue_date=${dateStr}` : ""}`),
  callNext: (dateStr) =>
    request(`/officer/queue/call-next${dateStr ? `?queue_date=${dateStr}` : ""}`, {
      method: "POST",
    }),
  startProcessing: (queueEntryId) =>
    request(`/officer/queue/${queueEntryId}/start-processing`, { method: "POST" }),
  completeQueue: (queueEntryId) =>
    request(`/officer/queue/${queueEntryId}/complete`, { method: "POST" }),
  markNoShow: (queueEntryId) =>
    request(`/officer/queue/${queueEntryId}/no-show`, { method: "POST" }),
  manualEntry: (payload) =>
    json("POST", "/officer/queue/manual-entry", payload),
  checkInBooking: (bookingId) =>
    request(`/officer/queue/check-in/${bookingId}`, { method: "POST" }),

  // Bookings List
  getBookings: (dateStr, status) => {
    const params = new URLSearchParams();
    if (dateStr) params.append("booking_date", dateStr);
    if (status) params.append("booking_status", status);
    const qs = params.toString();
    return request(`/officer/bookings${qs ? `?${qs}` : ""}`);
  },

  // Procurement Workflow
  getProcurements: () => request("/officer/procurements"),
  startProcurement: (bookingId) =>
    request(`/officer/procurements/start/${bookingId}`, { method: "POST" }),
  verifyDocuments: (procurementId, payload) =>
    json("POST", `/officer/procurements/${procurementId}/documents`, payload),
  qualityCheck: (procurementId, payload) =>
    json("POST", `/officer/procurements/${procurementId}/quality`, payload),
  recordWeighing: (procurementId, payload) =>
    json("POST", `/officer/procurements/${procurementId}/weighing`, payload),
  decideProcurement: (procurementId, payload) =>
    json("POST", `/officer/procurements/${procurementId}/decision`, payload),

  // Payments & Payouts Ledger
  getPayments: () => request("/officer/payments"),
  updatePayment: (paymentId, payload) =>
    json("PUT", `/officer/payments/${paymentId}`, payload),

  // Slots & Centre Capacity
  createSlot: (payload) => json("POST", "/officer/slots", payload),
  updateSlot: (slotId, payload) => json("PUT", `/officer/slots/${slotId}`, payload),
};

export default officerApi;

