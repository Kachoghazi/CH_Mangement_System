import mongoose from 'mongoose';

export interface IUser {
  _id?: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  profilePictureUrl?: string;
  role: 'Admin' | 'Teacher' | 'Student';
  lastLogin?: Date;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export const userSchema = new mongoose.Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
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
    },
    phone: {
      type: String,
      trim: true,
    },
    profilePictureUrl: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['Admin', 'Teacher', 'Student'],
      default: 'Student',
    },
    lastLogin: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

export const User = mongoose.models?.User || mongoose.model<IUser>('User', userSchema);
