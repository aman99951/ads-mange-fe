import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../config/theme';

const t = (k) => (d) => colors[d ? 'dark' : 'light'][k];

export default function AppLayout({ children, fullWidth = false, className = '' }) {
  const { dark } = useTheme();

  return (
    <main className={`min-h-screen transition-all duration-500 ${t('page')(dark)} ${t('pageGradient')(dark)}`}>
      {fullWidth ? (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          {children}
        </div>
      ) : (
        <div className={`w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 ${className}`}>
          {children}
        </div>
      )}
    </main>
  );
}
