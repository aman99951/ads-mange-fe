import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../config/theme';
import { ads } from '../services/api';
import AppLayout from '../components/layout/AppLayout';
import ErrorAlert from '../components/layout/ErrorAlert';
import Button from '../components/ui/Button';

const c = (k) => colors[k];

export default function ManagerRevisions() {
  const { dark } = useTheme();
  const navigate = useNavigate();
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await ads.getRevisionRequests();
        setRevisions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AppLayout fullWidth>
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-8 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full bg-gradient-to-b from-amber-500 to-amber-400" />
            <div>
              <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${c(dark ? 'dark' : 'light').text}`}>Revision Requests</h1>
              <p className={`text-sm mt-0.5 ${c(dark ? 'dark' : 'light').textMuted}`}>
                Campaigns that need your attention
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => navigate('/manager/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        <ErrorAlert message={error} onDismiss={() => setError('')} />

        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className={`h-20 rounded-2xl animate-pulse ${dark ? 'bg-neutral-900/60 border border-neutral-800' : 'bg-stone-100 border border-stone-200'}`} />
            ))}
          </div>
        )}

        {!loading && revisions.length === 0 && (
          <div className={`text-center py-16 ${c(dark ? 'dark' : 'light').textMuted}`}>
            <svg className="w-16 h-16 mx-auto mb-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium mb-1">All caught up!</p>
            <p className="text-sm">No campaigns are currently waiting for revision.</p>
          </div>
        )}

        {!loading && revisions.map((ad) => (
          <button
            key={ad.id}
            onClick={() => navigate(`/manager/campaigns/${ad.id}`)}
            className={`w-full text-left mb-3 p-5 rounded-2xl transition-all duration-200 border cursor-pointer hover-lift ${
              dark
                ? 'bg-neutral-900/70 border-neutral-800 hover:border-amber-500/25 hover:shadow-[0_0_30px_rgba(217,160,50,0.06)]'
                : 'bg-white/90 border-stone-200 hover:border-amber-300/50 shadow-sm hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <h3 className={`text-sm font-bold truncate ${c(dark ? 'dark' : 'light').text}`}>{ad.title}</h3>
                </div>
                <p className={`text-xs ${c(dark ? 'dark' : 'light').textMuted}`}>
                  Client: {ad.client_name}
                </p>
                {ad.latest_feedback && (
                  <div className={`mt-3 p-3 rounded-xl text-xs ${
                    dark ? 'bg-neutral-800/80 text-neutral-300' : 'bg-stone-100 text-stone-600'
                  }`}>
                    <span className={`font-medium ${c(dark ? 'dark' : 'light').text}`}>
                      {ad.latest_feedback.created_by === 'client' ? 'Client' : 'Manager'} feedback:
                    </span>
                    <p className="mt-1 whitespace-pre-wrap">{ad.latest_feedback.feedback}</p>
                  </div>
                )}
              </div>
              <svg className="w-5 h-5 flex-shrink-0 mt-1 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </AppLayout>
  );
}
