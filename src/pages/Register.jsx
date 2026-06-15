import { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../config/theme';
import { validateMobile, validateOTP } from '../utils/validation';

const c = (k) => colors[k];

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
    <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-700 ${c(dark ? 'dark' : 'light').page} ${c(dark ? 'dark' : 'light').pageGradient}`}>
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-48 -right-48 w-96 h-96 rounded-full blur-[150px] animate-float-slow transition-colors duration-700 ${c(dark ? 'dark' : 'light').glow}`} />
        <div className={`absolute -bottom-48 -left-48 w-96 h-96 rounded-full blur-[150px] animate-float-slow transition-colors duration-700 ${c(dark ? 'dark' : 'light').glowSubtle}`} style={{ animationDelay: '-3s' }} />
        <div className={`absolute top-1/3 -left-24 w-64 h-64 rounded-full blur-[120px] transition-colors duration-700 ${c(dark ? 'dark' : 'light').glowViolet}`} style={{ opacity: 0.5 }} />
      </div>

      <div className={`relative w-full max-w-md animate-fade-in-up ${step === 'otp' ? 'scale-[1.02]' : 'scale-100'}`}>
        <div className={`rounded-2xl p-8 sm:p-10 transition-all duration-500 backdrop-blur-xl ${
          dark
            ? 'bg-neutral-900/80 border border-amber-500/15 shadow-[0_0_60px_rgba(217,160,50,0.06)]'
            : 'bg-white/90 border border-stone-200 shadow-xl shadow-stone-200/50'
        }`}>
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 transition-all duration-500 shadow-lg ${
              dark
                ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-black shadow-amber-500/20'
                : 'bg-gradient-to-br from-amber-500 to-amber-600 text-black shadow-amber-500/20'
            }`}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
              </svg>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>Create Account</h1>
            <p className={`text-sm mt-1.5 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>Register to start managing your ads</p>
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
            <Link to="/login"
              className={`block w-full py-3 rounded-xl text-sm font-semibold text-center transition-all duration-300 hover-lift ${c(dark ? 'dark' : 'light').btnGhost}`}
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
