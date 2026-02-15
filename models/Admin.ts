import mongoose, { Document, Model, models } from 'mongoose';

export interface IAdmin extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: 'admin' | 'superadmin';
  isActive: boolean;
  refreshToken?: string;
  lastLogin?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdminMethods {
  softDelete(): Promise<IAdmin>;
}

export type AdminModel = Model<IAdmin, object, IAdminMethods>;

const adminSchema = new mongoose.Schema<IAdmin, AdminModel, IAdminMethods>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-]{10,15}$/, 'Please provide a valid phone number'],
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'superadmin'],
        message: '{VALUE} is not a valid role',
      },
      default: 'admin',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    lastLogin: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

adminSchema.index({ email: 1 }, { unique: true });
adminSchema.index({ role: 1, isActive: 1 });
adminSchema.index({ isDeleted: 1, createdAt: -1 });

adminSchema.methods.softDelete = async function (): Promise<IAdmin> {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

adminSchema.pre('find', function () {
  this.where({ isDeleted: { $ne: true } });
});

adminSchema.pre('findOne', function () {
  this.where({ isDeleted: { $ne: true } });
});

export const Admin = models?.Admin || mongoose.model<IAdmin, AdminModel>('Admin', adminSchema);
