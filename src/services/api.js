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
  if (res.status === 401 && !endpoint.includes('/auth/manager-login/') && !endpoint.includes('/auth/developer-login/')) {
    const stored = sessionStorage.getItem('user');
    const role = stored ? JSON.parse(stored)?.role : null;
    sessionStorage.removeItem('access');
    if (role === 'manager') window.location.href = '/manager';
    else if (role === 'developer') window.location.href = '/developer';
    else window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const ex = new Error(err.detail || err.error || JSON.stringify(err));
    ex.data = err;
    ex.status = res.status;
    throw ex;
  }
  if (res.status === 204) return null;
  return res.json();
}

export const auth = {
  sendOTP: (mobile) => request('/auth/send-otp/', { method: 'POST', body: JSON.stringify({ mobile }) }),
  verifyOTP: (mobile, otp) => request('/auth/verify-otp/', { method: 'POST', body: JSON.stringify({ mobile, otp }) }),
  register: (data) => request('/auth/register/', { method: 'POST', body: JSON.stringify(data) }),
  managerLogin: (username, password) => request('/auth/manager-login/', { method: 'POST', body: JSON.stringify({ username, password }) }),
  developerRegister: (data) => request('/auth/developer-register/', { method: 'POST', body: JSON.stringify(data) }),
  developerLogin: (email, password) => request('/auth/developer-login/', { method: 'POST', body: JSON.stringify({ email, password }) }),
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

export const languages = {
  list: () => request('/languages/'),
  create: (data) => request('/languages/', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => request(`/languages/${id}/`, { method: 'DELETE' }),
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
  downloadFinal: (id, assetId) => request(`/ads/${id}/download_final/${assetId ? `?asset_id=${assetId}` : ''}`),
  generateVideo: (id) => request(`/ads/${id}/generate_video/`, { method: 'POST' }),
  generateLanguageVideo: (id, languageId, prompt) => request(`/ads/${id}/generate_video/`, { method: 'POST', body: JSON.stringify({ language_id: languageId, prompt }) }),
  updateLanguageAsset: (id, data) => request(`/ads/${id}/update_language_asset/`, { method: 'PATCH', body: JSON.stringify(data) }),
  languageAssetsList: (id) => request(`/ads/${id}/language_assets_list/`),
  pushToApp: (id, appId) => request(`/ads/${id}/push_to_app/`, { method: 'POST', body: JSON.stringify({ app_id: appId }) }),
  pushToApps: (id, appIds) => request(`/ads/${id}/push_to_app/`, { method: 'POST', body: JSON.stringify({ app_ids: appIds }) }),
  pushedApps: (id) => request(`/ads/${id}/pushed_apps/`),
  generateImage: (data) => request('/ads/generate_image/', { method: 'POST', body: JSON.stringify(data) }),
  generateVideoClip: (data) => request('/ads/generate_video_clip/', { method: 'POST', body: JSON.stringify(data) }),
  getModels: () => request('/models/'),
  getUsageStats: () => request('/usage-stats/'),
  getRecentMedia: () => request('/recent-media/'),
  enhancePrompt: (data) => request('/enhance-prompt/', { method: 'POST', body: JSON.stringify(data) }),
  uploadAsset: (id, data) => {
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) form.append(k, v);
    });
    return request(`/ads/${id}/upload_asset/`, { method: 'POST', body: form });
  },
  requestRevision: (id, data) => request(`/ads/${id}/request_revision/`, { method: 'POST', body: JSON.stringify(data) }),
  sendBackToClient: (id, data) => request(`/ads/${id}/send_back_to_client/`, { method: 'POST', body: JSON.stringify(data) }),
  getRevisionRequests: () => request('/ads/revision_requests/'),
  getVideoFeedback: (adId) => request(`/ads/${adId}/video-feedback/`),
  addVideoFeedback: (adId, data) => {
    const body = { comment: data.comment };
    if (data.timestamp_seconds != null) body.timestamp_seconds = data.timestamp_seconds;
    if (data.language_asset_id) body.language_asset_id = data.language_asset_id;
    return request(`/ads/${adId}/video-feedback/`, { method: 'POST', body: JSON.stringify(body) });
  },
  deleteVideoFeedback: (adId, feedbackId) => request(`/ads/${adId}/video-feedback/${feedbackId}/`, { method: 'DELETE' }),
  saveGeneratedAssets: (adId, data) => request(`/ads/${adId}/save_generated_assets/`, { method: 'POST', body: JSON.stringify(data) }),
  createCreative: (data) => {
    const hasFile = data.image_file instanceof File || data.video_file instanceof File;
    if (hasFile) {
      const form = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (Array.isArray(v)) v.forEach((item) => form.append(k, item));
        else if (v !== undefined && v !== null) form.append(k, v);
      });
      return request('/ads/create_creative/', { method: 'POST', body: form });
    }
    return request('/ads/create_creative/', { method: 'POST', body: JSON.stringify(data) });
  },
};

export const developerAds = {
  list: () => request('/developer/ads/'),
  getDetails: (id) => request(`/developer/ads/${id}/details/`),
};

export const managerSettings = {
  getApiKey: () => request('/auth/manager-api-key/'),
  setApiKey: (apiKey) => request('/auth/manager-api-key/', { method: 'PUT', body: JSON.stringify({ api_key: apiKey }) }),
};

export const developerApps = {
  list: () => request('/developer/apps/'),
  create: (data) => request('/developer/apps/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/developer/apps/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/developer/apps/${id}/`, { method: 'DELETE' }),
};

export const creativeSessions = {
  list: () => request('/creative-sessions/'),
  create: (data) => request('/creative-sessions/', { method: 'POST', body: JSON.stringify(data) }),
  get: (id) => request(`/creative-sessions/${id}/`),
  update: (id, data) => request(`/creative-sessions/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/creative-sessions/${id}/`, { method: 'DELETE' }),
  addEvent: (id, data) => request(`/creative-sessions/${id}/add-event/`, { method: 'POST', body: JSON.stringify(data) }),
  uploadMedia: (file) => {
    const form = new FormData();
    form.append('file', file);
    return request('/upload-media/', { method: 'POST', body: form });
  },
};
