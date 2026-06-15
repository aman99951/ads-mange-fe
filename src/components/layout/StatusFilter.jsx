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
            className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-300 hover-lift ${
              isActive
                ? dark
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-400 border border-amber-500/30 shadow-[0_0_20px_rgba(217,160,50,0.08)]'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20'
                : dark
                  ? 'bg-neutral-900/60 text-neutral-500 border border-neutral-800 hover:border-neutral-700 hover:text-neutral-300 backdrop-blur-sm'
                  : 'bg-stone-100/80 text-stone-500 border border-stone-200 hover:border-stone-300 hover:text-stone-700 backdrop-blur-sm'
            }`}
          >
            {formatLabel(s)}
            {count > 0 && (
              <span className={`text-[10px] font-semibold ${isActive ? (dark ? 'text-amber-400/70' : 'text-white/70') : (dark ? 'text-neutral-600' : 'text-stone-400')}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
