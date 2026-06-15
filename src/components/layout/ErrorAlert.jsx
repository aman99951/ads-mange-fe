import { useTheme } from '../../context/ThemeContext';

export default function ErrorAlert({ message, onDismiss }) {
  const { dark } = useTheme();

  if (!message) return null;

  return (
    <div className={`mb-6 px-4 py-3 rounded-xl text-sm border flex items-center justify-between gap-3 transition-all duration-300 animate-fade-in-up ${
      dark ? 'bg-red-500/10 backdrop-blur-sm border-red-500/20 text-red-400' : 'bg-red-50/90 backdrop-blur-sm border-red-200 text-red-700'
    }`}>
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className={`p-1 rounded-lg transition-colors duration-200 ${
          dark ? 'hover:bg-red-500/20 hover:text-red-300' : 'hover:bg-red-200 hover:text-red-800'
        }`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
