import { useState, useEffect } from 'react';
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
import Modal from '../components/ui/Modal';
import { SectionCard } from '../components/ui/Card';
import IterationTimeline from '../components/ads/IterationTimeline';
import { formatDate, groupBy, isImageFile } from '../utils/helpers';

export default function AdDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dark } = useTheme();
  const { ad, loading, error: fetchError, refetch } = useAd(id);

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [iterationModal, setIterationModal] = useState(false);
  const [iterationFeedback, setIterationFeedback] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    if (ad?.final_asset) {
      ads.downloadFinal(id).then(res => {
        if (res.url) setVideoUrl(res.url);
      }).catch(() => {});
    } else {
      setVideoUrl('');
    }
  }, [ad?.final_asset, id]);

  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      await ads.submitForApproval(id);
      await refetch();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddIteration = async () => {
    setActionLoading(true);
    try {
      await ads.addIteration(id, { feedback: iterationFeedback });
      setIterationModal(false);
      setIterationFeedback('');
      await refetch();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await ads.downloadFinal(id);
      if (res.url) window.open(res.url, '_blank');
    } catch (err) {
      setError(err.message);
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
          <Button variant="ghost" className="mt-4" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </AppLayout>
    );
  }

  if (!ad) return null;

  const groupedAreas = groupBy(ad.target_areas || [], (ta) => `${ta.state} > ${ta.city}`);

  return (
    <AppLayout>
      <button
        onClick={() => navigate('/dashboard')}
        className={`inline-flex items-center gap-1 text-xs font-medium mb-6 transition-colors ${dark ? 'text-neutral-500 hover:text-amber-300' : 'text-amber-700 hover:text-amber-800'}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Dashboard
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight transition-colors duration-500 ${dark ? 'text-neutral-100' : 'text-neutral-900'}`}>{ad.title}</h1>
          <Badge status={ad.status} />
        </div>
        <p className={`text-sm ${dark ? 'text-neutral-500' : 'text-neutral-400'}`}>
          Created {formatDate(ad.created_at)}
        </p>
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
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                View Asset
              </a>
            )}
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

      {ad.final_asset && videoUrl && (
        <SectionCard title="Generated Video" className="mb-8">
          <div className="space-y-3">
            <video
              src={videoUrl}
              controls
              className="w-full max-w-2xl rounded-lg"
              style={{ maxHeight: '400px' }}
            >
              Your browser does not support the video tag.
            </video>
            <Button onClick={handleDownload}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download Video
            </Button>
          </div>
        </SectionCard>
      )}



      {ad.iterations?.length > 0 && (
        <SectionCard title="Revision History" className="mb-8">
          <IterationTimeline iterations={ad.iterations} />
        </SectionCard>
      )}

      <div className={`rounded-2xl p-5 flex flex-wrap items-center gap-3 transition-all duration-500 ${
        dark ? 'bg-neutral-900/30 border border-amber-500/10' : 'bg-white border border-stone-200'
      }`}>
        {ad.status === 'draft' && (
          <Button onClick={handleSubmit} loading={actionLoading}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Submit for Approval
          </Button>
        )}
        {(ad.status === 'rejected' || ad.status === 'draft') && (
          <Button variant="ghost" onClick={() => setIterationModal(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Add Revision
          </Button>
        )}
        {ad.status === 'pending_approval' && (
          <div className={`flex items-center gap-2 text-sm ${dark ? 'text-neutral-500' : 'text-stone-500'}`}>
            <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Awaiting admin review
          </div>
        )}
      </div>

      <Modal open={iterationModal} onClose={() => setIterationModal(false)} title="Add Revision">
        <div className="space-y-4">
          <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-stone-500'}`}>
            Provide feedback or updated content for the next iteration.
          </p>
          <Input textarea label="Your Feedback" value={iterationFeedback}
            onChange={(e) => setIterationFeedback(e.target.value)}
            placeholder="Describe the changes needed..."
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIterationModal(false)}>Cancel</Button>
            <Button onClick={handleAddIteration} loading={actionLoading} disabled={!iterationFeedback.trim()}>
              Submit Revision
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
