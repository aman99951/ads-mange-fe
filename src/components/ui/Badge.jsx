import { useTheme } from '../../context/ThemeContext';
import { AD_STATUS_LABELS } from '../../constants';

const statusStyles = {
  draft: { dot: 'bg-amber-500', bg: (d) => d ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-800', icon: 'M9.75 3.75v-2.25m0 2.25a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM9.75 15v-2.25M9.75 9v4.5' },
  pending_approval: { dot: 'bg-blue-500', bg: (d) => d ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-800', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
  approved: { dot: 'bg-emerald-500', bg: (d) => d ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  rejected: { dot: 'bg-red-500', bg: (d) => d ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-800', icon: 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  expired: { dot: 'bg-gray-500', bg: (d) => d ? 'bg-gray-500/10 border-gray-500/20 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-800', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
};

export default function Badge({ status, className = '' }) {
  const { dark } = useTheme();
  const style = statusStyles[status] || statusStyles.draft;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-300 ${style.bg(dark)} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {AD_STATUS_LABELS[status] || status}
    </span>
  );
}
