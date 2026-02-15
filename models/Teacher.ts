import mongoose, { Document, Model, models } from 'mongoose';

export interface ITeacher extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  subjectsTaught: string[];
  qualifications?: string;
  experience?: number;
  dateOfBirth?: Date;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
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

export interface ITeacherMethods {
  softDelete(): Promise<ITeacher>;
}

export type TeacherModel = Model<ITeacher, object, ITeacherMethods>;

const teacherSchema = new mongoose.Schema<ITeacher, TeacherModel, ITeacherMethods>(
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
    subjectsTaught: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 20;
        },
        message: 'Cannot teach more than 20 subjects',
      },
    },
    qualifications: {
      type: String,
      trim: true,
      maxlength: [500, 'Qualifications cannot exceed 500 characters'],
    },
    experience: {
      type: Number,
      min: [0, 'Experience cannot be negative'],
      max: [50, 'Experience cannot exceed 50 years'],
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

teacherSchema.index({ email: 1 }, { unique: true });
teacherSchema.index({ subjectsTaught: 1 });
teacherSchema.index({ isActive: 1, isDeleted: 1 });
teacherSchema.index({ isDeleted: 1, createdAt: -1 });

teacherSchema.methods.softDelete = async function (): Promise<ITeacher> {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

teacherSchema.pre('find', function () {
  this.where({ isDeleted: { $ne: true } });
});

teacherSchema.pre('findOne', function () {
  this.where({ isDeleted: { $ne: true } });
});

export const Teacher =
  models?.Teacher || mongoose.model<ITeacher, TeacherModel>('Teacher', teacherSchema);
