import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { MedicalProfile } from '../types';
import { HeartIcon, ExclamationTriangleIcon, UserCircleIcon, PhoneIcon, DocumentIcon } from '@heroicons/react/24/solid';

export const SharedProfilePage = () => {
  const { token } = useParams<{ token: string }>();
  const [profile, setProfile] = useState<MedicalProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.medical.getSharedProfile(token)
        .then((data) => {
          if (data.message) {
            setError(data.message);
          } else {
            setProfile(data);
          }
        })
        .catch(() => setError('Failed to load profile'))
        .finally(() => setLoading(false));
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0b1020] via-[#111a34] to-[#070a14]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-12 w-12 rounded-full border-4 border-red-400/70 border-t-transparent"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0b1020] via-[#111a34] to-[#070a14] p-4">
        <div className="surface-premium max-w-md p-8 text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="mb-2 text-xl font-bold text-slate-800 dark:text-white">Link Expired</h1>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1020] via-[#111a34] to-[#070a14] p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl"
      >
        <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/90 shadow-xl dark:bg-slate-800/90">
          <div className="bg-red-50 dark:bg-red-900/20 p-6 border-b border-red-100 dark:border-red-900/30">
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                <HeartIcon className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Medical Emergency ID</h1>
                <p className="text-sm text-slate-500">Shared by CrisisGuard User</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-start space-x-4">
              <UserCircleIcon className="h-6 w-6 text-slate-400 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{profile.fullName || 'Unknown'}</h3>
                <div className="flex space-x-3 mt-1">
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm font-bold">
                    Blood: {profile.bloodType || '--'}
                  </span>
                  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-sm">
                    DOB: {profile.dob || '--'}
                  </span>
                </div>
              </div>
            </div>

            {profile.emergencyContactPhone && (
              <div className="flex items-start space-x-4">
                <PhoneIcon className="h-6 w-6 text-green-500 mt-1" />
                <div>
                  <p className="text-sm text-slate-500">Emergency Contact</p>
                  <p className="font-medium text-slate-800 dark:text-white">{profile.emergencyContactName}</p>
                  <a href={`tel:${profile.emergencyContactPhone}`} className="text-green-600 font-bold">
                    {profile.emergencyContactPhone}
                  </a>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl">
                <p className="text-sm font-bold text-red-700 dark:text-red-300 mb-1">⚠️ Allergies</p>
                <p className="text-slate-800 dark:text-white">{profile.allergies || 'None'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">💊 Conditions</p>
                <p className="text-slate-800 dark:text-white">{profile.conditions || 'None'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">💉 Medications</p>
                <p className="text-slate-800 dark:text-white">{profile.medications || 'None'}</p>
              </div>
            </div>

            {profile.files && profile.files.length > 0 && (
              <div>
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">📎 Documents</p>
                <div className="space-y-2">
                  {profile.files.map((file) => (
                    <div key={file.id} className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <DocumentIcon className="h-5 w-5 text-slate-400" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
