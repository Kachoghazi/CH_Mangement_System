import mongoose, { Document, Model, models } from 'mongoose';

export type TeacherAttendanceStatus = 'Present' | 'Absent' | 'Late' | 'OnLeave' | 'HalfDay';

export interface ITeacherAttendance extends Document {
  _id: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  date: Date;
  status: TeacherAttendanceStatus;
  checkInTime?: Date;
  checkOutTime?: Date;
  workingHours?: number;
  leaveType?: 'Sick' | 'Casual' | 'Annual' | 'Unpaid' | 'Emergency';
  leaveApproved?: boolean;
  leaveApprovedBy?: mongoose.Types.ObjectId;
  remark?: string;
  markedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type TeacherAttendanceModel = Model<ITeacherAttendance>;

const teacherAttendanceSchema = new mongoose.Schema<ITeacherAttendance, TeacherAttendanceModel>(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Teacher reference is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Attendance date is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Present', 'Absent', 'Late', 'OnLeave', 'HalfDay'],
        message: '{VALUE} is not a valid attendance status',
      },
      required: [true, 'Attendance status is required'],
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    workingHours: {
      type: Number,
      min: [0, 'Working hours cannot be negative'],
      max: [24, 'Working hours cannot exceed 24'],
    },
    leaveType: {
      type: String,
      enum: {
        values: ['Sick', 'Casual', 'Annual', 'Unpaid', 'Emergency'],
        message: '{VALUE} is not a valid leave type',
      },
    },
    leaveApproved: {
      type: Boolean,
    },
    leaveApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    remark: {
      type: String,
      trim: true,
      maxlength: [300, 'Remark cannot exceed 300 characters'],
    },
    markedBy: {
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

teacherAttendanceSchema.index({ teacher: 1, date: 1 }, { unique: true });
teacherAttendanceSchema.index({ date: -1 });
teacherAttendanceSchema.index({ status: 1, date: -1 });

teacherAttendanceSchema.pre('save', function (next) {
  if (this.checkInTime && this.checkOutTime) {
    const diff = this.checkOutTime.getTime() - this.checkInTime.getTime();
    this.workingHours = Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
  }
  next();
});

export const TeacherAttendance =
  models?.TeacherAttendance ||
  mongoose.model<ITeacherAttendance, TeacherAttendanceModel>(
    'TeacherAttendance',
    teacherAttendanceSchema,
  );
