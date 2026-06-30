import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/layout/PageHeader';
import { SectionCard } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { colors } from '../config/theme';
import { API_BASE } from '../constants';

const c = (k) => colors[k];

export default function DeveloperPlayground() {
  const { dark } = useTheme();
  const [endpoint, setEndpoint] = useState('/developer/ads/');
  const [apiKey, setApiKey] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.api_key) setApiKey(u.api_key);
      }
    } catch {}
  }, []);

  const endpoints = [
    { value: '/developer/ads/', label: 'GET /developer/ads/' },
    { value: '/developer/apps/', label: 'GET /developer/apps/' },
    { value: '/public/ads/', label: 'GET /public/ads/ (public)' },
  ];

  const isPublic = endpoint === '/public/ads/';

  const run = async () => {
    setResult(null);
    setError(null);
    setLoading(true);
    try {
      const token = sessionStorage.getItem('access');
      const headers = {};
      let url = `${API_BASE}${endpoint}`;
      if (isPublic) {
        const key = apiKey.trim();
        if (key) {
          headers['X-API-Key'] = key;
        } else {
          url += '?api_key=';
        }
      } else {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(url, { headers });
      const body = res.ok ? await res.json() : await res.text();
      setResult({ status: res.status, body });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const [showExamples, setShowExamples] = useState(false);

  return (
    <AppLayout fullWidth>
      <div className="max-w-[1200px] mx-auto">
        <PageHeader title="API Playground" description="Test developer API endpoints live" />

        {/* Quick Start Examples */}
        <div className="mb-6 animate-fade-in-up animate-delay-50">
          <SectionCard title={
            <button onClick={() => setShowExamples(!showExamples)} className="flex items-center justify-between w-full text-left">
              <span>Quick Start Examples</span>
              <svg className={`w-4 h-4 transition-transform ${showExamples ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          }>
            {showExamples && (
              <div className="space-y-3 text-xs">
                <div>
                  <p className={`font-semibold mb-1 ${dark ? 'text-neutral-300' : 'text-neutral-700'}`}>1. Get your token</p>
                  <div className={`p-3 rounded-xl text-[10px] font-mono overflow-x-auto whitespace-nowrap ${
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
                  <div className={`p-3 rounded-xl text-[10px] font-mono overflow-x-auto whitespace-nowrap ${
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
                  <div className={`p-3 rounded-xl text-[10px] font-mono overflow-x-auto whitespace-nowrap ${
                    dark ? 'bg-neutral-900 text-neutral-400' : 'bg-stone-100 text-stone-600'
                  }`}>
                    <div className="text-amber-500">const res = await fetch('{API_BASE}/developer/ads/', {"{"}</div>
                    <div className="pl-4">headers: {"{"}'Authorization': 'Bearer &lt;token&gt;'{"}"}</div>
                    <div className="text-amber-500">{"}"});</div>
                    <div className="text-amber-500">const campaigns = await res.json();</div>
                  </div>
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="animate-fade-in-up animate-delay-100">
          <SectionCard title="Request">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="sm:col-span-2">
                <label className={`block text-xs font-medium mb-1 ${dark ? 'text-neutral-400' : 'text-stone-500'}`}>Endpoint</label>
                <select value={endpoint} onChange={e => setEndpoint(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 text-sm border ${dark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-stone-300 text-stone-900'}`}>
                  {endpoints.map(ep => (
                    <option key={ep.value} value={ep.value}>{ep.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${dark ? 'text-neutral-400' : 'text-stone-500'}`}>
                  {isPublic ? 'API Key' : '\u00A0'}
                </label>
                {isPublic ? (
                  <input type="text" value={apiKey} onChange={e => setApiKey(e.target.value)}
                    placeholder="Enter API key"
                    className={`w-full rounded-lg px-3 py-2 text-sm border ${dark ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500' : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400'}`} />
                ) : (
                  <Button size="sm" onClick={run} loading={loading} className="w-full">
                    Run
                  </Button>
                )}
              </div>
            </div>
            {isPublic && (
              <div className="flex justify-end mb-4">
                <Button size="sm" onClick={run} loading={loading}>
                  Run
                </Button>
              </div>
            )}

            <div className={`p-4 rounded-xl border text-xs font-mono ${dark ? 'bg-neutral-900 border-neutral-700' : 'bg-stone-50 border-stone-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`font-semibold ${dark ? 'text-amber-400' : 'text-amber-600'}`}>Request:</span>
                <span className={dark ? 'text-neutral-400' : 'text-stone-500'}>
                  GET {API_BASE}{endpoint}{isPublic && apiKey.trim() ? ` (X-API-Key: ${apiKey.trim().slice(0, 8)}...)` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${dark ? 'text-amber-400' : 'text-amber-600'}`}>Headers:</span>
                <span className={dark ? 'text-neutral-400' : 'text-stone-500'}>
                  {isPublic
                    ? (apiKey.trim() ? 'X-API-Key: <your-key>' : '?api_key= (no key)')
                    : 'Authorization: Bearer <token>'}
                </span>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="mt-6 animate-fade-in-up animate-delay-200">
          <SectionCard title="Response">
            {loading && (
              <div className="flex items-center gap-2 py-4">
                <svg className="animate-spin h-5 w-5 text-amber-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className={`text-sm ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Sending request...</span>
              </div>
            )}
            {error && (
              <div className="text-red-500 text-sm py-2">{error}</div>
            )}
            {result && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-semibold ${dark ? 'text-amber-400' : 'text-amber-600'}`}>Status:</span>
                  <span className={`text-sm font-bold ${result.status >= 400 ? 'text-red-500' : 'text-emerald-500'}`}>{result.status}</span>
                </div>
                <pre className={`p-4 rounded-xl border overflow-auto max-h-[60vh] text-[11px] leading-relaxed ${
                  dark ? 'bg-neutral-900 border-neutral-700 text-neutral-200' : 'bg-stone-50 border-stone-200 text-stone-800'
                }`}>
                  {typeof result.body === 'string' ? result.body : JSON.stringify(result.body, null, 2)}
                </pre>
              </>
            )}
            {!loading && !result && !error && (
              <p className={`text-sm py-4 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
                Select an endpoint and click <span className="text-amber-500 font-medium">Run</span> to see the response.
              </p>
            )}
          </SectionCard>
        </div>
      </div>
    </AppLayout>
  );
}
