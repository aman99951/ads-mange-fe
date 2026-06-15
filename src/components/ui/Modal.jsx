import { useEffect, useState, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../config/theme';

const t = (k) => (d) => colors[d ? 'dark' : 'light'][k];

export default function Modal({ open, onClose, title, children, className = '' }) {
  const { dark } = useTheme();
  const [visible, setVisible] = useState(false);

  const prevOpen = useRef(open);
  useEffect(() => {
    if (open && !prevOpen.current) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(open);
    }
    prevOpen.current = open;
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 transition-all duration-300 ${
          visible ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none'
        }`}
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-2xl transition-all duration-300 ${
          visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        } ${dark ? 'bg-neutral-900/95 backdrop-blur-xl border border-neutral-800' : 'bg-white/95 backdrop-blur-xl border border-stone-200'} ${className}`}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className={`text-lg font-bold tracking-tight transition-colors duration-500 ${t('text')(dark)}`}>{title}</h2>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-all duration-300 hover-lift ${
            dark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-amber-400' : 'hover:bg-stone-100 text-stone-400 hover:text-amber-600'
          }`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
