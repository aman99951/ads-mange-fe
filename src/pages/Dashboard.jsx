import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdList } from '../hooks/useAds';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../config/theme';
import AppLayout from '../components/layout/AppLayout';
import { CardSkeleton } from '../components/layout/LoadingSkeleton';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { StatCard, ClickableCard } from '../components/ui/Card';
import { formatDateShort } from '../utils/helpers';

const statsConfig = [
  {
    label: 'Total Campaigns',
    valueKey: 'total',
    accent: 'total',
    icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    bg: 'from-violet-500/10 to-purple-500/5',
  },
  {
    label: 'Approved',
    valueKey: 'approved',
    accent: 'approved',
    icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    bg: 'from-emerald-500/10 to-teal-500/5',
  },
  {
    label: 'Pending Review',
    valueKey: 'pending',
    accent: 'pending',
    icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
    bg: 'from-amber-500/10 to-orange-500/5',
  },
];

const t = (k) => (d) => colors[d ? 'dark' : 'light'][k];

function GreetingSection({ user, dark, onCreateCampaign }) {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good Morning');
    else if (h < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl mb-8">
      {/* Background decoration */}
      <div className={`absolute inset-0 transition-colors duration-500 ${
        dark
          ? 'bg-gradient-to-br from-amber-500/8 via-neutral-950 to-amber-500/5'
          : 'bg-gradient-to-br from-amber-50 via-white to-amber-50/50'
      }`} />
      <div className={`absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl transition-colors duration-500 ${
        dark ? 'bg-amber-500/5' : 'bg-amber-200/30'
      }`} />
      <div className={`absolute bottom-0 left-1/3 w-48 h-48 rounded-full blur-2xl transition-colors duration-500 ${
        dark ? 'bg-violet-500/5' : 'bg-violet-200/20'
      }`} />

      <div className="relative px-6 sm:px-8 py-7 sm:py-9">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="space-y-1 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold transition-all duration-500 ${
                dark
                  ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-gradient-to-br from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20'
              }`}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  <span className={dark ? 'text-neutral-100' : 'text-neutral-900'}>{greeting}, </span>
                  <span className="gradient-text">{user?.name || 'Shopkeeper'}</span>
                </h1>
                <p className={`text-sm mt-0.5 transition-colors duration-500 ${t('textMuted')(dark)}`}>
                  Welcome to your ad campaigns dashboard
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 animate-fade-in-up animate-delay-200">
            <Button onClick={onCreateCampaign} className="shadow-lg shadow-amber-500/15">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Campaign
            </Button>
          </div>
        </div>

        {/* Quick tip */}
        <div className={`mt-5 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs transition-all duration-500 ${
          dark
            ? 'bg-white/5 border border-white/5 text-neutral-400'
            : 'bg-amber-50/70 border border-amber-100 text-amber-700'
        }`}>
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
          <span>
            Pro tip: Create targeted campaigns for specific areas and audiences to maximize your ad reach
          </span>
        </div>
      </div>
    </div>
  );
}

function CampaignCard({ ad, dark, onNavigate }) {
  const statusGradients = {
    approved: 'from-emerald-500 to-teal-500',
    pending_approval: 'from-amber-500 to-orange-500',
    draft: 'from-neutral-400 to-neutral-500',
    rejected: 'from-red-500 to-rose-500',
  };

  const gradient = statusGradients[ad.status] || statusGradients.draft;

  return (
    <ClickableCard onClick={() => onNavigate(`/ads/${ad.id}`)}>
      <div className="flex items-center gap-4">
        {/* Status indicator bar */}
        <div className={`hidden sm:flex flex-shrink-0 w-1 h-12 rounded-full bg-gradient-to-b ${gradient}`} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className={`text-sm sm:text-base font-semibold truncate transition-colors duration-500 ${
              dark ? 'text-neutral-100 group-hover:text-amber-300' : 'text-neutral-900 group-hover:text-amber-700'
            }`}>
              {ad.title}
            </h3>
            <Badge status={ad.status} />
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className={`inline-flex items-center gap-1 text-[11px] transition-colors duration-500 ${
              dark ? 'text-neutral-500' : 'text-stone-400'
            }`}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              {formatDateShort(ad.created_at)}
            </span>
            {ad.target_areas?.length > 0 && (
              <span className={`inline-flex items-center gap-1 text-[11px] transition-colors duration-500 ${
                dark ? 'text-neutral-500' : 'text-stone-400'
              }`}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {ad.target_areas.length} {ad.target_areas.length === 1 ? 'area' : 'areas'}
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <svg className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${
          dark
            ? 'text-neutral-600 group-hover:text-amber-400 group-hover:translate-x-1'
            : 'text-stone-300 group-hover:text-amber-600 group-hover:translate-x-1'
        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </ClickableCard>
  );
}

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const { dark } = useTheme();
  const { ads, loading } = useAdList();

  const counts = {
    total: ads.length,
    approved: ads.filter((a) => a.status === 'approved').length,
    pending: ads.filter((a) => a.status === 'pending_approval').length,
  };

  return (
    <AppLayout>
      {/* Hero Greeting */}
      <GreetingSection
        user={user}
        dark={dark}
        onCreateCampaign={() => navigate('/ads/create')}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {statsConfig.map((s, i) => (
          <StatCard
            key={s.label}
            icon={s.icon}
            label={s.label}
            value={loading ? '—' : counts[s.valueKey]}
            accent={s.accent}
            index={i}
          />
        ))}
      </div>

      {/* Recent Campaigns Header */}
      <div className="flex items-center justify-between mb-5 animate-fade-in-up animate-delay-300">
        <div className="flex items-center gap-3">
          <div className={`w-1 h-6 rounded-full bg-gradient-to-b from-amber-500 to-amber-400`} />
          <h2 className={`text-lg font-bold tracking-tight transition-colors duration-500 ${t('text')(dark)}`}>
            Recent Campaigns
          </h2>
          {!loading && (
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full transition-colors duration-500 ${
              dark ? 'bg-neutral-800 text-neutral-400' : 'bg-stone-100 text-stone-500'
            }`}>
              {ads.length} total
            </span>
          )}
        </div>
        {ads.length > 0 && (
          <button
            onClick={() => navigate('/ads')}
            className={`group inline-flex items-center gap-1.5 text-xs font-semibold transition-all duration-300 ${
              dark
                ? 'text-neutral-400 hover:text-amber-400'
                : 'text-stone-500 hover:text-amber-700'
            }`}
          >
            View All
            <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`rounded-xl p-5 animate-pulse transition-colors duration-500 ${
              dark ? 'bg-neutral-900/60 border border-neutral-800' : 'bg-stone-100 border border-stone-200'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`hidden sm:block w-1 h-12 rounded-full ${dark ? 'bg-neutral-800' : 'bg-stone-200'}`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-4 w-48 rounded ${dark ? 'bg-neutral-800' : 'bg-stone-200'}`} />
                  <div className={`h-3 w-32 rounded ${dark ? 'bg-neutral-800' : 'bg-stone-200'}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : ads.length === 0 ? (
        <div className="animate-fade-in-up animate-delay-300">
          <EmptyState
            title="No campaigns yet"
            description="Create your first advertisement campaign to get started."
            action={
              <Button className="mt-5 shadow-lg shadow-amber-500/15" onClick={() => navigate('/ads/create')}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Create Your First Campaign
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-2.5">
          {ads.slice(0, 5).map((ad, i) => (
            <div key={ad.id} className="animate-fade-in-up" style={{ animationDelay: `${400 + i * 80}ms` }}>
              <CampaignCard ad={ad} dark={dark} onNavigate={navigate} />
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
