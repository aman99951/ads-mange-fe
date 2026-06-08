import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { colors } from './config/theme';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MyAds from './pages/MyAds';
import CreateAd from './pages/CreateAd';
import AdDetail from './pages/AdDetail';
import ManagerLogin from './pages/ManagerLogin';
import ManagerDashboard from './pages/ManagerDashboard';
import ManagerAdDetail from './pages/ManagerAdDetail';
import ManagerTargetAreas from './pages/ManagerTargetAreas';
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
  const isManager = user?.role === 'manager';

  return (
    <BrowserRouter>
      <ScrollToTop />
      {user && <Navbar user={user} onLogout={logout} />}
      <div className={`min-h-screen transition-colors duration-500 ${t('page')(dark)}`}>
        <Routes>
          <Route path={ROUTES.LOGIN} element={user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <Login onLogin={login} />} />
          <Route path={ROUTES.REGISTER} element={user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <Register onRegister={login} />} />
          <Route path={ROUTES.DASHBOARD} element={user && !isManager ? <Dashboard user={user} /> : <Navigate to={isManager ? ROUTES.MANAGER_DASHBOARD : ROUTES.LOGIN} replace />} />
          <Route path={ROUTES.ADS} element={user && !isManager ? <MyAds /> : <Navigate to={isManager ? ROUTES.MANAGER_DASHBOARD : ROUTES.LOGIN} replace />} />
          <Route path={ROUTES.CREATE_AD} element={user && !isManager ? <CreateAd /> : <Navigate to={isManager ? ROUTES.MANAGER_DASHBOARD : ROUTES.LOGIN} replace />} />
          <Route path={ROUTES.AD_DETAIL} element={user && !isManager ? <AdDetail /> : <Navigate to={isManager ? ROUTES.MANAGER_DASHBOARD : ROUTES.LOGIN} replace />} />

          <Route path={ROUTES.MANAGER_LOGIN} element={isManager ? <Navigate to={ROUTES.MANAGER_DASHBOARD} replace /> : <ManagerLogin onLogin={login} />} />
          <Route path={ROUTES.MANAGER_DASHBOARD} element={isManager ? <ManagerDashboard /> : <Navigate to={ROUTES.MANAGER_LOGIN} replace />} />
          <Route path={ROUTES.MANAGER_AD_DETAIL} element={isManager ? <ManagerAdDetail /> : <Navigate to={ROUTES.MANAGER_LOGIN} replace />} />
          <Route path={ROUTES.MANAGER_TARGET_AREAS} element={isManager ? <ManagerTargetAreas /> : <Navigate to={ROUTES.MANAGER_LOGIN} replace />} />

          <Route path="*" element={<Navigate to={user ? (isManager ? ROUTES.MANAGER_DASHBOARD : ROUTES.DASHBOARD) : ROUTES.LOGIN} replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
