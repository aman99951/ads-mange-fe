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
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="animate-fade-in-up">
          <div className="flex items-center gap-3">
            <div className={`w-1 h-8 rounded-full bg-gradient-to-b from-amber-500 to-amber-400`} />
            <div>
              <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>My Campaigns</h1>
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
      <div className="animate-fade-in-up animate-delay-150 mb-6">
        <StatusFilter active={filter} onChange={setFilter} counts={counts} />
      </div>

      {/* Campaigns */}
      <div className="mt-6">
        {loading ? (
          <CardSkeleton count={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={ads.length === 0 ? 'No campaigns yet' : 'No campaigns match this filter'}
            description={ads.length === 0 ? 'Create your first campaign to get started.' : 'Try a different filter.'}
            action={ads.length === 0 && (
              <Button className="mt-5 shadow-lg shadow-amber-500/15" onClick={() => navigate('/ads/create')}>Create Your First Campaign</Button>
            )}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((ad, i) => (
              <div key={ad.id} className="animate-fade-in-up" style={{ animationDelay: `${200 + i * 60}ms` }}>
                <AdCard ad={ad} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
