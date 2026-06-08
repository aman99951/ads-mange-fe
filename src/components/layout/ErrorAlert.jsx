import { useTheme } from '../../context/ThemeContext';

export default function ErrorAlert({ message, onDismiss }) {
  const { dark } = useTheme();

  if (!message) return null;

  return (
    <div className={`mb-6 px-4 py-3 rounded-lg text-sm border flex items-center justify-between transition-all duration-300 ${
      dark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
    }`}>
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-3 hover:opacity-70">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
