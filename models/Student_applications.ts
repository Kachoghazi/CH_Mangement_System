import mongoose, { models } from 'mongoose';

export interface IStudentApplication {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  applicationNumber: string;
  cnic: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  address: string;
  educationBackground: string;
  whyJoinBootcamp?: string;
  careerGoals?: string;
  status?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'info_needed';
  adminComment?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const studentApplicationSchema = new mongoose.Schema<IStudentApplication>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    applicationNumber: { type: String, required: true, unique: true },
    cnic: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    address: { type: String, required: true },
    educationBackground: { type: String, required: true },
    whyJoinBootcamp: { type: String },
    careerGoals: { type: String },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'info_needed'],
      default: 'draft',
    },
    adminComment: { type: String },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

studentApplicationSchema.index({ userId: 1 });
studentApplicationSchema.index({ status: 1, createdAt: -1 });

export const StudentApplication =
  models?.StudentApplication ||
  mongoose.model<IStudentApplication>('StudentApplication', studentApplicationSchema);
