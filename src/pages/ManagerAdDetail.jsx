import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAd } from '../hooks/useAds';
import { ads } from '../services/api';
import { developerApps } from '../services/api';
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

function LanguageVideoCard({ lang, asset, adId, dark, onGenerate, generating }) {
  const [prompt, setPrompt] = useState(asset?.prompt || '');
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    if (asset?.asset) {
      ads.downloadFinal(adId, asset.id).then(res => {
        if (res.url) setVideoUrl(res.url);
      }).catch(() => {});
    }
  }, [asset?.asset, asset?.id, adId]);

  return (
    <div className={`rounded-xl p-5 border transition-all duration-300 ${
      dark ? 'bg-neutral-800/40 border-neutral-700/50' : 'bg-stone-50 border-stone-200'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            asset?.status === 'completed' ? 'bg-emerald-500' :
            asset?.status === 'failed' ? 'bg-red-500' :
            asset?.status === 'generating' ? 'bg-amber-500 animate-pulse' :
            'bg-neutral-400'
          }`} />
          <h4 className={`text-sm font-bold ${c(dark ? 'dark' : 'light').text}`}>{lang.name}</h4>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
          dark ? 'bg-neutral-700/50 text-neutral-400' : 'bg-white text-stone-500 border border-stone-200'
        }`}>{asset?.status || 'pending'}</span>
      </div>

      <div className="mb-3 space-y-2">
        <Input textarea value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`Prompt for ${lang.name} video...`}
          className="text-xs"
        />
      </div>

      {asset?.status === 'generating' && (
        <div className={`flex items-center gap-3 p-3 rounded-lg mb-3 ${dark ? 'bg-amber-500/5' : 'bg-amber-50'}`}>
          <svg className="w-5 h-5 animate-spin text-amber-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className={`text-xs font-medium ${dark ? 'text-amber-300' : 'text-amber-700'}`}>Generating video...</span>
        </div>
      )}

      {asset?.status === 'failed' && (
        <div className={`p-3 rounded-lg text-xs mb-3 ${dark ? 'bg-red-500/10 text-red-300' : 'bg-red-50 text-red-700'}`}>
          {asset.error || 'Generation failed'}
        </div>
      )}

      {asset?.status === 'completed' && videoUrl && (
        <div className="space-y-3 mb-3">
          <div className="rounded-lg overflow-hidden border border-amber-500/10">
            <video src={videoUrl} controls className="w-full max-h-48 object-contain bg-black/10">
              Your browser does not support the video tag.
            </video>
          </div>
          <Button size="sm" onClick={async () => {
            try {
              const res = await ads.downloadFinal(adId, asset.id);
              if (res.url) window.open(res.url, '_blank');
            } catch (err) {}
          }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download
          </Button>
        </div>
      )}

      <div className="pt-3 border-t" style={{ borderColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }}>
        <Button className="w-full" size="sm" onClick={() => onGenerate(lang.id, prompt)}
          disabled={generating}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
          {asset?.status === 'completed' ? 'Regenerate' : 'Generate'}
        </Button>
      </div>
    </div>
  );
}

export default function ManagerAdDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dark } = useTheme();
  const { ad, loading, error: fetchError, refetch } = useAd(id);

  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [generatingLangs, setGeneratingLangs] = useState(new Set());
  const [languageAssets, setLanguageAssets] = useState([]);
  const [devApps, setDevApps] = useState([]);
  const [pushedApps, setPushedApps] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [pushing, setPushing] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (ad?.id) {
      ads.languageAssetsList(id).then(setLanguageAssets).catch(() => {});
      developerApps.list().then(setDevApps).catch(() => {});
      ads.pushedApps(id).then(setPushedApps).catch(() => {});
    }
  }, [ad?.id, id]);

  const getAssetForLang = (langId) =>
    languageAssets.find(a => a.language === langId);

  const isAnyGenerating = () =>
    languageAssets.some(a => a.status === 'generating');

  useEffect(() => {
    if (isAnyGenerating()) {
      pollRef.current = setInterval(async () => {
        try {
          const updated = await ads.languageAssetsList(id);
          setLanguageAssets(updated);
          if (!updated.some(a => a.status === 'generating')) {
            clearInterval(pollRef.current);
            pollRef.current = null;
            await refetch();
          }
        } catch { /* ignore */ }
      }, 3000);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }
  }, [id, ad?.id]);

  const handleGenerate = async (languageId, prompt) => {
    setError('');
    try {
      await ads.generateLanguageVideo(id, languageId, prompt);
      setGeneratingLangs(prev => new Set(prev).add(languageId));
      const assets = await ads.languageAssetsList(id);
      setLanguageAssets(assets);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePushToApp = async () => {
    if (!selectedAppId) return;
    setPushing(true);
    try {
      await ads.pushToApp(id, parseInt(selectedAppId));
      const updated = await ads.pushedApps(id);
      setPushedApps(updated);
      setToast({ show: true, message: 'Ad pushed to developer app successfully!', type: 'success' });
    } catch (e) {
      setError(e.message || 'Failed to push ad to app');
    } finally {
      setPushing(false);
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
          <Button variant="ghost" className="mt-4" onClick={() => navigate('/manager/dashboard')}>Back to Dashboard</Button>
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
          onClick={() => navigate('/manager/dashboard')}
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
          <div className={`flex flex-col sm:items-end gap-1 text-sm transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>
            <span className="font-medium">{ad.client_name} ({ad.client_mobile})</span>
            <span className="text-xs">Created {formatDate(ad.created_at)}</span>
          </div>
        </div>

        <ErrorAlert message={error} onDismiss={() => setError('')} />

        {/* Info Cards */}
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
              <p className={`text-sm ${c(dark ? 'dark' : 'light').textMuted}`}>No languages selected</p>
            )}
          </SectionCard>

          <SectionCard title="Schedule">
            {ad.scheduled_start || ad.scheduled_end ? (
              <div className="space-y-1 text-xs">
                {ad.scheduled_start && <p className={dark ? 'text-neutral-400' : 'text-stone-500'}>Start: {formatDate(ad.scheduled_start)}</p>}
                {ad.scheduled_end && <p className={dark ? 'text-neutral-400' : 'text-stone-500'}>End: {formatDate(ad.scheduled_end)}</p>}
              </div>
            ) : (
              <p className={`text-sm ${c(dark ? 'dark' : 'light').textMuted}`}>No schedule set</p>
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

        {/* Per-Language Video Generation */}
        {ad.status === 'approved' && ad.languages?.length > 0 && (
          <div className="mb-8 animate-fade-in-up animate-delay-300">
            <SectionCard title="Video Generation by Language">
              <p className={`text-xs mb-4 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>
                Prompt is optional. Leave empty to use ad content, or write a custom prompt to improve the video.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ad.languages.map((lang) => (
                  <LanguageVideoCard
                    key={lang.id}
                    lang={lang}
                    asset={getAssetForLang(lang.id)}
                    adId={id}
                    dark={dark}
                    onGenerate={handleGenerate}
                    generating={generatingLangs.has(lang.id)}
                  />
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {/* Push to Developer App */}
        {ad.status === 'approved' && devApps.length > 0 && (
          <div className="mb-8 animate-fade-in-up animate-delay-350">
            <SectionCard title="Push to Developer App">
              <p className={`text-xs mb-3 ${c(dark ? 'dark' : 'light').textMuted}`}>
                Push this approved ad to registered developer apps. Developers will see it via the public API.
              </p>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className={`block text-xs font-medium mb-1 ${c(dark ? 'dark' : 'light').textMuted}`}>Select App</label>
                  <select value={selectedAppId} onChange={e => setSelectedAppId(e.target.value)}
                    className={`w-full rounded-lg px-3 py-2 text-sm border transition-colors duration-500 ${
                      dark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}>
                    <option value="">-- Choose an app --</option>
                    {devApps.filter(a => a.is_active).map(app => (
                      <option key={app.id} value={app.id}>
                        {app.app_name} ({app.app_type}){app.app_url ? ` - ${app.app_url}` : ''}
                      </option>
                    ))}
                  </select>
                  {(() => {
                    const sel = selectedAppId ? devApps.find(a => a.id === Number(selectedAppId)) : null;
                    return sel?.app_url ? (
                      <p className={`text-[10px] mt-1 truncate ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
                        URL: {sel.app_url}
                      </p>
                    ) : null;
                  })()}
                </div>
                <Button onClick={handlePushToApp} loading={pushing} disabled={!selectedAppId} size="sm">
                  Push
                </Button>
              </div>
              {pushedApps.length > 0 && (
                <div className="mt-3">
                  <p className={`text-xs font-medium mb-1 ${c(dark ? 'dark' : 'light').textMuted}`}>Already pushed to:</p>
                  <div className="flex flex-wrap gap-2">
                    {pushedApps.map(pa => (
                      <span key={pa.push_id} className={`text-xs px-2 py-1 rounded-full ${
                        dark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {pa.app_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {/* Review Action */}
        <div className={`rounded-2xl p-6 space-y-5 transition-all duration-500 animate-fade-in-up animate-delay-400 ${
          dark ? 'bg-gradient-to-br from-neutral-900/80 to-neutral-900/40 border border-amber-500/10' : 'bg-white border border-stone-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-amber-500 to-amber-400" />
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
              <Button onClick={handleApprove} loading={actionLoading}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Approve
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
