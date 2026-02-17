import mongoose, { Document, Model, models } from 'mongoose';

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface IBatch extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  course: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  daysOfWeek: DayOfWeek[];
  timings: string;
  capacity?: number;
  currentEnrolled: number;
  isActive: boolean;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  venue?: string;
  description?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBatchMethods {
  softDelete(): Promise<IBatch>;
  hasAvailableSeats(): boolean;
}

export type BatchModel = Model<IBatch, object, IBatchMethods>;

const batchSchema = new mongoose.Schema<IBatch, BatchModel, IBatchMethods>(
  {
    name: {
      type: String,
      required: [true, 'Batch name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    daysOfWeek: {
      type: [String],
      enum: {
        values: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        message: '{VALUE} is not a valid day',
      },
      default: [],
    },
    timings: {
      type: String,
      trim: true,
      maxlength: [100, 'Timings cannot exceed 100 characters'],
    },
    capacity: {
      type: Number,
      min: [1, 'Capacity must be at least 1'],
    },
    currentEnrolled: {
      type: Number,
      default: 0,
      min: [0, 'Enrolled count cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: {
        values: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'upcoming',
      index: true,
    },
    venue: {
      type: String,
      trim: true,
      maxlength: [200, 'Venue cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
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

batchSchema.index({ course: 1, status: 1 });
batchSchema.index({ startDate: 1, endDate: 1 });
batchSchema.index({ isActive: 1, isDeleted: 1 });
batchSchema.index({ name: 'text' });

batchSchema.virtual('availableSeats').get(function (this: IBatch) {
  if (!this.capacity) return null;
  return Math.max(0, this.capacity - this.currentEnrolled);
});

batchSchema.virtual('isFull').get(function (this: IBatch) {
  if (!this.capacity) return false;
  return this.currentEnrolled >= this.capacity;
});

batchSchema.methods.softDelete = async function (this: IBatch): Promise<IBatch> {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

batchSchema.methods.hasAvailableSeats = function (this: IBatch): boolean {
  if (!this.capacity) return true;
  return this.currentEnrolled < this.capacity;
};

batchSchema.pre('find', function () {
  this.where({ isDeleted: { $ne: true } });
});

batchSchema.pre('findOne', function () {
  this.where({ isDeleted: { $ne: true } });
});

export const Batch = models?.Batch || mongoose.model<IBatch, BatchModel>('Batch', batchSchema);
