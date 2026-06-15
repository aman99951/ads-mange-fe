import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../config/theme';
import { ROUTES } from '../constants';

const c = (k) => colors[k];

const features = [
  {
    icon: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    title: 'Campaign Management',
    desc: 'Create, track, and optimize your ad campaigns from a single dashboard with real-time insights.',
    image: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
  },
  {
    icon: 'M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z',
    title: 'Smart Geo-Targeting',
    desc: 'Target specific states, cities, and localities with precision. Reach the right audience every time.',
    image: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  },
  {
    icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
    title: 'Real-Time Analytics',
    desc: 'Monitor performance metrics, track engagement, and make data-driven decisions instantly.',
    image: 'M3 3v18h18M7 16l4-8 4 4 4-6',
  },
  {
    icon: 'M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z',
    title: 'AI Video Generation',
    desc: 'Automatically generate stunning video ads from your content. No editing skills required.',
    image: 'M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z',
  },
];

const steps = [
  { num: '01', title: 'Create Your Campaign', desc: 'Set your target area, define your audience, and upload your creative assets in minutes.' },
  { num: '02', title: 'Review & Approve', desc: 'Our team reviews your campaign for quality. Get feedback and iterate until it\'s perfect.' },
  { num: '03', title: 'Launch & Track', desc: 'Go live and monitor performance in real-time. Optimize on the fly with detailed analytics.' },
];

export default function Landing() {
  const { dark, toggle } = useTheme();

  return (
    <div className={`min-h-screen transition-all duration-700 ${c(dark ? 'dark' : 'light').page} ${c(dark ? 'dark' : 'light').pageGradient}`}>
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-48 -right-48 w-[500px] h-[500px] rounded-full blur-[200px] animate-float-slow transition-colors duration-700 ${c(dark ? 'dark' : 'light').glow}`} />
        <div className={`absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full blur-[200px] animate-float-slow transition-colors duration-700 ${c(dark ? 'dark' : 'light').glowSubtle}`} style={{ animationDelay: '-3s' }} />
        <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[250px] transition-colors duration-700 ${c(dark ? 'dark' : 'light').glowViolet}`} style={{ opacity: 0.4 }} />
      </div>

      {/* ── Nav ── */}
      <nav className={`relative z-10 border-b transition-colors duration-500 ${c(dark ? 'dark' : 'light').border}`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link to={ROUTES.LANDING} className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>
              <span className={`text-lg font-bold tracking-tight transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>AdForge</span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Theme toggle */}
              <button onClick={toggle} className={`p-2 rounded-lg transition-all duration-300 ${
                dark ? 'text-amber-300/50 hover:text-amber-200 hover:bg-amber-500/10 bg-neutral-900/60 border border-neutral-800' : 'text-stone-500 hover:text-amber-700 hover:bg-amber-50 bg-white border border-stone-200'
              }`} aria-label="Toggle theme">
                {dark ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <Link to={ROUTES.LOGIN} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${c(dark ? 'dark' : 'light').btnGhost}`}>Sign In</Link>
              <Link to={ROUTES.REGISTER} className="px-5 py-2 rounded-xl text-sm font-semibold text-black bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 transition-all duration-300 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 pt-6 sm:pt-8 lg:pt-12 pb-16 sm:pb-20 lg:pb-28">
        {/* Hero background image with overlay */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&q=80"
            alt=""
            className="w-full h-full object-cover opacity-[0.04] dark:opacity-[0.06] transition-opacity duration-700"
          />
          <div className={`absolute inset-0 transition-colors duration-700 ${
            dark
              ? 'bg-gradient-to-r from-neutral-950/80 via-neutral-950/40 to-transparent'
              : 'bg-gradient-to-r from-white/60 via-white/20 to-transparent'
          }`} />
        </div>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Hero text */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5 sm:mb-6 backdrop-blur-sm border transition-colors duration-300"
                style={{ borderColor: dark ? 'rgba(217,160,50,0.25)' : 'rgba(217,160,50,0.3)', background: dark ? 'rgba(217,160,50,0.08)' : 'rgba(217,160,50,0.1)', color: dark ? '#d9a032' : '#a16a06' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-soft" />
                AI-Powered Ad Management Platform
              </div>

              <h1 className={`text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1] transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>
                Create & Manage{' '}
                <span className="gradient-text">High-Impact Ads</span>{' '}
                in Minutes
              </h1>

              <p className={`text-base sm:text-lg lg:text-xl mt-5 sm:mt-6 leading-relaxed max-w-lg transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>
                From geo-targeted campaigns to AI-generated video ads — manage your entire advertising workflow from one powerful dashboard.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-7 sm:mt-9">
                <Link to={ROUTES.REGISTER} className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-black bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 transition-all duration-300 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover-lift">
                  Start Free Trial
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link to={ROUTES.LOGIN} className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 border hover-lift ${
                  dark ? 'border-neutral-700 text-neutral-300 hover:border-amber-500/40 hover:text-amber-400 bg-neutral-900/50' : 'border-stone-300 text-stone-700 hover:border-amber-400 hover:text-amber-700 bg-white/50'
                }`}>
                  Sign In
                </Link>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 sm:gap-8 mt-10 sm:mt-12 pt-6 sm:pt-8 border-t transition-colors duration-500" style={{ borderColor: dark ? 'rgba(217,160,50,0.1)' : 'rgba(217,160,50,0.15)' }}>
                {[
                  { val: '500+', label: 'Campaigns' },
                  { val: '50+', label: 'Cities' },
                  { val: '98%', label: 'Satisfaction' },
                ].map((s, i) => (
                  <div key={i}>
                    <p className="text-xl sm:text-2xl font-bold gradient-text">{s.val}</p>
                    <p className={`text-xs sm:text-sm mt-0.5 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textDim}`}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero right - floating dashboard screenshot */}
            <div className="animate-fade-in-up relative" style={{ animationDelay: '200ms' }}>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl transition-all duration-500"
                style={{
                  boxShadow: dark
                    ? '0 0 80px rgba(217,160,50,0.08), 0 20px 60px rgba(0,0,0,0.4)'
                    : '0 0 80px rgba(217,160,50,0.1), 0 20px 60px rgba(0,0,0,0.08)'
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=700&q=80"
                  alt="Analytics dashboard preview"
                  className="w-full h-auto object-cover"
                />
              </div>
              {/* Floating badges */}
              <div className="flex justify-center gap-3 sm:gap-4 mt-4 sm:absolute sm:-bottom-3 sm:left-1/2 sm:-translate-x-1/2 sm:mt-0">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium backdrop-blur-sm border transition-colors duration-300 animate-float ${
                  dark ? 'bg-neutral-900/80 border-neutral-700 text-neutral-300' : 'bg-white/90 border-stone-200 text-stone-600 shadow-sm'
                }`} style={{ animationDelay: '-1s' }}>
                  <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Smart Analytics
                </div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium backdrop-blur-sm border transition-colors duration-300 animate-float ${
                  dark ? 'bg-neutral-900/80 border-neutral-700 text-neutral-300' : 'bg-white/90 border-stone-200 text-stone-600 shadow-sm'
                }`} style={{ animationDelay: '-2.5s' }}>
                  <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Real-Time
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 py-16 sm:py-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <p className={`text-xs font-semibold uppercase tracking-widest mb-3 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textDim}`}>Everything You Need</p>
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>
              Powered for <span className="gradient-text">Performance</span>
            </h2>
            <p className={`text-base sm:text-lg mt-4 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>
              A complete toolkit designed to streamline your ad operations from briefing to launch.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((f, i) => (
              <div key={i}
                className={`group rounded-2xl p-6 sm:p-8 transition-all duration-500 animate-fade-in-up ${
                  dark
                    ? 'bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 hover:border-amber-500/25 hover:bg-neutral-900/70 hover:shadow-[0_0_40px_rgba(217,160,50,0.06)]'
                    : 'bg-white/60 backdrop-blur-sm border border-stone-200 shadow-sm hover:border-amber-300/50 hover:shadow-lg hover:bg-white/80'
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Feature illustration */}
                <div className={`w-full h-28 rounded-xl mb-5 overflow-hidden transition-all duration-500 flex items-center justify-center ${
                  dark ? 'bg-neutral-800/60' : 'bg-stone-50'
                }`}>
                  <svg className={`w-16 h-16 transition-colors duration-500 ${dark ? 'text-amber-500/20' : 'text-amber-300/30'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.image} />
                  </svg>
                </div>

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg ${
                  dark
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15 group-hover:bg-amber-500/15 group-hover:shadow-amber-500/10'
                    : 'bg-amber-50 text-amber-700 border border-amber-200 group-hover:bg-amber-100 group-hover:shadow-amber-500/10'
                }`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                  </svg>
                </div>
                <h3 className={`text-base font-bold mb-2 transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>{f.title}</h3>
                <p className={`text-sm leading-relaxed transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="relative z-10 py-16 sm:py-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <p className={`text-xs font-semibold uppercase tracking-widest mb-3 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textDim}`}>Simple Process</p>
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>
              Three Steps to <span className="gradient-text">Launch</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 max-w-5xl mx-auto">
            {steps.map((s, i) => (
              <div key={i} className="relative text-center animate-fade-in-up" style={{ animationDelay: `${i * 150}ms` }}>
                <div className={`text-5xl sm:text-6xl font-black tracking-tighter mb-4 transition-colors duration-500 ${dark ? 'text-neutral-800' : 'text-stone-200'}`}>
                  {s.num}
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-8 left-[60%] w-[calc(80%)] h-px transition-colors duration-500"
                    style={{ background: `linear-gradient(90deg, ${dark ? 'rgba(217,160,50,0.25)' : 'rgba(217,160,50,0.3)'}, transparent)` }} />
                )}
                <h3 className={`text-lg font-bold mb-2 transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>{s.title}</h3>
                <p className={`text-sm leading-relaxed transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Preview / Dashboard Showcase ── */}
      <section className="relative z-10 py-16 sm:py-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="animate-fade-in-up order-2 lg:order-1">
              <p className={`text-xs font-semibold uppercase tracking-widest mb-3 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textDim}`}>See It In Action</p>
              <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>
                Everything at Your{' '}
                <span className="gradient-text">Fingertips</span>
              </h2>
              <p className={`text-base sm:text-lg mt-4 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>
                Monitor campaign performance, manage target areas, review creative assets, and communicate with your team — all from one beautifully crafted interface.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  { label: 'Real-time campaign analytics dashboard', checked: true },
                  { label: 'Multi-city geo-targeting with heat maps', checked: true },
                  { label: 'AI-powered video ad generation', checked: true },
                  { label: 'Client-manager collaboration & review workflow', checked: true },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm animate-fade-in-up" style={{ animationDelay: `${300 + i * 100}ms` }}>
                    <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-300 ${
                      dark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </span>
                    <span className={`transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 lg:order-2 animate-fade-in-up relative" style={{ animationDelay: '150ms' }}>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 hover-lift"
                style={{
                  boxShadow: dark
                    ? '0 0 60px rgba(217,160,50,0.06), 0 20px 50px rgba(0,0,0,0.3)'
                    : '0 0 60px rgba(217,160,50,0.08), 0 20px 50px rgba(0,0,0,0.05)'
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=700&q=80"
                  alt="Team collaboration workspace"
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className={`absolute -bottom-4 -right-4 px-4 py-2 rounded-xl text-xs font-semibold backdrop-blur-md border shadow-lg ${
                dark ? 'bg-neutral-900/90 border-neutral-700 text-amber-400' : 'bg-white/90 border-stone-200 text-amber-700'
              }`}>
                Live Dashboard
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-16 sm:py-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`max-w-3xl mx-auto rounded-3xl p-10 sm:p-14 lg:p-16 text-center transition-all duration-500 ${
            dark
              ? 'bg-gradient-to-br from-neutral-900/90 to-neutral-950/90 border border-amber-500/10 shadow-[0_0_80px_rgba(217,160,50,0.05)]'
              : 'bg-gradient-to-br from-white/90 to-stone-50/90 border border-stone-200/80 shadow-xl shadow-stone-200/50'
          }`}>
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>
              Ready to Transform Your{' '}
              <span className="gradient-text">Ad Campaigns</span>?
            </h2>
            <p className={`text-base sm:text-lg mt-4 max-w-lg mx-auto transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>
              Join businesses that are already reaching the right audiences with precision-targeted campaigns.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 sm:mt-10">
              <Link to={ROUTES.REGISTER} className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold text-black bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 transition-all duration-300 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover-lift">
                Get Started Free
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link to={ROUTES.LOGIN} className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 border hover-lift ${
                dark ? 'border-neutral-700 text-neutral-300 hover:border-amber-500/40 hover:text-amber-400' : 'border-stone-300 text-stone-700 hover:border-amber-400 hover:text-amber-700'
              }`}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t transition-colors duration-500 py-10 sm:py-14" style={{ borderColor: dark ? 'rgba(217,160,50,0.08)' : 'rgba(217,160,50,0.12)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-600 text-black">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>
              <span className={`text-sm font-bold transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>AdForge</span>
            </div>
            <p className={`text-xs transition-colors duration-500 ${c(dark ? 'dark' : 'light').textDim}`}>
              &copy; {new Date().getFullYear()} AdForge. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link to={ROUTES.LOGIN} className={`text-xs font-medium transition-colors duration-300 ${c(dark ? 'dark' : 'light').textLinkMuted}`}>Sign In</Link>
              <span className={`text-xs transition-colors duration-500 ${c(dark ? 'dark' : 'light').textDim}`}>|</span>
              <Link to={ROUTES.REGISTER} className={`text-xs font-medium transition-colors duration-300 ${c(dark ? 'dark' : 'light').textLinkMuted}`}>Get Started</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
