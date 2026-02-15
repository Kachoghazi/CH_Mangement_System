import mongoose, { Document, Model, models } from 'mongoose';

export interface ICourse extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  code: string;
  description?: string;
  level?: string;
  grade?: string;
  durationUnit: 'week' | 'month' | 'year';
  durationValue: number;
  price: number;
  registrationFee?: number;
  defaultInstallments?: number;
  capacity?: number;
  prerequisites?: string[];
  syllabus?: string;
  imageUrl?: string;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICourseMethods {
  softDelete(): Promise<ICourse>;
}

export type CourseModel = Model<ICourse, object, ICourseMethods>;

const courseSchema = new mongoose.Schema<ICourse, CourseModel, ICourseMethods>(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    code: {
      type: String,
      required: [true, 'Course code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9-]+$/, 'Code can only contain letters, numbers, and hyphens'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    level: {
      type: String,
      trim: true,
      enum: {
        values: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
        message: '{VALUE} is not a valid level',
      },
    },
    grade: {
      type: String,
      trim: true,
    },
    durationUnit: {
      type: String,
      enum: {
        values: ['week', 'month', 'year'],
        message: '{VALUE} is not a valid duration unit',
      },
      required: [true, 'Duration unit is required'],
    },
    durationValue: {
      type: Number,
      required: [true, 'Duration value is required'],
      min: [1, 'Duration must be at least 1'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    registrationFee: {
      type: Number,
      default: 0,
      min: [0, 'Registration fee cannot be negative'],
    },
    defaultInstallments: {
      type: Number,
      default: 1,
      min: [1, 'Installments must be at least 1'],
      max: [24, 'Installments cannot exceed 24'],
    },
    capacity: {
      type: Number,
      min: [1, 'Capacity must be at least 1'],
    },
    prerequisites: {
      type: [String],
      default: [],
    },
    syllabus: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
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

courseSchema.index({ code: 1 }, { unique: true });
courseSchema.index({ isActive: 1, isDeleted: 1 });
courseSchema.index({ title: 'text', description: 'text' });
courseSchema.index({ level: 1, grade: 1 });

courseSchema.virtual('fullDuration').get(function () {
  return `${this.durationValue} ${this.durationUnit}${this.durationValue > 1 ? 's' : ''}`;
});

courseSchema.methods.softDelete = async function (): Promise<ICourse> {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

courseSchema.pre('find', function () {
  this.where({ isDeleted: { $ne: true } });
});

courseSchema.pre('findOne', function () {
  this.where({ isDeleted: { $ne: true } });
});

export const Course =
  models?.Course || mongoose.model<ICourse, CourseModel>('Course', courseSchema);
