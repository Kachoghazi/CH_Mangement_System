import mongoose, { Document, Model, models } from 'mongoose';

export type AnnouncementPriority = 'Low' | 'Normal' | 'High' | 'Urgent';
export type AnnouncementCategory =
  | 'General'
  | 'Academic'
  | 'Event'
  | 'Holiday'
  | 'Exam'
  | 'Fee'
  | 'Other';

export interface IAnnouncementTarget {
  type: 'all' | 'batch' | 'course' | 'specific';
  batches?: mongoose.Types.ObjectId[];
  courses?: mongoose.Types.ObjectId[];
  students?: mongoose.Types.ObjectId[];
}

export interface IAnnouncement extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  batch?: mongoose.Types.ObjectId;
  target?: IAnnouncementTarget;
  postedBy: mongoose.Types.ObjectId;
  postedAt: Date;
  isPinned: boolean;
  priority: AnnouncementPriority;
  category: AnnouncementCategory;
  attachments?: string[];
  expiresAt?: Date;
  isActive: boolean;
  viewCount: number;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAnnouncementMethods {
  softDelete(): Promise<IAnnouncement>;
  incrementViewCount(): Promise<IAnnouncement>;
}

export type AnnouncementModel = Model<IAnnouncement, object, IAnnouncementMethods>;

const announcementTargetSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: {
        values: ['all', 'batch', 'course', 'specific'],
        message: '{VALUE} is not a valid target type',
      },
      default: 'all',
    },
    batches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch',
      },
    ],
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
  },
  { _id: false },
);

const announcementSchema = new mongoose.Schema<
  IAnnouncement,
  AnnouncementModel,
  IAnnouncementMethods
>(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true,
      maxlength: [10000, 'Content cannot exceed 10000 characters'],
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      index: true,
    },
    target: announcementTargetSchema,
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Posted by reference is required'],
      index: true,
    },
    postedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    priority: {
      type: String,
      enum: {
        values: ['Low', 'Normal', 'High', 'Urgent'],
        message: '{VALUE} is not a valid priority',
      },
      default: 'Normal',
    },
    category: {
      type: String,
      enum: {
        values: ['General', 'Academic', 'Event', 'Holiday', 'Exam', 'Fee', 'Other'],
        message: '{VALUE} is not a valid category',
      },
      default: 'General',
      index: true,
    },
    attachments: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 5;
        },
        message: 'Cannot have more than 5 attachments',
      },
    },
    expiresAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: [0, 'View count cannot be negative'],
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

announcementSchema.index({ batch: 1, postedAt: -1 });
announcementSchema.index({ isPinned: -1, postedAt: -1 });
announcementSchema.index({ category: 1, postedAt: -1 });
announcementSchema.index({ isActive: 1, expiresAt: 1 });
announcementSchema.index({ title: 'text', content: 'text' });

announcementSchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

announcementSchema.methods.softDelete = async function (): Promise<IAnnouncement> {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

announcementSchema.methods.incrementViewCount = async function (): Promise<IAnnouncement> {
  this.viewCount += 1;
  return this.save();
};

announcementSchema.pre('find', function () {
  this.where({ isDeleted: { $ne: true } });
});

announcementSchema.pre('findOne', function () {
  this.where({ isDeleted: { $ne: true } });
});

export const Announcement =
  models?.Announcement ||
  mongoose.model<IAnnouncement, AnnouncementModel>('Announcement', announcementSchema);
