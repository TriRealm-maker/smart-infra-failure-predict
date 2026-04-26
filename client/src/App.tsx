import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { GeolocationProvider, useGeolocation } from './context/GeolocationContext';
import { CinematicLoader } from './components/CinematicLoader';
import { Navbar } from './components/Navbar';
import { SOSButton } from './components/SOSButton';
import { Dashboard } from './pages/Dashboard';
import { AssetMap } from './pages/AssetMap';
import { FailureAnalysis } from './pages/FailureAnalysis';
import { ResourceDepots } from './pages/ResourceDepots';
import { Protocols } from './pages/Protocols';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { SharedProfilePage } from './pages/SharedProfilePage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import './i18n';

const publicRoutes = ['/verify-email', '/forgot-password', '/reset-password'];

const pageVariants = {
  initial: { opacity: 0, y: 18, scale: 0.992, filter: 'blur(6px)' },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.56, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.995,
    filter: 'blur(4px)',
    transition: { duration: 0.34, ease: [0.4, 0.1, 0.2, 1] },
  },
};

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="min-h-[calc(100vh-10rem)] motion-page"
  >
    {children}
  </motion.div>
);

const DashboardPage = () => {
  const { coords, usingFallback, loading } = useGeolocation();
  return <Dashboard coords={coords} usingFallback={usingFallback} loading={loading} />;
};

const MapPageContent = () => {
  const { coords } = useGeolocation();
  return <AssetMap coords={coords} />;
};

const PredictionPageContent = () => {
  const { coords } = useGeolocation();
  return <FailureAnalysis coords={coords} />;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><DashboardPage /></PageWrapper>} />
        <Route path="/map" element={<PageWrapper><MapPageContent /></PageWrapper>} />
        <Route path="/prediction" element={<PageWrapper><PredictionPageContent /></PageWrapper>} />
        <Route path="/medical" element={<PageWrapper><ResourceDepots /></PageWrapper>} />
        <Route path="/guides" element={<PageWrapper><Protocols /></PageWrapper>} />
        <Route path="/settings" element={<PageWrapper><SettingsPage /></PageWrapper>} />
        <Route path="/shared/:token" element={<PageWrapper><SharedProfilePage /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

const PublicAuthRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/verify-email" element={<PageWrapper><VerifyEmailPage /></PageWrapper>} />
        <Route path="/forgot-password" element={<PageWrapper><ForgotPasswordPage /></PageWrapper>} />
        <Route path="/reset-password" element={<PageWrapper><ResetPasswordPage /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const isPublicRoute = publicRoutes.some((route) => location.pathname.startsWith(route));

  if (loading) {
    return <CinematicLoader />;
  }

  if (!user) {
    return isPublicRoute ? <PublicAuthRoutes /> : <LoginPage />;
  }

  return (
    <GeolocationProvider>
      <div className="relative min-h-screen overflow-x-clip bg-background-light dark:bg-background-dark pb-20 md:pb-0">
        <motion.div
          className="pointer-events-none fixed left-0 right-0 top-0 z-[9998] h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent"
          animate={{ x: ['-120%', '120%'] }}
          transition={{ duration: 4.6, repeat: Infinity, ease: 'linear' }}
        />
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 premium-grid opacity-25 dark:opacity-15" />
          <div className="absolute inset-0 ambient-grid opacity-45 dark:opacity-15" />
          <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-primary/10 blur-[90px] dark:bg-primary/20" />
          <div className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-purple-500/10 blur-[120px] dark:bg-purple-500/20" />
          <div className="absolute -bottom-40 left-1/3 h-[24rem] w-[24rem] rounded-full bg-cyan-400/10 blur-[110px] dark:bg-cyan-400/20" />
        </div>
        <Navbar />
        <SOSButton />
        <main className="relative z-10 mx-auto max-w-7xl px-4 py-4 md:pt-24">
          <AnimatedRoutes />
        </main>
      </div>
    </GeolocationProvider>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
