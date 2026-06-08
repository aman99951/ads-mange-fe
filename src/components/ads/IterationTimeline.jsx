import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../config/theme';
import { formatDateShort } from '../../utils/helpers';

const t = (k) => (d) => colors[d ? 'dark' : 'light'][k];

export default function IterationTimeline({ iterations }) {
  const { dark } = useTheme();

  if (!iterations || iterations.length === 0) return null;

  return (
    <div className="space-y-3">
      {iterations.slice().reverse().map((iter) => (
        <div key={iter.id} className={`flex gap-3 p-3 rounded-lg text-xs ${dark ? 'bg-neutral-800/40' : 'bg-stone-50'}`}>
          <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
            iter.created_by === 'admin'
              ? (dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700')
              : (dark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700')
          }`}>
            {iter.created_by === 'admin' ? 'A' : 'C'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-medium ${t('text')(dark)}`}>{iter.created_by === 'admin' ? 'Admin' : 'You'}</span>
              <span className={t('textDim')(dark)}>{formatDateShort(iter.created_at)}</span>
            </div>
            {iter.feedback && <p className={t('textMuted')(dark)}>{iter.feedback}</p>}
            {iter.asset && (
              <a href={iter.asset} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1 mt-1 text-[10px] underline ${t('textLinkMuted')(dark)}`}>
                View attachment
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
