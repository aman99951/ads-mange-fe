import { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../config/theme';

const t = (k) => (d) => colors[d ? 'dark' : 'light'][k];

export default function Modal({ open, onClose, title, children }) {
  const { dark } = useTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
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
        className={`relative w-full max-w-lg rounded-2xl p-6 shadow-2xl transition-all duration-300 ${
          visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        } ${t('card')(dark)}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-bold tracking-tight transition-colors duration-500 ${t('text')(dark)}`}>{title}</h2>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors duration-300 ${t('toggle')(dark)}`}>
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
