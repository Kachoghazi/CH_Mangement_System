import mongoose from 'mongoose';

const attendanceStudentSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    sessionNumber: {
      type: Number,
    },
    records: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Student',
          required: true,
        },
        status: {
          type: String,
          enum: ['present', 'absent', 'late', 'excused', 'holiday'],
          required: true,
        },
        remarks: String,
        lateMinutes: Number,
      },
    ],
    totalPresent: {
      type: Number,
      default: 0,
    },
    totalAbsent: {
      type: Number,
      default: 0,
    },
    totalLate: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
attendanceStudentSchema.index({ date: 1, batchId: 1 }, { unique: true });
attendanceStudentSchema.index({ batchId: 1 });
attendanceStudentSchema.index({ date: -1 });
attendanceStudentSchema.index({ 'records.studentId': 1 });

// Calculate totals before saving
attendanceStudentSchema.pre('save', function () {
  if (this.records && this.records.length > 0) {
    this.totalPresent = this.records.filter((r) => r.status === 'present').length;
    this.totalAbsent = this.records.filter((r) => r.status === 'absent').length;
    this.totalLate = this.records.filter((r) => r.status === 'late').length;
  }
});

// Find by batch and date
attendanceStudentSchema.statics.findByBatchAndDate = function (batchId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.findOne({
    batchId,
    date: { $gte: startOfDay, $lte: endOfDay },
  });
};

// Get attendance for date range
attendanceStudentSchema.statics.getByDateRange = function (batchId, startDate, endDate) {
  return this.find({
    batchId,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });
};

// Get student attendance summary
attendanceStudentSchema.statics.getStudentSummary = async function (studentId, startDate, endDate) {
  const records = await this.find({
    'records.studentId': studentId,
    date: { $gte: startDate, $lte: endDate },
  });

  let present = 0,
    absent = 0,
    late = 0,
    excused = 0;

  records.forEach((record) => {
    const studentRecord = record.records.find(
      (r) => r.studentId.toString() === studentId.toString(),
    );
    if (studentRecord) {
      switch (studentRecord.status) {
        case 'present':
          present++;
          break;
        case 'absent':
          absent++;
          break;
        case 'late':
          late++;
          break;
        case 'excused':
          excused++;
          break;
      }
    }
  });

  const total = present + absent + late + excused;
  return {
    present,
    absent,
    late,
    excused,
    total,
    attendancePercentage: total > 0 ? (((present + late) / total) * 100).toFixed(2) : 0,
  };
};

const AttendanceStudent =
  mongoose.models.AttendanceStudent || mongoose.model('AttendanceStudent', attendanceStudentSchema);

export default AttendanceStudent;
