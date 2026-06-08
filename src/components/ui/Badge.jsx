import { AD_STATUS_LABELS } from '../../constants';

const statusStyles = {
  draft: 'text-amber-900 bg-amber-100 border-amber-300 dark:text-amber-900 dark:bg-amber-400/20 dark:border-amber-500/30',
  pending_approval: 'text-blue-800 bg-blue-100 border-blue-300 dark:text-blue-200 dark:bg-blue-500/20 dark:border-blue-500/30',
  approved: 'text-emerald-800 bg-emerald-100 border-emerald-300 dark:text-emerald-200 dark:bg-emerald-500/20 dark:border-emerald-500/30',
  rejected: 'text-red-800 bg-red-100 border-red-300 dark:text-red-200 dark:bg-red-500/20 dark:border-red-500/30',
};

export default function Badge({ status, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-300 ${statusStyles[status] || statusStyles.draft} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'approved' ? 'bg-emerald-500' : status === 'rejected' ? 'bg-red-500' : status === 'pending_approval' ? 'bg-blue-500' : 'bg-amber-500'}`} />
      {AD_STATUS_LABELS[status] || status}
    </span>
  );
}
