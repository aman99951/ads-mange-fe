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
  { path: '/manager/target-areas', label: 'Target Areas', icon: 'M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z' },
];

function NavLink({ item, currentPath, dark, onClick }) {
  const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
        isActive
          ? (dark ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' : 'bg-amber-50 text-amber-700 border border-amber-200')
          : `${dark ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'}`
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
  const navItems = isManager ? MANAGER_NAV : CLIENT_NAV;

  const handleLogout = () => {
    sessionStorage.removeItem('access');
    sessionStorage.removeItem('user');
    onLogout();
    navigate(isManager ? '/manager' : '/login');
  };

  return (
    <header className={`sticky top-0 z-40 w-full border-b transition-all duration-500 ${
      dark ? 'bg-neutral-950/80 backdrop-blur-xl border-neutral-800' : 'bg-white/80 backdrop-blur-xl border-stone-200'
    }`}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => navigate(isManager ? '/manager/dashboard' : '/dashboard')}
              className={`inline-flex items-center gap-2.5 px-3 py-2 rounded-lg text-base font-bold tracking-tight mr-2 sm:mr-4 transition-colors duration-500 ${t('text')(dark)}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 ${t('logo')(dark)}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>
              <span className="hidden sm:inline">Ads Manager</span>
            </button>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink key={item.path} item={item} currentPath={location.pathname} dark={dark} onClick={() => navigate(item.path)} />
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors duration-300 ${
              dark ? 'bg-neutral-900/60' : 'bg-stone-50'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
              }`}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <span className={`text-xs font-medium transition-colors duration-500 ${t('textDim')(dark)}`}>
                {user?.name || user?.mobile} {isManager ? '(Manager)' : ''}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${t('btnLogout')(dark)}`}
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
