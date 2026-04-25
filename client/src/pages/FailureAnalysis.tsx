import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { Coordinates } from '../types';
import { Card, RiskBadge, Button } from '../components/ui';
import { cn } from '../lib/utils';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  CalendarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface Props {
  coords: Coordinates | null;
}

interface PredictionData {
  riskLevel: string;
  threats: { name: string; description: string }[];
  recommendations: string[];
  assetType?: 'building' | 'bridge' | 'tower';
  workerSafety?: {
    level: 'Safe' | 'Caution' | 'Restricted' | 'Hazardous';
    advisory: string;
  };
  weatherSnapshot?: {
    condition: string;
    temperatureC: number | null;
    humidityPercent: number | null;
    windSpeedKmh: number | null;
    aqiIndex: number | null;
    aqiLabel: string;
  };
}

type AssetType = 'building' | 'bridge' | 'tower';

const threatIcons: Record<string, string> = {
  structural_fatigue: '🏗️',
  corrosion: '🧪',
  overload: '⚖️',
  seismic: '🌍',
  thermal_stress: '🌡️',
  vibration: '〰️',
  water_damage: '💧',
  default: '⚙️',
};

export const FailureAnalysis = ({ coords }: Props) => {
  const { t } = useTranslation();
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assetType, setAssetType] = useState<AssetType>('building');

  const fetchPrediction = (selectedAssetType: AssetType = assetType) => {
    if (!coords) return;
    setLoading(true);
    setError(null);
    api.prediction.get(coords.lat, coords.lng, selectedAssetType)
      .then((data) => {
        setPrediction(data || null);
      })
      .catch((err) => {
        setError('Failed to process telemetry');
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (coords) fetchPrediction();
  }, [coords, assetType]);

  const getRiskLevel = (level: string): 'low' | 'medium' | 'high' => {
    const l = level.toLowerCase();
    if (l === 'critical' || l === 'high') return 'high';
    if (l === 'medium') return 'medium';
    return 'low';
  };

  const getThreatIcon = (name: string): string => {
    const key = name.toLowerCase();
    return threatIcons[key] || threatIcons.default;
  };

  if (!coords) {
    return (
      <Card className="p-8 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-text-secondary-light dark:text-text-secondary-dark mb-2" />
        <p className="text-text-secondary-light dark:text-text-secondary-dark">{t('common.loading')}</p>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
          Failure Analytics Engine
        </h1>
        <div className="flex items-center gap-3">
          <select
            value={assetType}
            onChange={(event) => setAssetType(event.target.value as AssetType)}
            className="px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-sm text-text-primary-light dark:text-text-primary-dark"
            aria-label="Asset type"
          >
            <option value="building">Building</option>
            <option value="bridge">Bridge</option>
            <option value="tower">Tower</option>
          </select>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchPrediction(assetType)}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <ArrowPathIcon className={cn('h-4 w-4', loading && 'animate-spin')} />
            Run Diagnostics
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-text-secondary-light dark:text-text-secondary-dark">
        <div className="flex items-center gap-2">
          <MapPinIcon className="h-5 w-5" />
          <span className="text-sm font-mono">
            {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          <span className="text-sm">{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {loading && (
        <Card className="p-12 text-center">
          <SparklesIcon className="h-12 w-12 mx-auto text-primary animate-pulse mb-4" />
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Analyzing sensor telemetry...
          </p>
        </Card>
      )}

      {error && (
        <Card className="p-8 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <p className="text-red-500">{error}</p>
          <Button variant="secondary" onClick={() => fetchPrediction(assetType)} className="mt-4">
            Try Again
          </Button>
        </Card>
      )}

      {prediction && !loading && !error && (
        <>
          {prediction.workerSafety && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                Worker Safety Index
              </h2>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Level: <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">{prediction.workerSafety.level}</span>
                </div>
                <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Asset: <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">{(prediction.assetType || assetType).toUpperCase()}</span>
                </div>
              </div>
              <p className="mt-3 text-text-primary-light dark:text-text-primary-dark">{prediction.workerSafety.advisory}</p>
              {prediction.weatherSnapshot && (
                <div className="mt-4 grid gap-2 md:grid-cols-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  <span>AQI: {prediction.weatherSnapshot.aqiIndex ?? '--'} ({prediction.weatherSnapshot.aqiLabel})</span>
                  <span>Temp: {prediction.weatherSnapshot.temperatureC ?? '--'}°C</span>
                  <span>Wind: {prediction.weatherSnapshot.windSpeedKmh ?? '--'} km/h</span>
                </div>
              )}
            </Card>
          )}

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                Structural Integrity Assessment
              </h2>
              <RiskBadge level={getRiskLevel(prediction.riskLevel)} />
            </div>

            {prediction.threats && prediction.threats.length > 0 && (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {prediction.threats.map((threat, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getThreatIcon(threat.name)}</span>
                      <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                        {threat.name}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {threat.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {prediction.recommendations && prediction.recommendations.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                Maintenance Recommendations
              </h2>
              <ul className="space-y-3">
                {prediction.recommendations.map((rec, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-text-primary-light dark:text-text-primary-dark"
                  >
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                      {index + 1}
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </motion.div>
  );
};
