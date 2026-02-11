import mongoose from 'mongoose';
export interface ITeacherAttendance {
  _id?: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  date: Date;
  status: 'present' | 'absent' | 'late';
  createdAt?: Date;
  updatedAt?: Date;
}

const teacherAttendanceSchema = new mongoose.Schema<ITeacherAttendance>(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      required: true,
    },
  },
  { timestamps: true },
);

export const TeacherAttendance = mongoose.model<ITeacherAttendance>(
  'TeacherAttendance',
  teacherAttendanceSchema,
);
