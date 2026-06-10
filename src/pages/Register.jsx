import { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../config/theme';
import { validateMobile, validateOTP } from '../utils/validation';

const t = (k) => (dark) => colors[dark ? 'dark' : 'light'][k];

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
    <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-700 ${t('page')(dark)}`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-48 -right-48 w-96 h-96 rounded-full blur-[120px] transition-colors duration-700 ${t('glow')(dark)}`} />
        <div className={`absolute -bottom-48 -left-48 w-96 h-96 rounded-full blur-[120px] transition-colors duration-700 ${t('glowSubtle')(dark)}`} />
      </div>

      <div className={`relative w-full max-w-md transition-all duration-500 ${step === 'otp' ? 'scale-[1.02]' : 'scale-100'}`}>
        <div className={`rounded-2xl p-8 transition-all duration-500 ${t('card')(dark)}`}>
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 transition-all duration-500 ${t('logo')(dark)}`}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
              </svg>
            </div>
            <h1 className={`text-2xl font-bold tracking-tight transition-colors duration-500 ${t('text')(dark)}`}>Create Account</h1>
            <p className={`text-sm mt-1 transition-colors duration-500 ${t('textMuted')(dark)}`}>Register to get started</p>
          </div>

          {error && (
            <div className={`mb-5 px-4 py-3 rounded-lg text-sm border transition-all duration-300 ${
              dark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
            }`}>{error}</div>
          )}

          {step === 'details' ? (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div>
                <label className={`block text-xs font-medium uppercase tracking-widest mb-2 transition-colors duration-500 ${t('textMuted')(dark)}`}>Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-300 ${t('input')(dark)} ${t('borderFocus')(dark)}`}
                  required
                />
              </div>
              <div>
                <label className={`block text-xs font-medium uppercase tracking-widest mb-2 transition-colors duration-500 ${t('textMuted')(dark)}`}>Mobile Number</label>
                <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 15))}
                  placeholder="Enter your mobile number"
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
                    Send OTP
                  </span>
                ) : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className={`block text-xs font-medium uppercase tracking-widest mb-2 transition-colors duration-500 ${t('textMuted')(dark)}`}>OTP sent to</label>
                <p className={`text-sm mb-3 transition-colors duration-500 ${dark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                  {mobile}{' '}
                  <button type="button" onClick={() => setStep('details')} className={`underline transition-colors ${t('textLinkMuted')(dark)}`}>Change</button>
                </p>
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000" maxLength={6}
                  className={`w-full px-4 py-3 rounded-xl text-2xl tracking-[0.5em] text-center font-mono outline-none transition-all duration-300 ${t('input')(dark)} ${t('borderFocus')(dark)}`}
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
                    Creating account...
                  </span>
                ) : 'Create Account'}
              </button>
            </form>
          )}

          <div className={`mt-6 pt-6 border-t transition-colors duration-500 ${t('border')(dark)}`}>
            <p className={`text-xs text-center mb-3 transition-colors duration-500 ${t('textDim')(dark)}`}>Already have an account?</p>
            <Link to="/login" className={`block w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-all duration-300 ${t('btnGhost')(dark)}`}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
