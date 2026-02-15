import mongoose, { Document, Model, models } from 'mongoose';

export interface IStudent extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  rollNumber: string;
  email?: string;
  password: string;
  phone?: string;
  parentPhone?: string;
  dateOfBirth?: Date;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship?: string;
  };
  profileImage?: string;
  joiningDate: Date;
  isActive: boolean;
  refreshToken?: string;
  lastLogin?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudentMethods {
  softDelete(): Promise<IStudent>;
}

export type StudentModel = Model<IStudent, object, IStudentMethods>;

const studentSchema = new mongoose.Schema<IStudent, StudentModel, IStudentMethods>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9-]+$/, 'Roll number can only contain letters, numbers, and hyphens'],
    },
    email: {
      type: String,
      sparse: true,
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
    parentPhone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-]{10,15}$/, 'Please provide a valid phone number'],
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: {
        values: ['Male', 'Female', 'Other'],
        message: '{VALUE} is not a valid gender',
      },
    },
    address: {
      type: String,
      trim: true,
      maxlength: [300, 'Address cannot exceed 300 characters'],
    },
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relationship: { type: String, trim: true },
    },
    profileImage: {
      type: String,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

studentSchema.index({ rollNumber: 1 }, { unique: true });
studentSchema.index({ email: 1 }, { sparse: true });
studentSchema.index({ phone: 1 }, { sparse: true });
studentSchema.index({ isActive: 1, isDeleted: 1 });
studentSchema.index({ isDeleted: 1, createdAt: -1 });
studentSchema.index({ fullName: 'text' });

let rollNumberCounter = 1000;

studentSchema.pre('save', async function () {
  if (this.isNew && !this.rollNumber) {
    const year = new Date().getFullYear().toString().slice(-2);
    rollNumberCounter += 1;
    this.rollNumber = `STU-${year}-${rollNumberCounter.toString().padStart(4, '0')}`;
  }
});

studentSchema.methods.softDelete = async function (): Promise<IStudent> {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

studentSchema.pre('find', function () {
  this.where({ isDeleted: { $ne: true } });
});

studentSchema.pre('findOne', function () {
  this.where({ isDeleted: { $ne: true } });
});

export const Student =
  models?.Student || mongoose.model<IStudent, StudentModel>('Student', studentSchema);
