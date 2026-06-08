import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../config/theme';

const t = (k) => (d) => colors[d ? 'dark' : 'light'][k];

export default function AppLayout({ children, maxWidth = 'max-w-7xl' }) {
  const { dark } = useTheme();

  return (
    <main className={`min-h-screen transition-colors duration-500 ${t('page')(dark)}`}>
      <div className={`w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 ${maxWidth} mx-auto`}>
        {children}
      </div>
    </main>
  );
}
