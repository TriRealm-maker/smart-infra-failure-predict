import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IEmergencyContact {
  name: string;
  phone: string;
  email: string;
}

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  isVerified: boolean;
  verificationToken: string | undefined;
  verificationTokenExpiry: Date | undefined;
  resetPasswordToken: string | undefined;
  resetPasswordTokenExpiry: Date | undefined;
  emergencyContacts: IEmergencyContact[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    default: undefined,
  },
  verificationTokenExpiry: {
    type: Date,
    default: undefined,
  },
  resetPasswordToken: {
    type: String,
    default: undefined,
  },
  resetPasswordTokenExpiry: {
    type: Date,
    default: undefined,
  },
  emergencyContacts: {
    type: [{
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
    }],
    default: [],
    validate: {
      validator: function(v: IEmergencyContact[]) {
        return v.length <= 5;
      },
      message: 'Maximum 5 emergency contacts allowed',
    },
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
