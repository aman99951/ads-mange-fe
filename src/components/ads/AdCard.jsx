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
      className={`rounded-xl p-5 cursor-pointer transition-all duration-300 group hover-lift ${
        dark
          ? 'bg-neutral-900/70 backdrop-blur-sm border border-amber-500/10 hover:border-amber-500/30 hover:bg-neutral-900/90 hover:shadow-[0_0_30px_rgba(217,160,50,0.08)]'
          : 'bg-white/90 backdrop-blur-sm border border-stone-200 hover:border-amber-300/60 hover:shadow-lg hover:bg-white'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className={`text-sm font-semibold leading-snug transition-colors duration-300 group-hover:text-amber-600 ${
            dark ? 'text-neutral-100 group-hover:text-amber-400' : 'text-neutral-900'
          }`}>
            {ad.title}
          </h3>
          <Badge status={ad.status} />
        </div>

        <div className="mt-auto space-y-2">
          <div className="flex items-center gap-3 text-xs">
            <span className={`inline-flex items-center gap-1.5 transition-colors duration-500 ${
              dark ? 'text-neutral-500' : 'text-neutral-400'
            }`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              {formatDateShort(ad.created_at)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            {ad.client_name && (
              <span className={`text-xs transition-colors duration-500 ${dark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                {ad.client_name}
              </span>
            )}
            <div className={`flex items-center gap-1 text-xs font-medium transition-all duration-300 ${
              dark ? 'text-amber-500/0 group-hover:text-amber-400' : 'text-amber-600/0 group-hover:text-amber-600'
            }`}>
              <span>View</span>
              <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
