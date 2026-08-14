const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function authHeaders() {
  const token = localStorage.getItem('admin_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handle(res) {
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      message = body.error || message
    } catch { /* no json body */ }
    throw new Error(message)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  // ---- public ----
  getAvailability: (date) =>
    fetch(`${BASE_URL}/availability?date=${date}`).then(handle),

  createBooking: (payload) =>
    fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handle),

  // ---- admin auth ----
  login: (username, password) =>
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }).then(handle),

  // ---- admin: courts ----
  getCourts: () =>
    fetch(`${BASE_URL}/courts`, { headers: authHeaders() }).then(handle),

  createCourt: (payload) =>
    fetch(`${BASE_URL}/courts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload)
    }).then(handle),

  updateCourt: (id, payload) =>
    fetch(`${BASE_URL}/courts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload)
    }).then(handle),

  deleteCourt: (id) =>
    fetch(`${BASE_URL}/courts/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handle),

  addClosure: (payload) =>
    fetch(`${BASE_URL}/courts/closures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload)
    }).then(handle),

  removeClosure: (id) =>
    fetch(`${BASE_URL}/courts/closures/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handle),

  addPricingRule: (payload) =>
    fetch(`${BASE_URL}/courts/pricing-rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload)
    }).then(handle),

  removePricingRule: (id) =>
    fetch(`${BASE_URL}/courts/pricing-rules/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handle),

  // ---- admin: bookings ----
  getBookings: (filters = {}) => {
    const params = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v !== '' && v != null)
    )
    return fetch(`${BASE_URL}/bookings?${params}`, { headers: authHeaders() }).then(handle)
  },

  cancelBooking: (id) =>
    fetch(`${BASE_URL}/bookings/${id}/cancel`, { method: 'PATCH', headers: authHeaders() }).then(handle)
}
