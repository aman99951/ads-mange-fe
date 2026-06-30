import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { developerAds, developerApps } from '../services/api';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/layout/PageHeader';
import { SectionCard } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { formatDate } from '../utils/helpers';
import { colors } from '../config/theme';
import { API_BASE } from '../constants';

const c = (k) => colors[k];

export default function DeveloperDashboard({ user }) {
  const { dark } = useTheme();
  const apiKey = user?.api_key || 'N/A';

  // Approved ads
  const [adsList, setAdsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState(null);
  const [adDetail, setAdDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Developer apps CRUD
  const [apps, setApps] = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [showAppForm, setShowAppForm] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [appForm, setAppForm] = useState({ app_name: '', app_type: 'website', app_url: '' });
  const [savingApp, setSavingApp] = useState(false);

  // Developer apps CRUD

  useEffect(() => {
    developerAds.list().then(setAdsList).catch(() => {}).finally(() => setLoading(false));
    developerApps.list().then(setApps).catch(() => {}).finally(() => setAppsLoading(false));
  }, []);

  const refreshApps = () => {
    setAppsLoading(true);
    developerApps.list().then(setApps).catch(() => {}).finally(() => setAppsLoading(false));
  };

  const viewDetails = async (id) => {
    setSelectedAd(id);
    setDetailLoading(true);
    setAdDetail(null);
    try {
      const data = await developerAds.getDetails(id);
      setAdDetail(data);
    } catch {}
    setDetailLoading(false);
  };

  const handleAppSubmit = async () => {
    if (!appForm.app_name.trim()) return;
    setSavingApp(true);
    try {
      if (editingApp) {
        await developerApps.update(editingApp.id, appForm);
      } else {
        await developerApps.create(appForm);
      }
      setShowAppForm(false);
      setEditingApp(null);
      setAppForm({ app_name: '', app_type: 'website', app_url: '' });
      refreshApps();
    } catch (e) {
      alert(e.message || 'Failed to save app');
    } finally {
      setSavingApp(false);
    }
  };

  const handleEditApp = (app) => {
    setAppForm({ app_name: app.app_name, app_type: app.app_type, app_url: app.app_url || '' });
    setEditingApp(app);
    setShowAppForm(true);
  };

  const handleDeleteApp = async (id) => {
    if (!window.confirm('Delete this app?')) return;
    try {
      await developerApps.delete(id);
      refreshApps();
    } catch (e) {
      alert(e.message || 'Failed to delete app');
    }
  };

  return (
    <AppLayout fullWidth>
      <div className="max-w-[1400px] mx-auto">
        <PageHeader title="Developer Dashboard" description={`Welcome, ${user?.company_name || 'Developer'}`} />

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8 animate-fade-in-up animate-delay-100">
          <SectionCard title="Your API Key">
            <div className={`p-2 sm:p-3 rounded-xl text-[9px] sm:text-xs font-mono break-all border transition-all duration-300 overflow-x-auto ${
              dark ? 'bg-neutral-900 border-neutral-700 text-amber-400' : 'bg-stone-50 border-stone-200 text-amber-700'
            }`}>
              {apiKey}
            </div>
            <p className={`text-[10px] sm:text-xs mt-2 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
              Use as <code className="text-amber-500">X-API-Key</code> header or <code className="text-amber-500">?api_key=</code> param.
            </p>
          </SectionCard>

          <SectionCard title="Public API Endpoint">
            <div className="space-y-2 text-[10px] sm:text-xs">
              <p className={dark ? 'text-neutral-400' : 'text-stone-500'}>
                <span className="font-semibold text-amber-500">GET</span> Pushed approved ads:
              </p>
              <code className={`block p-2 rounded text-[9px] sm:text-[10px] overflow-x-auto ${
                dark ? 'bg-neutral-900 text-neutral-400' : 'bg-stone-100 text-stone-600'
              }`}>
                {API_BASE}/public/ads/
              </code>
              <p className={dark ? 'text-neutral-400' : 'text-stone-500'}>
                Auth via <code className="text-amber-500">X-API-Key</code> or <code className="text-amber-500">?api_key=</code>
              </p>
            </div>
          </SectionCard>

          <SectionCard title="API Usage Examples">
            <div className="space-y-3 text-[10px] sm:text-xs">
              <div>
                <p className={`font-semibold mb-1 ${dark ? 'text-neutral-300' : 'text-neutral-700'}`}>1. Get your token</p>
                <div className={`p-2 rounded text-[9px] sm:text-[10px] font-mono overflow-x-auto whitespace-nowrap ${
                  dark ? 'bg-neutral-900 text-neutral-400' : 'bg-stone-100 text-stone-600'
                }`}>
                  <div className="text-amber-500"># Login with your email &amp; password:</div>
                  <div>curl -X POST {API_BASE}/auth/developer-login/ \</div>
                  <div className="pl-4">-H "Content-Type: application/json" \</div>
                  <div className="pl-4">-d '&#123;"email":"your@email.com","password":"yourpass"&#125;'</div>
                  <div className="mt-1 text-amber-500"># &rarr; Returns: &#123;"access": "&lt;YOUR_JWT_TOKEN&gt;"&#125;</div>
                </div>
              </div>
              <div>
                <p className={`font-semibold mb-1 ${dark ? 'text-neutral-300' : 'text-neutral-700'}`}>2. Use the token in requests</p>
                <div className={`p-2 rounded text-[9px] sm:text-[10px] font-mono overflow-x-auto whitespace-nowrap ${
                  dark ? 'bg-neutral-900 text-neutral-400' : 'bg-stone-100 text-stone-600'
                }`}>
                  <div className="mb-1 text-amber-500"># List all approved campaigns:</div>
                  <div>curl {API_BASE}/developer/ads/ \</div>
                  <div className="pl-4">-H "Authorization: Bearer &lt;YOUR_JWT_TOKEN&gt;"</div>
                  <div className="mt-1 text-amber-500"># Get campaign details:</div>
                  <div>curl {API_BASE}/developer/ads/&lt;ID&gt;/details/ \</div>
                  <div className="pl-4">-H "Authorization: Bearer &lt;YOUR_JWT_TOKEN&gt;"</div>
                </div>
              </div>
              <div>
                <p className={`font-semibold mb-1 ${dark ? 'text-neutral-300' : 'text-neutral-700'}`}>3. JavaScript / Fetch</p>
                <div className={`p-2 rounded text-[9px] sm:text-[10px] font-mono overflow-x-auto whitespace-nowrap ${
                  dark ? 'bg-neutral-900 text-neutral-400' : 'bg-stone-100 text-stone-600'
                }`}>
                  <div className="text-amber-500">const res = await fetch('{API_BASE}/developer/ads/', {"{"}</div>
                  <div className="pl-4">headers: {"{"}'Authorization': 'Bearer &lt;token&gt;'{"}"}</div>
                  <div className="text-amber-500">{"}"});</div>
                  <div className="text-amber-500">const campaigns = await res.json();</div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Available Ads">
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl sm:text-4xl font-bold ${dark ? 'text-amber-400' : 'text-amber-600'}`}>
                {loading ? '...' : adsList.length}
              </span>
              <span className={`text-xs sm:text-sm ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>approved campaigns</span>
            </div>
          </SectionCard>
        </div>

        {/* Registered Apps */}
        <div className="mb-8 animate-fade-in-up animate-delay-150">
          <SectionCard title={
            <div className="flex items-center justify-between w-full">
              <span>Registered Apps</span>
              <Button size="sm" onClick={() => { setEditingApp(null); setAppForm({ app_name: '', app_type: 'website', app_url: '' }); setShowAppForm(true); }}>
                + New App
              </Button>
            </div>
          }>
            {showAppForm && (
              <div className={`mb-4 p-4 rounded-xl border ${dark ? 'bg-neutral-800/40 border-neutral-700' : 'bg-stone-50 border-stone-200'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <Input label="App Name" value={appForm.app_name}
                    onChange={(e) => setAppForm({ ...appForm, app_name: e.target.value })} />
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${dark ? 'text-neutral-400' : 'text-stone-500'}`}>Type</label>
                    <select value={appForm.app_type} onChange={(e) => setAppForm({ ...appForm, app_type: e.target.value })}
                      className={`w-full rounded-lg px-3 py-2 text-sm border ${dark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-stone-300 text-stone-900'}`}>
                      <option value="website">Website</option>
                      <option value="mobile">Mobile App</option>
                    </select>
                  </div>
                  <Input label="App URL (optional)" value={appForm.app_url}
                    onChange={(e) => setAppForm({ ...appForm, app_url: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setShowAppForm(false); setEditingApp(null); }}>Cancel</Button>
                  <Button size="sm" onClick={handleAppSubmit} loading={savingApp}>
                    {editingApp ? 'Update' : 'Create'}
                  </Button>
                </div>
              </div>
            )}
            {appsLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className={`h-12 rounded-xl animate-pulse ${dark ? 'bg-neutral-800' : 'bg-stone-100'}`} />
                ))}
              </div>
            ) : apps.length === 0 ? (
              <p className={`text-sm ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>No apps registered yet.</p>
            ) : (
              <div className="space-y-2">
                {apps.map((app) => (
                  <div key={app.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border ${
                    dark ? 'bg-neutral-800/30 border-neutral-700/50' : 'bg-stone-50 border-stone-200'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className={`text-sm font-semibold truncate ${dark ? 'text-neutral-200' : 'text-neutral-800'}`}>{app.app_name}</span>
                        <Badge status={app.is_active ? 'approved' : 'rejected'} label={app.is_active ? 'Active' : 'Inactive'} />
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${dark ? 'bg-neutral-700 text-neutral-400' : 'bg-stone-200 text-stone-500'}`}>{app.app_type}</span>
                      </div>
                      {app.app_url && (
                        <p className={`text-[10px] mt-0.5 truncate ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>{app.app_url}</p>
                      )}
                      <p className={`text-[9px] sm:text-[10px] font-mono mt-0.5 truncate ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>Key: {app.api_key}</p>
                    </div>
                    <div className="flex items-center gap-2 sm:ml-3 self-end sm:self-auto">
                      <button onClick={() => handleEditApp(app)}
                        className={`text-xs px-2.5 py-1.5 sm:px-2 sm:py-1 rounded-lg transition-colors ${dark ? 'text-neutral-400 hover:text-amber-400 hover:bg-neutral-700' : 'text-stone-500 hover:text-amber-600 hover:bg-stone-100'}`}>
                        Edit
                      </button>
                      <button onClick={() => handleDeleteApp(app.id)}
                        className="text-xs px-2.5 py-1.5 sm:px-2 sm:py-1 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Approved Ads */}
        <div className="animate-fade-in-up animate-delay-300">
          <SectionCard title="Approved Campaigns">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`h-16 rounded-xl animate-pulse ${dark ? 'bg-neutral-800' : 'bg-stone-100'}`} />
                ))}
              </div>
            ) : adsList.length === 0 ? (
              <p className={`text-sm ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>No approved campaigns available yet.</p>
            ) : (
              <div className="space-y-2">
                {adsList.map((ad) => (
                  <div key={ad.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      dark
                        ? 'bg-neutral-800/40 border border-neutral-700/50 hover:border-amber-500/20'
                        : 'bg-stone-50 border border-stone-200 hover:border-amber-300'
                    } ${selectedAd === ad.id ? (dark ? 'border-amber-500/30' : 'border-amber-400') : ''}`}
                    onClick={() => viewDetails(ad.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className={`text-sm font-semibold ${dark ? 'text-neutral-100' : 'text-neutral-900'}`}>{ad.title}</h3>
                      <p className={`text-[10px] mt-0.5 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
                        Client: {ad.client_name} &middot; {formatDate(ad.created_at)}
                      </p>
                      {ad.pushed_apps?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {ad.pushed_apps.map((pa, i) => (
                            <a key={i} href={pa.app_url} target="_blank" rel="noreferrer"
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                dark
                                  ? 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              {pa.app_name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="self-end sm:self-auto">
                      <Badge status={ad.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Ad Detail Modal */}
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
                {adDetail.language_assets?.length > 0 && (
                  <div>
                    <h3 className={`text-xs font-semibold uppercase tracking-widest mb-2 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Generated Videos</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {adDetail.language_assets.filter((a) => a.status === 'completed' && a.asset).map((asset) => (
                        <div key={asset.id} className={`p-3 rounded-xl border ${dark ? 'bg-neutral-800/40 border-neutral-700/50' : 'bg-stone-50 border-stone-200'}`}>
                          <p className={`text-xs font-semibold mb-1 ${dark ? 'text-neutral-300' : 'text-neutral-700'}`}>{asset.language_name}</p>
                          <a href={asset.asset} target="_blank" rel="noreferrer"
                            className="text-[10px] text-amber-500 hover:text-amber-400 underline">Download Video</a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {adDetail.pushed_apps?.length > 0 && (
                  <div>
                    <h3 className={`text-xs font-semibold uppercase tracking-widest mb-2 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Pushed To Apps</h3>
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
                            Company: {pa.company} &middot; Pushed: {formatDate(pa.pushed_at)}
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
