import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    teacherId: {
      type: String,
      unique: true,
      sparse: true,
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
    photo: {
      type: String,
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
    qualifications: [
      {
        degree: String,
        institution: String,
        year: Number,
      },
    ],
    experience: {
      type: Number, // in years
      default: 0,
    },
    specializations: [
      {
        type: String,
        trim: true,
      },
    ],
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    salary: {
      amount: {
        type: Number,
        default: 0,
      },
      type: {
        type: String,
        enum: ['monthly', 'per_class', 'hourly'],
        default: 'monthly',
      },
    },
    bankDetails: {
      accountName: String,
      accountNumber: String,
      bankName: String,
      ifscCode: String,
    },
    employmentStatus: {
      type: String,
      enum: ['active', 'inactive', 'resigned', 'terminated'],
      default: 'active',
    },
    assignedBatches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch',
      },
    ],
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
teacherSchema.index({ userId: 1 });
teacherSchema.index({ teacherId: 1 });
teacherSchema.index({ employmentStatus: 1 });
teacherSchema.index({ name: 'text' });

// Generate teacher ID before saving
teacherSchema.pre('save', async function () {
  if (!this.teacherId) {
    const year = new Date().getFullYear().toString().slice(-2);
    const count = (await mongoose.models.Teacher.countDocuments()) + 1;
    this.teacherId = `TCH${year}${count.toString().padStart(4, '0')}`;
  }
});

// Find active teachers
teacherSchema.statics.findActive = function () {
  return this.find({ employmentStatus: 'active', deletedAt: null });
};

const Teacher = mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema);

export default Teacher;
