import { useTheme } from '../../context/ThemeContext';
import { WIZARD_STEPS } from '../../constants';

export default function Stepper({ current, steps = WIZARD_STEPS }) {
  const { dark } = useTheme();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((s, i) => {
          const completed = s.num < current;
          const active = s.num === current;

          return (
            <div key={s.num} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`relative flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-all duration-500 ${
                  completed
                    ? 'bg-amber-500 text-black'
                    : active
                    ? 'bg-amber-500/15 border-2 border-amber-500 text-amber-400 shadow-[0_0_20px_rgba(217,160,50,0.15)]'
                    : `${dark ? 'bg-neutral-800 text-neutral-500 border border-neutral-700' : 'bg-stone-200 text-stone-400 border border-stone-300'}`
                }`}>
                  {completed ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    s.num
                  )}
                </div>
                <span className={`text-[10px] font-medium mt-1.5 whitespace-nowrap transition-colors duration-500 ${
                  active ? (dark ? 'text-amber-400' : 'text-amber-700') : (dark ? 'text-neutral-500' : 'text-stone-400')
                }`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px mx-3 mb-5 transition-all duration-500 ${
                  s.num < current ? 'bg-amber-500' : (dark ? 'bg-neutral-800' : 'bg-stone-200')
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
