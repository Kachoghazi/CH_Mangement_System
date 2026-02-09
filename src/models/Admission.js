import mongoose from 'mongoose';

const admissionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
    },
    admissionNumber: {
      type: String,
      unique: true,
    },
    admittedAt: {
      type: Date,
      default: Date.now,
    },
    academicYear: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentApplication',
    },
    status: {
      type: String,
      enum: ['active', 'transferred', 'cancelled', 'completed'],
      default: 'active',
    },
    feeDiscount: {
      amount: {
        type: Number,
        default: 0,
      },
      percentage: {
        type: Number,
        default: 0,
      },
      reason: String,
    },
    documents: [
      {
        name: String,
        url: String,
        verified: {
          type: Boolean,
          default: false,
        },
      },
    ],
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
admissionSchema.index({ studentId: 1 });
admissionSchema.index({ courseId: 1 });
admissionSchema.index({ batchId: 1 });
admissionSchema.index({ admissionNumber: 1 });
admissionSchema.index({ academicYear: 1 });
admissionSchema.index({ status: 1 });

// Generate admission number
admissionSchema.pre('save', async function () {
  if (!this.admissionNumber) {
    const year = new Date().getFullYear().toString();
    const count =
      (await mongoose.models.Admission.countDocuments({
        academicYear: this.academicYear,
      })) + 1;
    this.admissionNumber = `ADM${year}${count.toString().padStart(5, '0')}`;
  }
});

// Get current academic year
admissionSchema.statics.getCurrentAcademicYear = function () {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // Academic year typically starts in July/August
  if (month >= 6) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

const Admission = mongoose.models.Admission || mongoose.model('Admission', admissionSchema);

export default Admission;
