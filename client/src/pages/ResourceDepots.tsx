import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { MedicalProfile as MedicalProfileType, MedicalFile } from '../types';
import { Card, Button } from '../components/ui';
import { cn } from '../lib/utils';
import {
  PencilSquareIcon,
  CheckIcon,
  UserCircleIcon,
  PhoneIcon,
  TrashIcon,
  ShareIcon,
  DocumentIcon,
  XMarkIcon,
  ShieldExclamationIcon,
  CloudArrowUpIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { WrenchScrewdriverIcon as WrenchSolidIcon } from '@heroicons/react/24/solid';

const emptyProfile: MedicalProfileType = {
  fullName: '',
  dob: '',
  bloodType: '',
  allergies: '',
  conditions: '',
  medications: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  files: [],
};

const specialties = ['Structural Engineer', 'Electrical', 'Heavy Machinery', 'Concrete', 'Plumbing', 'Diving Team', 'Hazmat', 'General'];

export const ResourceDepots = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<MedicalProfileType>(emptyProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareDuration, setShareDuration] = useState('24');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.medical.getProfile()
      .then((data) => {
        if (data && typeof data === 'object') {
          setProfile({
            ...emptyProfile,
            ...data,
            files: Array.isArray(data.files) ? data.files : [],
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    await api.medical.updateProfile(profile as unknown as Record<string, unknown>);
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (file: File) => {
    const result = await api.medical.uploadFile(file);
    if (result.file) {
      setProfile(prev => ({ ...prev, files: [...(prev.files || []), result.file] }));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const deleteFile = async (fileId: string) => {
    await api.medical.deleteFile(fileId);
    setProfile(prev => ({ ...prev, files: (prev.files || []).filter(f => f.id !== fileId) }));
  };

  const generateShareLink = async () => {
    const result = await api.medical.generateShareLink(parseInt(shareDuration));
    if (result.link) {
      setGeneratedLink(`${window.location.origin}${result.link}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="h-8 bg-border-light dark:bg-border-dark rounded w-1/3 animate-pulse" />
          <div className="h-48 bg-border-light dark:bg-border-dark rounded-2xl animate-pulse" />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto pb-24 md:pb-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark flex items-center">
          <WrenchSolidIcon className="h-8 w-8 text-primary mr-2" />
          Resource Depots & Contractors
        </h2>
        <div className="flex space-x-3">
          {!isEditing && (
            <Button onClick={() => setShowShareModal(true)} className="flex items-center">
              <ShareIcon className="w-4 h-4 mr-2" />
              {t('medical.share')}
            </Button>
          )}
          <Button
            variant={isEditing ? 'primary' : 'secondary'}
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="flex items-center"
          >
            {isEditing ? (
              <>
                <CheckIcon className="w-4 h-4 mr-2" />
                {t('medical.save')}
              </>
            ) : (
              <>
                <PencilSquareIcon className="w-4 h-4 mr-2" />
                {t('medical.edit')}
              </>
            )}
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className={cn(
          'h-2 bg-gradient-to-r from-danger via-red-500 to-danger',
          'transition-all duration-500'
        )} />
        
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-glow-primary">
                {profile.fullName ? (
                  <span className="text-3xl font-bold text-white">
                    {profile.fullName.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <UserCircleIcon className="w-12 h-12 text-white/70" />
                )}
              </div>
              {isEditing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <CloudArrowUpIcon className="w-8 h-8 text-white" />
                  <input type="file" className="hidden" accept="image/*" />
                </label>
              )}
            </div>

            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  name="fullName"
                  value={profile.fullName}
                  onChange={handleChange}
                  placeholder="Enter Depot or Team Name"
                  className="text-2xl md:text-3xl font-bold bg-transparent border-b-2 border-primary focus:outline-none w-full pb-1"
                />
              ) : (
                <h3 className="text-2xl md:text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
                  {profile.fullName || 'Unnamed Team / Depot'}
                </h3>
              )}
              
              <div className="flex flex-wrap items-center gap-3 mt-3">
                {isEditing ? (
                  <select
                    name="bloodType"
                    value={profile.bloodType}
                    onChange={handleChange}
                    className="px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm font-medium"
                  >
                    <option value="">Select Specialty</option>
                    {specialties.map(bt => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                ) : profile.bloodType ? (
                  <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-primary/10 text-primary border border-primary/20">
                    Specialty: {profile.bloodType}
                  </span>
                ) : null}

                {isEditing ? (
                  <input
                    type="date"
                    name="dob"
                    value={profile.dob}
                    onChange={handleChange}
                    className="px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm"
                  />
                ) : profile.dob ? (
                  <span className="px-3 py-1.5 rounded-lg text-sm bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
                    Commission Date: {profile.dob}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark mb-4">
                Depot Details
              </h4>
              <div className="space-y-4">
                <InfoField
                  label="Commission Date"
                  value={profile.dob}
                  isEditing={isEditing}
                  name="dob"
                  onChange={handleChange}
                  type="date"
                />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark mb-4">
                Site Supervisor
              </h4>
              <div className="space-y-4">
                <InfoField
                  label="Supervisor Name"
                  value={profile.emergencyContactName}
                  isEditing={isEditing}
                  name="emergencyContactName"
                  onChange={handleChange}
                />
                <InfoField
                  label="Dispatch Phone"
                  value={profile.emergencyContactPhone}
                  isEditing={isEditing}
                  name="emergencyContactPhone"
                  onChange={handleChange}
                  type="tel"
                />
                {!isEditing && profile.emergencyContactPhone && (
                  <a
                    href={`tel:${profile.emergencyContactPhone}`}
                    className="inline-flex items-center text-success font-medium"
                  >
                    <PhoneIcon className="w-4 h-4 mr-1" />
                    Call Now
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark mb-4">
              Operational Capacity
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CriticalInfoField
                label="Hazmat Capabilities"
                value={profile.allergies}
                isEditing={isEditing}
                name="allergies"
                onChange={handleChange}
                important
              />
              <CriticalInfoField
                label="Equipment Roster"
                value={profile.conditions}
                isEditing={isEditing}
                name="conditions"
                onChange={handleChange}
              />
              <CriticalInfoField
                label="Active Deployments"
                value={profile.medications}
                isEditing={isEditing}
                name="medications"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="mt-8">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark mb-4">
              Certifications & Manuals
            </h4>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'border-2 border-dashed rounded-xl p-6 text-center transition-all',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border-light dark:border-border-dark hover:border-primary/50',
                isEditing && 'cursor-pointer'
              )}
              onClick={() => isEditing && fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileInput}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <DocumentIcon className={cn(
                'w-10 h-10 mx-auto mb-2',
                isDragging ? 'text-primary' : 'text-text-secondary-light dark:text-text-secondary-dark'
              )} />
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                {isEditing ? 'Upload PDF/Images' : 'No documents uploaded'}
              </p>
            </div>

            {profile.files && profile.files.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {profile.files.map((file: MedicalFile) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-between p-3 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark"
                  >
                    <div className="flex items-center space-x-3">
                      <DocumentIcon className="w-8 h-8 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                          {file.name}
                        </p>
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                          {file.uploadDate} • {file.size}
                        </p>
                      </div>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => deleteFile(file.id)}
                        className="p-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-danger transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                  Secure Depot Access
                </h3>
                <button onClick={() => setShowShareModal(false)}>
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              {!generatedLink ? (
                <>
                  <div className="bg-warning/10 dark:bg-warning/5 p-3 rounded-xl mb-4">
                    <p className="text-xs text-warning flex items-start">
                      <ShieldExclamationIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                      Share operational stats with regional command
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="text-sm font-medium mb-2 block">Access Duration</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['1', '12', '24'].map(dur => (
                        <button
                          key={dur}
                          onClick={() => setShareDuration(dur)}
                          className={cn(
                            'py-2 rounded-lg border transition-all',
                            shareDuration === dur
                              ? 'bg-primary text-white border-primary'
                              : 'border-border-light dark:border-border-dark'
                          )}
                        >
                          {dur}h
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button onClick={generateShareLink} className="w-full">
                    Generate Link
                  </Button>
                </>
              ) : (
                <>
                  <div className="bg-surface-light dark:bg-background-dark p-3 rounded-xl break-all font-mono text-sm mb-4 border border-border-light dark:border-border-dark">
                    {generatedLink}
                  </div>
                  <Button
                    onClick={() => { setGeneratedLink(''); setShowShareModal(false); }}
                    className="w-full"
                  >
                    Done
                  </Button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

function InfoField({
  label,
  value,
  isEditing,
  name,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  isEditing: boolean;
  name: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1">
        {label}
      </label>
      {isEditing ? (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      ) : (
        <div className="text-text-primary-light dark:text-text-primary-dark font-medium">
          {value || <span className="text-text-secondary-light dark:text-text-secondary-dark italic">Add info</span>}
        </div>
      )}
    </div>
  );
}

function CriticalInfoField({
  label,
  value,
  isEditing,
  name,
  onChange,
  important,
}: {
  label: string;
  value: string;
  isEditing: boolean;
  name: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  important?: boolean;
}) {
  return (
    <div className={cn(!isEditing && value && important && 'bg-danger/5 dark:bg-danger/10 p-3 rounded-xl')}>
      <label className={cn(
        'block text-xs font-medium mb-1',
        important ? 'text-danger' : 'text-text-secondary-light dark:text-text-secondary-dark'
      )}>
        {label}
      </label>
      {isEditing ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
      ) : value ? (
        <div className={cn(
          'font-semibold whitespace-pre-wrap',
          important ? 'text-danger' : 'text-text-primary-light dark:text-text-primary-dark'
        )}>
          {value}
        </div>
      ) : (
        <span className="text-text-secondary-light dark:text-text-secondary-dark italic text-sm">
          Add info
        </span>
      )}
    </div>
  );
}
