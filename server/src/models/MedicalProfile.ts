import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicalFile {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
  url: string;
}

export interface IMedicalProfile extends Document {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  dob: string;
  bloodType: string;
  allergies: string;
  conditions: string;
  medications: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  files: IMedicalFile[];
  shareToken?: string;
  shareExpiry?: Date;
  updatedAt: Date;
}

const medicalFileSchema = new Schema<IMedicalFile>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  uploadDate: { type: String, required: true },
  size: { type: String, required: true },
  url: { type: String, required: true },
});

const medicalProfileSchema = new Schema<IMedicalProfile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  fullName: { type: String, default: '' },
  dob: { type: String, default: '' },
  bloodType: { type: String, default: '' },
  allergies: { type: String, default: '' },
  conditions: { type: String, default: '' },
  medications: { type: String, default: '' },
  emergencyContactName: { type: String, default: '' },
  emergencyContactPhone: { type: String, default: '' },
  files: [medicalFileSchema],
  shareToken: { type: String },
  shareExpiry: { type: Date },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IMedicalProfile>('MedicalProfile', medicalProfileSchema);
