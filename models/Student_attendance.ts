import mongoose from 'mongoose';

export interface IStudentAttendance {
  _id?: string;
  studentId: string;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'leave';
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const studentAttendanceSchema = new mongoose.Schema<IStudentAttendance>(
  {
    studentId: { type: String, required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent', 'late', 'leave'], required: true },
    remarks: { type: String },
  },
  { timestamps: true },
);

export const StudentAttendance = mongoose.models?.StudentAttendance || mongoose.model<IStudentAttendance>('StudentAttendance', studentAttendanceSchema);
