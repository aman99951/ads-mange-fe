import { useState } from 'react';
import { auth } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../config/theme';

const t = (k) => (dark) => colors[dark ? 'dark' : 'light'][k];

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
      localStorage.setItem('access', res.access);
      onLogin(res.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-700 ${t('page')(dark)}`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-48 -right-48 w-96 h-96 rounded-full blur-[120px] transition-colors duration-700 ${t('glow')(dark)}`} />
        <div className={`absolute -bottom-48 -left-48 w-96 h-96 rounded-full blur-[120px] transition-colors duration-700 ${t('glowSubtle')(dark)}`} />
      </div>

      <div className={`relative w-full max-w-md transition-all duration-500`}>
        <div className={`rounded-2xl p-8 transition-all duration-500 ${t('card')(dark)}`}>
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 transition-all duration-500 ${t('logo')(dark)}`}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h1 className={`text-2xl font-bold tracking-tight transition-colors duration-500 ${t('text')(dark)}`}>Manager Login</h1>
            <p className={`text-sm mt-1 transition-colors duration-500 ${t('textMuted')(dark)}`}>Sign in to manage campaigns</p>
          </div>

          {error && (
            <div className={`mb-5 px-4 py-3 rounded-lg text-sm border transition-all duration-300 ${
              dark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
            }`}>{error}</div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className={`block text-xs font-medium uppercase tracking-widest mb-2 transition-colors duration-500 ${t('textMuted')(dark)}`}>Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username" autoComplete="username"
                className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-300 ${t('input')(dark)} ${t('borderFocus')(dark)}`}
                required
              />
            </div>
            <div>
              <label className={`block text-xs font-medium uppercase tracking-widest mb-2 transition-colors duration-500 ${t('textMuted')(dark)}`}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password" autoComplete="current-password"
                className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-300 ${t('input')(dark)} ${t('borderFocus')(dark)}`}
                required
              />
            </div>
            <button type="submit" disabled={loading} className={`w-full py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 ${t('btnPrimary')(dark)}`}>
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
