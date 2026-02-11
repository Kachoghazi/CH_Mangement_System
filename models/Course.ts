import mongoose from "mongoose";

export interface ICourse {
  _id?: mongoose.Types.ObjectId;
  code: string;
  title: string;
  description?: string;
  durationUnit: 'week' | 'month';
  durationValue: number;
  price: number;
  registrationFee?: number;
  defaultInstallments?: number;
  capacity: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const courseSchema = new mongoose.Schema<ICourse>(
  {
    code: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    durationUnit: { type: String, enum: ['week', 'month'], required: true },
    durationValue: { type: Number, required: true },
    price: { type: Number, required: true },
    registrationFee: { type: Number },
    defaultInstallments: { type: Number, default: 1 },
    capacity: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Course = mongoose.models?.Course || mongoose.model<ICourse>('Course', courseSchema);
