import { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../config/theme';
import { validateMobile, validateOTP } from '../utils/validation';
import { ROUTES } from '../constants';

const c = (k) => colors[k];

const features = [
  'Free account with full access',
  'AI-powered campaign tools',
  'Precision geo-targeting',
  'Real-time analytics dashboard',
];

export default function Register({ onRegister }) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { dark } = useTheme();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!validateMobile(mobile)) { setError('Enter a valid mobile number'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await auth.sendOTP(mobile);
      setStep('otp');
      if (res.otp) console.log('OTP:', res.otp);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateOTP(otp)) { setError('Enter a valid OTP'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await auth.register({ name: name.trim(), mobile, otp });
      sessionStorage.setItem('access', res.access);
      onRegister(res.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex transition-all duration-700 ${c(dark ? 'dark' : 'light').page}`}>
      {/* ── Left Side: Branding ── */}
      <div className={`hidden lg:flex lg:w-1/2 relative flex-col justify-between p-10 xl:p-14 overflow-hidden ${
        dark
          ? 'bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950'
          : 'bg-gradient-to-br from-amber-50 via-stone-50 to-white'
      }`}>
        {/* Animated orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full blur-[180px] animate-float-slow transition-colors duration-700 ${c(dark ? 'dark' : 'light').glow}`} />
          <div className={`absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full blur-[180px] animate-float-slow transition-colors duration-700 ${c(dark ? 'dark' : 'light').glowSubtle}`} style={{ animationDelay: '-3s' }} />
          <div className={`absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full blur-[140px] transition-colors duration-700 ${c(dark ? 'dark' : 'light').glowViolet}`} style={{ opacity: 0.4 }} />
        </div>

        {/* Back to home */}
        <div className="relative z-10">
          <Link to={ROUTES.LANDING} className={`inline-flex items-center gap-2 text-xs font-medium transition-colors duration-300 hover-lift-sm ${
            dark ? 'text-neutral-500 hover:text-amber-400' : 'text-stone-500 hover:text-amber-700'
          }`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Brand content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
              </svg>
            </div>
            <span className={`text-xl font-bold tracking-tight transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>AdForge</span>
          </div>

          <h2 className={`text-3xl xl:text-4xl font-bold tracking-tight leading-tight transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>
            Start your journey{' '}
            <span className="gradient-text">today.</span>
          </h2>

          <p className={`text-sm mt-3 leading-relaxed transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>
            Join hundreds of businesses already using AdForge to reach the right audiences with precision-targeted campaigns.
          </p>

          <ul className="mt-8 space-y-3">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-sm animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                  dark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-100 text-amber-700'
                }`}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                <span className={`transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>{f}</span>
              </li>
            ))}
          </ul>

          {/* Stats */}
          <div className="flex gap-8 mt-10">
            {[
              { val: '500+', label: 'Campaigns' },
              { val: '50+', label: 'Cities' },
              { val: '98%', label: 'Satisfaction' },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-xl font-bold gradient-text">{s.val}</p>
                <p className={`text-[10px] mt-0.5 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textDim}`}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className={`relative z-10 text-[10px] transition-colors duration-500 ${c(dark ? 'dark' : 'light').textDim}`}>
          &copy; {new Date().getFullYear()} AdForge. All rights reserved.
        </p>
      </div>

      {/* ── Right Side: Form ── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative">
        {/* Mobile: Back to home */}
        <Link to={ROUTES.LANDING} className={`lg:hidden absolute top-6 left-6 inline-flex items-center gap-1.5 text-xs font-medium transition-colors duration-300 ${
          dark ? 'text-neutral-500 hover:text-amber-400' : 'text-stone-500 hover:text-amber-700'
        }`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </Link>

        <div className="w-full max-w-md">
          <div className={`rounded-2xl p-8 sm:p-10 transition-all duration-500 ${
            dark
              ? 'bg-neutral-900/80 backdrop-blur-xl border border-amber-500/15 shadow-[0_0_60px_rgba(217,160,50,0.06)]'
              : 'bg-white/90 backdrop-blur-xl border border-stone-200 shadow-xl shadow-stone-200/50'
          }`}>
            {/* Header */}
            <div className="text-center mb-7">
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 transition-all duration-500 shadow-lg ${
                dark
                  ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-black shadow-amber-500/20'
                  : 'bg-gradient-to-br from-amber-500 to-amber-600 text-black shadow-amber-500/20'
              }`}>
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>
              <h1 className={`text-2xl font-bold tracking-tight transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>Create Account</h1>
              <p className={`text-sm mt-1 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>Start managing your ads in minutes</p>
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

            {step === 'details' ? (
              <form onSubmit={handleSendOTP} className="space-y-5">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-widest mb-2 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>Your Name</label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors duration-500 ${c(dark ? 'dark' : 'light').textDim}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className={`w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all duration-300 ${c(dark ? 'dark' : 'light').input} ${c(dark ? 'dark' : 'light').borderFocus}`}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-widest mb-2 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>Mobile Number</label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors duration-500 ${c(dark ? 'dark' : 'light').textDim}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                      </svg>
                    </div>
                    <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 15))}
                      placeholder="Enter your mobile number"
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
                      Sending OTP...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Send OTP
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </span>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-widest mb-2 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>OTP sent to</label>
                  <p className={`text-sm mb-4 flex items-center gap-2 transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>
                    <span className="gradient-text font-semibold">{mobile}</span>
                    <button type="button" onClick={() => setStep('details')} className={`text-xs font-medium underline transition-colors ${c(dark ? 'dark' : 'light').textLinkMuted}`}>Change</button>
                  </p>
                  <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="0 0 0 0 0 0" maxLength={6}
                    className={`w-full px-4 py-4 rounded-xl text-2xl tracking-[0.5em] text-center font-mono outline-none transition-all duration-300 ${c(dark ? 'dark' : 'light').input} ${c(dark ? 'dark' : 'light').borderFocus}`}
                    required
                  />
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
                      Creating Account...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Create Account
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                  )}
                </button>
              </form>
            )}

            {/* Footer */}
            <div className={`mt-8 pt-6 border-t transition-colors duration-500 ${c(dark ? 'dark' : 'light').border}`}>
              <p className={`text-xs text-center mb-3 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textDim}`}>Already have an account?</p>
              <Link to={ROUTES.LOGIN}
                className={`block w-full py-3 rounded-xl text-sm font-semibold text-center transition-all duration-300 hover-lift ${c(dark ? 'dark' : 'light').btnGhost}`}
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
