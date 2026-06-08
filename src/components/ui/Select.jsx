import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../config/theme';

const t = (k) => (d) => colors[d ? 'dark' : 'light'][k];

function getLabel(opt) {
  return typeof opt === 'string' ? opt : opt.label;
}

function getValue(opt) {
  return typeof opt === 'string' ? opt : opt.value;
}

export default function Select({ label, options = [], value, onChange, placeholder = 'Select', error, className = '', ...props }) {
  const { dark } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => getValue(o) === value);
  const display = selected ? getLabel(selected) : placeholder;

  return (
    <div className="space-y-1.5" ref={ref}>
      {label && (
        <label className={`block text-xs font-medium uppercase tracking-widest transition-colors duration-500 ${t('textMuted')(dark)}`}>
          {label}
        </label>
      )}
      <div className="relative" {...props}>
        <button type="button" onClick={() => setOpen(!open)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm outline-none transition-all duration-300 ${
            value ? t('input')(dark) : `${dark ? 'bg-neutral-800 border border-neutral-700 text-neutral-500' : 'bg-white border border-stone-300 text-neutral-400'}`
          } ${t('borderFocus')(dark)} ${className}`}
        >
          <span className={value ? '' : 'truncate'}>{display}</span>
          <svg className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className={`absolute z-50 mt-1 w-full rounded-xl overflow-hidden border shadow-lg ${
            dark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-stone-200'
          }`}>
            <button type="button" onClick={() => { onChange({ target: { value: '' } }); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                !value
                  ? dark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-700'
                  : dark ? 'text-neutral-400 hover:bg-neutral-700' : 'text-neutral-500 hover:bg-stone-50'
              }`}
            >
              {placeholder}
            </button>
            {options.map((opt) => {
              const v = getValue(opt);
              const lbl = getLabel(opt);
              const isSelected = v === value;
              return (
                <button key={v} type="button" onClick={() => { onChange({ target: { value: v } }); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    isSelected
                      ? dark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-700'
                      : dark ? 'text-neutral-300 hover:bg-neutral-700' : 'text-neutral-700 hover:bg-stone-50'
                  }`}
                >
                  {lbl}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {error && (
        <p className={`text-xs px-1 ${dark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
      )}
    </div>
  );
}
