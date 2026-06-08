import { useState, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../config/theme';

const t = (k) => (d) => colors[d ? 'dark' : 'light'][k];

export default function FileUpload({ value, onChange, accept = 'image/*,.pdf', label }) {
  const { dark } = useTheme();
  const ref = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFile = (file) => {
    if (!file) return;
    onChange(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => handleFile(e.target.files[0]);

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
    if (ref.current) ref.current.value = '';
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label className={`block text-xs font-medium uppercase tracking-widest transition-colors duration-500 ${t('textMuted')(dark)}`}>
          {label}
        </label>
      )}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => ref.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-300 ${
          dragOver
            ? 'border-amber-500 bg-amber-500/5'
            : value && preview
            ? (dark ? 'border-amber-500/30 bg-neutral-800/60' : 'border-amber-300 bg-stone-100/50')
            : (dark ? 'border-neutral-700 hover:border-amber-500/30 bg-neutral-900/30' : 'border-stone-300 hover:border-amber-300 bg-white')
        }`}
      >
        <input ref={ref} type="file" accept={accept} className="hidden" onChange={handleChange} />

        {preview ? (
          <div className="space-y-3">
            <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-lg object-contain" />
            <p className={`text-xs transition-colors duration-500 ${dark ? 'text-amber-300/60' : 'text-neutral-500'}`}>{value?.name}</p>
            <button type="button" onClick={(e) => { e.stopPropagation(); handleRemove(); }}
              className={`text-xs font-medium underline transition-colors ${dark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}>
              Remove
            </button>
          </div>
        ) : value ? (
          <div className="space-y-2">
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors duration-300 ${dark ? 'bg-neutral-800 text-amber-300/80' : 'bg-stone-100 text-neutral-700'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              {value.name}
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); handleRemove(); }}
              className={`block mx-auto text-xs font-medium underline transition-colors ${dark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}>
              Remove
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className={`inline-flex items-center justify-center w-12 h-12 mx-auto rounded-full transition-colors duration-500 ${dark ? 'bg-neutral-800' : 'bg-stone-100'}`}>
              <svg className={`w-6 h-6 transition-colors duration-500 ${t('textDim')(dark)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className={`text-xs transition-colors duration-500 ${dark ? 'text-amber-300/50' : 'text-neutral-500'}`}>
              <span className={`font-medium ${dark ? 'text-amber-400' : 'text-amber-700'}`}>Click to upload</span> or drag and drop
            </p>
            <p className={`text-[10px] transition-colors duration-500 ${dark ? 'text-neutral-600' : 'text-neutral-400'}`}>PNG, JPG, PDF up to 10MB</p>
          </div>
        )}
      </div>
    </div>
  );
}
