import { useTheme } from '../../context/ThemeContext';

function SkeletonBar({ className = '' }) {
  const { dark } = useTheme();
  return (
    <div className={`relative overflow-hidden rounded ${dark ? 'bg-neutral-800' : 'bg-stone-200'} ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
    </div>
  );
}

export function CardSkeleton({ count = 3 }) {
  const { dark } = useTheme();

  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`rounded-2xl p-5 transition-colors duration-500 ${dark ? 'bg-neutral-900/60 border border-neutral-800' : 'bg-stone-100 border border-stone-200'}`}>
          <SkeletonBar className="h-4 w-48" />
          <SkeletonBar className="h-3 w-32 mt-3" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  const { dark } = useTheme();

  return (
    <div className="space-y-4">
      <SkeletonBar className="h-8 w-64" />
      <SkeletonBar className="h-4 w-48" />
      <div className={`rounded-2xl p-8 transition-colors duration-500 ${dark ? 'bg-neutral-900/60 border border-neutral-800' : 'bg-stone-100 border border-stone-200'}`}>
        <SkeletonBar className="h-4 w-full" />
        <SkeletonBar className="h-4 w-3/4 mt-3" />
        <SkeletonBar className="h-4 w-1/2 mt-3" />
      </div>
    </div>
  );
}
