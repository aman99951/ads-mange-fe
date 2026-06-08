export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(dateStr, options = {}) {
  const date = new Date(dateStr);
  const defaults = { day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-IN', { ...defaults, ...options });
}

export function formatDateShort(dateStr) {
  return formatDate(dateStr, { day: 'numeric', month: 'short' });
}

export function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

export function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural || `${singular}s`;
}

export function statusLabel(status) {
  const labels = {
    draft: 'Draft',
    pending_approval: 'Pending Approval',
    approved: 'Approved',
    rejected: 'Rejected',
  };
  return labels[status] || status;
}

export function isImageFile(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
}
