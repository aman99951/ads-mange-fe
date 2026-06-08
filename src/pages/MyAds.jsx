import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdList } from '../hooks/useAds';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/layout/PageHeader';
import StatusFilter from '../components/layout/StatusFilter';
import { CardSkeleton } from '../components/layout/LoadingSkeleton';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import AdCard from '../components/ads/AdCard';

export default function MyAds() {
  const navigate = useNavigate();
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
      <PageHeader
        title="My Campaigns"
        description="Manage your advertisement campaigns"
        actions={
          <Button onClick={() => navigate('/ads/create')}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Campaign
          </Button>
        }
      />

      <StatusFilter active={filter} onChange={setFilter} counts={counts} />

      <div className="mt-6">
        {loading ? (
          <CardSkeleton count={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={ads.length === 0 ? 'No campaigns yet' : 'No campaigns match this filter'}
            description={ads.length === 0 ? 'Create your first campaign to get started.' : 'Try a different filter.'}
            action={ads.length === 0 && (
              <Button className="mt-4" onClick={() => navigate('/ads/create')}>Create Your First Campaign</Button>
            )}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
