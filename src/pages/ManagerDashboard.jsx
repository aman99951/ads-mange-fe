import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../config/theme';
import { ads } from '../services/api';
import AppLayout from '../components/layout/AppLayout';
import ErrorAlert from '../components/layout/ErrorAlert';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { StatCard } from '../components/ui/Card';
import { formatDate } from '../utils/helpers';

const c = (k) => colors[k];

const statIcons = {
  total: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  pending: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  approved: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

export default function ManagerDashboard() {
  const { dark } = useTheme();
  const navigate = useNavigate();
  const [allAds, setAllAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const [actionAd, setActionAd] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const refetch = async () => {
    try {
      const data = await ads.list();
      setAllAds(data);
    } catch (err) {
      setError(err.message);
    }
  };

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

  const handleApprove = async () => {
    if (!actionAd) return;
    setActionLoading(true);
    try {
      await ads.approve(actionAd.id, { admin_feedback: feedback });
      setActionAd(null);
      setFeedback('');
      await refetch();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!actionAd) return;
    setActionLoading(true);
    try {
      await ads.reject(actionAd.id, { admin_feedback: feedback });
      setActionAd(null);
      setFeedback('');
      await refetch();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = filter === 'all' ? allAds : allAds.filter(a => a.status === filter);
  const counts = {
    total: allAds.length,
    pending_approval: allAds.filter(a => a.status === 'pending_approval').length,
    approved: allAds.filter(a => a.status === 'approved').length,
    rejected: allAds.filter(a => a.status === 'rejected').length,
    draft: allAds.filter(a => a.status === 'draft').length,
  };

  const tabs = [
    { key: 'all', label: 'All', count: counts.total },
    { key: 'pending_approval', label: 'Pending', count: counts.pending_approval },
    { key: 'approved', label: 'Approved', count: counts.approved },
    { key: 'rejected', label: 'Rejected', count: counts.rejected },
  ];

  return (
    <AppLayout fullWidth>
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in-up">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 rounded-full bg-gradient-to-b from-amber-500 to-amber-400" />
              <div>
                <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${c(dark ? 'dark' : 'light').text}`}>Manager Dashboard</h1>
                <p className={`text-sm mt-0.5 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>Review and manage all ad campaigns</p>
              </div>
            </div>
          </div>
          <Button variant="ghost" onClick={() => navigate('/manager/target-areas')}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            Manage Target Areas
          </Button>
        </div>

        <ErrorAlert message={error} onDismiss={() => setError('')} />

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-8 animate-fade-in-up animate-delay-100">
            <StatCard icon={statIcons.total} label="Total Campaigns" value={counts.total} accent="total" index={0} />
            <StatCard icon={statIcons.pending} label="Pending Review" value={counts.pending_approval} accent="pending" index={1} />
            <StatCard icon={statIcons.approved} label="Approved" value={counts.approved} accent="approved" index={2} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1.5 mb-6 flex-wrap animate-fade-in-up animate-delay-200">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                filter === tab.key
                  ? dark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-800 border border-amber-200'
                  : dark ? 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 border border-transparent' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100 border border-transparent'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-[10px] ${filter === tab.key ? (dark ? 'text-amber-400/60' : 'text-amber-600/60') : (dark ? 'text-neutral-600' : 'text-stone-400')}`}>
                ({tab.count})
              </span>
            </button>
          ))}
        </div>

        {/* Ads List */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className={`h-20 rounded-2xl animate-pulse ${dark ? 'bg-neutral-900/60 border border-neutral-800' : 'bg-stone-100 border border-stone-200'}`} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className={`text-center py-16 animate-fade-in-up ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 ${dark ? 'bg-neutral-800' : 'bg-stone-100'}`}>
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <p className="text-sm font-medium">No ads found</p>
            <p className="text-xs mt-1">Try a different filter</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ad, i) => (
              <div key={ad.id} className="animate-fade-in-up" style={{ animationDelay: `${100 + i * 60}ms` }}>
                <div className={`rounded-2xl p-4 sm:p-5 transition-all duration-300 cursor-pointer hover-lift ${
                  dark
                    ? 'bg-neutral-900/70 backdrop-blur-sm border border-neutral-800 hover:border-amber-500/25 hover:shadow-[0_0_30px_rgba(217,160,50,0.06)]'
                    : 'bg-white/90 backdrop-blur-sm border border-stone-200 hover:border-amber-300/50 shadow-sm hover:shadow-md'
                }`} onClick={() => navigate(`/manager/ads/${ad.id}`)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-sm font-semibold truncate transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>{ad.title}</h3>
                        <Badge status={ad.status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs flex-wrap">
                        <span className={`inline-flex items-center gap-1 ${c(dark ? 'dark' : 'light').textMuted}`}>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                          {ad.client_name}
                        </span>
                        <span className={`${dark ? 'text-neutral-700' : 'text-stone-300'}`}>·</span>
                        <span className={`inline-flex items-center gap-1 ${c(dark ? 'dark' : 'light').textMuted}`}>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                          </svg>
                          {ad.client_mobile}
                        </span>
                        <span className={`${dark ? 'text-neutral-700' : 'text-stone-300'}`}>·</span>
                        <span className={`inline-flex items-center gap-1 ${c(dark ? 'dark' : 'light').textMuted}`}>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                          {formatDate(ad.created_at)}
                        </span>
                      </div>
                    </div>

                    {ad.status === 'pending_approval' && (
                      <div className="flex gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => { setActionAd(ad); setFeedback(''); }}
                          className={`p-2.5 rounded-xl text-xs font-medium transition-all duration-300 border hover-lift ${
                            dark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                          }`}
                          title="Approve"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => { setActionAd(ad); setFeedback(''); }}
                          className={`p-2.5 rounded-xl text-xs font-medium transition-all duration-300 border hover-lift ${
                            dark ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                          }`}
                          title="Reject"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review Modal */}
        <Modal open={!!actionAd} onClose={() => { setActionAd(null); setFeedback(''); }} title={actionAd ? `Review: ${actionAd.title}` : ''}>
          <div className="space-y-4">
            <p className={`text-xs transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>
              Add optional feedback, then approve or reject this campaign.
            </p>
            <Input textarea label="Feedback (optional)" value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Reason for approval/rejection, suggested changes..."
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setActionAd(null); setFeedback(''); }}>Cancel</Button>
              <Button onClick={handleReject} loading={actionLoading} variant="ghost">
                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject
              </Button>
              <Button onClick={handleApprove} loading={actionLoading}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Approve
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
