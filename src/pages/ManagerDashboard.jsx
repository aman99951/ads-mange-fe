import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ads } from '../services/api';
import AppLayout from '../components/layout/AppLayout';
import ErrorAlert from '../components/layout/ErrorAlert';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { formatDate } from '../utils/helpers';

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
    all: allAds.length,
    pending_approval: allAds.filter(a => a.status === 'pending_approval').length,
    approved: allAds.filter(a => a.status === 'approved').length,
    rejected: allAds.filter(a => a.status === 'rejected').length,
    draft: allAds.filter(a => a.status === 'draft').length,
  };

  const tabs = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'pending_approval', label: 'Pending', count: counts.pending_approval },
    { key: 'approved', label: 'Approved', count: counts.approved },
    { key: 'rejected', label: 'Rejected', count: counts.rejected },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight transition-colors duration-500 ${dark ? 'text-neutral-100' : 'text-neutral-900'}`}>Manager Dashboard</h1>
          <p className={`text-sm mt-1 ${dark ? 'text-neutral-500' : 'text-stone-500'}`}>Review and manage all ad campaigns</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/manager/target-areas')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
          Manage Target Areas
        </Button>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      <div className="flex gap-1 mb-6 flex-wrap">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              filter === tab.key
                ? dark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'
                : dark ? 'text-neutral-500 hover:text-neutral-300' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className={`h-20 rounded-2xl animate-pulse ${dark ? 'bg-neutral-900' : 'bg-stone-100'}`} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className={`text-center py-12 text-sm ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
          No ads found
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ad => (
            <div key={ad.id} className={`rounded-2xl p-4 sm:p-5 transition-all duration-500 cursor-pointer ${
              dark ? 'bg-neutral-900/50 border border-neutral-800 hover:border-amber-500/30' : 'bg-white border border-stone-200 hover:border-amber-300/50 shadow-sm'
            }`} onClick={() => navigate(`/manager/ads/${ad.id}`)}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-sm font-semibold truncate ${dark ? 'text-neutral-100' : 'text-neutral-900'}`}>{ad.title}</h3>
                    <Badge status={ad.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={dark ? 'text-neutral-500' : 'text-stone-400'}>{ad.client_name}</span>
                    <span className={dark ? 'text-neutral-600' : 'text-stone-300'}>·</span>
                    <span className={dark ? 'text-neutral-500' : 'text-stone-400'}>{ad.client_mobile}</span>
                    <span className={dark ? 'text-neutral-600' : 'text-stone-300'}>·</span>
                    <span className={dark ? 'text-neutral-500' : 'text-stone-400'}>{formatDate(ad.created_at)}</span>
                  </div>
                </div>
                {ad.status === 'pending_approval' && (
                  <div className="flex gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" onClick={() => { setActionAd(ad); setFeedback(''); }}>
                      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Approve
                    </Button>
                    <Button variant="ghost" onClick={() => { setActionAd(ad); setFeedback(''); }}>
                      <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!actionAd} onClose={() => { setActionAd(null); setFeedback(''); }} title={actionAd ? `Review: ${actionAd.title}` : ''}>
        <div className="space-y-4">
          <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-stone-500'}`}>
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
    </AppLayout>
  );
}
