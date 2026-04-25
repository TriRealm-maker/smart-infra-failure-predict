import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { GeolocationProvider, useGeolocation } from './context/GeolocationContext';
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

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
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

const AuthRoutes = () => {
  const location = useLocation();
  const publicRoutes = ['/verify-email', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route));

  if (isPublicRoute) {
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/verify-email" element={<PageWrapper><VerifyEmailPage /></PageWrapper>} />
          <Route path="/forgot-password" element={<PageWrapper><ForgotPasswordPage /></PageWrapper>} />
          <Route path="/reset-password" element={<PageWrapper><ResetPasswordPage /></PageWrapper>} />
        </Routes>
      </AnimatePresence>
    );
  }

  return null;
};

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthRoutes />
        <LoginPage />
      </>
    );
  }

  return (
    <GeolocationProvider>
      <div className="min-h-screen bg-background-light dark:bg-background-dark pb-20 md:pb-0">
        <Navbar />
        <SOSButton />
        <main className="max-w-7xl mx-auto px-4 py-4 md:pt-20">
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
