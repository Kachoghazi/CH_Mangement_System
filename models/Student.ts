import mongoose, { models } from 'mongoose';

export interface IStudent {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rollNumber: string;
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
  isDeleted: boolean;
  deletedAt?: Date;
  studentAt: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new mongoose.Schema<IStudent>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9-]+$/, 'Roll number can only contain letters, numbers, and hyphens'],
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
    studentAt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institute',
      required: [true, 'Student must be associated with an institute'],
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
export const Student = models?.Student || mongoose.model<IStudent>('Student', studentSchema);
