import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    durationMonths: {
      type: Number,
      required: true,
      min: 1,
    },
    durationUnit: {
      type: String,
      enum: ['months', 'days'],
      default: 'months',
    },
    feeStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeStructure',
    },
    totalFee: {
      type: Number,
      default: 0,
    },
    admissionFee: {
      type: Number,
      default: 0,
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
    eligibility: {
      type: String,
      trim: true,
    },
    syllabus: {
      type: String,
      trim: true,
    },
    maxStudents: {
      type: Number,
      default: 0, // 0 means unlimited
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    thumbnail: {
      type: String,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Indexes
courseSchema.index({ name: 1 });
courseSchema.index({ code: 1 });
courseSchema.index({ isActive: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ name: 'text', description: 'text' });

// Generate code before saving if not exists
courseSchema.pre('save', async function () {
  if (!this.code) {
    const prefix = this.name.substring(0, 3).toUpperCase();
    const count = (await mongoose.models.Course.countDocuments()) + 1;
    this.code = `${prefix}${count.toString().padStart(3, '0')}`;
  }
});

// Find active courses
courseSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

// Virtual for duration in human readable format
courseSchema.virtual('durationText').get(function () {
  const months = this.durationMonths || 0;
  const days = this.durationDays || 0;
  let text = '';
  if (months > 0) text += `${months} month${months > 1 ? 's' : ''}`;
  if (days > 0) text += ` ${days} day${days > 1 ? 's' : ''}`;
  return text.trim();
});

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

export default Course;
