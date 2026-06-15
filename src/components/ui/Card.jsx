import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../config/theme';

const t = (k) => (d) => colors[d ? 'dark' : 'light'][k];

export function SectionCard({ dark: forcedDark, title, children, className = '' }) {
  const { dark: themeDark } = useTheme();
  const dark = forcedDark !== undefined ? forcedDark : themeDark;

  return (
    <div className={`rounded-xl p-4 sm:p-5 transition-all duration-500 hover-lift ${
      dark
        ? 'bg-neutral-900/50 border border-neutral-800 hover:border-amber-500/20'
        : 'bg-white/80 backdrop-blur-sm border border-stone-200 shadow-sm hover:shadow-md'
    } ${className}`}>
      <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 transition-colors duration-500 ${t('textMuted')(dark)}`}>{title}</h3>
      {children}
    </div>
  );
}

export function StatCard({ dark: forcedDark, icon, label, value, accent, index = 0 }) {
  const { dark: themeDark } = useTheme();
  const dark = forcedDark !== undefined ? forcedDark : themeDark;

  const accentColors = {
    approved: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400' },
    pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400' },
    total: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', iconBg: 'bg-violet-500/15', iconColor: 'text-violet-400' },
  };

  const lightAccent = {
    approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    total: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
  };

  const ac = dark ? (accentColors[accent] || accentColors.total) : (lightAccent[accent] || lightAccent.total);

  return (
    <div
      className={`rounded-xl p-5 transition-all duration-300 hover-lift animate-fade-in-up ${
        dark
          ? 'bg-neutral-900/70 border border-neutral-800 hover:border-amber-500/25'
          : 'bg-white/90 backdrop-blur-sm border border-stone-200 shadow-sm hover:shadow-lg'
      }`}
      style={{ animationDelay: `${(index || 0) * 100}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${ac.iconBg} transition-all duration-300`}>
          <svg className={`w-4 h-4 ${ac.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
        {accent && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ac.bg} ${ac.text} ${ac.border}`}>
            {value}
          </span>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-bold tracking-tight transition-colors duration-500" style={{ color: dark ? '#f5f5f5' : '#1a1a1a' }}>
        {value}
      </p>
      <p className={`text-xs mt-1 font-medium transition-colors duration-500 ${t('textMuted')(dark)}`}>{label}</p>
    </div>
  );
}

export function ClickableCard({ dark: forcedDark, children, onClick, className = '' }) {
  const { dark: themeDark } = useTheme();
  const dark = forcedDark !== undefined ? forcedDark : themeDark;

  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-4 sm:p-5 cursor-pointer transition-all duration-300 group hover-lift ${
        dark
          ? 'bg-neutral-900/60 border border-neutral-800 hover:border-amber-500/30 hover:bg-neutral-900/80 hover:shadow-[0_0_30px_rgba(217,160,50,0.08)]'
          : 'bg-white/80 backdrop-blur-sm border border-stone-200 shadow-sm hover:border-amber-300 hover:shadow-lg hover:bg-white'
      } ${className}`}
    >
      {children}
    </div>
  );
}
