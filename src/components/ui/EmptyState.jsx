import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../config/theme';

const t = (k) => (d) => colors[d ? 'dark' : 'light'][k];

export default function EmptyState({ icon, title, description, action, compact }) {
  const { dark } = useTheme();

  return (
    <div className={`rounded-2xl ${compact ? 'p-8' : 'p-12 sm:p-16'} text-center transition-all duration-500 animate-fade-in-up ${t('cardGlass')(dark)}`}>
      {icon || (
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-5 transition-all duration-500 animate-float ${
          dark ? 'bg-neutral-800 border border-neutral-700' : 'bg-stone-100 border border-stone-200'
        }`}>
          <svg className={`w-8 h-8 transition-colors duration-500 ${t('textDim')(dark)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
          </svg>
        </div>
      )}
      <h3 className={`text-lg font-semibold mb-1.5 transition-colors duration-500 ${t('text')(dark)}`}>{title}</h3>
      <p className={`text-sm max-w-xs mx-auto transition-colors duration-500 ${t('textMuted')(dark)}`}>{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
