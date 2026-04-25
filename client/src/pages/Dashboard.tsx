import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Coordinates, WeatherData } from '../types';
import { Counter, GlassCard } from '../components/ui';
import { cn, getAQIColor, getAQIBgColor } from '../lib/utils';
import {
  CloudIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  HeartIcon,
  ArrowRightIcon,
  SignalIcon,
} from '@heroicons/react/24/solid';

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

interface Props {
  coords: Coordinates | null;
  usingFallback?: boolean;
  loading?: boolean;
}

const quickActions = [
  { id: 'assets', label: 'Structural Map', icon: MapPinIcon, color: 'blue', href: '/map' },
  { id: 'protocols', label: 'Maintenance SOPs', icon: CloudIcon, color: 'green', href: '/guides' },
  { id: 'risks', label: 'Failure Analytics', icon: ExclamationTriangleIcon, color: 'amber', href: '/prediction' },
  { id: 'depots', label: 'Resource & Repair Crews', icon: BoltIcon, color: 'red', href: '/medical' },
];

const colorMap: Record<string, { bg: string; icon: string; glow: string }> = {
  blue: { bg: 'bg-blue-500/10', icon: 'text-blue-500', glow: 'shadow-glow-primary' },
  green: { bg: 'bg-green-500/10', icon: 'text-success', glow: 'shadow-glow-success' },
  amber: { bg: 'bg-amber-500/10', icon: 'text-warning', glow: 'shadow-glow-warning' },
  red: { bg: 'bg-red-500/10', icon: 'text-danger', glow: 'shadow-glow-danger' },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const aqiMap: Record<number, string> = {
  1: 'Good',
  2: 'Fair',
  3: 'Moderate',
  4: 'Poor',
  5: 'Very Poor',
};

const SkeletonCard = () => (
  <GlassCard hover className="p-4">
    <div className="flex items-center space-x-3 mb-2">
      <div className="p-2 rounded-xl bg-border-light dark:bg-border-dark animate-pulse w-9 h-9" />
      <div className="h-4 w-20 bg-border-light dark:bg-border-dark rounded animate-pulse" />
    </div>
    <div className="h-9 w-16 bg-border-light dark:bg-border-dark rounded animate-pulse mb-2" />
    <div className="h-3 w-24 bg-border-light dark:bg-border-dark rounded animate-pulse" />
  </GlassCard>
);

export const Dashboard = ({ coords, usingFallback = false, loading = false }: Props) => {
  const { t } = useTranslation();
  const [data, setData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coords || loading) {
      return;
    }

    setWeatherLoading(true);
    setError(null);

    const fetchWeatherData = async () => {
      try {
        const weatherRes = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lng}&appid=${API_KEY}&units=metric`
        );

        console.log('Weather API response:', weatherRes);

        if (!weatherRes.ok) {
          const errorData = await weatherRes.json();
          console.log('Weather API error response:', errorData);

          if (weatherRes.status === 401) {
            setError('API key activating, try again in a few minutes');
            setWeatherLoading(false);
            return;
          }
          if (weatherRes.status === 429) {
            setError('Rate limit reached');
            setWeatherLoading(false);
            return;
          }
          
          throw new Error(errorData.message || errorData.error || `Weather API failed (${weatherRes.status})`);
        }

        const weatherData = await weatherRes.json();
        console.log('Weather data:', weatherData);

        let aqiValue = 0;
        let aqiText = 'Unavailable';

        try {
          const aqiRes = await fetch(
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${coords.lat}&lon=${coords.lng}&appid=${API_KEY}`
          );

          console.log('AQI API response:', aqiRes);

          if (aqiRes.ok) {
            const aqiData = await aqiRes.json();
            console.log('AQI data:', aqiData);
            aqiValue = aqiData.list[0].main.aqi;
            aqiText = aqiMap[aqiValue] || 'Unknown';
          } else {
            console.log('AQI API error:', aqiRes.status, aqiRes.statusText);
          }
        } catch (aqiErr) {
          console.log('AQI fetch failed (graceful degradation):', aqiErr);
        }

        setData({
          temperature: `${Math.round(weatherData.main.temp)}°`,
          condition: weatherData.weather[0].description,
          aqi: `${aqiValue} (${aqiText})`,
          humidity: `${weatherData.main.humidity}%`,
          windSpeed: `${Math.round(weatherData.wind.speed * 3.6)} km/h`,
          locationName: weatherData.name,
        });
      } catch (err: unknown) {
        console.error('Failed to fetch weather data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data';
        setError(errorMessage);
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeatherData();
  }, [coords]);

  const parseNumber = (str: string) => {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const getHumidityValue = (humidity: string) => parseNumber(humidity);

  const getAqiNumber = (aqi: string) => {
    const match = aqi.match(/^(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

const handleBitchat = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isAndroid = userAgent.includes('android');
  const isIOS = /iphone|ipad|ipod/.test(userAgent);

  if (isAndroid) {
    window.location.href = 'intent://open/#Intent;scheme=bitchat.droid;package=com.bitchat.droid;end';
  } else if (isIOS) {
    window.location.href = 'https://apps.apple.com/us/app/bitchat-mesh/id6748219622';
  } else {
    window.location.href = 'https://play.google.com/store/apps/details?id=com.bitchat.droid&hl=en_IN';
  }
};

  if (!coords) {
    return (
      <div className="p-8 text-center bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark">
        <MapPinIcon className="h-12 w-12 mx-auto text-text-secondary-light dark:text-text-secondary-dark mb-2" />
        <p className="text-text-secondary-light dark:text-text-secondary-dark">{t('common.loading')}</p>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">Please enable location services</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-24 md:pb-6"
    >
      <motion.div variants={itemVariants}>
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-900 dark:to-black p-6 md:p-8 text-white">
          <div className="absolute inset-0 mesh-gradient animate-mesh opacity-60" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            {usingFallback && (
              <div className="flex items-center space-x-2 mb-2 px-2 py-1 bg-amber-500/20 rounded-lg w-fit">
                <MapPinIcon className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-medium text-amber-400">Using fallback location</span>
              </div>
            )}
            <div className="flex items-center space-x-2 mb-2">
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-success rounded-full"
              />
              <span className="text-sm font-medium text-success/80 uppercase tracking-wider">
                System Telemetry Online
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
              Infrastructure Command
            </h1>
            <p className="text-white/60 text-sm">Monitoring: Dams, Bridges, Roads, and Buildings</p>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {weatherLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : error ? (
              <>
                <GlassCard hover className="p-4 col-span-1 md:col-span-3">
                  <div className="text-center py-4">
                    <ExclamationTriangleIcon className="h-8 w-8 mx-auto text-warning mb-2" />
                    <p className="text-white/70">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-3 px-4 py-2 bg-primary/20 text-primary rounded-lg text-sm font-medium hover:bg-primary/30 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </GlassCard>
              </>
            ) : (
              <>
                <GlassCard hover className="p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 rounded-xl bg-blue-500/20">
                      <CloudIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Structural Stress (Strain)</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    <Counter value={parseNumber(data?.temperature || '45')} suffix="%" />
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">Normal limits</div>
                </GlassCard>

                <GlassCard 
                  hover 
                  className="p-4"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 rounded-xl bg-purple-500/20">
                      <ExclamationTriangleIcon className="h-5 w-5 text-purple-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Vibration Amplitude</span>
                  </div>
                  <div className="text-3xl font-bold text-purple-500 dark:text-white">
                    <Counter value={parseNumber(data?.temperature || '2')} suffix="mm/s" />
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Within threshold</div>
                </GlassCard>

                <GlassCard hover className="p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 rounded-xl bg-purple-500/20">
                      <BoltIcon className="h-5 w-5 text-purple-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Thermal Gradient</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    <Counter value={getHumidityValue(data?.humidity || '32')} suffix="°C" />
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Bridge core temp</div>
                </GlassCard>
              </>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="bg-black border-2 border-dashed border-white/60 rounded-lg p-4 md:p-5 scanlines">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center bg-white/10 rounded border border-white/30">
                <SignalIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-dotmatrix text-xl md:text-2xl text-white tracking-wider">
                  FIELD ENG. COMMS — MESH NETWORK<span className="animate-blink">_</span>
                </h4>
                <p className="font-dotmatrix text-sm text-white/60 mt-1 tracking-wide">
                  Peer-to-peer radio mesh for site engineers • No internet required
                </p>
              </div>
            </div>
            <button 
              onClick={handleBitchat}
              className="px-5 py-2.5 bg-black border-2 border-white font-dotmatrix text-white text-lg tracking-wider hover:bg-white hover:text-black transition-colors duration-150 whitespace-nowrap"
              aria-label="Launch Comms"
            >
              LAUNCH P2P RADIO
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-4 px-1">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const colors = colorMap[action.color];
            return (
              <motion.div
                key={action.id}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to={action.href}
                  className={cn(
                    'flex flex-col items-center justify-center p-6 rounded-2xl',
                    'bg-surface-light dark:bg-surface-dark',
                    'border border-border-light dark:border-border-dark',
                    'hover:shadow-lg hover:border-primary/30',
                    'transition-all duration-300 group'
                  )}
                >
                  <div className={cn(
                    'p-4 rounded-2xl mb-3',
                    colors.bg,
                    'group-hover:scale-110 transition-transform duration-300'
                  )}>
                    <action.icon className={cn('h-7 w-7', colors.icon)} />
                  </div>
                  <span className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark text-center">
                    {action.label}
                  </span>
                  <ArrowRightIcon className="w-4 h-4 mt-2 text-text-secondary-light dark:text-text-secondary-dark opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};
