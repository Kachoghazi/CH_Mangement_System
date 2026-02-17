import mongoose, { Document, Model, models } from 'mongoose';

export interface ITeacher {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  teacherAt: mongoose.Types.ObjectId;
  subjectsTaught: string[];
  qualifications?: string;
  experience?: number;
  dateOfBirth?: Date;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  joiningDate: Date;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const teacherSchema = new mongoose.Schema<ITeacher>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    teacherAt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institute',
      required: [true, 'Teacher must be associated with an institute'],
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

export const Teacher = models?.Teacher || mongoose.model<ITeacher>('Teacher', teacherSchema);
