import mongoose, { Document, Model, models } from 'mongoose';

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused' | 'HalfDay';

export interface IAttendanceRecord {
  student: mongoose.Types.ObjectId;
  status: AttendanceStatus;
  checkInTime?: Date;
  checkOutTime?: Date;
  remark?: string;
}

export interface IAttendance extends Document {
  _id: mongoose.Types.ObjectId;
  institute: mongoose.Types.ObjectId;
  batch: mongoose.Types.ObjectId;
  date: Date;
  records: IAttendanceRecord[];
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  markedBy: mongoose.Types.ObjectId;
  markedAt: Date;
  isLocked: boolean;
  lockedAt?: Date;
  lockedBy?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendanceMethods {
  calculateStats(): { present: number; absent: number; late: number; excused: number };
  lockAttendance(lockedBy: mongoose.Types.ObjectId): Promise<IAttendance>;
}

export type AttendanceModel = Model<IAttendance, object, IAttendanceMethods>;

const attendanceRecordSchema = new mongoose.Schema(
  {
    institute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institute',
      required: [true, 'Institute reference is required'],
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Present', 'Absent', 'Late', 'Excused', 'HalfDay'],
        message: '{VALUE} is not a valid attendance status',
      },
      required: true,
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    remark: {
      type: String,
      trim: true,
      maxlength: [200, 'Remark cannot exceed 200 characters'],
    },
  },
  { _id: false },
);

const attendanceSchema = new mongoose.Schema<IAttendance, AttendanceModel, IAttendanceMethods>(
  {
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: [true, 'Batch reference is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Attendance date is required'],
      index: true,
    },
    records: {
      type: [attendanceRecordSchema],
      default: [],
      validate: {
        validator: function (v: IAttendanceRecord[]) {
          const studentIds = v.map((r) => r.student.toString());
          return new Set(studentIds).size === studentIds.length;
        },
        message: 'Duplicate student entries in attendance records',
      },
    },
    totalPresent: {
      type: Number,
      default: 0,
      min: [0, 'Count cannot be negative'],
    },
    totalAbsent: {
      type: Number,
      default: 0,
      min: [0, 'Count cannot be negative'],
    },
    totalLate: {
      type: Number,
      default: 0,
      min: [0, 'Count cannot be negative'],
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Marked by teacher reference is required'],
    },
    markedAt: {
      type: Date,
      default: Date.now,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    lockedAt: {
      type: Date,
    },
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

attendanceSchema.index({ batch: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ markedBy: 1, date: -1 });
attendanceSchema.index({ 'records.student': 1, date: -1 });

attendanceSchema.virtual('attendancePercentage').get(function () {
  const total = this.records.length;
  if (total === 0) return 0;
  return Math.round((this.totalPresent / total) * 100);
});

attendanceSchema.methods.calculateStats = function () {
  const stats = { present: 0, absent: 0, late: 0, excused: 0 };
  for (const record of this.records) {
    switch (record.status) {
      case 'Present':
        stats.present++;
        break;
      case 'Absent':
        stats.absent++;
        break;
      case 'Late':
        stats.late++;
        break;
      case 'Excused':
        stats.excused++;
        break;
    }
  }
  return stats;
};

attendanceSchema.methods.lockAttendance = async function (
  lockedBy: mongoose.Types.ObjectId,
): Promise<IAttendance> {
  this.isLocked = true;
  this.lockedAt = new Date();
  this.lockedBy = lockedBy;
  return this.save();
};

attendanceSchema.pre('save', function () {
  const stats = { present: 0, absent: 0, late: 0 };
  for (const record of this.records) {
    switch (record.status) {
      case 'Present':
        stats.present++;
        break;
      case 'Absent':
        stats.absent++;
        break;
      case 'Late':
        stats.late++;
        break;
    }
  }
  this.totalPresent = stats.present;
  this.totalAbsent = stats.absent;
  this.totalLate = stats.late;
});

export const Attendance =
  models?.Attendance ||
  mongoose.model<IAttendance, AttendanceModel>('Attendance', attendanceSchema);
