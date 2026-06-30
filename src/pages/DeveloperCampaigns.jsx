import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../config/theme';
import { developerAds, developerApps, ads } from '../services/api';
import AppLayout from '../components/layout/AppLayout';
import { SectionCard } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { formatDate } from '../utils/helpers';
import { API_BASE } from '../constants';

const c = (k) => colors[k];

export default function DeveloperCampaigns({ user }) {
  const { dark } = useTheme();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAd, setSelectedAd] = useState(null);
  const [adDetail, setAdDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [apps, setApps] = useState([]);
  const [selectedAppIds, setSelectedAppIds] = useState([]);
  const [pushingAdId, setPushingAdId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await developerAds.list();
        setCampaigns(data);
      } catch {} finally {
        setLoading(false);
      }
    })();
    developerApps.list().then(setApps).catch(() => {});
  }, []);

  const viewDetails = async (id) => {
    setSelectedAd(id);
    setDetailLoading(true);
    setAdDetail(null);
    setSelectedAppIds([]);
    try {
      const data = await developerAds.getDetails(id);
      setAdDetail(data);
    } catch {} finally {
      setDetailLoading(false);
    }
  };

  const handlePush = async (adId) => {
    if (selectedAppIds.length === 0) return;
    setPushingAdId(adId);
    try {
      await ads.pushToApps(adId, { app_ids: selectedAppIds });
      const data = await developerAds.getDetails(adId);
      setAdDetail(data);
      setCampaigns(prev => prev.map(c => c.id === adId ? { ...c, pushed_apps: data.pushed_apps } : c));
      setSelectedAppIds([]);
    } catch {} finally {
      setPushingAdId(null);
    }
  };

  const toggleApp = (appId) => {
    setSelectedAppIds(prev =>
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  const filtered = campaigns.filter(c =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout fullWidth>
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full bg-gradient-to-b from-amber-500 to-amber-400" />
            <div>
              <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${c(dark ? 'dark' : 'light').text}`}>Approved Campaigns</h1>
              <p className={`text-sm mt-0.5 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>
                Browse and push approved campaigns to your apps
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('/developer/dashboard')}>
              Dashboard
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 animate-fade-in-up animate-delay-50">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search campaigns by title or client..."
            className={`w-full max-w-md rounded-xl px-4 py-2.5 text-sm border transition-all duration-300 ${
              dark
                ? 'bg-neutral-900/60 border-neutral-700/50 text-white placeholder-neutral-500 focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/20'
                : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-amber-300 focus:ring-1 focus:ring-amber-200'
            }`}
          />
        </div>

        {/* Campaigns List */}
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
            <p className="text-sm font-medium">No campaigns found</p>
            <p className="text-xs mt-1">{search ? 'Try a different search' : 'No approved campaigns available yet'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ad, i) => (
              <div key={ad.id} className="animate-fade-in-up" style={{ animationDelay: `${100 + i * 60}ms` }}>
                <div className={`rounded-2xl p-4 sm:p-5 transition-all duration-300 cursor-pointer hover-lift ${
                  dark
                    ? 'bg-neutral-900/70 backdrop-blur-sm border border-neutral-800 hover:border-amber-500/25 hover:shadow-[0_0_30px_rgba(217,160,50,0.06)]'
                    : 'bg-white/90 backdrop-blur-sm border border-stone-200 hover:border-amber-300/50 shadow-sm hover:shadow-md'
                } ${selectedAd === ad.id ? (dark ? 'border-amber-500/30' : 'border-amber-400') : ''}`}
                  onClick={() => viewDetails(ad.id)}
                >
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
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                          {formatDate(ad.created_at)}
                        </span>
                      </div>
                      {ad.pushed_apps?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {ad.pushed_apps.map((pa, i) => (
                            <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                              dark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              {pa.app_name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedAd && adDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-up"
            onClick={() => { setSelectedAd(null); setAdDetail(null); }}>
            <div className={`relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-6 sm:p-8 transition-all duration-500 ${
              dark ? 'bg-neutral-900 border border-amber-500/15' : 'bg-white border border-stone-200 shadow-xl'
            }`} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { setSelectedAd(null); setAdDetail(null); }}
                className={`absolute top-4 right-4 p-2 rounded-xl transition-all duration-300 ${
                  dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-stone-100 text-stone-500'
                }`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h2 className={`text-xl font-bold mb-4 ${dark ? 'text-neutral-100' : 'text-neutral-900'}`}>{adDetail.title}</h2>

              {adDetail.description && (
                <p className={`text-sm mb-4 ${dark ? 'text-neutral-400' : 'text-stone-500'}`}>{adDetail.description}</p>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className={`text-xs font-semibold uppercase tracking-widest mb-2 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Client</h3>
                  <p className={`text-sm ${dark ? 'text-neutral-200' : 'text-neutral-800'}`}>{adDetail.client_name}</p>
                </div>

                <div>
                  <h3 className={`text-xs font-semibold uppercase tracking-widest mb-2 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Target Areas</h3>
                  <div className="flex flex-wrap gap-1">
                    {adDetail.target_areas?.map((ta) => (
                      <span key={ta.id} className={`px-2 py-0.5 rounded text-[10px] font-medium ${dark ? 'bg-neutral-800 text-neutral-400' : 'bg-stone-100 text-stone-600'}`}>
                        {ta.locality || ta.city}, {ta.state}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className={`text-xs font-semibold uppercase tracking-widest mb-2 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Target Audience</h3>
                  <div className="flex flex-wrap gap-1">
                    {adDetail.target_audiences?.map((ta) => (
                      <span key={ta.id} className={`px-2 py-0.5 rounded text-[10px] font-medium ${dark ? 'bg-neutral-800 text-neutral-400' : 'bg-stone-100 text-stone-600'}`}>
                        {ta.profile} ({ta.age_min}-{ta.age_max})
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className={`text-xs font-semibold uppercase tracking-widest mb-2 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Languages</h3>
                  <div className="flex flex-wrap gap-1">
                    {adDetail.languages?.map((lang) => (
                      <span key={lang.id} className={`px-2 py-0.5 rounded text-[10px] font-medium ${dark ? 'bg-neutral-800 text-neutral-400' : 'bg-stone-100 text-stone-600'}`}>
                        {lang.name}
                      </span>
                    ))}
                  </div>
                </div>

                {adDetail.final_asset && (
                  <div>
                    <h3 className={`text-xs font-semibold uppercase tracking-widest mb-2 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Ad Video</h3>
                    <div className={`rounded-xl overflow-hidden border ${dark ? 'border-neutral-700/50' : 'border-stone-200'} max-w-xl`}>
                      <video src={adDetail.final_asset} controls className="w-full max-h-72 object-contain bg-black/10">
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <a href={adDetail.final_asset} target="_blank" rel="noreferrer"
                      className={`inline-flex items-center gap-1 text-[10px] mt-2 ${dark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-500'}`}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Download
                    </a>
                  </div>
                )}

                {/* Push to Apps */}
                <div className={`rounded-xl border p-4 ${dark ? 'bg-neutral-800/30 border-neutral-700/50' : 'bg-stone-50 border-stone-200'}`}>
                  <h3 className={`text-xs font-semibold uppercase tracking-widest mb-3 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Push to Apps</h3>
                  {apps.length === 0 ? (
                    <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
                      No apps registered.{' '}
                      <button onClick={() => navigate('/developer/dashboard')} className="text-amber-500 hover:underline">Register one</button>
                    </p>
                  ) : (
                    <>
                      <div className="space-y-1.5 mb-3">
                        {apps.filter(a => a.is_active).map(app => {
                          const alreadyPushed = adDetail.pushed_apps?.some(pa => pa.push_id && pa.app_name === app.app_name);
                          return (
                            <label key={app.id}
                              className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                                alreadyPushed
                                  ? dark ? 'bg-emerald-500/5 text-neutral-500' : 'bg-emerald-50/50 text-stone-400'
                                  : dark ? 'hover:bg-neutral-700/50 text-neutral-200' : 'hover:bg-stone-100 text-stone-800'
                              }`}>
                              <input type="checkbox" checked={selectedAppIds.includes(app.id)}
                                onChange={() => toggleApp(app.id)}
                                disabled={alreadyPushed}
                                className="accent-amber-500" />
                              <span className="flex-1">{app.app_name}</span>
                              <span className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>{app.app_type}</span>
                              {alreadyPushed && (
                                <span className="text-[10px] text-emerald-500">Already pushed</span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                      <Button size="sm" onClick={() => handlePush(adDetail.id)}
                        loading={pushingAdId === adDetail.id}
                        disabled={selectedAppIds.length === 0}>
                        Push to {selectedAppIds.length > 0 ? `${selectedAppIds.length} app${selectedAppIds.length > 1 ? 's' : ''}` : 'Selected Apps'}
                      </Button>
                    </>
                  )}
                </div>

                {adDetail.pushed_apps?.length > 0 && (
                  <div>
                    <h3 className={`text-xs font-semibold uppercase tracking-widest mb-2 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Already Pushed To</h3>
                    <div className="space-y-2">
                      {adDetail.pushed_apps.map((pa) => (
                        <div key={pa.push_id} className={`p-3 rounded-xl border ${dark ? 'bg-neutral-800/40 border-neutral-700/50' : 'bg-stone-50 border-stone-200'}`}>
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`font-semibold ${dark ? 'text-neutral-200' : 'text-neutral-800'}`}>{pa.app_name}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${dark ? 'bg-neutral-700 text-neutral-400' : 'bg-stone-200 text-stone-500'}`}>{pa.app_type}</span>
                          </div>
                          {pa.app_url && (
                            <a href={pa.app_url} target="_blank" rel="noreferrer"
                              className={`text-[10px] mt-0.5 block truncate ${dark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-500'}`}>
                              {pa.app_url}
                            </a>
                          )}
                          <p className={`text-[10px] mt-0.5 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
                            Pushed: {formatDate(pa.pushed_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`text-xs pt-4 border-t ${dark ? 'border-neutral-700 text-neutral-500' : 'border-stone-200 text-stone-400'}`}>
                  Created {formatDate(adDetail.created_at)}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedAd && detailLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className={`p-6 rounded-2xl ${dark ? 'bg-neutral-900' : 'bg-white'}`}>
              <svg className="animate-spin h-8 w-8 text-amber-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
