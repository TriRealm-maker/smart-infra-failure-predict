import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../services/api';
import { DisasterType } from '../types';
import { Card, Button } from '../components/ui';
import { cn } from '../lib/utils';
import {
  BookOpenIcon,
  ArrowPathIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

const disasterTypes: { type: DisasterType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'earthquake', label: 'Bridges & Tunnels', icon: EarthquakeIcon },
  { type: 'flood', label: 'Dams & Reservoirs', icon: FloodIcon },
  { type: 'fire', label: 'Power Stations', icon: FireIcon },
  { type: 'hurricane', label: 'High-Rise Bldgs', icon: HurricaneIcon },
  { type: 'tornado', label: 'Sensor Nodes', icon: TornadoIcon },
  { type: 'tsunami', label: 'Road Networks', icon: TsunamiIcon },
];

function EarthquakeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12h4l3-9 4 18 3-9h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FloodIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6c0 0 3-3 6-3s6 3 6 3 3-3 6-3 6 3 6 3M3 12c0 0 3-3 6-3s6 3 6 3 3-3 6-3 6 3 6 3M3 18c0 0 3-3 6-3s6 3 6 3 3-3 6-3 6 3 6 3" strokeLinecap="round" />
    </svg>
  );
}

function FireIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HurricaneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" strokeLinecap="round" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

function TornadoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4 9c0-2 2-4 4-4s4 2 4 4c0 2-2 4-4 4s-4-2-4-4zM4 15c0 2 2 4 4 4s4-2 4-4c0-2-2-4-4-4s-4 2-4 4z" strokeLinecap="round" />
    </svg>
  );
}

function TsunamiIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 18c0-4 4-8 7-8M9 14c0-4 4-6 6-6M3 22h18" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 18c0-3 2-6 5-6 1 0 2 .5 2.5 1M7 14c0-2 2-4 4-4s4 2 4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const colorMap: Record<DisasterType, string> = {
  earthquake: 'bg-amber-500 text-white',
  flood: 'bg-blue-500 text-white',
  fire: 'bg-red-500 text-white',
  hurricane: 'bg-purple-500 text-white',
  tornado: 'bg-gray-500 text-white',
  tsunami: 'bg-cyan-500 text-white',
};

const iconColorMap: Record<DisasterType, string> = {
  earthquake: 'text-amber-500',
  flood: 'text-blue-500',
  fire: 'text-red-500',
  hurricane: 'text-purple-500',
  tornado: 'text-gray-500',
  tsunami: 'text-cyan-500',
};

export const Protocols = () => {
  const { t } = useTranslation();
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterType>('earthquake');
  const [guide, setGuide] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const guideRef = useRef<HTMLDivElement>(null);

  const fetchGuide = () => {
    setLoading(true);
    api.prediction.getGuide(selectedDisaster)
      .then((data) => setGuide(data.guide || ''))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handlePrint = () => {
    const printContent = guideRef.current;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Protocol | ${selectedDisaster}</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 20px; }
              h1 { color: #111; }
              h2 { color: #333; margin-top: 20px; }
              ul { padding-left: 20px; }
              li { margin: 8px 0; }
              .warning { background: #FEF3C7; padding: 12px; border-left: 4px solid #F59E0B; }
              .tip { background: #D1FAE5; padding: 12px; border-left: 4px solid #22C55E; }
            </style>
          </head>
          <body>${printContent.innerHTML}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSaveOffline = () => {
    const blob = new Blob([guide], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const selectedLabel = disasterTypes.find((d) => d.type === selectedDisaster)?.label || selectedDisaster;
    const safeName = selectedLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    a.href = url;
    a.download = `${safeName}-protocol.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto pb-24 md:pb-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark flex items-center">
          <BookOpenIcon className="h-8 w-8 text-primary mr-2" />
          Standard Operating Procedures
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {disasterTypes.map((disaster, index) => {
          const isActive = selectedDisaster === disaster.type;
          const Icon = disaster.icon;
          
          return (
            <motion.button
              key={disaster.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => { setSelectedDisaster(disaster.type); setGuide(''); }}
              className={cn(
                'p-4 rounded-2xl text-center transition-all relative overflow-hidden',
                isActive
                  ? colorMap[disaster.type]
                  : 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:border-primary/50'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                layoutId={`disaster-bg-${disaster.type}`}
                className={cn(
                  'absolute inset-0 transition-opacity',
                  isActive ? 'opacity-100' : 'opacity-0'
                )}
              />
              <div className={cn(
                'relative z-10',
                isActive ? 'text-white' : iconColorMap[disaster.type]
              )}>
                <Icon className="w-10 h-10 mx-auto mb-2" />
                <span className="font-semibold text-sm">
                  {disaster.label}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDisaster}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-white dark:from-surface-dark dark:to-surface-dark p-4 border-b border-border-light dark:border-border-dark">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {(() => {
                    const Icon = disasterTypes.find(d => d.type === selectedDisaster)?.icon;
                    return Icon ? <Icon className={cn('w-6 h-6', iconColorMap[selectedDisaster])} /> : null;
                  })()}
                  <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                    {disasterTypes.find(d => d.type === selectedDisaster)?.label} Protocol
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  {guide && (
                    <>
                      <Button variant="ghost" size="sm" onClick={handlePrint}>
                        <PrinterIcon className="w-4 h-4 mr-1" />
                        Print Protocol
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleSaveOffline}>
                        <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                        Download Offline
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={fetchGuide}
                    disabled={loading}
                    size="sm"
                  >
                    <ArrowPathIcon className={cn('w-4 h-4 mr-1', loading && 'animate-spin')} />
                    {loading ? 'Loading...' : 'Load Protocol'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6" ref={guideRef}>
              {loading ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="w-12 h-12"
                    >
                      <BookOpenIcon className="w-12 h-12 text-primary" />
                    </motion.div>
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="h-4 bg-border-light dark:bg-border-dark rounded animate-pulse"
                        style={{ width: `${100 - i * 10}%` }}
                      />
                    ))}
                  </div>
                </div>
              ) : guide ? (
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mt-6 mb-4">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mt-6 mb-3 flex items-center">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mt-4 mb-2">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4 leading-relaxed">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside space-y-2 mb-4">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside space-y-2 mb-4">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-text-secondary-light dark:text-text-secondary-dark">
                          {children}
                        </li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                          {children}
                        </strong>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-warning bg-warning/10 dark:bg-warning/5 p-4 rounded-r-lg my-4">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {guide}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpenIcon className="w-16 h-16 mx-auto mb-4 text-text-secondary-light dark:text-text-secondary-dark opacity-30" />
                  <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
                    Select an infrastructure type to view its maintenance protocol
                  </p>
                  <Button onClick={fetchGuide}>
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    Load Protocol
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
