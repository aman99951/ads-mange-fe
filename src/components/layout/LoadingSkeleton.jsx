import { useTheme } from '../../context/ThemeContext';

export function CardSkeleton({ count = 3 }) {
  const { dark } = useTheme();

  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`rounded-xl p-5 animate-pulse transition-colors duration-500 ${dark ? 'bg-neutral-900/60' : 'bg-stone-100'}`}>
          <div className={`h-4 w-48 rounded ${dark ? 'bg-neutral-800' : 'bg-stone-200'}`} />
          <div className={`h-3 w-32 rounded mt-3 ${dark ? 'bg-neutral-800' : 'bg-stone-200'}`} />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  const { dark } = useTheme();

  return (
    <div className="animate-pulse space-y-4">
      <div className={`h-8 w-64 rounded ${dark ? 'bg-neutral-800' : 'bg-stone-200'}`} />
      <div className={`h-4 w-48 rounded ${dark ? 'bg-neutral-800' : 'bg-stone-200'}`} />
      <div className={`h-48 rounded-2xl ${dark ? 'bg-neutral-900/60' : 'bg-stone-100'}`} />
    </div>
  );
}
