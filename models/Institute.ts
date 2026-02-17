import mongoose from 'mongoose';

export interface IInstitute {
  _id?: mongoose.Types.ObjectId;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  type?: 'School' | 'College' | 'University' | 'Coaching Center' | 'Other';
  ownedBy: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export const Institute = new mongoose.Schema<IInstitute>(
  {
    name: {
      type: String,
      required: [true, 'Institute name is required'],
      trim: true,
      maxlength: [100, 'Institute name cannot exceed 100 characters'],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [300, 'Address cannot exceed 300 characters'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-]{10,15}$/, 'Please provide a valid phone number'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    website: {
      type: String,
      trim: true,
      match: [
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
        'Please provide a valid website URL',
      ],
    },
    logo: {
      type: String,
    },
    type: {
      type: String,
      enum: {
        values: ['School', 'College', 'University', 'Coaching Center', 'Other'],
        message: '{VALUE} is not a valid institute type',
      },
    },

    ownedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: [true, 'Institute must be owned by a user'],
    },
  },
  { timestamps: true },
);

export const InstituteModel =
  mongoose.models.Institute || mongoose.model<IInstitute>('Institute', Institute);
