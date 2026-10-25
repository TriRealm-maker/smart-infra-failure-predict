import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Coordinates } from '../types';

interface GeolocationResult {
  coords: Coordinates;
  usingFallback: boolean;
}

interface GeolocationContextType {
  coords: Coordinates | null;
  usingFallback: boolean;
  loading: boolean;
}

const FALLBACK_COORDS: Coordinates = { lat: 18.6298, lng: 73.7997 };

const getCurrentPosition = (): Promise<GeolocationResult> => {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      console.log('Geolocation not supported, using fallback');
      resolve({ coords: FALLBACK_COORDS, usingFallback: true });
      return;
    }

    const timeoutId = setTimeout(() => {
      console.log('Geolocation timeout (4s), using fallback');
      resolve({ coords: FALLBACK_COORDS, usingFallback: true });
    }, 4000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        console.log('Geolocation success:', position.coords.latitude, position.coords.longitude);
        resolve({ coords: { lat: position.coords.latitude, lng: position.coords.longitude }, usingFallback: false });
      },
      (error) => {
        clearTimeout(timeoutId);
        console.log('Geolocation error:', {
          code: error.code,
          message: error.message,
        });
        
        let errorMessage: string;
        switch (error.code) {
          case 1:
            errorMessage = 'Permission denied';
            break;
          case 2:
            errorMessage = 'Position unavailable';
            break;
          case 3:
            errorMessage = 'Timeout';
            break;
          default:
            errorMessage = 'Unknown error';
        }
        console.log('Geolocation error type:', errorMessage);
        
        console.log('Using fallback location due to geolocation error');
        resolve({ coords: FALLBACK_COORDS, usingFallback: true });
      },
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 60000 }
    );
  });
};

const GeolocationContext = createContext<GeolocationContextType | undefined>(undefined);

export const GeolocationProvider = ({ children }: { children: ReactNode }) => {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentPosition()
      .then((result) => {
        setCoords(result.coords);
        setUsingFallback(result.usingFallback);
      })
      .catch((err) => {
        console.error('Geolocation failed:', err);
        setCoords(FALLBACK_COORDS);
        setUsingFallback(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <GeolocationContext.Provider value={{ coords, usingFallback, loading }}>
      {children}
    </GeolocationContext.Provider>
  );
};

export const useGeolocation = () => {
  const context = useContext(GeolocationContext);
  if (!context) {
    throw new Error('useGeolocation must be used within a GeolocationProvider');
  }
  return context;
};
