import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../config/theme';

const t = (k) => (d) => colors[d ? 'dark' : 'light'][k];

export default function Input({ label, error, textarea, className = '', ...props }) {
  const { dark } = useTheme();
  const Tag = textarea ? 'textarea' : 'input';

  return (
    <div className="space-y-1.5">
      {label && (
        <label className={`block text-xs font-medium uppercase tracking-widest transition-colors duration-500 ${t('textMuted')(dark)}`}>
          {label}
        </label>
      )}
      <Tag
        className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-300 ${t('input')(dark)} ${t('borderFocus')(dark)} ${textarea ? 'resize-none min-h-[100px]' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className={`text-xs px-1 ${dark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
      )}
    </div>
  );
}
