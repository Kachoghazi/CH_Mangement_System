import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
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
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    credits: {
      type: Number,
      default: 0,
    },
    totalClasses: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
subjectSchema.index({ courseId: 1 });
subjectSchema.index({ name: 1, courseId: 1 });

// Find subjects by course
subjectSchema.statics.findByCourse = function (courseId) {
  return this.find({ courseId, isActive: true });
};

const Subject = mongoose.models.Subject || mongoose.model('Subject', subjectSchema);

export default Subject;
