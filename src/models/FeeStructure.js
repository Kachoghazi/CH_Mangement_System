import mongoose from 'mongoose';

const feeStructureSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    admissionFee: {
      type: Number,
      default: 0,
    },
    installments: [
      {
        label: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        dueAfterDays: {
          type: Number,
          default: 0, // Days after admission
        },
        dueDate: {
          type: Date, // Specific date if applicable
        },
      },
    ],
    lateFee: {
      type: {
        type: String,
        enum: ['fixed', 'percentage', 'per_day'],
        default: 'fixed',
      },
      amount: {
        type: Number,
        default: 0,
      },
      maxAmount: {
        type: Number,
        default: 0, // 0 means no cap
      },
      gracePeriodDays: {
        type: Number,
        default: 0,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    academicYear: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
feeStructureSchema.index({ courseId: 1 });
feeStructureSchema.index({ isActive: 1 });
feeStructureSchema.index({ name: 1 });

// Find by course
feeStructureSchema.statics.findByCourse = function (courseId) {
  return this.find({ courseId, isActive: true });
};

const FeeStructure =
  mongoose.models.FeeStructure || mongoose.model('FeeStructure', feeStructureSchema);

export default FeeStructure;
