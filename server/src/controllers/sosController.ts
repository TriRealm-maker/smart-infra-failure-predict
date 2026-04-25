import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import User from '../models/User';
import { sendSOSEmail } from '../services/emailService';

interface SOSPayload {
  lat: number;
  lng: number;
  timestamp: string;
}

interface ContactPayload {
  name: string;
  phone: string;
  email: string;
}

export const getContacts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select('emergencyContacts');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ contacts: user.emergencyContacts || [] });
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const saveContacts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { contacts } = req.body as { contacts: ContactPayload[] };

    if (!Array.isArray(contacts)) {
      res.status(400).json({ message: 'Contacts must be an array' });
      return;
    }

    if (contacts.length > 5) {
      res.status(400).json({ message: 'Maximum 5 emergency contacts allowed' });
      return;
    }

    for (const contact of contacts) {
      if (!contact.name || !contact.phone || !contact.email) {
        res.status(400).json({ message: 'Each contact must have name, phone, and email' });
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contact.email)) {
        res.status(400).json({ message: `Invalid email format: ${contact.email}` });
        return;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user?.id,
      { emergencyContacts: contacts },
      { new: true }
    ).select('emergencyContacts');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ message: 'Emergency contacts saved successfully', contacts: user.emergencyContacts });
  } catch (error) {
    console.error('Error saving emergency contacts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const sendSOS = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lat, lng, timestamp } = req.body as SOSPayload;

    if (lat === undefined || lng === undefined || !timestamp) {
      res.status(400).json({ message: 'Missing required fields: lat, lng, timestamp' });
      return;
    }

    const user = await User.findById(req.user?.id).select('name emergencyContacts');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (!user.emergencyContacts || user.emergencyContacts.length === 0) {
      res.status(400).json({ message: 'No emergency contacts configured' });
      return;
    }

    const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
    const formattedTimestamp = new Date(timestamp).toLocaleString();

    const results = await Promise.allSettled(
      user.emergencyContacts.map(async (contact) => {
        await sendSOSEmail(contact.email, user.name, lat, lng, mapsLink, formattedTimestamp);
        return { email: contact.email, success: true };
      })
    );

    const response = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          email: user.emergencyContacts[index].email,
          success: false,
          error: result.reason?.message || 'Unknown error',
        };
      }
    });

    const successCount = response.filter((r) => r.success).length;
    const failureCount = response.filter((r) => !r.success).length;

    res.json({
      message: `SOS sent: ${successCount} succeeded, ${failureCount} failed`,
      results,
    });
  } catch (error) {
    console.error('Error sending SOS:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
