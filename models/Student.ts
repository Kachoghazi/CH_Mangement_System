import mongoose, { models } from 'mongoose';

export interface IStudent {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  studentCode: string;
  githubUsername?: string;
  emergencyContact: {
    name: string;
    phone: string;
  };
  status: 'active' | 'paused' | 'completed' | 'dropped' | 'pending';
  joinedAt: Date;
  totalBadges: number;
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new mongoose.Schema<IStudent>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentCode: { type: String, required: true, unique: true },
    githubUsername: { type: String },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'dropped', 'pending'],
      default: 'pending',
    },
    joinedAt: { type: Date, default: Date.now },
    totalBadges: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Student = models?.Student || mongoose.model<IStudent>('Student', studentSchema);
