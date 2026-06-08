import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../config/theme';
import Select from '../ui/Select';

const t = (k) => (d) => colors[d ? 'dark' : 'light'][k];

function LocalityItem({ loc, selected, onToggle, dark }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(loc)}
      className={`text-left px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
        selected
          ? (dark ? 'bg-amber-500/20 border border-amber-500/40 text-white' : 'bg-amber-500 text-white border border-amber-600')
          : (dark ? 'bg-neutral-800/60 border border-neutral-700/50 text-neutral-400 hover:border-amber-500/30 hover:text-amber-300' : 'bg-stone-50 border border-stone-200 text-stone-600 hover:border-amber-300 hover:text-amber-700')
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-all duration-200 ${
          selected
            ? 'bg-white border-0'
            : (dark ? 'border border-neutral-600' : 'border border-stone-300')
        }`}>
          {selected && (
            <svg className="w-2.5 h-2.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
        </div>
        <span>{loc.locality || loc.city}</span>
      </div>
    </button>
  );
}

function SelectedTag({ item, onRemove, dark }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all duration-300 ${
      dark ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25' : 'bg-amber-100 text-amber-800 border border-amber-200'
    }`}>
      {item.locality || item.city}
      <button type="button" onClick={() => onRemove(item)} className="hover:opacity-70 ml-0.5">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

export default function TargetAreaSelector({
  states, cities, localities,
  selectedState, onStateChange,
  selectedCity, onCityChange,
  selectedLocalities, onToggleLocality,
}) {
  const { dark } = useTheme();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="State" options={states} value={selectedState} onChange={(e) => onStateChange(e.target.value)} placeholder="Select state" />
        <Select label="City" options={cities} value={selectedCity} onChange={(e) => onCityChange(e.target.value)} placeholder={selectedState ? 'Select city' : 'Select state first'} disabled={!selectedState} />
      </div>

      {selectedCity && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className={`text-xs font-medium uppercase tracking-widest transition-colors duration-500 ${t('textMuted')(dark)}`}>Localities</label>
            <span className={`text-[10px] transition-colors duration-500 ${t('textDim')(dark)}`}>{selectedLocalities.length} selected</span>
          </div>
          {localities.length === 0 ? (
            <p className={`text-sm py-4 text-center transition-colors duration-500 ${t('textDim')(dark)}`}>No localities available</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {localities.map((loc) => (
                <LocalityItem key={loc.id} loc={loc} selected={selectedLocalities.some((l) => l.id === loc.id)} onToggle={onToggleLocality} dark={dark} />
              ))}
            </div>
          )}
        </div>
      )}

      {selectedLocalities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedLocalities.map((loc) => (
            <SelectedTag key={loc.id} item={loc} onRemove={onToggleLocality} dark={dark} />
          ))}
        </div>
      )}
    </div>
  );
}
