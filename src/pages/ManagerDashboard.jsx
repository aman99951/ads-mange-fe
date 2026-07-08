import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../config/theme';
import { ads } from '../services/api';
import AppLayout from '../components/layout/AppLayout';
import ErrorAlert from '../components/layout/ErrorAlert';
import { StatCard } from '../components/ui/Card';
import Button from '../components/ui/Button';

const c = (k) => colors[k];

const QUICK_ACTIONS = [
  {
    label: 'All Campaigns',
    desc: 'Review, approve, or reject ad campaigns',
    icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z',
    path: '/manager/campaigns',
    color: 'from-amber-500 to-amber-400',
  },
  {
    label: 'Creative Studio',
    desc: 'Generate images & videos with AI',
    icon: 'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42',
    path: '/manager/create-creative',
    color: 'from-purple-500 to-pink-500',
  },
  {
    label: 'Target Areas',
    desc: 'Manage location-based targeting',
    icon: 'M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z',
    path: '/manager/target-areas',
    color: 'from-blue-500 to-cyan-400',
  },
  {
    label: 'View Revisions',
    desc: 'Review campaigns pending revision',
    icon: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182',
    path: '/manager/revisions',
    color: 'from-rose-500 to-orange-400',
  },
];

const statIcons = {
  total: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  pending: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  approved: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  revision: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182',
};

export default function ManagerDashboard() {
  const { dark } = useTheme();
  const navigate = useNavigate();
  const [allAds, setAllAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await ads.list();
        setAllAds(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const counts = {
    total: allAds.length,
    pending_approval: allAds.filter(a => a.status === 'pending_approval').length,
    approved: allAds.filter(a => a.status === 'approved').length,
    revision_requested: allAds.filter(a => a.status === 'revision_requested').length,
  };

  const recentRevisions = allAds.filter(a => a.status === 'revision_requested').slice(0, 5);

  return (
    <AppLayout fullWidth>
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full bg-gradient-to-b from-amber-500 to-amber-400" />
            <div>
              <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${c(dark ? 'dark' : 'light').text}`}>Dashboard</h1>
              <p className={`text-sm mt-0.5 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>
                Overview of your ad management platform
              </p>
            </div>
          </div>
        </div>

        <ErrorAlert message={error} onDismiss={() => setError('')} />

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8 animate-fade-in-up animate-delay-100">
            <StatCard icon={statIcons.total} label="Total Campaigns" value={counts.total} accent="total" index={0} />
            <StatCard icon={statIcons.pending} label="Pending Review" value={counts.pending_approval} accent="pending" index={1} />
            <StatCard icon={statIcons.approved} label="Approved" value={counts.approved} accent="approved" index={2} />
            <StatCard icon={statIcons.revision} label="Revision Requests" value={counts.revision_requested} accent="pending" index={3} />
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className={`h-28 rounded-2xl animate-pulse ${dark ? 'bg-neutral-900/60 border border-neutral-800' : 'bg-stone-100 border border-stone-200'}`} />
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 animate-fade-in-up animate-delay-200">
          {QUICK_ACTIONS.map((action, i) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={`relative group text-left rounded-2xl p-6 transition-all duration-300 border cursor-pointer hover-lift ${
                dark
                  ? 'bg-neutral-900/70 backdrop-blur-sm border-neutral-800 hover:border-amber-500/25 hover:shadow-[0_0_30px_rgba(217,160,50,0.06)]'
                  : 'bg-white/90 backdrop-blur-sm border-stone-200 hover:border-amber-300/50 shadow-sm hover:shadow-md'
              }`}
              style={{ animationDelay: `${200 + i * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-base font-bold mb-1 ${c(dark ? 'dark' : 'light').text}`}>{action.label}</h3>
                  <p className={`text-xs leading-relaxed ${c(dark ? 'dark' : 'light').textMuted}`}>{action.desc}</p>
                </div>
                <svg className={`w-5 h-5 flex-shrink-0 mt-1 transition-transform duration-300 group-hover:translate-x-1 ${
                  dark ? 'text-neutral-600 group-hover:text-amber-400' : 'text-stone-400 group-hover:text-amber-600'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>

              {/* Pending badge */}
              {action.label === 'All Campaigns' && counts.pending_approval > 0 && (
                <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  dark ? 'bg-amber-500 text-black' : 'bg-amber-500 text-white'
                } shadow-lg`}>
                  {counts.pending_approval}
                </div>
              )}
              {action.label === 'View Revisions' && counts.revision_requested > 0 && (
                <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  dark ? 'bg-rose-500 text-white' : 'bg-rose-500 text-white'
                } shadow-lg`}>
                  {counts.revision_requested}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Recent Revisions */}
        {!loading && recentRevisions.length > 0 && (
          <div className="mt-8 animate-fade-in-up animate-delay-250">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-bold ${c(dark ? 'dark' : 'light').text}`}>Pending Revisions</h3>
              <button
                onClick={() => navigate('/manager/revisions')}
                className={`text-[10px] font-medium transition-colors ${dark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-700 hover:text-amber-600'}`}
              >
                View all →
              </button>
            </div>
            <div className="space-y-2">
              {recentRevisions.map((ad) => (
                <button
                  key={ad.id}
                  onClick={() => navigate(`/manager/campaigns/${ad.id}`)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs transition-all duration-200 ${
                    dark
                      ? 'bg-neutral-900/40 border border-neutral-800/50 hover:bg-neutral-800/60 hover:border-neutral-700'
                      : 'bg-stone-50/60 border border-stone-200/50 hover:bg-stone-100 hover:border-stone-300'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0 bg-rose-500" />
                  <span className={`flex-1 text-left font-medium truncate ${c(dark ? 'dark' : 'light').text}`}>{ad.title}</span>
                  <span className={`flex-shrink-0 ${c(dark ? 'dark' : 'light').textMuted}`}>{ad.client_name}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-medium ${
                    dark ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600'
                  }`}>revision requested</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {!loading && allAds.length > 0 && (
          <div className="mt-8 animate-fade-in-up animate-delay-300">
            <h3 className={`text-sm font-bold mb-4 ${c(dark ? 'dark' : 'light').text}`}>Recent Campaigns</h3>
            <div className="space-y-2">
              {allAds.slice(0, 5).map((ad) => (
                <button
                  key={ad.id}
                  onClick={() => navigate(`/manager/campaigns/${ad.id}`)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs transition-all duration-200 ${
                    dark
                      ? 'bg-neutral-900/40 border border-neutral-800/50 hover:bg-neutral-800/60 hover:border-neutral-700'
                      : 'bg-stone-50/60 border border-stone-200/50 hover:bg-stone-100 hover:border-stone-300'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    ad.status === 'approved' ? 'bg-emerald-500' :
                    ad.status === 'pending_approval' ? 'bg-amber-500' :
                    ad.status === 'rejected' ? 'bg-red-500' : 'bg-neutral-400'
                  }`} />
                  <span className={`flex-1 text-left font-medium truncate ${c(dark ? 'dark' : 'light').text}`}>{ad.title}</span>
                  <span className={`flex-shrink-0 ${c(dark ? 'dark' : 'light').textMuted}`}>{ad.client_name}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-medium ${
                    dark ? 'bg-neutral-800 text-neutral-400' : 'bg-stone-100 text-stone-500'
                  }`}>{ad.status.replace('_', ' ')}</span>
                </button>
              ))}
              {allAds.length > 5 && (
                <button
                  onClick={() => navigate('/manager/campaigns')}
                  className={`w-full text-center py-2 text-[10px] font-medium transition-colors ${
                    dark ? 'text-neutral-500 hover:text-amber-400' : 'text-stone-400 hover:text-amber-700'
                  }`}
                >
                  View all {allAds.length} campaigns →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
