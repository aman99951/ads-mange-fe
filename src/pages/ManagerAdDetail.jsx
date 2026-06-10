import { useState, useEffect, useRef } from 'react';
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
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const pollRef = useRef(null);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (ad?.final_asset) {
      ads.downloadFinal(id).then(res => {
        if (res.url) setVideoUrl(res.url);
      }).catch(() => {});
    } else {
      setVideoUrl('');
    }
  }, [ad?.final_asset, id]);

  const handleGenerateVideo = async () => {
    setActionLoading(true);
    setError('');
    try {
      await ads.generateVideo(id);
      setGenerating(true);
      pollRef.current = setInterval(async () => {
        try {
          const updated = await ads.get(id);
          if (updated.final_asset || updated.generation_error) {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setGenerating(false);
            await refetch();
          }
        } catch { /* ignore poll errors */ }
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

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

      {videoUrl && (
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
            <Button onClick={async () => {
              try {
                const res = await ads.downloadFinal(id);
                if (res.url) window.open(res.url, '_blank');
              } catch (err) {
                setError(err.message);
              }
            }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download Video
            </Button>
          </div>
        </SectionCard>
      )}

      {ad.status === 'approved' && (
        <div className={`rounded-2xl p-6 mb-8 flex items-start gap-4 transition-all duration-500 ${
          dark ? 'bg-neutral-900/50 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
        }`}>
          {generating ? (
            <>
              <svg className="w-8 h-8 animate-spin text-amber-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <div>
                <p className={`text-sm font-medium ${dark ? 'text-amber-300' : 'text-amber-800'}`}>Generating your video...</p>
                <p className={`text-xs mt-0.5 ${dark ? 'text-neutral-500' : 'text-amber-600/70'}`}>This may take a minute. We'll update you once it's ready.</p>
              </div>
            </>
          ) : ad.generation_error ? (
            <>
              <svg className="w-8 h-8 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <div className="flex-1">
                <p className={`text-sm font-medium ${dark ? 'text-red-300' : 'text-red-800'}`}>Video generation failed</p>
                <p className={`text-xs mt-0.5 ${dark ? 'text-neutral-500' : 'text-red-600/70'}`}>{ad.generation_error}</p>
              </div>
              <Button onClick={handleGenerateVideo} loading={actionLoading} variant="ghost">
                Retry
              </Button>
            </>
          ) : !videoUrl && (
            <Button onClick={handleGenerateVideo} loading={actionLoading}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
              Generate Video
            </Button>
          )}
        </div>
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
