const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const isJson = (response.headers.get('content-type') || '').includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(payload?.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.details = payload?.details || [];
    throw error;
  }

  return payload;
}

export const api = {
  getContent: () => request('/content'),
  getTours: () => request('/tours'),
  createBooking: (data) =>
    request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  createContactMessage: (data) =>
    request('/contact', { method: 'POST', body: JSON.stringify(data) }),
};

export default api;