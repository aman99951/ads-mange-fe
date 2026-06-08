import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAd } from '../hooks/useAds';
import { ads } from '../services/api';
import AppLayout from '../components/layout/AppLayout';
import ErrorAlert from '../components/layout/ErrorAlert';
import { DetailSkeleton } from '../components/layout/LoadingSkeleton';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { SectionCard } from '../components/ui/Card';
import { formatDate, groupBy, isImageFile } from '../utils/helpers';

export default function ManagerAdDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dark } = useTheme();
  const { ad, loading, error: fetchError, refetch } = useAd(id);

  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await ads.approve(id, { admin_feedback: feedback });
      await refetch();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await ads.reject(id, { admin_feedback: feedback });
      await refetch();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <DetailSkeleton />
      </AppLayout>
    );
  }

  if ((fetchError || error) && !ad) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className={`text-sm ${dark ? 'text-red-400' : 'text-red-600'}`}>{fetchError || error}</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate('/manager/dashboard')}>Back to Dashboard</Button>
        </div>
      </AppLayout>
    );
  }

  if (!ad) return null;

  const groupedAreas = groupBy(ad.target_areas || [], (ta) => `${ta.state} > ${ta.city}`);

  return (
    <AppLayout>
      <button
        onClick={() => navigate('/manager/dashboard')}
        className={`inline-flex items-center gap-1 text-xs font-medium mb-6 transition-colors ${dark ? 'text-neutral-500 hover:text-amber-300' : 'text-amber-700 hover:text-amber-800'}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Dashboard
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${dark ? 'text-neutral-100' : 'text-neutral-900'}`}>{ad.title}</h1>
          <Badge status={ad.status} />
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className={dark ? 'text-neutral-500' : 'text-neutral-400'}>
            {ad.client_name} ({ad.client_mobile})
          </span>
          <span className={`text-xs ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>
            Created {formatDate(ad.created_at)}
          </span>
        </div>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <SectionCard title="Target Areas">
          {ad.target_areas?.length > 0 ? (
            <div className="space-y-2">
              {Object.entries(groupedAreas).map(([key, areas]) => (
                <div key={key}>
                  <p className={`text-xs font-medium ${dark ? 'text-neutral-400' : 'text-amber-700'}`}>{key}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {areas.map((a) => (
                      <span key={a.id} className={`px-2 py-0.5 rounded text-[10px] ${dark ? 'bg-neutral-800 text-neutral-400' : 'bg-stone-100 text-stone-500'}`}>
                        {a.locality || a.city}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>No areas selected</p>
          )}
        </SectionCard>

        <SectionCard title="Target Audience">
          {ad.target_audiences?.length > 0 ? (
            <div className="space-y-1.5">
              {ad.target_audiences.map((ta) => (
                <div key={ta.id} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${dark ? 'bg-neutral-800/60' : 'bg-stone-100'}`}>
                  <span className={`font-medium ${dark ? 'text-neutral-100' : 'text-neutral-900'}`}>{ta.profile}</span>
                  <span className={dark ? 'text-neutral-500' : 'text-stone-400'}>{ta.age_min}-{ta.age_max} yrs</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>No audience selected</p>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Ad Content" className="mb-8">
        {ad.description && (
          <p className={`text-sm mb-3 ${dark ? 'text-neutral-100' : 'text-neutral-900'}`}>{ad.description}</p>
        )}
        {ad.asset && (
          <div className="mb-3">
            {isImageFile(ad.asset) ? (
              <img src={ad.asset} alt="Ad asset" className="max-h-48 rounded-lg object-contain" />
            ) : (
              <a href={ad.asset} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-2 text-xs font-medium underline ${dark ? 'text-neutral-300 hover:text-amber-300' : 'text-amber-700 hover:text-amber-800'}`}>
                View Asset
              </a>
            )}
          </div>
        )}
        {ad.text_content && (
          <div className={`px-3 py-2 rounded-lg text-xs ${dark ? 'bg-neutral-800/60 text-neutral-400' : 'bg-stone-100 text-stone-500'}`}>
            {ad.text_content}
          </div>
        )}
      </SectionCard>

      {ad.admin_feedback && (
        <SectionCard title="Admin Feedback" className="mb-8">
          <div className={`px-4 py-3 rounded-lg text-sm border ${
            dark ? 'bg-neutral-800/60 border-neutral-700 text-neutral-300' : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            {ad.admin_feedback}
          </div>
        </SectionCard>
      )}

      {ad.final_asset && (
        <SectionCard title="Generated Video" className="mb-8">
          {ad.final_asset ? (
            <video src={ad.final_asset} controls className="w-full max-w-2xl rounded-lg" style={{ maxHeight: '400px' }}>
              Your browser does not support the video tag.
            </video>
          ) : (
            <p className={`text-sm ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>No video generated yet</p>
          )}
        </SectionCard>
      )}

      <div className={`rounded-2xl p-6 space-y-4 ${dark ? 'bg-neutral-900/50 border border-neutral-800' : 'bg-white border border-stone-200 shadow-sm'}`}>
        <h3 className={`text-sm font-semibold ${dark ? 'text-neutral-200' : 'text-neutral-800'}`}>Review Action</h3>
        <Input textarea label="Feedback" value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Add feedback for the client..."
        />
        <div className="flex items-center justify-end gap-2">
          {ad.status !== 'rejected' && (
            <Button onClick={handleReject} loading={actionLoading} variant="ghost">
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject
            </Button>
          )}
          {ad.status !== 'approved' && (
            <Button onClick={handleApprove} loading={actionLoading}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Approve
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
