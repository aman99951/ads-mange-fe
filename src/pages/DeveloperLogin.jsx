import { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../config/theme';
import { ROUTES } from '../constants';

const c = (k) => colors[k];

export default function DeveloperLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { dark } = useTheme();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError('Enter email and password'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await auth.developerLogin(email, password);
      sessionStorage.setItem('access', res.access);
      onLogin({ ...res.user, role: 'developer' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-700 ${c(dark ? 'dark' : 'light').page} ${c(dark ? 'dark' : 'light').pageGradient}`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-48 -right-48 w-96 h-96 rounded-full blur-[150px] animate-float-slow transition-colors duration-700 ${c(dark ? 'dark' : 'light').glow}`} />
        <div className={`absolute -bottom-48 -left-48 w-96 h-96 rounded-full blur-[150px] animate-float-slow transition-colors duration-700 ${c(dark ? 'dark' : 'light').glowSubtle}`} style={{ animationDelay: '-3s' }} />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className={`rounded-2xl p-8 sm:p-10 transition-all duration-500 backdrop-blur-xl ${
          dark
            ? 'bg-neutral-900/80 border border-amber-500/15 shadow-[0_0_60px_rgba(217,160,50,0.06)]'
            : 'bg-white/90 border border-stone-200 shadow-xl shadow-stone-200/50'
        }`}>
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 transition-all duration-500 shadow-lg ${
              dark
                ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-black shadow-amber-500/20'
                : 'bg-gradient-to-br from-amber-500 to-amber-600 text-black shadow-amber-500/20'
            }`}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
              </svg>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>Developer Login</h1>
            <p className={`text-sm mt-1.5 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>Sign in to integrate ads into your apps</p>
          </div>

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
              <label className={`block text-xs font-semibold uppercase tracking-widest mb-2 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>Email</label>
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors duration-500 ${c(dark ? 'dark' : 'light').textDim}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email" autoComplete="email"
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

          <div className="mt-6 text-center">
            <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
              Don't have an account?{' '}
              <Link to={ROUTES.DEVELOPER_REGISTER} className="text-amber-500 hover:text-amber-400 font-medium">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
