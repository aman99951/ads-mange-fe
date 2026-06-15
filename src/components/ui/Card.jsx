import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../config/theme';

const t = (k) => (d) => colors[d ? 'dark' : 'light'][k];

export function SectionCard({ dark: forcedDark, title, children, className = '' }) {
  const { dark: themeDark } = useTheme();
  const dark = forcedDark !== undefined ? forcedDark : themeDark;

  return (
    <div className={`rounded-2xl p-5 sm:p-6 transition-all duration-500 ${
      dark
        ? 'bg-neutral-900/70 backdrop-blur-sm border border-neutral-800 hover:border-amber-500/15'
        : 'bg-white/90 backdrop-blur-sm border border-stone-200 shadow-sm hover:shadow-md'
    } ${className}`}>
      {title && (
        <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 transition-colors duration-500 ${t('textMuted')(dark)}`}>{title}</h3>
      )}
      {children}
    </div>
  );
}

export function StatCard({ dark: forcedDark, icon, label, value, accent, index = 0 }) {
  const { dark: themeDark } = useTheme();
  const dark = forcedDark !== undefined ? forcedDark : themeDark;

  const accentColors = {
    approved: { bg: dark ? 'bg-emerald-500/10' : 'bg-emerald-50', text: dark ? 'text-emerald-400' : 'text-emerald-700', border: dark ? 'border-emerald-500/20' : 'border-emerald-200', iconBg: dark ? 'bg-emerald-500/15' : 'bg-emerald-100', iconColor: dark ? 'text-emerald-400' : 'text-emerald-600' },
    pending: { bg: dark ? 'bg-amber-500/10' : 'bg-amber-50', text: dark ? 'text-amber-400' : 'text-amber-700', border: dark ? 'border-amber-500/20' : 'border-amber-200', iconBg: dark ? 'bg-amber-500/15' : 'bg-amber-100', iconColor: dark ? 'text-amber-400' : 'text-amber-600' },
    total: { bg: dark ? 'bg-violet-500/10' : 'bg-violet-50', text: dark ? 'text-violet-400' : 'text-violet-700', border: dark ? 'border-violet-500/20' : 'border-violet-200', iconBg: dark ? 'bg-violet-500/15' : 'bg-violet-100', iconColor: dark ? 'text-violet-400' : 'text-violet-600' },
  };

  const ac = accentColors[accent] || accentColors.total;

  return (
    <div
      className={`rounded-2xl p-5 sm:p-6 transition-all duration-300 hover-lift animate-fade-in-up ${
        dark
          ? 'bg-neutral-900/70 backdrop-blur-sm border border-neutral-800 hover:border-amber-500/25'
          : 'bg-white/90 backdrop-blur-sm border border-stone-200 shadow-sm hover:shadow-lg'
      }`}
      style={{ animationDelay: `${(index || 0) * 100}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${ac.iconBg} transition-all duration-300`}>
          <svg className={`w-5 h-5 ${ac.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
        {accent && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ac.bg} ${ac.text} ${ac.border}`}>
            {value}
          </span>
        )}
      </div>
      <p className="text-3xl sm:text-4xl font-bold tracking-tight transition-colors duration-500" style={{ color: dark ? '#f5f5f5' : '#1a1a1a' }}>
        {value}
      </p>
      <p className={`text-xs sm:text-sm mt-1.5 font-medium transition-colors duration-500 ${t('textMuted')(dark)}`}>{label}</p>
    </div>
  );
}

export function ClickableCard({ dark: forcedDark, children, onClick, className = '' }) {
  const { dark: themeDark } = useTheme();
  const dark = forcedDark !== undefined ? forcedDark : themeDark;

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-5 sm:p-6 cursor-pointer transition-all duration-300 group hover-lift ${
        dark
          ? 'bg-neutral-900/60 backdrop-blur-sm border border-neutral-800 hover:border-amber-500/30 hover:bg-neutral-900/80 hover:shadow-[0_0_40px_rgba(217,160,50,0.08)]'
          : 'bg-white/80 backdrop-blur-sm border border-stone-200 shadow-sm hover:border-amber-300/60 hover:shadow-lg hover:bg-white'
      } ${className}`}
    >
      {children}
    </div>
  );
}
