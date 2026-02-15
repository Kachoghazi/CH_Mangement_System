import mongoose, { Document, Model, models } from 'mongoose';

export type AssignmentType = 'Homework' | 'Test' | 'Quiz' | 'Project' | 'Classwork' | 'Lab';

export interface IAssignment extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  batch: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  dueDate: Date;
  totalMarks: number;
  passingMarks?: number;
  type: AssignmentType;
  attachmentUrl?: string;
  attachments?: string[];
  instructions?: string;
  isPublished: boolean;
  publishedAt?: Date;
  allowLateSubmission: boolean;
  lateSubmissionDeadline?: Date;
  lateSubmissionPenalty?: number;
  isDeleted: boolean;
  deletedAt?: Date;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAssignmentMethods {
  softDelete(): Promise<IAssignment>;
  isOverdue(): boolean;
}

export type AssignmentModel = Model<IAssignment, object, IAssignmentMethods>;

const assignmentSchema = new mongoose.Schema<IAssignment, AssignmentModel, IAssignmentMethods>(
  {
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: [true, 'Batch reference is required'],
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Created by teacher reference is required'],
      index: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true,
    },
    totalMarks: {
      type: Number,
      required: [true, 'Total marks is required'],
      min: [0, 'Total marks cannot be negative'],
    },
    passingMarks: {
      type: Number,
      min: [0, 'Passing marks cannot be negative'],
      validate: {
        validator: function (this: IAssignment, value: number) {
          return !value || value <= this.totalMarks;
        },
        message: 'Passing marks cannot exceed total marks',
      },
    },
    type: {
      type: String,
      enum: {
        values: ['Homework', 'Test', 'Quiz', 'Project', 'Classwork', 'Lab'],
        message: '{VALUE} is not a valid assignment type',
      },
      required: [true, 'Assignment type is required'],
      index: true,
    },
    attachmentUrl: {
      type: String,
    },
    attachments: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 10;
        },
        message: 'Cannot have more than 10 attachments',
      },
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: [2000, 'Instructions cannot exceed 2000 characters'],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
    allowLateSubmission: {
      type: Boolean,
      default: false,
    },
    lateSubmissionDeadline: {
      type: Date,
    },
    lateSubmissionPenalty: {
      type: Number,
      min: [0, 'Penalty cannot be negative'],
      max: [100, 'Penalty cannot exceed 100%'],
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

assignmentSchema.index({ batch: 1, dueDate: 1 });
assignmentSchema.index({ batch: 1, type: 1 });
assignmentSchema.index({ isPublished: 1, dueDate: 1 });
assignmentSchema.index({ title: 'text', description: 'text' });

assignmentSchema.virtual('isOpen').get(function () {
  const now = new Date();
  if (this.allowLateSubmission && this.lateSubmissionDeadline) {
    return now <= this.lateSubmissionDeadline;
  }
  return now <= this.dueDate;
});

assignmentSchema.methods.isOverdue = function (): boolean {
  return new Date() > this.dueDate;
};

assignmentSchema.methods.softDelete = async function (): Promise<IAssignment> {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

assignmentSchema.pre('save', function () {
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

assignmentSchema.pre('find', function () {
  this.where({ isDeleted: { $ne: true } });
});

assignmentSchema.pre('findOne', function () {
  this.where({ isDeleted: { $ne: true } });
});

export const Assignment =
  models?.Assignment ||
  mongoose.model<IAssignment, AssignmentModel>('Assignment', assignmentSchema);
