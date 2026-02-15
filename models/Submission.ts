import mongoose, { Document, Model, models } from 'mongoose';

export type SubmissionStatus =
  | 'Pending'
  | 'Submitted'
  | 'Late'
  | 'Graded'
  | 'Returned'
  | 'Resubmitted';

export interface IGrade {
  marksObtained: number;
  percentage?: number;
  grade?: string;
  feedback?: string;
  gradedBy: mongoose.Types.ObjectId;
  gradedAt: Date;
  remarks?: string;
}

export interface ISubmission extends Document {
  _id: mongoose.Types.ObjectId;
  assignment: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  submittedAt?: Date;
  content?: string;
  fileUrl?: string;
  files?: string[];
  status: SubmissionStatus;
  isLate: boolean;
  latePenaltyApplied?: number;
  grade?: IGrade;
  attempts: number;
  lastAttemptAt?: Date;
  teacherComments?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubmissionMethods {
  calculateFinalMarks(): number | null;
}

export type SubmissionModel = Model<ISubmission, object, ISubmissionMethods>;

const gradeSchema = new mongoose.Schema(
  {
    marksObtained: {
      type: Number,
      required: true,
      min: [0, 'Marks cannot be negative'],
    },
    percentage: {
      type: Number,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
    },
    grade: {
      type: String,
      trim: true,
      maxlength: [10, 'Grade cannot exceed 10 characters'],
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: [2000, 'Feedback cannot exceed 2000 characters'],
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    gradedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters'],
    },
  },
  { _id: false },
);

const submissionSchema = new mongoose.Schema<ISubmission, SubmissionModel, ISubmissionMethods>(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Assignment reference is required'],
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
      index: true,
    },
    submittedAt: {
      type: Date,
    },
    content: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
    },
    files: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 10;
        },
        message: 'Cannot upload more than 10 files',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Submitted', 'Late', 'Graded', 'Returned', 'Resubmitted'],
        message: '{VALUE} is not a valid submission status',
      },
      default: 'Pending',
      index: true,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    latePenaltyApplied: {
      type: Number,
      min: [0, 'Penalty cannot be negative'],
      max: [100, 'Penalty cannot exceed 100%'],
    },
    grade: gradeSchema,
    attempts: {
      type: Number,
      default: 0,
      min: [0, 'Attempts cannot be negative'],
    },
    lastAttemptAt: {
      type: Date,
    },
    teacherComments: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comments cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
submissionSchema.index({ assignment: 1, status: 1 });
submissionSchema.index({ student: 1, status: 1 });
submissionSchema.index({ submittedAt: -1 });
submissionSchema.index({ 'grade.gradedAt': -1 });

submissionSchema.virtual('isGraded').get(function () {
  return this.status === 'Graded' && this.grade != null;
});

submissionSchema.methods.calculateFinalMarks = function (): number | null {
  if (!this.grade) return null;
  let finalMarks = this.grade.marksObtained;
  if (this.isLate && this.latePenaltyApplied) {
    finalMarks = finalMarks * (1 - this.latePenaltyApplied / 100);
  }
  return Math.round(finalMarks * 100) / 100;
};

submissionSchema.pre('save', function () {
  if (this.isModified('content') || this.isModified('fileUrl') || this.isModified('files')) {
    if (this.status === 'Pending' || this.status === 'Returned') {
      this.submittedAt = new Date();
      this.status = this.attempts > 0 ? 'Resubmitted' : 'Submitted';
      this.attempts += 1;
      this.lastAttemptAt = new Date();
    }
  }

  if (this.isModified('grade') && this.grade) {
    this.status = 'Graded';
  }
});

export const Submission =
  models?.Submission ||
  mongoose.model<ISubmission, SubmissionModel>('Submission', submissionSchema);
