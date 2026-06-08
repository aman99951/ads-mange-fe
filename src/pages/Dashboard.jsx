import { useNavigate } from 'react-router-dom';
import { useAdList } from '../hooks/useAds';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../config/theme';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/layout/PageHeader';
import { CardSkeleton } from '../components/layout/LoadingSkeleton';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { StatCard, ClickableCard } from '../components/ui/Card';
import { formatDateShort } from '../utils/helpers';

const statsConfig = [
  { label: 'Total Campaigns', valueKey: 'total', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
  { label: 'Approved', valueKey: 'approved', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z', accent: 'approved' },
  { label: 'Pending Review', valueKey: 'pending', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z', accent: 'pending' },
];

const t = (k) => (d) => colors[d ? 'dark' : 'light'][k];

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
      <PageHeader
        title={`Hello, ${user?.name || 'Shopkeeper'}`}
        description="Welcome to Ads Manager — manage your ad campaigns"
        actions={
          <Button onClick={() => navigate('/ads/create')}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Campaign
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {statsConfig.map((s) => (
          <StatCard key={s.label} icon={s.icon} label={s.label} value={loading ? '-' : counts[s.valueKey]} accent={s.accent} />
        ))}
      </div>

      <div className="flex items-center justify-between mb-5">
        <h2 className={`text-lg font-bold tracking-tight transition-colors duration-500 ${t('text')(dark)}`}>Recent Campaigns</h2>
        {ads.length > 0 && (
          <button onClick={() => navigate('/ads')} className={`text-xs font-medium underline transition-colors ${dark ? 'text-neutral-400 hover:text-amber-400' : 'text-amber-700 hover:text-amber-800'}`}>View All</button>
        )}
      </div>

      {loading ? (
        <CardSkeleton count={3} />
      ) : ads.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Create your first advertisement campaign to get started."
          action={<Button className="mt-4" onClick={() => navigate('/ads/create')}>Create Your First Campaign</Button>}
        />
      ) : (
        <div className="space-y-2">
          {ads.slice(0, 5).map((ad) => (
            <ClickableCard key={ad.id} onClick={() => navigate(`/ads/${ad.id}`)}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${dark ? 'text-neutral-100' : 'text-neutral-900'}`}>{ad.title}</p>
                  <p className={`text-[10px] mt-0.5 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>{formatDateShort(ad.created_at)}</p>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <Badge status={ad.status} />
                </div>
              </div>
            </ClickableCard>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
