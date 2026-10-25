import { useEffect, useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../services/api';
import { Coordinates, NearbyPlace } from '../types';
import { cn } from '../lib/utils';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  Bars3Icon,
  MapPinIcon,
  PhoneIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  WifiIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

interface Props {
  coords: Coordinates | null;
}

type ErrorType = 'timeout' | 'no_results' | 'offline' | 'location' | null;

const MapUpdater = ({ coords }: { coords: Coordinates }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo([coords.lat, coords.lng], 13);
  }, [coords, map]);
  return null;
};

const createUserMarker = () => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity }} class="absolute w-8 h-8 bg-primary/30 rounded-full" />
        <div class="w-4 h-4 bg-primary rounded-full border-2 border-white dark:border-slate-800 shadow-lg" />
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createServiceMarker = (type: string) => {
  const colors: Record<string, string> = {
    hospital: '#06B6D4',
    clinic: '#06B6D4',
    doctors: '#06B6D4',
    police: '#F59E0B',
    fire: '#EF4444',
    pharmacy: '#9CA3AF',
    atm: '#6366F1',
    gas_station: '#22C55E',
    other: '#6B7280',
  };
  const color = colors[type] || colors.other;
  
  return L.divIcon({
    className: 'custom-service-marker',
    html: `
      <div class="relative flex items-center justify-center" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24c0-8.837-7.163-16-16-16z" fill="${color}"/>
          <circle cx="16" cy="14" r="6" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
  });
};

type FilterType = 'all' | 'medical' | 'pharmacy' | 'police' | 'fire' | 'atm' | 'gas_station';

const filters: { type: FilterType; label: string }[] = [
  { type: 'all', label: 'All Services' },
  { type: 'medical', label: 'Hospitals & Clinics' },
  { type: 'pharmacy', label: 'Pharmacies' },
  { type: 'police', label: 'Police' },
  { type: 'fire', label: 'Fire Stations' },
  { type: 'atm', label: 'ATMs & Banks' },
  { type: 'gas_station', label: 'Fuel Stations' },
];

interface ErrorStateProps {
  errorType: ErrorType;
  onRetry: () => void;
}

const ErrorState = ({ errorType, onRetry }: ErrorStateProps) => {
  const getMessage = () => {
    switch (errorType) {
      case 'timeout':
        return {
          icon: ExclamationTriangleIcon,
          title: 'Asset Telemetry Unavailable',
          message: 'Sensor nodes are unresponsive. Try again in a moment.',
          tip: 'Check regional gateway status',
        };
      case 'no_results':
        return {
          icon: MapPinIcon,
          title: 'No assets found in sector',
          message: 'Expand scanning radius or check coordinates.',
          tip: 'Verify target infrastructure ID',
        };
      case 'offline':
        return {
          icon: WifiIcon,
          title: 'No internet connection',
          message: 'Check your network and retry.',
          tip: 'Local caching is disabled',
        };
      case 'location':
        return {
          icon: MapPinIcon,
          title: 'Location unavailable',
          message: 'Enable location access to map nearby structures.',
          tip: 'Required for relative scanning',
        };
      default:
        return {
          icon: ExclamationTriangleIcon,
          title: 'Failed to load telemetry',
          message: 'An unexpected core error occurred.',
          tip: 'Check service logs',
        };
    }
  };

  const { icon: Icon, title, message, tip } = getMessage();

  return (
    <div className="text-center py-6 px-2">
      <Icon className="h-12 w-12 mx-auto mb-3 text-warning" />
      <p className="text-text-primary-light dark:text-text-primary-dark font-semibold text-sm mb-1">
        {title}
      </p>
      <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mb-3">
        {message}
      </p>
      <p className="text-danger text-xs font-medium mb-4">
        {tip}
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <ArrowPathIcon className="w-4 h-4 mr-2" />
        Retry
      </button>
    </div>
  );
};

export const AssetMap = ({ coords }: Props) => {
  const { t } = useTranslation();
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [showPanel, setShowPanel] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingAddresses, setLoadingAddresses] = useState<Record<string, boolean>>({});
  const [resolvedAddresses, setResolvedAddresses] = useState<Record<string, string>>({});
  const mapRef = useRef<L.Map | null>(null);
  const hasRetried = useRef(false);

  const fetchPlaces = () => {
    if (!coords) return;
    
    setLoading(true);
    setErrorType(null);
    
    api.places.getNearby(coords.lat, coords.lng, 5000)
      .then((data) => {
        if (data.length === 0 && !hasRetried.current) {
          hasRetried.current = true;
          setTimeout(() => fetchPlaces(), 2000);
          return;
        }
        setPlaces(data);
        setErrorType(null);
      })
      .catch((err: Error) => {
        console.error('Failed to fetch places:', err);
        
        if (err.message === 'OVERPASS_ALL_MIRRORS_FAILED') {
          setErrorType('timeout');
        } else if (err.message.includes('Failed to fetch') || err.message.includes('Network')) {
          setErrorType('offline');
        } else {
          setErrorType('timeout');
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    hasRetried.current = false;
    fetchPlaces();
  }, [coords]);

  const filteredPlaces = useMemo(() => {
    let result = places;
    if (activeFilter !== 'all') {
      if (activeFilter === 'medical') {
        result = result.filter(p => p.type === 'hospital' || p.type === 'clinic' || p.type === 'doctors');
      } else {
        result = result.filter(p => p.type === activeFilter);
      }
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(query));
    }
    return result;
  }, [places, activeFilter, searchQuery]);

  const flyToPlace = (place: NearbyPlace) => {
    if (mapRef.current && place.lat && place.lng) {
      mapRef.current.flyTo([place.lat, place.lng], 16, { duration: 1 });
    }
  };

  const fetchAddress = async (placeId: string, lat: number, lng: number) => {
    if (loadingAddresses[placeId] || resolvedAddresses[placeId]) return;
    
    setLoadingAddresses(prev => ({ ...prev, [placeId]: true }));
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: { 'User-Agent': 'CrisisGuardApp/1.0' },
        }
      );
      const data = await response.json();
      const address = data.address || {};
      const parts: string[] = [];
      
      if (address.road) parts.push(address.road);
      if (address.suburb) parts.push(address.suburb);
      if (address.city) parts.push(address.city);
      else if (address.town) parts.push(address.town);
      else if (address.village) parts.push(address.village);
      if (address.postcode) parts.push(address.postcode);
      
      const resolvedAddress = parts.length > 0 ? parts.join(', ') : 'Address not available';
      setResolvedAddresses(prev => ({ ...prev, [placeId]: resolvedAddress }));
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      setResolvedAddresses(prev => ({ ...prev, [placeId]: 'Address not available' }));
    } finally {
      setLoadingAddresses(prev => ({ ...prev, [placeId]: false }));
    }
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'hospital':
      case 'clinic':
      case 'doctors':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
      case 'police':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'fire':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      case 'pharmacy':
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
      case 'atm':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'gas_station':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
    }
  };

  const getBadgeLabel = (type: string) => {
    switch (type) {
      case 'hospital': return 'Hospital';
      case 'clinic': return 'Clinic';
      case 'doctors': return 'Doctor';
      case 'police': return 'Police Station';
      case 'fire': return 'Fire Station';
      case 'pharmacy': return 'Pharmacy';
      case 'atm': return 'ATM / Bank';
      case 'gas_station': return 'Fuel Station';
      default: return 'Service';
    }
  };

  if (!coords) {
    return (
      <div className="h-[calc(100vh-140px)] flex items-center justify-center bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark">
        <p className="text-text-secondary-light dark:text-text-secondary-dark">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] rounded-2xl overflow-hidden border border-border-light dark:border-border-dark">
      <MapContainer
        center={[coords.lat, coords.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        ref={mapRef}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        <Marker position={[coords.lat, coords.lng]} icon={createUserMarker()}>
          <Popup>
            <div className="font-semibold text-center p-1">Mobile Command Center</div>
          </Popup>
        </Marker>
        {filteredPlaces.map((place) => (
          place.lat && place.lng ? (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={createServiceMarker(place.type)}
            >
              <Popup>
                <div className="min-w-[180px] p-1">
                  <h3 className="font-bold text-slate-900">{place.title}</h3>
                  <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium border ${getBadgeStyle(place.type)}`}>
                    {getBadgeLabel(place.type)}
                  </span>
                  {place.address ? (
                    <p className="text-sm text-slate-600 mt-1">{place.address}</p>
                  ) : loadingAddresses[place.id] ? (
                    <p className="text-sm text-slate-400 mt-1 italic">Loading address...</p>
                  ) : resolvedAddresses[place.id] ? (
                    <p className="text-sm text-slate-600 mt-1">{resolvedAddresses[place.id]}</p>
                  ) : (
                    <p 
                      className="text-sm text-slate-400 mt-1 cursor-pointer hover:underline"
                      onClick={() => fetchAddress(place.id, place.lat!, place.lng!)}
                    >
                      Tap to load address
                    </p>
                  )}
                  {place.phoneNumber && (
                    <a href={`tel:${place.phoneNumber}`} className="text-primary text-sm flex items-center mt-1">
                      <PhoneIcon className="h-4 w-4 mr-1" /> {place.phoneNumber}
                    </a>
                  )}
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm flex items-center mt-2 hover:underline"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" /> Get Directions
                  </a>
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
        <MapUpdater coords={coords} />
      </MapContainer>

      <AnimatePresence mode="wait">
        {showPanel && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 190, damping: 24, mass: 0.9 }}
            className="absolute top-4 left-4 bottom-4 w-80 z-[400] flex flex-col"
          >
            <div className="flex-1 glass-map-panel rounded-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-white/20 dark:border-white/10">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                    Nearby Services Tracker
                  </h2>
                  <button 
                    onClick={() => setShowPanel(false)} 
                    className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary-light dark:text-text-secondary-dark" />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-white/30 bg-white/30 py-2 pl-9 pr-4 text-sm backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-white/15 dark:bg-slate-900/40"
                  />
                </div>
              </div>

              <div className="p-3 border-b border-white/20 dark:border-white/10">
                <div className="flex gap-2">
                  {filters.map((filter) => (
                    <button
                      key={filter.type}
                      onClick={() => setActiveFilter(filter.type)}
                      className={cn(
                        'px-3 py-1.5 text-xs font-medium rounded-full transition-all',
                        activeFilter === filter.type
                          ? 'bg-primary text-white'
                          : 'border border-white/30 bg-white/30 text-text-secondary-light backdrop-blur-md hover:border-primary/50 dark:border-white/15 dark:bg-slate-900/40 dark:text-text-secondary-dark'
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex space-x-3 rounded-xl border border-white/25 bg-white/25 p-3 backdrop-blur-md dark:border-white/15 dark:bg-slate-900/40"
                      >
                        <div className="h-10 w-10 rounded-lg bg-white/25 animate-pulse dark:bg-white/10" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 rounded bg-white/25 animate-pulse dark:bg-white/10" />
                          <div className="h-3 w-1/2 rounded bg-white/25 animate-pulse dark:bg-white/10" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : errorType ? (
                  <ErrorState errorType={errorType} onRetry={fetchPlaces} />
                ) : filteredPlaces.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPinIcon className="h-10 w-10 mx-auto mb-2 text-text-secondary-light dark:text-text-secondary-dark opacity-30" />
                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">No assets found within scan radius.</p>
                  </div>
                ) : (
                  filteredPlaces.map((place, index) => (
                    <motion.div
                      key={place.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.28 }}
                      onClick={() => flyToPlace(place)}
                      className="cursor-pointer rounded-xl border border-white/25 bg-white/25 p-3 backdrop-blur-md transition-all hover:border-primary/30 hover:bg-white/40 dark:border-white/15 dark:bg-slate-900/40 dark:hover:bg-slate-900/50"
                    >
                      <h3 className="font-semibold text-sm text-text-primary-light dark:text-text-primary-dark mb-1">
                        {place.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getBadgeStyle(place.type)}`}>
                          {getBadgeLabel(place.type)}
                        </span>
                        {place.distance !== undefined && (
                          <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                            {place.distance.toFixed(1)} km
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showPanel && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          onClick={() => setShowPanel(true)}
          className="absolute bottom-4 left-4 z-[400] glass-map-panel rounded-full px-4 py-3 flex items-center space-x-2"
        >
          <Bars3Icon className="h-5 w-5" />
          <span className="font-medium text-sm">Services ({filteredPlaces.length})</span>
        </motion.button>
      )}

      <div className="absolute bottom-4 right-4 z-[400] glass-map-panel rounded-xl px-3 py-2 text-xs">
        <div className="font-medium mb-2 text-text-secondary-light dark:text-text-secondary-dark">Service Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full" />
            <span className="text-text-secondary-light dark:text-text-secondary-dark">Your Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-500 rounded-full" />
            <span className="text-text-secondary-light dark:text-text-secondary-dark">Hospitals & Clinics</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full" />
            <span className="text-text-secondary-light dark:text-text-secondary-dark">Pharmacies</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full" />
            <span className="text-text-secondary-light dark:text-text-secondary-dark">Police Stations</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-danger rounded-full" />
            <span className="text-text-secondary-light dark:text-text-secondary-dark">Fire Stations</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-500 rounded-full" />
            <span className="text-text-secondary-light dark:text-text-secondary-dark">ATMs & Banks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-text-secondary-light dark:text-text-secondary-dark">Fuel Stations</span>
          </div>
        </div>
      </div>
    </div>
  );
};
