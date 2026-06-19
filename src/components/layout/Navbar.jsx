import { useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../config/theme';

const t = (k) => (d) => colors[d ? 'dark' : 'light'][k];

const CLIENT_NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' },
  { path: '/ads', label: 'My Ads', icon: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3' },
  { path: '/ads/create', label: 'Create Campaign', icon: 'M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z' },
];

const MANAGER_NAV = [
  { path: '/manager/dashboard', label: 'Dashboard', icon: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' },
  { path: '/manager/campaigns', label: 'Campaigns', icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' },
  { path: '/manager/create-creative', label: 'Creative Studio', icon: 'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42' },
  { path: '/manager/target-areas', label: 'Target Areas', icon: 'M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z' },
];

const DEVELOPER_NAV = [
  { path: '/developer/dashboard', label: 'Dashboard', icon: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' },
  { path: '/developer/playground', label: 'API Playground', icon: 'M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z' },
];

function NavLink({ item, currentPath, dark, onClick }) {
  const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
        isActive
          ? (dark
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25 shadow-[0_0_20px_rgba(217,160,50,0.08)]'
              : 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm')
          : `${dark ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'}`
      }`}
    >
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
      </svg>
      <span className="hidden sm:inline">{item.label}</span>
    </button>
  );
}

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { dark } = useTheme();
  const isManager = user?.role === 'manager';
  const isDeveloper = user?.role === 'developer';
  const navItems = isManager ? MANAGER_NAV : isDeveloper ? DEVELOPER_NAV : CLIENT_NAV;
  const homePath = isManager ? '/manager/dashboard' : isDeveloper ? '/developer/dashboard' : '/dashboard';
  const logoutPath = isManager ? '/manager' : isDeveloper ? '/developer' : '/login';
  const displayName = isDeveloper ? (user?.company_name || 'Developer') : (user?.name || user?.mobile);

  const handleLogout = () => {
    sessionStorage.removeItem('access');
    sessionStorage.removeItem('user');
    onLogout();
    window.location.href = logoutPath;
  };

  return (
    <header className={`sticky top-0 z-40 w-full transition-all duration-500 ${t('navGlass')(dark)}`}>
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => navigate(homePath)}
              className={`inline-flex items-center gap-2.5 px-3 py-2 rounded-xl text-base font-bold tracking-tight mr-2 sm:mr-4 transition-all duration-300 hover-lift ${t('text')(dark)}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 ${t('logo')(dark)}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>
              <span className="hidden sm:inline text-gradient-amber">Ads Manager</span>
            </button>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink key={item.path} item={item} currentPath={location.pathname} dark={dark} onClick={() => navigate(item.path)} />
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <div className={`hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl transition-all duration-300 border ${
              dark ? 'bg-neutral-900/60 border-neutral-800/50' : 'bg-stone-50 border-stone-200/50'
            }`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                dark ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-black' : 'bg-gradient-to-br from-amber-500 to-amber-600 text-black'
              }`}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <span className={`text-xs font-medium transition-colors duration-500 ${t('textDim')(dark)}`}>
                {displayName}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 hover-lift ${t('btnLogout')(dark)}`}
              title="Logout"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        <div className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto scrollbar-none">
          {navItems.map((item) => (
            <NavLink key={item.path} item={item} currentPath={location.pathname} dark={dark} onClick={() => navigate(item.path)} />
          ))}
        </div>
      </div>
    </header>
  );
}
