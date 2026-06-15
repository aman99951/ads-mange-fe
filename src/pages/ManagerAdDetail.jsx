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
import { colors } from '../config/theme';

const c = (k) => colors[k];

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
        } catch { /* ignore */ }
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
        <div className="text-center py-12 animate-fade-in-up">
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
      {/* Back button */}
      <button
        onClick={() => navigate('/manager/dashboard')}
        className={`inline-flex items-center gap-1.5 text-xs font-medium mb-6 transition-all duration-300 group animate-fade-in-up ${
          dark ? 'text-neutral-500 hover:text-amber-300' : 'text-amber-700 hover:text-amber-800'
        }`}
      >
        <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Dashboard
      </button>

      {/* Title section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in-up animate-delay-100">
        <div className="flex items-center gap-3">
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>{ad.title}</h1>
          <Badge status={ad.status} />
        </div>
        <div className={`flex flex-col sm:items-end gap-1 text-sm transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>
          <span className="font-medium">{ad.client_name} ({ad.client_mobile})</span>
          <span className="text-xs">Created {formatDate(ad.created_at)}</span>
        </div>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8 animate-fade-in-up animate-delay-200">
        <SectionCard title="Target Areas">
          {ad.target_areas?.length > 0 ? (
            <div className="space-y-2">
              {Object.entries(groupedAreas).map(([key, areas]) => (
                <div key={key}>
                  <p className={`text-xs font-medium transition-colors duration-500 ${dark ? 'text-amber-400' : 'text-amber-700'}`}>{key}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {areas.map((a) => (
                      <span key={a.id} className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors duration-500 ${
                        dark ? 'bg-neutral-800/80 text-neutral-400 border border-neutral-700' : 'bg-stone-100 text-stone-500 border border-stone-200'
                      }`}>
                        {a.locality || a.city}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${c(dark ? 'dark' : 'light').textMuted}`}>No areas selected</p>
          )}
        </SectionCard>

        <SectionCard title="Target Audience">
          {ad.target_audiences?.length > 0 ? (
            <div className="space-y-1.5">
              {ad.target_audiences.map((ta) => (
                <div key={ta.id} className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-all duration-300 ${
                  dark ? 'bg-neutral-800/60 border border-neutral-700/50' : 'bg-stone-100 border border-stone-200'
                }`}>
                  <span className={`font-semibold transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>{ta.profile}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    dark ? 'bg-neutral-700/50 text-neutral-400' : 'bg-white text-stone-500'
                  }`}>{ta.age_min}-{ta.age_max} yrs</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${c(dark ? 'dark' : 'light').textMuted}`}>No audience selected</p>
          )}
        </SectionCard>
      </div>

      {/* Ad Content */}
      <div className="animate-fade-in-up animate-delay-300">
        <SectionCard title="Ad Content" className="mb-8">
          {ad.description && (
            <p className={`text-sm mb-4 transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>{ad.description}</p>
          )}
          {ad.asset && (
            <div className="mb-3">
              {isImageFile(ad.asset) ? (
                <div className="rounded-xl overflow-hidden border border-amber-500/10">
                  <img src={ad.asset} alt="Ad asset" className="max-h-56 w-full object-contain bg-black/20" />
                </div>
              ) : (
                <a href={ad.asset} target="_blank" rel="noreferrer"
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 border hover-lift ${
                    dark ? 'bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:text-amber-300 hover:border-amber-500/30' : 'bg-stone-50 border-stone-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  View Asset
                </a>
              )}
            </div>
          )}
          {ad.text_content && (
            <div className={`px-4 py-3 rounded-xl text-xs leading-relaxed border transition-all duration-300 ${
              dark ? 'bg-neutral-800/60 border-neutral-700 text-neutral-400' : 'bg-stone-50 border-stone-200 text-stone-600'
            }`}>
              {ad.text_content}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Admin Feedback */}
      {ad.admin_feedback && (
        <div className="animate-fade-in-up animate-delay-300">
          <SectionCard title="Your Feedback" className="mb-8">
            <div className={`px-5 py-4 rounded-xl text-sm border-l-4 transition-all duration-500 ${
              dark ? 'bg-neutral-800/60 border-amber-500/30 text-neutral-300' : 'bg-amber-50/80 border-amber-400 text-amber-800'
            }`}>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                <span>{ad.admin_feedback}</span>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Video generation */}
      {ad.status === 'approved' && (
        <div className={`rounded-2xl p-5 sm:p-6 mb-8 flex items-start gap-4 transition-all duration-500 animate-fade-in-up animate-delay-300 ${
          dark ? 'bg-neutral-900/50 border border-amber-500/15' : 'bg-white border border-amber-200 shadow-sm'
        }`}>
          {generating ? (
            <>
              <div className={`p-3 rounded-full animate-glow-pulse ${dark ? 'bg-amber-500/10' : 'bg-amber-100'}`}>
                <svg className="w-6 h-6 animate-spin text-amber-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <div>
                <p className={`text-sm font-medium ${dark ? 'text-amber-300' : 'text-amber-800'}`}>Generating your video...</p>
                <p className={`text-xs mt-0.5 ${dark ? 'text-neutral-500' : 'text-amber-600/70'}`}>This may take a minute. We'll update you once it's ready.</p>
              </div>
            </>
          ) : ad.generation_error ? (
            <>
              <div className={`p-3 rounded-full ${dark ? 'bg-red-500/10' : 'bg-red-100'}`}>
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${dark ? 'text-red-300' : 'text-red-800'}`}>Video generation failed</p>
                <p className={`text-xs mt-0.5 ${dark ? 'text-neutral-500' : 'text-red-600/70'}`}>{ad.generation_error}</p>
              </div>
              <Button onClick={handleGenerateVideo} loading={actionLoading} variant="ghost">Retry</Button>
            </>
          ) : videoUrl ? (
            <div className="w-full space-y-4">
              <div className="rounded-xl overflow-hidden border border-amber-500/10 shadow-lg">
                <video src={videoUrl} controls className="w-full max-w-2xl mx-auto" style={{ maxHeight: '400px' }}>
                  Your browser does not support the video tag.
                </video>
              </div>
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
          ) : (
            <Button onClick={handleGenerateVideo} loading={actionLoading} className="shadow-lg shadow-amber-500/10">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
              Generate Video
            </Button>
          )}
        </div>
      )}

      {/* Review Action */}
      <div className={`rounded-2xl p-6 space-y-5 transition-all duration-500 animate-fade-in-up animate-delay-400 ${
        dark ? 'bg-gradient-to-br from-neutral-900/80 to-neutral-900/40 border border-amber-500/10' : 'bg-white border border-stone-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-1 h-6 rounded-full bg-gradient-to-b from-amber-500 to-amber-400`} />
          <h3 className={`text-sm font-semibold transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>Review Action</h3>
        </div>
        <Input textarea label="Feedback for Client" value={feedback}
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
            <Button onClick={handleApprove} loading={actionLoading} className="shadow-lg shadow-amber-500/10">
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
