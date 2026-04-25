import { Request, Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import MedicalProfile from '../models/MedicalProfile';
import { AuthRequest } from '../middleware/authMiddleware';

export const getMedicalProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    let profile = await MedicalProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    
    if (!profile) {
      profile = new MedicalProfile({ userId: new mongoose.Types.ObjectId(userId) });
      await profile.save();
    }

    res.json({
      fullName: profile.fullName,
      dob: profile.dob,
      bloodType: profile.bloodType,
      allergies: profile.allergies,
      conditions: profile.conditions,
      medications: profile.medications,
      emergencyContactName: profile.emergencyContactName,
      emergencyContactPhone: profile.emergencyContactPhone,
      files: profile.files,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: (error as Error).message });
  }
};

export const updateMedicalProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { fullName, dob, bloodType, allergies, conditions, medications, emergencyContactName, emergencyContactPhone } = req.body;

    let profile = await MedicalProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });

    if (!profile) {
      profile = new MedicalProfile({ userId: new mongoose.Types.ObjectId(userId) });
    }

    profile.fullName = fullName || profile.fullName;
    profile.dob = dob || profile.dob;
    profile.bloodType = bloodType || profile.bloodType;
    profile.allergies = allergies || profile.allergies;
    profile.conditions = conditions || profile.conditions;
    profile.medications = medications || profile.medications;
    profile.emergencyContactName = emergencyContactName || profile.emergencyContactName;
    profile.emergencyContactPhone = emergencyContactPhone || profile.emergencyContactPhone;
    profile.updatedAt = new Date();

    await profile.save();
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: (error as Error).message });
  }
};

export const addMedicalFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const profile = await MedicalProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!profile) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    const newFile = {
      id: crypto.randomUUID(),
      name: req.file.originalname,
      type: req.file.mimetype,
      uploadDate: new Date().toLocaleDateString(),
      size: `${(req.file.size / 1024).toFixed(1)} KB`,
      url: `/uploads/${req.file.filename}`,
    };

    profile.files.push(newFile);
    profile.updatedAt = new Date();
    await profile.save();

    res.json({ message: 'File uploaded successfully', file: newFile });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading file', error: (error as Error).message });
  }
};

export const deleteMedicalFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { fileId } = req.params;

    const profile = await MedicalProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!profile) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    profile.files = profile.files.filter(f => f.id !== fileId);
    profile.updatedAt = new Date();
    await profile.save();

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting file', error: (error as Error).message });
  }
};

export const generateShareLink = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { hours = '24' } = req.body;

    const profile = await MedicalProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!profile) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    const token = crypto.randomUUID();
    const expiry = new Date(Date.now() + parseInt(hours) * 60 * 60 * 1000);

    profile.shareToken = token;
    profile.shareExpiry = expiry;
    await profile.save();

    res.json({ 
      link: `/shared/${token}`,
      expires: expiry.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating link', error: (error as Error).message });
  }
};

export const getSharedProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const profile = await MedicalProfile.findOne({ shareToken: token });
    if (!profile) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    if (profile.shareExpiry && new Date() > profile.shareExpiry) {
      res.status(410).json({ message: 'Link has expired' });
      return;
    }

    res.json({
      fullName: profile.fullName,
      dob: profile.dob,
      bloodType: profile.bloodType,
      allergies: profile.allergies,
      conditions: profile.conditions,
      medications: profile.medications,
      emergencyContactName: profile.emergencyContactName,
      emergencyContactPhone: profile.emergencyContactPhone,
      files: profile.files,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: (error as Error).message });
  }
};
