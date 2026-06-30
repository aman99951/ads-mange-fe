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
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const fileInputRef = useRef(null);

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setError('');
    setUploadSuccess('');
    try {
      await ads.uploadAsset(id, { file: uploadFile });
      setUploadSuccess('Asset uploaded successfully!');
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await refetch();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
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
          <Button variant="ghost" className="mt-4" onClick={() => navigate('/manager/campaigns')}>Back to Campaigns</Button>
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
          onClick={() => navigate('/manager/campaigns')}
          className={`inline-flex items-center gap-1.5 text-xs font-medium mb-6 transition-all duration-300 group animate-fade-in-up ${
            dark ? 'text-neutral-500 hover:text-amber-400' : 'text-amber-700 hover:text-amber-800'
          }`}
        >
          <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>                Back to Campaigns
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

          <SectionCard title="Content Format">
            {ad.content_type ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide ${
                    ad.content_type === 'video'
                      ? dark ? 'bg-purple-500/15 text-purple-300' : 'bg-purple-100 text-purple-700'
                      : dark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {ad.content_type === 'video' ? '🎬 Video' : '🖼️ Image'}
                  </span>
                </div>
                {ad.content_size && (
                  <p className={`text-xs ${dark ? 'text-neutral-400' : 'text-stone-500'}`}>
                    Size: {ad.content_size}
                  </p>
                )}
              </div>
            ) : (
              <p className={`text-sm ${c(dark ? 'dark' : 'light').textMuted}`}>Not specified</p>
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

        {/* Generate in Studio */}
        {ad.status === 'approved' && (
          <div className="mb-8 animate-fade-in-up animate-delay-300">
            <div className={`rounded-2xl p-6 border transition-all duration-300 ${
              dark ? 'bg-gradient-to-br from-neutral-900/80 to-neutral-900/40 border-purple-500/10' : 'bg-white border-stone-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-8 rounded-full bg-gradient-to-b from-purple-500 to-pink-500" />
                <div>
                  <h3 className={`text-sm font-bold ${c(dark ? 'dark' : 'light').text}`}>Generate Video in Creative Studio</h3>
                  <p className={`text-[10px] mt-0.5 ${c(dark ? 'dark' : 'light').textMuted}`}>
                    Use AI to create professional images & videos with full control over dimensions, style, and effects
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/manager/create-creative', { state: { prompt: ad.description || ad.text_content || '', languages: ad.languages || [], mediaType: ad.content_type || 'video', dimensions: ad.content_size || '' } })}
                className="w-full !py-3.5 !text-sm !font-bold !rounded-2xl"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
                Open Creative Studio
              </Button>
            </div>
          </div>
        )}

        {/* Upload External Asset */}
        {ad.status === 'approved' && (
          <div className="mb-8 animate-fade-in-up animate-delay-350">
            <div className={`rounded-2xl p-6 border transition-all duration-300 ${
              dark ? 'bg-gradient-to-br from-neutral-900/80 to-neutral-900/40 border-emerald-500/10' : 'bg-white border-stone-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-8 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500" />
                <div>
                  <h3 className={`text-sm font-bold ${c(dark ? 'dark' : 'light').text}`}>Upload External Asset</h3>
                  <p className={`text-[10px] mt-0.5 ${c(dark ? 'dark' : 'light').textMuted}`}>
                    Upload a video or image created externally (e.g., Canva, Photoshop)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setUploadFile(e.target.files[0] || null)}
                  className={`flex-1 text-sm file:mr-3 file:py-2 file:px-4 file:rounded-xl file:text-xs file:font-semibold file:border-0 ${
                    dark
                      ? 'text-neutral-300 file:bg-emerald-500/10 file:text-emerald-300'
                      : 'text-neutral-700 file:bg-emerald-50 file:text-emerald-700'
                  }`}
                />
                <Button onClick={handleUpload} loading={uploading} disabled={!uploadFile || uploading} size="sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Upload
                </Button>
              </div>
              {uploadSuccess && (
                <p className={`text-xs mt-3 font-medium ${dark ? 'text-emerald-400' : 'text-emerald-600'}`}>{uploadSuccess}</p>
              )}
            </div>
          </div>
        )}

        {/* Final Asset Preview */}
        {(ad.final_asset || ad.language_assets?.some(a => a.status === 'completed' && a.asset)) && (
          <div className="mb-8 animate-fade-in-up animate-delay-350">
            <SectionCard title="Uploaded Assets">
              {ad.final_asset && (
                <div className="mb-4">
                  <p className={`text-xs font-semibold mb-2 ${dark ? 'text-emerald-400' : 'text-emerald-700'}`}>Final Asset</p>
                  {isImageFile(ad.final_asset) ? (
                    <div className="rounded-xl overflow-hidden border border-amber-500/10">
                      <img src={ad.final_asset} alt="Final asset" className="max-h-80 w-full object-contain bg-black/10" />
                    </div>
                  ) : (
                    <div className="rounded-xl overflow-hidden border border-amber-500/10 max-w-2xl">
                      <video src={ad.final_asset} controls className="w-full max-h-96 object-contain bg-black/10">
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}
                </div>
              )}
              {ad.language_assets?.filter(a => a.status === 'completed' && a.asset).length > 0 && (
                <div>
                  <p className={`text-xs font-semibold mb-2 ${dark ? 'text-emerald-400' : 'text-emerald-700'}`}>Language Assets</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ad.language_assets.filter(a => a.status === 'completed' && a.asset).map((asset) => (
                      <div key={asset.id} className={`rounded-xl p-4 border transition-all duration-300 ${
                        dark ? 'bg-neutral-800/40 border-neutral-700/50' : 'bg-stone-50 border-stone-200'
                      }`}>
                        <h4 className={`text-sm font-bold mb-2 ${dark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                          {asset.language_name || asset.language}
                        </h4>
                        {isImageFile(asset.asset) ? (
                          <div className="rounded-lg overflow-hidden border border-amber-500/10">
                            <img src={asset.asset} alt={`${asset.language_name} asset`} className="max-h-48 w-full object-contain bg-black/10" />
                          </div>
                        ) : (
                          <div className="rounded-lg overflow-hidden border border-amber-500/10">
                            <video src={asset.asset} controls className="w-full max-h-48 object-contain bg-black/10">
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        )}
                      </div>
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
