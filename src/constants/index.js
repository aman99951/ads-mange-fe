export const AD_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const AD_STATUS_LABELS = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const AD_STATUS_FILTERS = ['all', 'draft', 'pending_approval', 'approved', 'rejected'];

export const WIZARD_STEPS = [
  { num: 1, label: 'Target Area' },
  { num: 2, label: 'Audience' },
  { num: 3, label: 'Ad Content' },
  { num: 4, label: 'Review' },
];

export const ITERATION_ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client',
};

export const FILE_ACCEPT = 'image/*,.pdf';
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  ADS: '/ads',
  CREATE_AD: '/ads/create',
  AD_DETAIL: '/ads/:id',
  MANAGER_LOGIN: '/manager',
  MANAGER_DASHBOARD: '/manager/dashboard',
  MANAGER_AD_DETAIL: '/manager/ads/:id',
  MANAGER_TARGET_AREAS: '/manager/target-areas',
};

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api';
