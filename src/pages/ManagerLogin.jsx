import { useState } from 'react';
import { auth } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../config/theme';

const c = (k) => colors[k];

export default function ManagerLogin({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { dark } = useTheme();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { setError('Enter username and password'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await auth.managerLogin(username, password);
      sessionStorage.setItem('access', res.access);
      onLogin(res.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-700 ${c(dark ? 'dark' : 'light').page}`}>
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-48 -right-48 w-96 h-96 rounded-full blur-[120px] animate-float transition-colors duration-700 ${c(dark ? 'dark' : 'light').glow}`} />
        <div className={`absolute -bottom-48 -left-48 w-96 h-96 rounded-full blur-[120px] animate-float transition-colors duration-700 ${c(dark ? 'dark' : 'light').glowSubtle}`} style={{ animationDelay: '-2s' }} />
        <div className={`absolute top-1/2 left-1/4 w-64 h-64 rounded-full blur-[100px] transition-colors duration-700 ${c(dark ? 'dark' : 'light').glow}`} style={{ opacity: 0.4 }} />
      </div>

      <div className={`relative w-full max-w-md animate-fade-in-up`}>
        <div className={`rounded-2xl p-8 sm:p-10 transition-all duration-500 backdrop-blur-xl ${
          dark
            ? 'bg-neutral-900/80 border border-amber-500/15 shadow-[0_0_60px_rgba(217,160,50,0.06)]'
            : 'bg-white/90 border border-stone-200 shadow-xl shadow-stone-200/50'
        }`}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 transition-all duration-500 shadow-lg ${
              dark
                ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-black shadow-amber-500/20'
                : 'bg-gradient-to-br from-amber-500 to-amber-600 text-black shadow-amber-500/20'
            }`}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>Manager Login</h1>
            <p className={`text-sm mt-1.5 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>Sign in to review and manage campaigns</p>
          </div>

          {/* Error */}
          {error && (
            <div className={`mb-5 px-4 py-3 rounded-xl text-sm border flex items-center gap-2 animate-fade-in-up transition-all duration-300 ${
              dark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-widest mb-2 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>Username</label>
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors duration-500 ${c(dark ? 'dark' : 'light').textDim}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username" autoComplete="username"
                  className={`w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all duration-300 ${c(dark ? 'dark' : 'light').input} ${c(dark ? 'dark' : 'light').borderFocus}`}
                  required
                />
              </div>
            </div>
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-widest mb-2 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>Password</label>
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors duration-500 ${c(dark ? 'dark' : 'light').textDim}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password" autoComplete="current-password"
                  className={`w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all duration-300 ${c(dark ? 'dark' : 'light').input} ${c(dark ? 'dark' : 'light').borderFocus}`}
                  required
                />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className={`w-full py-3.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 shadow-lg ${
                dark ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black hover:shadow-amber-500/25 disabled:opacity-40' : 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:shadow-amber-500/25 disabled:opacity-40'
              }`}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  Sign In
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
