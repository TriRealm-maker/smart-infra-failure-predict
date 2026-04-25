import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '../lib/utils';
import {
  HomeIcon,
  MapIcon,
  ChartBarIcon,
  HeartIcon,
  BookOpenIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { path: '/', label: 'nav.dashboard', icon: HomeIcon },
  { path: '/map', label: 'nav.map', icon: MapIcon },
  { path: '/prediction', label: 'nav.prediction', icon: ChartBarIcon },
  { path: '/medical', label: 'nav.medical', icon: HeartIcon },
  { path: '/guides', label: 'nav.guides', icon: BookOpenIcon },
  { path: '/settings', label: 'nav.settings', icon: Cog6ToothIcon },
];

const languages = [
  { code: 'en', label: 'EN', flag: '🇺🇸' },
  { code: 'hi', label: 'HI', flag: '🇮🇳' },
  { code: 'es', label: 'ES', flag: '🇪🇸' },
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
  { code: 'ar', label: 'AR', flag: '🇸🇦' },
];

export function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setShowLangMenu(false);
  };

  return (
    <>
      <nav className="fixed top-3 left-0 right-0 z-[9999] hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <div className="glass rounded-2xl px-4 shadow-card hover:shadow-card-hover transition-all duration-300 border border-white/40 dark:border-white/10">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-glow-primary">
                  <span className="text-white font-bold text-sm">CG</span>
                </div>
                <span className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark">
                  CrisisGuard
                </span>
              </div>

              <div className="flex items-center space-x-1 relative">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:-translate-y-0.5',
                        isActive
                          ? 'text-primary dark:text-primary-light'
                          : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-black/5 dark:hover:bg-white/5'
                      )}
                    >
                      <AnimatePresence mode="wait">
                        {isActive && (
                          <motion.div
                            layoutId="nav-pill"
                            className="absolute inset-0 bg-gradient-to-r from-primary/15 to-purple-500/15 dark:from-primary/25 dark:to-purple-500/20 rounded-xl border border-primary/20 dark:border-primary/30"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                          />
                        )}
                      </AnimatePresence>
                      <span className="relative z-10 flex items-center space-x-2">
                        <item.icon className="w-4 h-4" />
                        <span>{t(item.label)}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>

              <div className="flex items-center space-x-3">
                <div className="relative" ref={langMenuRef}>
                  <button
                    onClick={() => setShowLangMenu(!showLangMenu)}
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <span>🌐</span>
                    <span>{currentLang.label}</span>
                    <ChevronDownIcon className={cn('w-4 h-4 transition-transform', showLangMenu && 'rotate-180')} />
                  </button>
                  <AnimatePresence>
                    {showLangMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 mt-2 w-32 bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark overflow-hidden z-[9999]"
                      >
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={cn(
                              'w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
                              i18n.language === lang.code
                                ? 'text-primary dark:text-primary-light font-medium'
                                : 'text-text-primary-light dark:text-text-primary-dark'
                            )}
                          >
                            <span>{lang.flag}</span>
                            <span>{lang.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <ThemeToggle />

                {user && (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                        {user.name}
                      </span>
                    </div>
                    <button
                      onClick={logout}
                      className="p-2 rounded-lg text-text-secondary-light dark:text-text-secondary-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      title="Logout"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur-xl border-t border-border-light dark:border-border-dark shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'relative flex flex-col items-center justify-center flex-1 h-full transition-colors duration-300',
                  isActive ? 'text-primary dark:text-primary-light' : 'text-text-secondary-light dark:text-text-secondary-dark'
                )}
              >
                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-pill"
                      className="absolute top-0 inset-x-0 h-0.5 bg-primary"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </AnimatePresence>
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">{t(item.label)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
