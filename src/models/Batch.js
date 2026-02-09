import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      uppercase: true,
      sparse: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
    },
    assistantTeachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    schedule: {
      days: [
        {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        },
      ],
      startTime: {
        type: String, // Format: "HH:MM"
      },
      endTime: {
        type: String, // Format: "HH:MM"
      },
      timezone: {
        type: String,
        default: 'Asia/Kolkata',
      },
    },
    room: {
      type: String,
      trim: true,
    },
    maxStudents: {
      type: Number,
      default: 30,
    },
    currentStrength: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    isActive: {
      type: Boolean,
      default: true,
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
batchSchema.index({ courseId: 1 });
batchSchema.index({ teacherId: 1 });
batchSchema.index({ status: 1 });
batchSchema.index({ startDate: 1 });
batchSchema.index({ isActive: 1 });

// Generate batch code
batchSchema.pre('save', async function () {
  if (this.code || !this.courseId) return;

  const course = await mongoose.models.Course.findById(this.courseId);
  const prefix = course?.code || 'BAT';

  const count = await mongoose.models.Batch.countDocuments({
    courseId: this.courseId,
  });

  const year = new Date().getFullYear().toString().slice(-2);

  this.code = `${prefix}-${year}-${(count + 1).toString().padStart(2, '0')}`;
});

// Update status based on dates
batchSchema.methods.updateStatus = function () {
  const now = new Date();
  if (this.startDate > now) {
    this.status = 'upcoming';
  } else if (this.endDate && this.endDate < now) {
    this.status = 'completed';
  } else {
    this.status = 'ongoing';
  }
  return this.save();
};

// Find active batches
batchSchema.statics.findActive = function () {
  return this.find({ isActive: true, status: { $in: ['upcoming', 'ongoing'] } });
};

// Find batches by course
batchSchema.statics.findByCourse = function (courseId) {
  return this.find({ courseId, isActive: true });
};

// Find batches by teacher
batchSchema.statics.findByTeacher = function (teacherId) {
  return this.find({
    $or: [{ teacherId }, { assistantTeachers: teacherId }],
    isActive: true,
  });
};

// Check if batch has space
batchSchema.virtual('hasSpace').get(function () {
  return this.maxStudents === 0 || this.currentStrength < this.maxStudents;
});

// Get schedule display text
batchSchema.virtual('scheduleText').get(function () {
  if (!this.schedule?.days?.length) return 'Not scheduled';
  const days = this.schedule.days.map((d) => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ');
  const time =
    this.schedule.startTime && this.schedule.endTime
      ? `${this.schedule.startTime} - ${this.schedule.endTime}`
      : '';
  return `${days}${time ? ' | ' + time : ''}`;
});

const Batch = mongoose.models.Batch || mongoose.model('Batch', batchSchema);

export default Batch;
