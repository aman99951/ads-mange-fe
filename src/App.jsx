import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { colors } from './config/theme';
import { useAuth } from './hooks/useAuth';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MyAds from './pages/MyAds';
import CreateAd from './pages/CreateAd';
import AdDetail from './pages/AdDetail';
import ManagerLogin from './pages/ManagerLogin';
import ManagerDashboard from './pages/ManagerDashboard';
import ManagerCampaigns from './pages/ManagerCampaigns';
import ManagerAdDetail from './pages/ManagerAdDetail';
import ManagerTargetAreas from './pages/ManagerTargetAreas';
import ManagerCreateCreative from './pages/ManagerCreateCreative';
import ManagerRevisions from './pages/ManagerRevisions';
import DeveloperLogin from './pages/DeveloperLogin';
import DeveloperRegister from './pages/DeveloperRegister';
import DeveloperDashboard from './pages/DeveloperDashboard';
import DeveloperCampaigns from './pages/DeveloperCampaigns';
import DeveloperPlayground from './pages/DeveloperPlayground';
import Navbar from './components/layout/Navbar';
import { ROUTES } from './constants';

const t = (k) => (d) => colors[d ? 'dark' : 'light'][k];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AppContent() {
  const { user, login, logout } = useAuth();
  const { dark } = useTheme();
  const location = useLocation();
  const isManager = user?.role === 'manager';
  const isDeveloper = user?.role === 'developer';
  const isClient = user && !isManager && !isDeveloper;
  const hideNavbar = location.pathname === ROUTES.MANAGER_CREATE_CREATIVE;

  const getHomeRoute = () => {
    if (isManager) return ROUTES.MANAGER_DASHBOARD;
    if (isDeveloper) return ROUTES.DEVELOPER_DASHBOARD;
    return ROUTES.DASHBOARD;
  };

  return (
    <>
      <ScrollToTop />
      {user && !hideNavbar && <Navbar user={user} onLogout={logout} />}
      <div className={`min-h-screen transition-colors duration-500 ${t('page')(dark)}`}>
        <Routes>
          <Route path={ROUTES.LANDING} element={user ? <Navigate to={getHomeRoute()} replace /> : <Landing />} />
          <Route path={ROUTES.LOGIN} element={isClient ? <Navigate to={ROUTES.DASHBOARD} replace /> : user ? <Navigate to={getHomeRoute()} replace /> : <Login onLogin={login} />} />
          <Route path={ROUTES.REGISTER} element={isClient ? <Navigate to={ROUTES.DASHBOARD} replace /> : user ? <Navigate to={getHomeRoute()} replace /> : <Register onRegister={login} />} />
          <Route path={ROUTES.DASHBOARD} element={isClient ? <Dashboard user={user} /> : <Navigate to={getHomeRoute()} replace />} />
          <Route path={ROUTES.ADS} element={isClient ? <MyAds /> : <Navigate to={getHomeRoute()} replace />} />
          <Route path={ROUTES.CREATE_AD} element={isClient ? <CreateAd /> : <Navigate to={getHomeRoute()} replace />} />
          <Route path={ROUTES.AD_DETAIL} element={isClient ? <AdDetail /> : <Navigate to={getHomeRoute()} replace />} />

          <Route path={ROUTES.MANAGER_LOGIN} element={isManager ? <Navigate to={ROUTES.MANAGER_DASHBOARD} replace /> : <ManagerLogin onLogin={login} />} />
          <Route path={ROUTES.MANAGER_DASHBOARD} element={isManager ? <ManagerDashboard /> : <Navigate to={ROUTES.MANAGER_LOGIN} replace />} />
          <Route path={ROUTES.MANAGER_CAMPAIGNS} element={isManager ? <ManagerCampaigns /> : <Navigate to={ROUTES.MANAGER_LOGIN} replace />} />
          <Route path={ROUTES.MANAGER_CAMPAIGN_DETAIL} element={isManager ? <ManagerAdDetail /> : <Navigate to={ROUTES.MANAGER_LOGIN} replace />} />
          <Route path={ROUTES.MANAGER_AD_DETAIL} element={isManager ? <ManagerAdDetail /> : <Navigate to={ROUTES.MANAGER_LOGIN} replace />} />
          <Route path={ROUTES.MANAGER_TARGET_AREAS} element={isManager ? <ManagerTargetAreas /> : <Navigate to={ROUTES.MANAGER_LOGIN} replace />} />
          <Route path={ROUTES.MANAGER_CREATE_CREATIVE} element={isManager ? <ManagerCreateCreative /> : <Navigate to={ROUTES.MANAGER_LOGIN} replace />} />
          <Route path={ROUTES.MANAGER_REVISIONS} element={isManager ? <ManagerRevisions /> : <Navigate to={ROUTES.MANAGER_LOGIN} replace />} />

          <Route path={ROUTES.DEVELOPER_LOGIN} element={isDeveloper ? <Navigate to={ROUTES.DEVELOPER_DASHBOARD} replace /> : <DeveloperLogin onLogin={login} />} />
          <Route path={ROUTES.DEVELOPER_REGISTER} element={isDeveloper ? <Navigate to={ROUTES.DEVELOPER_DASHBOARD} replace /> : <DeveloperRegister onRegister={login} />} />
          <Route path={ROUTES.DEVELOPER_DASHBOARD} element={isDeveloper ? <DeveloperDashboard user={user} /> : <Navigate to={ROUTES.DEVELOPER_LOGIN} replace />} />
          <Route path={ROUTES.DEVELOPER_CAMPAIGNS} element={isDeveloper ? <DeveloperCampaigns user={user} /> : <Navigate to={ROUTES.DEVELOPER_LOGIN} replace />} />
          <Route path={ROUTES.DEVELOPER_PLAYGROUND} element={isDeveloper ? <DeveloperPlayground /> : <Navigate to={ROUTES.DEVELOPER_LOGIN} replace />} />

          <Route path="*" element={<Navigate to={user ? getHomeRoute() : ROUTES.LANDING} replace />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}
