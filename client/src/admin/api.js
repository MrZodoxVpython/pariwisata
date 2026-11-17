const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const TOKEN_KEY = 'cb_admin_token';

export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  } catch (error) {
    return '';
  }
}

export function setToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    /* ignore */
  }
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const isJson = (response.headers.get('content-type') || '').includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (response.status === 401 && token) {
    setToken('');
    window.dispatchEvent(new Event('cb-admin-unauthorized'));
  }

  if (!response.ok) {
    const error = new Error(payload?.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.details = payload?.details || [];
    throw error;
  }

  return payload;
}

async function compressImage(file, maxSize = 1800, quality = 0.82) {
  if (!/^image\//.test(file.type) || file.type === 'image/gif') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
  } catch (error) {
    return file;
  }
}

async function uploadImage(file) {
  const prepared = await compressImage(file);
  const sign = await request('/admin/media/sign', {
    method: 'POST',
    body: { filename: prepared.name, contentType: prepared.type || 'image/webp' },
  });

  const upload = await fetch(sign.signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': prepared.type || 'image/webp', 'x-upsert': 'true' },
    body: prepared,
  });
  if (!upload.ok) {
    const text = await upload.text();
    throw new Error(`Upload failed (${upload.status}): ${text.slice(0, 160)}`);
  }

  const registered = await request('/admin/media', {
    method: 'POST',
    body: {
      path: sign.path,
      url: sign.publicUrl,
      mime: prepared.type,
      size: prepared.size,
    },
  });
  return registered.media;
}

async function download(path, filename) {
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error('Export failed');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export const adminApi = {
  login: (email, password) =>
    request('/admin/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/admin/auth/me'),
  logout: (allDevices = false) =>
    request('/admin/auth/logout', { method: 'POST', body: { allDevices } }),
  changePassword: (currentPassword, newPassword) =>
    request('/admin/auth/password', { method: 'POST', body: { currentPassword, newPassword } }),
  get: (path) => request(`/admin${path}`),
  post: (path, body) => request(`/admin${path}`, { method: 'POST', body: body ?? {} }),
  patch: (path, body) => request(`/admin${path}`, { method: 'PATCH', body }),
  put: (path, body) => request(`/admin${path}`, { method: 'PUT', body }),
  del: (path) => request(`/admin${path}`, { method: 'DELETE' }),
  uploadImage,
  download,
};

export default adminApi;