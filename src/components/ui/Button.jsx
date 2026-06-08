import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../config/theme';

const t = (k) => (d) => colors[d ? 'dark' : 'light'][k];

const variantStyles = {
  primary: 'btnPrimary',
  ghost: 'btnGhost',
  danger: 'btnDanger',
};

export default function Button({ children, variant = 'primary', loading, disabled, className = '', ...props }) {
  const { dark } = useTheme();

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${t(variantStyles[variant])(dark)} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
