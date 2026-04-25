import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGeolocation } from '../context/GeolocationContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

type SOSState = 'idle' | 'confirming' | 'sending' | 'success' | 'error';

export function SOSButton() {
  const { user } = useAuth();
  const { coords } = useGeolocation();
  const [state, setState] = useState<SOSState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (state !== 'idle') {
      const timer = setTimeout(() => {
        if (state === 'success' || state === 'error') {
          setState('idle');
          setErrorMessage('');
        }
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const handleSOSClick = () => {
    if (!user) return;
    setState('confirming');
  };

  const handleConfirm = async () => {
    if (!coords) {
      setErrorMessage('Location not available');
      setState('error');
      return;
    }

    setState('sending');

    try {
      const response = await api.sos.sendSOS(coords.lat, coords.lng);
      
      const successFromResults = response.results && 
        Array.isArray(response.results) && 
        response.results.filter((r: { success: boolean }) => r.success).length > 0;
      
      const messageMatch = response.message && response.message.match(/(\d+)\s+succeeded/);
      const successFromMessage = messageMatch && parseInt(messageMatch[1], 10) > 0;

      if (successFromResults || successFromMessage) {
        setState('success');
      } else if (response.message && response.message.includes('No emergency contacts')) {
        setErrorMessage('No emergency contacts configured');
        setState('error');
      } else {
        setErrorMessage('Failed to send to all contacts');
        setState('error');
      }
    } catch (error) {
      setErrorMessage('Failed to send SOS');
      setState('error');
    }
  };

  const handleCancel = () => {
    setState('idle');
    setErrorMessage('');
  };

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleSOSClick}
        className="fixed bottom-24 right-4 z-[10000] w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-full shadow-lg shadow-red-500/50 flex items-center justify-center hover:shadow-red-500/70 transition-shadow"
        title="Send SOS"
      >
        <ExclamationTriangleIcon className="w-8 h-8 md:w-10 md:h-10 text-white" />
      </motion.button>

      <AnimatePresence>
        {state !== 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={state === 'sending' ? undefined : handleCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'w-full max-w-md p-6 rounded-2xl',
                'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark',
                'shadow-xl'
              )}
            >
              {state === 'confirming' && (
                <>
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
                  </div>
                  <h2 className="mb-2 text-xl font-bold text-center text-text-primary-light dark:text-text-primary-dark">
                    Confirm SOS
                  </h2>
                  <p className="mb-6 text-center text-text-secondary-light dark:text-text-secondary-dark">
                    This will immediately send an emergency alert with your current location to all your emergency contacts via email.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      className="flex-1"
                      onClick={handleConfirm}
                    >
                      Send SOS
                    </Button>
                  </div>
                </>
              )}

              {state === 'sending' && (
                <>
                  <div className="flex flex-col items-center justify-center py-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mb-4"
                    />
                    <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                      Sending SOS...
                    </h2>
                  </div>
                </>
              )}

              {state === 'success' && (
                <>
                  <div className="flex flex-col items-center justify-center py-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center justify-center w-16 h-16 mb-4 bg-green-100 dark:bg-green-900/30 rounded-full"
                    >
                      <CheckCircleIcon className="w-8 h-8 text-green-600" />
                    </motion.div>
                    <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                      SOS Sent Successfully
                    </h2>
                    <p className="mt-2 text-center text-text-secondary-light dark:text-text-secondary-dark">
                      Your emergency contacts have been notified with your location.
                    </p>
                  </div>
                </>
              )}

              {state === 'error' && (
                <>
                  <div className="flex flex-col items-center justify-center py-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center justify-center w-16 h-16 mb-4 bg-red-100 dark:bg-red-900/30 rounded-full"
                    >
                      <ExclamationCircleIcon className="w-8 h-8 text-red-600" />
                    </motion.div>
                    <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                      SOS Failed
                    </h2>
                    <p className="mt-2 text-center text-text-secondary-light dark:text-text-secondary-dark">
                      {errorMessage || 'Unable to send SOS. Please try again.'}
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
