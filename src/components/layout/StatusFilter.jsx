import { useTheme } from '../../context/ThemeContext';
import { AD_STATUS_FILTERS, AD_STATUS_LABELS } from '../../constants';

export default function StatusFilter({ filters = AD_STATUS_FILTERS, active, onChange, counts = {} }) {
  const { dark } = useTheme();

  const formatLabel = (s) => {
    if (s === 'all') return 'All';
    return AD_STATUS_LABELS[s] || s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
      {filters.map((s) => {
        const isActive = active === s;
        const count = s === 'all' ? total : (counts[s] || 0);

        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${
              isActive
                ? (dark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-amber-500 text-white border border-amber-600')
                : (dark ? 'bg-neutral-900 text-neutral-500 border border-neutral-800 hover:border-neutral-700' : 'bg-stone-100 text-stone-500 border border-stone-200 hover:border-stone-300')
            }`}
          >
            {formatLabel(s)}
            {count > 0 && (
              <span className={`text-[10px] ${isActive ? (dark ? 'text-amber-400/70' : 'text-white/70') : (dark ? 'text-neutral-600' : 'text-stone-400')}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
