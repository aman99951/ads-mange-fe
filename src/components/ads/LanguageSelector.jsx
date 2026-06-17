import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../config/theme';

const t = (k) => (d) => colors[d ? 'dark' : 'light'][k];

function LanguageCard({ lang, selected, onToggle, dark }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(lang.id)}
      className={`text-left p-4 rounded-xl transition-all duration-200 ${
        selected
          ? (dark
              ? 'bg-amber-500/20 border-2 border-amber-500/50 text-white shadow-[0_0_15px_rgba(217,160,50,0.1)]'
              : 'bg-amber-500 text-white border-2 border-amber-600 shadow-sm')
          : (dark ? 'bg-neutral-900/50 border border-neutral-700/50 hover:border-amber-500/30' : 'bg-white border border-stone-200 hover:border-amber-300')
      }`}
    >
      <div className="flex items-start justify-between">
        <p className={`text-sm font-semibold ${selected ? 'text-white' : t('text')(dark)}`}>
          {lang.name}
        </p>
        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
          selected
            ? 'bg-white'
            : (dark ? 'border-2 border-neutral-600' : 'border-2 border-stone-300')
        }`}>
          {selected && (
            <svg className="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}

function LanguageTag({ lang, onRemove, dark }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all duration-300 ${
      dark ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25' : 'bg-amber-100 text-amber-800 border border-amber-200'
    }`}>
      {lang.name}
      <button type="button" onClick={() => onRemove(lang.id)} className="hover:opacity-70 ml-0.5">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

export default function LanguageSelector({ languages, selectedIds, onToggle, loading }) {
  const { dark } = useTheme();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`rounded-xl p-4 animate-pulse ${dark ? 'bg-neutral-900/50' : 'bg-stone-100'}`}>
            <div className={`h-4 w-24 rounded ${dark ? 'bg-neutral-800' : 'bg-stone-200'}`} />
          </div>
        ))}
      </div>
    );
  }

  if (languages.length === 0) {
    return (
      <p className={`text-sm py-8 text-center transition-colors duration-500 ${t('textDim')(dark)}`}>No languages configured yet. Contact your administrator.</p>
    );
  }

  const selectedLangs = languages.filter((l) => selectedIds.includes(l.id));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {languages.map((lang) => (
          <LanguageCard key={lang.id} lang={lang} selected={selectedIds.includes(lang.id)} onToggle={onToggle} dark={dark} />
        ))}
      </div>

      {selectedLangs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedLangs.map((lang) => (
            <LanguageTag key={lang.id} lang={lang} onRemove={onToggle} dark={dark} />
          ))}
        </div>
      )}
    </div>
  );
}
