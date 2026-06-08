import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Badge from '../ui/Badge';
import { formatDateShort } from '../../utils/helpers';

export default function AdCard({ ad }) {
  const navigate = useNavigate();
  const { dark } = useTheme();

  return (
    <div
      onClick={() => navigate(`/ads/${ad.id}`)}
      className={`rounded-xl p-4 sm:p-5 cursor-pointer transition-all duration-300 group ${
        dark
          ? 'bg-neutral-900/50 border border-amber-500/10 hover:border-amber-500/30 hover:bg-neutral-900/80'
          : 'bg-white border border-stone-200 hover:border-amber-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm sm:text-base font-semibold truncate transition-colors duration-500 ${dark ? 'text-neutral-100' : 'text-neutral-900'}`}>
            {ad.title}
          </h3>
          <div className="flex items-center gap-3 mt-1.5">
              <span className={`text-xs transition-colors duration-500 ${dark ? 'text-neutral-500' : 'text-neutral-400'}`}>
              {formatDateShort(ad.created_at)}
            </span>
            {ad.client_name && (
              <span className={`text-xs transition-colors duration-500 ${dark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                {ad.client_name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
          <Badge status={ad.status} />
          <svg className={`w-4 h-4 transition-all duration-300 ${
            dark ? 'text-amber-500/30 group-hover:text-amber-500/60' : 'text-stone-300 group-hover:text-amber-500'
          }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}
