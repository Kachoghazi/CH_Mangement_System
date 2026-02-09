import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    admissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admission',
    },
    studentId: {
      type: String,
      unique: true,
      sparse: true, // Allow null values
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    guardianName: {
      type: String,
      trim: true,
    },
    guardianPhone: {
      type: String,
      trim: true,
    },
    guardianRelation: {
      type: String,
      trim: true,
    },
    photo: {
      type: String,
    },
    currentBatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
    },
    currentCourseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    enrolledCourses: [
      {
        courseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Course',
        },
        batchId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Batch',
        },
        enrolledAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['active', 'completed', 'dropped'],
          default: 'active',
        },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'inactive', 'passed', 'dropped', 'rejected', 'pending'],
      default: 'active',
    },
    admissionSource: {
      type: String,
      enum: ['self_signup', 'admin_created'],
      default: 'admin_created',
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    previousEducation: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
studentSchema.index({ userId: 1 });
studentSchema.index({ studentId: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ currentBatchId: 1 });
studentSchema.index({ currentCourseId: 1 });
studentSchema.index({ name: 'text' });

// Generate student ID before saving
studentSchema.pre('save', async function () {
  if (this.studentId) return;

  const year = new Date().getFullYear().toString().slice(-2);
  const count = await mongoose.models.Student.countDocuments();

  this.studentId = `STU${year}${(count + 1).toString().padStart(5, '0')}`;
});

// Virtual for full address
studentSchema.virtual('fullAddress').get(function () {
  if (!this.address) return '';
  const parts = [
    this.address.street,
    this.address.city,
    this.address.state,
    this.address.pincode,
  ].filter(Boolean);
  return parts.join(', ');
});

// Find active students
studentSchema.statics.findActive = function () {
  return this.find({ status: 'active', deletedAt: null });
};

// Find students by batch
studentSchema.statics.findByBatch = function (batchId) {
  return this.find({ currentBatchId: batchId, status: 'active', deletedAt: null });
};

// Find students by course
studentSchema.statics.findByCourse = function (courseId) {
  return this.find({ currentCourseId: courseId, status: 'active', deletedAt: null });
};

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);

export default Student;
