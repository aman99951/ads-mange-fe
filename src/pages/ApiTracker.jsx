import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../config/theme';
import AppLayout from '../components/layout/AppLayout';
import { apiTracker } from '../services/api';

const c = (k) => colors[k];

const CATEGORY_CONFIG = {
  billed_success: { label: 'Billed — Delivered', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/20 dark:border-emerald-500/30', dot: 'bg-emerald-500' },
  billed_failed: { label: 'Billed — Failed', color: 'bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/20 dark:border-red-500/30', dot: 'bg-red-500' },
  free_transient: { label: 'Free — Transient', color: 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/20 dark:border-sky-500/30', dot: 'bg-sky-500' },
  free_polling: { label: 'Free — Polling', color: 'bg-neutral-500/15 text-neutral-600 dark:text-neutral-300 border-neutral-500/20 dark:border-neutral-500/30', dot: 'bg-neutral-500' },
};

function ModelBadge({ modelId }) {
  const parts = modelId.split(':');
  const prefix = parts[0] || '';
  const model = parts.slice(1).join(':') || modelId;
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider ${
        prefix.includes('billed_fail') ? 'bg-red-500/15 text-red-600 dark:text-red-300' :
        prefix.includes('output') ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' :
        prefix.includes('gen') ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300' :
        prefix.includes('poll') ? 'bg-neutral-500/15 text-neutral-600 dark:text-neutral-300' :
        'bg-neutral-500/15 text-neutral-600 dark:text-neutral-300'
      }`}>{prefix}</span>
      <span className="text-[12px] font-mono truncate max-w-[220px] text-neutral-700 dark:text-neutral-200">{model}</span>
    </span>
  );
}

function StatusDot({ category }) {
  const cfg = CATEGORY_CONFIG[category];
  return <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg?.dot || 'bg-neutral-500'}`} />;
}

export default function ApiTracker() {
  const { dark } = useTheme();
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, page_size: 10, total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchLogs = useCallback(async (pageNum, pageSize) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (search.trim()) params.set('model', search.trim());
      params.set('page', String(pageNum));
      params.set('page_size', String(pageSize));
      const data = await apiTracker.getLogs(params.toString());
      setLogs(data.logs || []);
      setSummary(data.summary);
      setPagination(data.pagination || { page: 1, page_size: 10, total: 0, total_pages: 1 });
    } catch (err) {
      console.error('Failed to fetch API logs:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to page 1 when filter or search changes
  useEffect(() => { setPage(1); }, [filter, search]);

  useEffect(() => { fetchLogs(page, pageSize); }, [fetchLogs, page, pageSize]);

  const goToPage = (p) => {
    if (p >= 1 && p <= pagination.total_pages) setPage(p);
  };

  const changePageSize = (size) => {
    setPageSize(size);
    setPage(1);
  };

  // Build page number list (show max 7 pages with ellipsis)
  const getPageNumbers = () => {
    const { total_pages: tp, page: cp } = pagination;
    if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1);
    const pages = [];
    if (cp <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(tp);
    } else if (cp >= tp - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = tp - 4; i <= tp; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = cp - 1; i <= cp + 1; i++) pages.push(i);
      pages.push('...');
      pages.push(tp);
    }
    return pages;
  };

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filters = [
    { key: 'all', label: 'All', color: 'bg-neutral-500' },
    { key: 'billed_success', label: 'Billed Success', color: 'bg-emerald-500' },
    { key: 'billed_failed', label: 'Billed Failed', color: 'bg-red-500' },
    { key: 'free', label: 'Free', color: 'bg-blue-500' },
  ];

  return (
    <AppLayout fullWidth>
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full bg-gradient-to-b from-amber-500 to-amber-400" />
            <div>
              <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${c(dark ? 'dark' : 'light').text}`}>API Usage Tracker</h1>
              <p className={`text-sm mt-0.5 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>
                Every API request — what it cost and whether it delivered
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 animate-fade-in-up animate-delay-50">
            <div className={`rounded-2xl p-4 border transition-all duration-300 ${
              dark ? 'bg-neutral-900/70 border-neutral-800' : 'bg-white/90 border-stone-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-neutral-500" />
                <span className={`text-[10px] font-medium uppercase tracking-wider ${c(dark ? 'dark' : 'light').textMuted}`}>Total</span>
              </div>
              <p className={`text-2xl font-bold ${c(dark ? 'dark' : 'light').text}`}>{summary.total}</p>
            </div>
            <div className={`rounded-2xl p-4 border transition-all duration-300 ${
              dark ? 'bg-neutral-900/70 border-neutral-800' : 'bg-white/90 border-stone-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className={`text-[10px] font-medium uppercase tracking-wider ${c(dark ? 'dark' : 'light').textMuted}`}>Billed + Delivered</span>
              </div>
              <p className={`text-2xl font-bold text-emerald-500`}>{summary.billed_success}</p>
            </div>
            <div className={`rounded-2xl p-4 border transition-all duration-300 ${
              dark ? 'bg-neutral-900/70 border-neutral-800' : 'bg-white/90 border-stone-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className={`text-[10px] font-medium uppercase tracking-wider ${c(dark ? 'dark' : 'light').textMuted}`}>Billed + Failed</span>
              </div>
              <p className={`text-2xl font-bold text-red-400`}>{summary.billed_failed}</p>
            </div>
            <div className={`rounded-2xl p-4 border transition-all duration-300 ${
              dark ? 'bg-neutral-900/70 border-neutral-800' : 'bg-white/90 border-stone-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className={`text-[10px] font-medium uppercase tracking-wider ${c(dark ? 'dark' : 'light').textMuted}`}>Free Requests</span>
              </div>
              <p className={`text-2xl font-bold text-blue-400`}>{summary.free_transient + summary.free_polling}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 animate-fade-in-up animate-delay-100`}>
          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 border ${
                  filter === f.key
                    ? (dark ? 'bg-amber-500/15 text-amber-300 border-amber-500/25' : 'bg-amber-50 text-amber-700 border-amber-200')
                    : (dark ? 'bg-neutral-900/70 text-neutral-400 border-neutral-800 hover:border-neutral-700' : 'bg-white/70 text-stone-500 border-stone-200 hover:border-stone-300')
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${f.color}`} />
                  {f.label}
                </span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs w-full sm:ml-auto">
            <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${dark ? 'text-neutral-500' : 'text-stone-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-9 pr-3 py-1.5 rounded-lg text-xs outline-none border transition-all duration-200 ${
                dark
                  ? 'bg-neutral-900/70 border-neutral-800 text-neutral-200 placeholder-neutral-600 focus:border-amber-500/30'
                  : 'bg-white/70 border-stone-200 text-neutral-900 placeholder-stone-400 focus:border-amber-300'
              }`}
            />
          </div>
        </div>

        {/* Table */}
        <div className={`rounded-2xl border overflow-hidden animate-fade-in-up animate-delay-150 ${
          dark ? 'bg-neutral-900/70 border-neutral-800' : 'bg-white/90 border-stone-200 shadow-sm'
        }`}>
          {/* Table Header */}
          <div className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3.5 border-b text-[11px] font-semibold uppercase tracking-wider ${
            dark ? 'text-neutral-400 border-neutral-800' : 'text-stone-400 border-stone-200'
          }`}>
            <span>Request</span>
            <span>Credits</span>
            <span>Status</span>
            <span>Time</span>
          </div>

          {/* Loading */}
          {loading && (
            <div className="p-8 text-center">
              <div className={`inline-block w-5 h-5 border-2 rounded-full animate-spin ${
                dark ? 'border-neutral-700 border-t-amber-500' : 'border-stone-300 border-t-amber-600'
              }`} />
            </div>
          )}

          {/* Empty */}
          {!loading && logs.length === 0 && (
            <div className={`p-8 text-center text-xs ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
              No API requests found matching your filters.
            </div>
          )}

          {/* Rows */}
          {!loading && logs.map((log, i) => {
            const cat = log.category || 'free_polling';
            const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.free_polling;
            return (
              <div
                key={log.id}
                className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3.5 text-sm border-b transition-colors duration-150 ${
                  dark ? 'border-neutral-800/50 hover:bg-neutral-800/30' : 'border-stone-100 hover:bg-stone-50'
                } ${cat === 'billed_failed' ? (dark ? 'bg-red-500/5' : 'bg-red-50/30') : ''}`}
                style={{ animationDelay: `${150 + i * 30}ms` }}
              >
                {/* Model */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <StatusDot category={cat} />
                  <div className="min-w-0">
                    <ModelBadge modelId={log.model_id} />
                    {log.credit_cost != null && log.credit_cost > 0 && (
                      <span className="block text-[10px] mt-0.5 font-mono text-amber-600 dark:text-amber-400">
                        {log.credit_cost} credit{log.credit_cost !== 1 ? 's' : ''} consumed
                      </span>
                    )}
                    {log.credit_cost != null && log.credit_cost === 0 && (
                      <span className="flex items-center gap-1 mt-0.5">
                        <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">No charge</span>
                      </span>
                    )}
                    {cat === 'billed_failed' && (
                      <span className="block text-[11px] mt-0.5 text-red-400">⚠ Charged but no output</span>
                    )}
                  </div>
                </div>

                {/* Credits */}
                <div className="flex items-center">
                  {log.credit_cost != null && log.credit_cost > 0 ? (
                    <span className={`px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap font-mono ${
                      dark ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {log.credit_cost} cr
                    </span>
                  ) : log.credit_cost === 0 ? (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium whitespace-nowrap ${
                      dark ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Free
                    </span>
                  ) : (
                    <span className={`px-2.5 py-1 rounded text-[11px] font-mono ${
                      dark ? 'text-neutral-600' : 'text-stone-400'
                    }`}>—</span>
                  )}
                </div>

                {/* Status badge */}
                <div className="flex items-center">
                  <span className={`px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap border ${cfg?.color || ''}`}>
                    {cfg?.label || cat}
                  </span>
                </div>

                {/* Time */}
                <div className={`flex items-center text-[12px] font-mono whitespace-nowrap ${dark ? 'text-neutral-400' : 'text-stone-400'}`}>
                  {new Date(log.created_at).toLocaleString(undefined, {
                    month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {!loading && pagination.total > 0 && (
          <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 animate-fade-in-up animate-delay-200 ${
            dark ? 'text-neutral-400' : 'text-stone-500'
          }`}>
            {/* Page size selector */}
            <div className="flex items-center gap-2 text-xs">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => changePageSize(Number(e.target.value))}
                className={`px-2 py-1 rounded-lg text-xs font-medium outline-none border transition-all duration-200 cursor-pointer ${
                  dark
                    ? 'bg-neutral-900/70 border-neutral-800 text-neutral-200 hover:border-amber-500/30'
                    : 'bg-white/70 border-stone-200 text-neutral-800 hover:border-amber-300'
                }`}
              >
                {[10, 25, 50, 100].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span className={`text-[11px] ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
                {pagination.total} total
              </span>
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(1)}
                disabled={pagination.page <= 1}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all duration-150 border ${
                  pagination.page <= 1
                    ? (dark ? 'text-neutral-700 border-neutral-800/50 cursor-not-allowed' : 'text-stone-300 border-stone-200 cursor-not-allowed')
                    : (dark ? 'text-neutral-400 border-neutral-800 hover:border-amber-500/30 hover:text-amber-300' : 'text-stone-500 border-stone-200 hover:border-amber-300 hover:text-amber-700')
                }`}
              >
                ‹‹
              </button>
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all duration-150 border ${
                  pagination.page <= 1
                    ? (dark ? 'text-neutral-700 border-neutral-800/50 cursor-not-allowed' : 'text-stone-300 border-stone-200 cursor-not-allowed')
                    : (dark ? 'text-neutral-400 border-neutral-800 hover:border-amber-500/30 hover:text-amber-300' : 'text-stone-500 border-stone-200 hover:border-amber-300 hover:text-amber-700')
                }`}
              >
                ‹
              </button>

              {getPageNumbers().map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className={`px-1 text-[11px] ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`w-8 h-8 rounded-lg text-[11px] font-semibold transition-all duration-150 border ${
                      p === pagination.page
                        ? (dark ? 'bg-amber-500/15 text-amber-300 border-amber-500/25' : 'bg-amber-50 text-amber-700 border-amber-200')
                        : (dark ? 'text-neutral-400 border-neutral-800 hover:border-amber-500/30 hover:text-amber-300' : 'text-stone-500 border-stone-200 hover:border-amber-300 hover:text-amber-700')
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.total_pages}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all duration-150 border ${
                  pagination.page >= pagination.total_pages
                    ? (dark ? 'text-neutral-700 border-neutral-800/50 cursor-not-allowed' : 'text-stone-300 border-stone-200 cursor-not-allowed')
                    : (dark ? 'text-neutral-400 border-neutral-800 hover:border-amber-500/30 hover:text-amber-300' : 'text-stone-500 border-stone-200 hover:border-amber-300 hover:text-amber-700')
                }`}
              >
                ›
              </button>
              <button
                onClick={() => goToPage(pagination.total_pages)}
                disabled={pagination.page >= pagination.total_pages}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all duration-150 border ${
                  pagination.page >= pagination.total_pages
                    ? (dark ? 'text-neutral-700 border-neutral-800/50 cursor-not-allowed' : 'text-stone-300 border-stone-200 cursor-not-allowed')
                    : (dark ? 'text-neutral-400 border-neutral-800 hover:border-amber-500/30 hover:text-amber-300' : 'text-stone-500 border-stone-200 hover:border-amber-300 hover:text-amber-700')
                }`}
              >
                ››
              </button>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className={`mt-4 p-4 rounded-2xl border text-xs ${
          dark ? 'bg-neutral-900/40 border-neutral-800/50 text-neutral-400' : 'bg-stone-50/60 border-stone-200 text-stone-400'
        }`}>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <span key={key} className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            ))}
          </div>
          <p className="mt-2">
            <strong>Note:</strong> "Billed" means Google accepted the request (HTTP 200) – you paid.
            "Free" means the request was rejected before processing – no charge.
            Polling requests are GET status checks and are always free.
          </p>
          <p className="mt-1.5 text-emerald-600 dark:text-emerald-400">
            <strong>✓</strong> Entries marked with a green "Free" badge and "No charge" are delivery confirmations —
            no additional credits were deducted for that request.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
