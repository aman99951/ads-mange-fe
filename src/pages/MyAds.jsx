import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdList } from '../hooks/useAds';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../config/theme';
import AppLayout from '../components/layout/AppLayout';
import StatusFilter from '../components/layout/StatusFilter';
import { CardSkeleton } from '../components/layout/LoadingSkeleton';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import AdCard from '../components/ads/AdCard';

const c = (k) => colors[k];

export default function MyAds() {
  const navigate = useNavigate();
  const { dark } = useTheme();
  const { ads, loading } = useAdList();
  const [filter, setFilter] = useState('all');

  const counts = {
    draft: ads.filter((a) => a.status === 'draft').length,
    pending_approval: ads.filter((a) => a.status === 'pending_approval').length,
    approved: ads.filter((a) => a.status === 'approved').length,
    rejected: ads.filter((a) => a.status === 'rejected').length,
  };

  const filtered = filter === 'all' ? ads : ads.filter((a) => a.status === filter);

  return (
    <AppLayout fullWidth>
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 rounded-full bg-gradient-to-b from-amber-500 to-amber-400" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>My Campaigns</h1>
                  {!loading && ads.length > 0 && (
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full transition-all duration-500 ${
                      dark ? 'bg-neutral-800 text-neutral-400 border border-neutral-700' : 'bg-stone-100 text-stone-500 border border-stone-200'
                    }`}>{ads.length} total</span>
                  )}
                </div>
                <p className={`text-sm mt-0.5 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>Manage your advertisement campaigns</p>
              </div>
            </div>
          </div>
          <div className="animate-fade-in-up animate-delay-100">
            <Button onClick={() => navigate('/ads/create')}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Campaign
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="animate-fade-in-up animate-delay-150 mb-8">
          <StatusFilter active={filter} onChange={setFilter} counts={counts} />
        </div>

        {/* Campaigns */}
        <div>
          {loading ? (
            <CardSkeleton count={5} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={ads.length === 0 ? 'No campaigns yet' : 'No campaigns match this filter'}
              description={ads.length === 0 ? 'Create your first campaign to get started.' : 'Try a different filter.'}
              action={ads.length === 0 && (
                <Button className="mt-6" onClick={() => navigate('/ads/create')}>Create Your First Campaign</Button>
              )}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((ad, i) => (
                <div key={ad.id} className="animate-fade-in-up" style={{ animationDelay: `${100 + i * 60}ms` }}>
                  <AdCard ad={ad} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
