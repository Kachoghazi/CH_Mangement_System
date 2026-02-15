import mongoose, { Document, Model, models } from 'mongoose';

export type RoleInBatch = 'Lead' | 'Assistant' | 'Substitute';

export interface ITeacherAssignment extends Document {
  _id: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  batch: mongoose.Types.ObjectId;
  assignedAt: Date;
  roleInBatch: RoleInBatch;
  isPrimary: boolean;
  subjects?: string[];
  notes?: string;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type TeacherAssignmentModel = Model<ITeacherAssignment>;

const teacherAssignmentSchema = new mongoose.Schema<ITeacherAssignment, TeacherAssignmentModel>(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Teacher reference is required'],
      index: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: [true, 'Batch reference is required'],
      index: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    roleInBatch: {
      type: String,
      enum: {
        values: ['Lead', 'Assistant', 'Substitute'],
        message: '{VALUE} is not a valid role',
      },
      default: 'Assistant',
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    subjects: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
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

teacherAssignmentSchema.index({ teacher: 1, batch: 1 }, { unique: true });
teacherAssignmentSchema.index({ batch: 1, isActive: 1 });
teacherAssignmentSchema.index({ teacher: 1, isActive: 1 });
teacherAssignmentSchema.index({ roleInBatch: 1 });

export const TeacherAssignment =
  models?.TeacherAssignment ||
  mongoose.model<ITeacherAssignment, TeacherAssignmentModel>(
    'TeacherAssignment',
    teacherAssignmentSchema,
  );
