import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../config/theme';

const t = (k) => (d) => colors[d ? 'dark' : 'light'][k];

export default function PageHeader({ title, description, actions }) {
  const { dark } = useTheme();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight transition-colors duration-500 ${t('text')(dark)}`}>
          {title}
        </h1>
        {description && (
          <p className={`text-sm mt-1 transition-colors duration-500 ${t('textMuted')(dark)}`}>{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
    </div>
  );
}
