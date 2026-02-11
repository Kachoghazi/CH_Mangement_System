import mongoose from 'mongoose';

export interface IBatch {
  _id?: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  name: string;
  startDate: Date;
  endDate: Date;
  capacity: number;
  currentEnrolled: number;
  instructorIds: [mongoose.Types.ObjectId];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt?: Date;
  updatedAt?: Date;
}

const batchSchema = new mongoose.Schema<IBatch>(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    capacity: { type: Number, required: true },
    currentEnrolled: { type: Number, default: 0 },
    instructorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
  },
  { timestamps: true },
);

export const Batch = mongoose.models?.Batch || mongoose.model<IBatch>('Batch', batchSchema);
