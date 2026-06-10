import { API_BASE } from '../constants';

function getToken() {
  return sessionStorage.getItem('access');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (res.status === 401 && !endpoint.includes('/auth/manager-login/')) {
    const stored = sessionStorage.getItem('user');
    const isManager = stored ? JSON.parse(stored)?.role === 'manager' : false;
    sessionStorage.removeItem('access');
    window.location.href = isManager ? '/manager' : '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || JSON.stringify(err));
  }
  if (res.status === 204) return null;
  return res.json();
}

export const auth = {
  sendOTP: (mobile) => request('/auth/send-otp/', { method: 'POST', body: JSON.stringify({ mobile }) }),
  verifyOTP: (mobile, otp) => request('/auth/verify-otp/', { method: 'POST', body: JSON.stringify({ mobile, otp }) }),
  register: (data) => request('/auth/register/', { method: 'POST', body: JSON.stringify(data) }),
  managerLogin: (username, password) => request('/auth/manager-login/', { method: 'POST', body: JSON.stringify({ username, password }) }),
};

export const targetAreas = {
  getStates: () => request('/target-areas/states/'),
  getCities: (state) => request(`/target-areas/cities/?state=${encodeURIComponent(state)}`),
  getLocalities: (state, city) => request(`/target-areas/localities/?state=${encodeURIComponent(state)}&city=${encodeURIComponent(city)}`),
};

export const targetAudiences = {
  list: () => request('/target-audiences/'),
  create: (data) => request('/target-audiences/', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => request(`/target-audiences/${id}/`, { method: 'DELETE' }),
};

export const ads = {
  list: () => request('/ads/'),
  get: (id) => request(`/ads/${id}/`),
  create: (data) => {
    const hasFile = data.asset instanceof File;
    if (hasFile) {
      const form = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (Array.isArray(v)) v.forEach((item) => form.append(k, item));
        else if (v !== undefined && v !== null) form.append(k, v);
      });
      return request('/ads/', { method: 'POST', body: form });
    }
    return request('/ads/', { method: 'POST', body: JSON.stringify(data) });
  },
  update: (id, data) => {
    const hasFile = data.asset instanceof File;
    if (hasFile) {
      const form = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (Array.isArray(v)) v.forEach((item) => form.append(k, item));
        else if (v !== undefined && v !== null) form.append(k, v);
      });
      return request(`/ads/${id}/`, { method: 'PATCH', body: form });
    }
    return request(`/ads/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  submitForApproval: (id) => request(`/ads/${id}/submit_for_approval/`, { method: 'POST' }),
  approve: (id, data = {}) => request(`/ads/${id}/approve/`, { method: 'POST', body: JSON.stringify(data) }),
  reject: (id, data = {}) => request(`/ads/${id}/reject/`, { method: 'POST', body: JSON.stringify(data) }),
  addIteration: (id, data) => request(`/ads/${id}/add_iteration/`, { method: 'POST', body: JSON.stringify(data) }),
  downloadFinal: (id) => request(`/ads/${id}/download_final/`),
  generateVideo: (id) => request(`/ads/${id}/generate_video/`, { method: 'POST' }),
};
