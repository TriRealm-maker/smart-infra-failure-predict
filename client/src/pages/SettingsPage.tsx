import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { EmergencyContact } from '../types';
import { Button } from '../components/ui';
import { cn } from '../lib/utils';
import {
  PlusIcon,
  TrashIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

const emptyContact: EmergencyContact = {
  name: '',
  phone: '',
  email: '',
};

export const SettingsPage = () => {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api.sos.getContacts()
      .then((data) => {
        if (data.contacts && Array.isArray(data.contacts)) {
          setContacts(data.contacts);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAddContact = () => {
    if (contacts.length >= 5) {
      setMessage({ type: 'error', text: 'Maximum 5 emergency contacts allowed' });
      return;
    }
    setContacts([...contacts, { ...emptyContact }]);
  };

  const handleRemoveContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const handleContactChange = (index: number, field: keyof EmergencyContact, value: string) => {
    const newContacts = [...contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setContacts(newContacts);
  };

  const handleSave = async () => {
    const validContacts = contacts.filter(c => c.name && c.phone && c.email);
    
    if (validContacts.length === 0 && contacts.length > 0) {
      setMessage({ type: 'error', text: 'Please fill in all fields for contacts or remove empty ones' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await api.sos.saveContacts(validContacts);
      if (response.contacts) {
        setContacts(response.contacts);
        setMessage({ type: 'success', text: 'Emergency contacts saved successfully!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save contacts. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Settings
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mt-1">
            Manage your emergency contacts for SOS alerts
          </p>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                Emergency Contacts
              </h2>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Add up to 5 contacts who will be notified during an SOS emergency
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddContact}
              disabled={contacts.length >= 5}
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'flex items-center gap-2 p-4 mb-4 rounded-lg',
                message.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              )}
            >
              {message.type === 'success' ? (
                <CheckCircleIcon className="w-5 h-5" />
              ) : (
                <ExclamationCircleIcon className="w-5 h-5" />
              )}
              {message.text}
            </motion.div>
          )}

          <div className="space-y-4">
            {contacts.length === 0 ? (
              <div className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark">
                <p>No emergency contacts added yet.</p>
                <p className="text-sm mt-1">Click "Add" to add your first contact.</p>
              </div>
            ) : (
              contacts.map((contact, index) => (
                <div
                  key={index}
                  className="p-4 bg-background-light dark:bg-background-dark rounded-xl border border-border-light dark:border-border-dark"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                          Name
                        </label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary-light dark:text-text-secondary-dark" />
                          <input
                            type="text"
                            value={contact.name}
                            onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                            placeholder="Contact name"
                            className="w-full pl-10 pr-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light/50 dark:placeholder:text-text-secondary-dark/50 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                          Phone
                        </label>
                        <div className="relative">
                          <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary-light dark:text-text-secondary-dark" />
                          <input
                            type="tel"
                            value={contact.phone}
                            onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                            placeholder="Phone number"
                            className="w-full pl-10 pr-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light/50 dark:placeholder:text-text-secondary-dark/50 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                          Email
                        </label>
                        <div className="relative">
                          <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary-light dark:text-text-secondary-dark" />
                          <input
                            type="email"
                            value={contact.email}
                            onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                            placeholder="Email address"
                            className="w-full pl-10 pr-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light/50 dark:placeholder:text-text-secondary-dark/50 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveContact(index)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Remove contact"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={saving}
              disabled={contacts.length === 0}
            >
              Save Contacts
            </Button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
          <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
            Important Note
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Your emergency contacts will receive an email with your GPS location and a Google Maps link when you trigger an SOS alert. Make sure your contacts know they may receive an emergency alert.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
