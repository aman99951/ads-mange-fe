import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAd } from '../hooks/useAds';
import { ads, developerApps } from '../services/api';
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
import { colors } from '../config/theme';

const c = (k) => colors[k];

export default function AdDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dark } = useTheme();
  const { ad, loading, error: fetchError, refetch } = useAd(id);

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [iterationModal, setIterationModal] = useState(false);
  const [iterationFeedback, setIterationFeedback] = useState('');
  const [devApps, setDevApps] = useState([]);
  const [pushedApps, setPushedApps] = useState([]);
  const [selectedAppIds, setSelectedAppIds] = useState([]);
  const [pushing, setPushing] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [langVideoUrls, setLangVideoUrls] = useState({});
  const videoRef = useRef(null);
  const langVideoRefs = useRef({});
  const [feedbackOpen, setFeedbackOpen] = useState(true);
  const [sendingRevision, setSendingRevision] = useState(false);
  const [feedbackInputs, setFeedbackInputs] = useState({});
  const getAssetKey = (assetId) => assetId ? `lang_${assetId}` : 'main';

  const feedbackList = ad?.video_feedback || [];
  const completedLangAssets = ad?.language_assets?.filter(a => a.asset && a.status === 'completed') || [];

  const feedbacksForAsset = (assetId) => {
    const key = getAssetKey(assetId);
    return feedbackList.filter(fb => {
      if (key === 'main') return !fb.language_asset;
      return fb.language_asset === assetId;
    });
  };

  const inputState = (assetId) => feedbackInputs[getAssetKey(assetId)] || { comment: '', timestamp: null, loading: false };
  const setInput = (assetId, patch) => setFeedbackInputs(prev => ({
    ...prev,
    [getAssetKey(assetId)]: { ...inputState(assetId), ...patch }
  }));

  useEffect(() => {
    if (ad?.final_asset) {
      ads.downloadFinal(id).then(res => {
        if (res.url) setVideoUrl(res.url);
      }).catch(() => {});
    } else {
      setVideoUrl('');
    }
  }, [ad?.final_asset, id]);

  useEffect(() => {
    if (ad?.id) {
      developerApps.list().then(setDevApps).catch(() => {});
      ads.pushedApps(id).then(setPushedApps).catch(() => {});
    }
  }, [ad?.id, id]);

  useEffect(() => {
    if (ad?.language_assets?.length > 0) {
      const urls = {};
      Promise.all(ad.language_assets
        .filter(a => a.asset && a.status === 'completed')
        .map(async (a) => {
          try {
            const res = await ads.downloadFinal(id, a.id);
            if (res.url) urls[a.language] = res.url;
          } catch {}
        })
      ).then(() => setLangVideoUrls(urls));
    }
  }, [ad?.language_assets, id]);

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

  const handlePushToApps = async () => {
    if (selectedAppIds.length === 0) return;
    setPushing(true);
    try {
      await ads.pushToApps(id, selectedAppIds);
      const updated = await ads.pushedApps(id);
      setPushedApps(updated);
      setSelectedAppIds([]);
    } catch (e) {
      setError(e.message || 'Failed to push ad to apps');
    } finally {
      setPushing(false);
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

  const handleDownload = async (assetId) => {
    try {
      const res = await ads.downloadFinal(id, assetId);
      if (res.url) window.open(res.url, '_blank');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCaptureTimestamp = (assetId) => {
    const ref = assetId ? langVideoRefs.current[assetId] : videoRef.current;
    if (ref) {
      setInput(assetId, { timestamp: Math.floor(ref.currentTime) });
    }
  };

  const handleAddFeedback = async (assetId) => {
    const state = inputState(assetId);
    if (!state.comment.trim()) return;
    setInput(assetId, { loading: true });
    try {
      const data = { comment: state.comment.trim() };
      if (state.timestamp !== null) data.timestamp_seconds = state.timestamp;
      if (assetId) data.language_asset_id = assetId;
      await ads.addVideoFeedback(id, data);
      setInput(assetId, { comment: '', timestamp: null, loading: false });
      await refetch();
    } catch (err) {
      setInput(assetId, { loading: false });
      setError(err.message);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    try {
      await ads.deleteVideoFeedback(id, feedbackId);
      await refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRequestRevision = async () => {
    const combinedFeedback = feedbackList
      .map(f => {
        const label = f.language_name ? `[${f.language_name}] ` : '';
        const ts = f.timestamp_seconds != null ? formatTimestamp(f.timestamp_seconds) + ' - ' : '';
        return label + ts + f.comment;
      })
      .join('\n');
    if (!combinedFeedback.trim()) return;
    setSendingRevision(true);
    try {
      await ads.requestRevision(id, { feedback: combinedFeedback });
      await refetch();
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingRevision(false);
    }
  };

  const formatTimestamp = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderFeedbackBlock = (videoSrc, assetId, label) => {
    const key = getAssetKey(assetId);
    const fbItems = feedbacksForAsset(assetId);
    const state = inputState(assetId);
    const setRef = (el) => {
      if (assetId) langVideoRefs.current[assetId] = el;
    };

    return (
      <div key={key} className={`mb-5 p-4 rounded-xl border transition-all duration-300 ${
        dark ? 'bg-neutral-800/30 border-neutral-700/40' : 'bg-stone-50/80 border-stone-200'
      }`}>
        {label && (
          <h4 className={`text-xs font-bold mb-3 ${c(dark ? 'dark' : 'light').text}`}>{label}</h4>
        )}
        {/* Video player */}
        {videoSrc && (
          <div className="rounded-lg overflow-hidden border border-amber-500/10 max-w-xl mb-3">
            <video ref={assetId ? setRef : videoRef} src={videoSrc} controls className="w-full max-h-48 object-contain bg-black/10">
              Your browser does not support the video tag.
            </video>
          </div>
        )}
        {/* Comments for this asset */}
        {fbItems.length > 0 && (
          <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto">
            {fbItems.map(fb => (
              <div key={fb.id} className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs border ${
                dark ? 'bg-neutral-800/40 border-neutral-700/50' : 'bg-white border-stone-200'
              }`}>
                <div className={`w-1 h-full min-h-[1.5rem] rounded-full flex-shrink-0 bg-amber-500`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {fb.timestamp_seconds != null && (
                      <span className={`px-1 py-0.5 rounded text-[9px] font-mono font-bold ${
                        dark ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {formatTimestamp(fb.timestamp_seconds)}
                      </span>
                    )}
                    <span className={`text-[9px] ${c(dark ? 'dark' : 'light').textMuted}`}>{fb.user_name || 'Client'}</span>
                  </div>
                  <p className={`${c(dark ? 'dark' : 'light').text}`}>{fb.comment}</p>
                </div>
                <button onClick={() => handleDeleteFeedback(fb.id)}
                  className={`p-0.5 rounded hover:bg-red-500/10 transition-colors ${
                    dark ? 'text-neutral-600 hover:text-red-400' : 'text-stone-400 hover:text-red-500'
                  }`}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        {/* Add feedback form */}
        <div className="flex items-start gap-1.5">
          <input
            value={state.comment}
            onChange={(e) => setInput(assetId, { comment: e.target.value })}
            placeholder="Add feedback..."
            className={`flex-1 text-xs px-3 py-2 rounded-lg border outline-none transition-all duration-300 ${
              dark
                ? 'bg-neutral-800 border-neutral-700 text-neutral-200 placeholder-neutral-500 focus:border-amber-500/30'
                : 'bg-white border-stone-200 text-stone-800 placeholder-stone-400 focus:border-amber-400'
            }`}
          />
          <button onClick={() => handleCaptureTimestamp(assetId)}
            className={`p-2 rounded-lg text-xs font-medium transition-all duration-300 ${
              dark ? 'bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-amber-300' : 'bg-white border border-stone-200 text-stone-500 hover:text-amber-600'
            }`}
            title="Capture current video timestamp">
            {state.timestamp != null ? formatTimestamp(state.timestamp) :
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          </button>
          <Button size="sm" onClick={() => handleAddFeedback(assetId)} loading={state.loading}
            disabled={!state.comment.trim()}>Add</Button>
          {state.timestamp != null && (
            <button onClick={() => setInput(assetId, { timestamp: null })}
              className={`p-2 rounded-lg text-[9px] ${dark ? 'text-neutral-500 hover:text-neutral-300' : 'text-stone-400 hover:text-stone-600'}`}>
              Clear
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <AppLayout fullWidth>
        <div className="max-w-[1400px] mx-auto">
          <DetailSkeleton />
        </div>
      </AppLayout>
    );
  }

  if ((fetchError || error) && !ad) {
    return (
      <AppLayout fullWidth>
        <div className="max-w-[1400px] mx-auto text-center py-12 animate-fade-in-up">
          <p className={`text-sm ${dark ? 'text-red-400' : 'text-red-600'}`}>{fetchError || error}</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </AppLayout>
    );
  }

  if (!ad) return null;

  const groupedAreas = groupBy(ad.target_areas || [], (ta) => `${ta.state} > ${ta.city}`);

  return (
    <AppLayout fullWidth>
      <div className="max-w-[1400px] mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          className={`inline-flex items-center gap-1.5 text-xs font-medium mb-6 transition-all duration-300 group animate-fade-in-up ${
            dark ? 'text-neutral-500 hover:text-amber-400' : 'text-amber-700 hover:text-amber-800'
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
            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>{ad.title}</h1>
            <Badge status={ad.status} />
          </div>
          <div className={`flex items-center gap-2 text-sm transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            Created {formatDate(ad.created_at)}
          </div>
        </div>

        <ErrorAlert message={error} onDismiss={() => setError('')} />

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8 animate-fade-in-up animate-delay-200">
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
              <p className={`text-sm transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>No areas selected</p>
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
              <p className={`text-sm transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>No audience selected</p>
            )}
          </SectionCard>

          <SectionCard title="Languages">
            {ad.languages?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {ad.languages.map((lang) => (
                  <span key={lang.id} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                    dark ? 'bg-neutral-800/60 border border-neutral-700/50 text-neutral-300' : 'bg-stone-100 border border-stone-200 text-stone-600'
                  }`}>
                    {lang.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className={`text-sm transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>No languages selected</p>
            )}
          </SectionCard>

          <SectionCard title="Schedule">
            {ad.scheduled_start || ad.scheduled_end ? (
              <div className="space-y-1 text-xs">
                {ad.scheduled_start && <p className={dark ? 'text-neutral-400' : 'text-stone-500'}>Start: {formatDate(ad.scheduled_start)}</p>}
                {ad.scheduled_end && <p className={dark ? 'text-neutral-400' : 'text-stone-500'}>End: {formatDate(ad.scheduled_end)}</p>}
              </div>
            ) : (
              <p className={`text-sm transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>No schedule set</p>
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
                    <img src={ad.asset} alt="Ad asset" className="max-h-64 w-full object-contain bg-black/10" />
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
          </SectionCard>
        </div>

        {/* Admin Feedback */}
        {ad.admin_feedback && (
          <div className="animate-fade-in-up animate-delay-300">
            <SectionCard title="Admin Feedback" className="mb-8">
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

        {/* Final Video / Asset */}
        {videoUrl && (
          <div className="animate-fade-in-up animate-delay-300">
            <SectionCard title="Your Ad Video" className="mb-8">
              {isImageFile(videoUrl) ? (
                <div className="rounded-xl overflow-hidden border border-amber-500/10">
                  <img src={videoUrl} alt="Ad asset" className="max-h-80 w-full object-contain bg-black/10" />
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden border border-amber-500/10 max-w-2xl">
                  <video src={videoUrl} controls className="w-full max-h-96 object-contain bg-black/10">
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {/* Generated Videos by Language */}
        {ad.language_assets?.length > 0 && ad.language_assets.some(a => a.status === 'completed') && (
          <div className="animate-fade-in-up animate-delay-300">
            <SectionCard title="Generated Videos" className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ad.language_assets.filter(a => a.status === 'completed' && a.asset).map((asset) => (
                  <div key={asset.id} className={`rounded-xl p-4 border transition-all duration-300 ${
                    dark ? 'bg-neutral-800/40 border-neutral-700/50' : 'bg-stone-50 border-stone-200'
                  }`}>
                    <h4 className={`text-sm font-bold mb-3 ${c(dark ? 'dark' : 'light').text}`}>{asset.language_name}</h4>
                    <div className="rounded-lg overflow-hidden border border-amber-500/10 mb-3">
                      <video src={langVideoUrls[asset.language]} controls className="w-full max-h-48 object-contain bg-black/10">
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <Button size="sm" onClick={() => handleDownload(asset.id)}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {/* Iteration History */}
        {ad.iterations?.length > 0 && (
          <div className="animate-fade-in-up animate-delay-300">
            <SectionCard title="Revision History" className="mb-8">
              <IterationTimeline iterations={ad.iterations} />
            </SectionCard>
          </div>
        )}

        {/* Feedback & Send Back Section */}
        {(
          <div className="animate-fade-in-up animate-delay-300 mb-8">
            <SectionCard title={
              <div className="flex items-center justify-between w-full">
                <span>Feedback & Send Back to Manager</span>
                <button onClick={() => setFeedbackOpen(o => !o)}
                  className={`p-1.5 rounded-lg transition-all duration-300 hover:bg-amber-500/10 ${
                    dark ? 'text-neutral-500 hover:text-amber-400' : 'text-stone-400 hover:text-amber-600'
                  }`}>
                  <svg className={`w-4 h-4 transition-transform duration-300 ${feedbackOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                  </svg>
                </button>
              </div>
            }>
              {feedbackOpen && (
              <>
              <p className={`text-xs mb-4 ${c(dark ? 'dark' : 'light').textMuted}`}>
                {videoUrl || completedLangAssets.length > 0
                  ? 'Add timestamped feedback on any video below, then send back for revisions.'
                  : 'Add your feedback below, then send back to the manager for revisions.'}
              </p>

              {/* Main video feedback block */}
              {videoUrl && renderFeedbackBlock(videoUrl, null, 'Main Video')}

              {/* Language asset video feedback blocks */}
              {completedLangAssets.map(asset => (
                <div key={asset.id}>
                  {renderFeedbackBlock(langVideoUrls[asset.language], asset.id, `Video — ${asset.language_name || asset.language}`)}
                </div>
              ))}

              {/* Send Back button — always visible */}
              <div className={`mt-4 pt-4 border-t border-dashed ${dark ? 'border-amber-500/20' : 'border-stone-200'}`}>
                <Button onClick={handleRequestRevision} loading={sendingRevision} className="w-full !py-3"
                  disabled={feedbackList.length === 0}
                  title={feedbackList.length === 0 ? 'Add at least one feedback comment first' : ''}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                  Send Back for Revisions
                </Button>
                <p className={`text-[10px] mt-1.5 text-center ${c(dark ? 'dark' : 'light').textMuted}`}>
                  {feedbackList.length > 0
                    ? `This will bundle all ${feedbackList.length} feedback${feedbackList.length > 1 ? 's' : ''} across all videos and notify the manager`
                    : 'Add feedback on any video above, then click here to send back to the manager'}
                </p>
              </div>
              </>)}
            </SectionCard>
          </div>
        )}

        {/* Push to Developer App - Client side */}
        {ad.status === 'approved' && devApps.length > 0 && (
          <div className="mb-8 animate-fade-in-up animate-delay-350">
            <SectionCard title="Push to Developer Apps">
              <p className={`text-xs mb-4 ${c(dark ? 'dark' : 'light').textMuted}`}>
                Your ad has been approved! Select one or more developer apps/websites to publish your ad to.
              </p>

              {/* Available Apps Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {devApps.filter(a => a.is_active).map(app => {
                  const isPushed = pushedApps.some(p => p.app_id === app.id);
                  const isSelected = selectedAppIds.includes(app.id);
                  return (
                    <div key={app.id} className={`rounded-xl p-4 border transition-all duration-300 ${
                      isPushed
                        ? dark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                        : isSelected
                          ? dark ? 'bg-amber-500/5 border-amber-500/30' : 'bg-amber-50 border-amber-300'
                          : dark ? 'bg-neutral-800/40 border-neutral-700/50' : 'bg-stone-50 border-stone-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        {!isPushed && (
                          <input type="checkbox" checked={isSelected}
                            onChange={() => {
                              setSelectedAppIds(prev =>
                                prev.includes(app.id) ? prev.filter(id => id !== app.id) : [...prev, app.id]
                              );
                            }}
                            className="mt-1 w-4 h-4 rounded accent-amber-500 cursor-pointer"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-base ${app.app_type === 'mobile' ? '📱' : '🌐'}`} />
                            <h4 className={`text-sm font-bold truncate ${c(dark ? 'dark' : 'light').text}`}>
                              {app.app_name}
                            </h4>
                          </div>
                          {app.description && (
                            <p className={`text-[10px] mt-0.5 leading-relaxed ${c(dark ? 'dark' : 'light').textMuted}`}>
                              {app.description}
                            </p>
                          )}
                          {app.app_url && (
                            <a href={app.app_url} target="_blank" rel="noopener noreferrer"
                              className={`text-[10px] mt-1 block truncate hover:underline ${dark ? 'text-blue-400' : 'text-blue-600'}`}>
                              {app.app_url}
                            </a>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-semibold ${
                              app.app_type === 'mobile'
                                ? dark ? 'bg-violet-500/10 text-violet-300' : 'bg-violet-50 text-violet-700'
                                : dark ? 'bg-cyan-500/10 text-cyan-300' : 'bg-cyan-50 text-cyan-700'
                            }`}>
                              {app.app_type}
                            </span>
                            <span className={`text-[10px] ${c(dark ? 'dark' : 'light').textMuted}`}>
                              by {app.company || 'Unknown'}
                            </span>
                          </div>
                          {/* Rating Stars */}
                          <div className="flex items-center gap-1 mt-1.5">
                            {[1,2,3,4,5].map(star => (
                              <svg key={star} className={`w-3.5 h-3.5 ${
                                star <= Math.round(app.rating || 0)
                                  ? 'text-amber-400'
                                  : dark ? 'text-neutral-600' : 'text-stone-300'
                              }`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className={`text-[10px] ml-1 ${c(dark ? 'dark' : 'light').textMuted}`}>
                              {app.rating ? app.rating.toFixed(1) : 'N/A'}
                            </span>
                          </div>
                        </div>
                        {isPushed && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${
                            dark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            Pushed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button onClick={handlePushToApps} loading={pushing} disabled={selectedAppIds.length === 0} size="sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  {selectedAppIds.length > 0 ? `Push to Selected (${selectedAppIds.length})` : 'Select Apps Above'}
                </Button>
              </div>

              {/* Already Pushed Summary */}
              {pushedApps.length > 0 && (
                <div className="mt-4 pt-3 border-t border-dashed border-amber-500/20">
                  <p className={`text-[10px] font-medium mb-2 ${c(dark ? 'dark' : 'light').textMuted}`}>
                    Already pushed to {pushedApps.length} app{pushedApps.length > 1 ? 's' : ''}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {pushedApps.map(pa => (
                      <span key={pa.push_id} className={`text-[10px] px-2 py-1 rounded-full ${
                        dark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {pa.app_name}{pa.company ? ` (${pa.company})` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {/* Action Bar — only show when at least one status condition matches */}
        {(ad.status === 'draft' || ad.status === 'rejected' || ad.status === 'pending_approval' || (ad.status === 'approved' && !ad.final_asset) || ad.status === 'revision_requested') && (
        <div className={`rounded-2xl p-5 sm:p-6 flex flex-wrap items-center gap-3 transition-all duration-500 animate-fade-in-up animate-delay-400 ${
          dark ? 'bg-gradient-to-br from-neutral-900/80 to-neutral-900/40 border border-amber-500/10' : 'bg-white border border-stone-200 shadow-sm'
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
            <div className={`flex items-center gap-3 text-sm transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>
              <div className={`p-2 rounded-full ${dark ? 'bg-amber-500/10' : 'bg-amber-100'}`}>
                <svg className="w-4 h-4 animate-spin text-amber-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <span className="font-medium">Awaiting admin review</span>
            </div>
          )}
          {ad.status === 'approved' && !ad.final_asset && (
            <div className={`flex items-start gap-3 text-sm ${dark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              <div className={`p-2 rounded-full ${dark ? 'bg-emerald-500/10' : 'bg-emerald-100'}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Campaign Approved!</p>
                <p className={`text-xs mt-0.5 ${dark ? 'text-emerald-300/70' : 'text-emerald-600'}`}>
                  Your ad video will be generated and available here shortly.
                </p>
              </div>
            </div>
          )}
          {ad.status === 'revision_requested' && (
            <div className={`flex items-start gap-3 text-sm ${dark ? 'text-purple-400' : 'text-purple-700'}`}>
              <div className={`p-2 rounded-full ${dark ? 'bg-purple-500/10' : 'bg-purple-100'}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Revision Requested</p>
                <p className={`text-xs mt-0.5 ${dark ? 'text-purple-300/70' : 'text-purple-600'}`}>
                  The manager has been notified. You can add more feedback below.
                </p>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Revision Modal */}
        <Modal open={iterationModal} onClose={() => setIterationModal(false)} title="Add Revision">
          <div className="space-y-4">
            <p className={`text-xs transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>
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
      </div>
    </AppLayout>
  );
}
