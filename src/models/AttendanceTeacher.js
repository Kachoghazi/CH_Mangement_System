import mongoose from 'mongoose';

const attendanceTeacherSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half_day', 'leave', 'holiday'],
      required: true,
    },
    checkInTime: {
      type: String, // Format: "HH:MM"
    },
    checkOutTime: {
      type: String, // Format: "HH:MM"
    },
    workingHours: {
      type: Number, // in hours
      default: 0,
    },
    remarks: {
      type: String,
      trim: true,
    },
    leaveType: {
      type: String,
      enum: ['casual', 'sick', 'earned', 'unpaid', 'other'],
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
attendanceTeacherSchema.index({ teacherId: 1, date: 1 }, { unique: true });
attendanceTeacherSchema.index({ date: -1 });
attendanceTeacherSchema.index({ status: 1 });

// Calculate working hours before saving
attendanceTeacherSchema.pre('save', function (next) {
  if (this.checkInTime && this.checkOutTime) {
    const [inHour, inMin] = this.checkInTime.split(':').map(Number);
    const [outHour, outMin] = this.checkOutTime.split(':').map(Number);
    const inMinutes = inHour * 60 + inMin;
    const outMinutes = outHour * 60 + outMin;
    this.workingHours = (outMinutes - inMinutes) / 60;
  }
  next();
});

// Find by teacher and date
attendanceTeacherSchema.statics.findByTeacherAndDate = function (teacherId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.findOne({
    teacherId,
    date: { $gte: startOfDay, $lte: endOfDay },
  });
};

// Get attendance report for date range
attendanceTeacherSchema.statics.getReport = async function (teacherId, startDate, endDate) {
  const records = await this.find({
    teacherId,
    date: { $gte: startDate, $lte: endDate },
  });

  const summary = {
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    leave: 0,
    totalDays: records.length,
    totalWorkingHours: 0,
  };

  records.forEach((record) => {
    switch (record.status) {
      case 'present':
        summary.present++;
        break;
      case 'absent':
        summary.absent++;
        break;
      case 'late':
        summary.late++;
        break;
      case 'half_day':
        summary.halfDay++;
        break;
      case 'leave':
        summary.leave++;
        break;
    }
    summary.totalWorkingHours += record.workingHours || 0;
  });

  return { records, summary };
};

const AttendanceTeacher =
  mongoose.models.AttendanceTeacher || mongoose.model('AttendanceTeacher', attendanceTeacherSchema);

export default AttendanceTeacher;
