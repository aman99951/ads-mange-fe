import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../config/theme';

const t = (k) => (d) => colors[d ? 'dark' : 'light'][k];

export function SectionCard({ dark: forcedDark, title, children, className = '' }) {
  const { dark: themeDark } = useTheme();
  const dark = forcedDark !== undefined ? forcedDark : themeDark;

  return (
    <div className={`rounded-xl p-4 sm:p-5 transition-all duration-500 ${
      dark ? 'bg-neutral-900/50 border border-neutral-800' : 'bg-white border border-stone-200'
    } ${className}`}>
      <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 transition-colors duration-500 ${t('textMuted')(dark)}`}>{title}</h3>
      {children}
    </div>
  );
}

export function StatCard({ dark: forcedDark, icon, label, value, accent }) {
  const { dark: themeDark } = useTheme();
  const dark = forcedDark !== undefined ? forcedDark : themeDark;

  return (
    <div className={`rounded-xl p-5 transition-all duration-500 ${
      dark ? 'bg-neutral-900/60 border border-neutral-800' : 'bg-white border border-stone-200 shadow-sm'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${dark ? 'bg-neutral-800' : 'bg-stone-100'}`}>
          <svg className={`w-4 h-4 ${dark ? 'text-amber-400' : 'text-amber-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
        {accent && (
          <span className={`text-[10px] font-medium ${accent === 'approved' ? 'text-emerald-500' : accent === 'pending' ? 'text-amber-500' : ''}`}>
            {value}
          </span>
        )}
      </div>
      <p className={`text-2xl font-bold transition-colors duration-500 ${t('text')(dark)}`}>{value}</p>
      <p className={`text-xs mt-0.5 transition-colors duration-500 ${t('textMuted')(dark)}`}>{label}</p>
    </div>
  );
}

export function ClickableCard({ dark: forcedDark, children, onClick, className = '' }) {
  const { dark: themeDark } = useTheme();
  const dark = forcedDark !== undefined ? forcedDark : themeDark;

  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-4 sm:p-5 cursor-pointer transition-all duration-300 group ${
        dark
          ? 'bg-neutral-900/50 border border-neutral-800 hover:border-amber-500/30 hover:bg-neutral-900/80'
          : 'bg-white border border-stone-200 hover:border-amber-300 hover:shadow-md'
      } ${className}`}
    >
      {children}
    </div>
  );
}
