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
  try { data = text ? JSON.parse(text) : {}; } catch { data = text; }

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

const json = (method, path, body) => request(path, {
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

async function fallback(primary, secondary) {
  try {
    return await primary();
  } catch (error) {
    if (![404, 405, 422].includes(error?.response?.status)) throw error;
    return secondary();
  }
}

const farmerApi = {
  dashboard: () => request("/dashboard/farmer"),
  farmer: () => request("/farmers/me"),
  updateFarmer: (payload) => json("PUT", "/farmers/me", payload),

  farms: () => request("/farms"),
  farm: (id) => request(`/farms/${id}`),
  createFarm: (payload) => json("POST", "/farms", payload),
  updateFarm: (id, payload) => json("PUT", `/farms/${id}`, payload),
  deleteFarm: (id) => request(`/farms/${id}`, { method: "DELETE" }),

  crops: () => request("/crops"),
  farmCrops: (farmId) => request(`/farms/${farmId}/crops`),
  crop: (id) => request(`/crops/${id}`),
  createCrop: (farmId, payload) => json("POST", `/farms/${farmId}/crops`, payload),
  updateCrop: (id, payload) => json("PUT", `/crops/${id}`, payload),
  deleteCrop: (id) => request(`/crops/${id}`, { method: "DELETE" }),

  centres: (params = "") => request(`/centres${params ? `?${new URLSearchParams(params)}` : ""}`),
  centre: (id) => request(`/centres/${id}`),
  slots: (centreId) => request(`/centres/${centreId}/slots`),
  recommendations: (limit = 8) => request(`/recommendations/centres?limit=${limit}`),
  recommendedSlots: (centreId, limit = 8) => request(`/recommendations/slots/${centreId}?limit=${limit}`),

  bookings: () => request("/bookings"),
  booking: (id) => request(`/bookings/${id}`),
  createBooking: (payload) => json("POST", "/bookings", payload),
  cancelBooking: (id) => request(`/bookings/${id}/cancel`, { method: "POST" }),

  queue: () => fallback(() => request("/queue/me"), async () => ({ data: [], status: 200, ok: true })),
  checkIn: (bookingId) => request(`/queue/check-in/${bookingId}`, { method: "POST" }),
  onTheWay: (bookingId) => request(`/queue/${bookingId}/on-the-way`, { method: "POST" }),
  queueForBooking: (bookingId) => request(`/queue/${bookingId}`),

  procurements: () => request("/procurements/my"),
  procurement: (id) => request(`/procurements/${id}`),
  payments: () => request("/payments"),
  payment: (id) => request(`/payments/${id}`),

  notifications: () => request("/notifications"),
  unreadCount: () => request("/notifications/unread-count"),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "POST" }),
  markAllNotificationsRead: () => request("/notifications/read-all", { method: "POST" }),

  leaveTime: (bookingId, params = {}) => request(`/recommendations/leave-time/${bookingId}${Object.keys(params).length ? `?${new URLSearchParams(params)}` : ""}`),

  weatherForFarm: (farmId, lat, lon) => (lat != null && lon != null)
    ? request(`/providers/weather?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}`)
    : request(`/providers/weather?latitude=30.0363&longitude=77.7518`),
  weather: (latitude, longitude) => request(`/providers/weather?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`),

  marketPrices: () => request("/providers/market-prices"),
  schemes: () => request("/providers/schemes"),

  assistantQuery: (payload) => json("POST", "/assistant/query", payload),
};

export default farmerApi;
