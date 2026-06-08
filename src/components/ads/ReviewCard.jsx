import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../config/theme';

const t = (k) => (d) => colors[d ? 'dark' : 'light'][k];

export default function ReviewCard({ title, children, onEdit }) {
  const { dark } = useTheme();

  return (
    <div className={`rounded-xl p-4 transition-all duration-500 ${
      dark ? 'bg-neutral-900/60 border border-neutral-800' : 'bg-stone-50 border border-stone-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-500 ${t('textMuted')(dark)}`}>{title}</h3>
        <button type="button" onClick={onEdit} className={`text-[10px] font-medium underline transition-colors ${t('textLinkMuted')(dark)}`}>Edit</button>
      </div>
      {children}
    </div>
  );
}
