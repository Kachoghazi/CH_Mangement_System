import mongoose from 'mongoose';

const studentFeeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    admissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admission',
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    // Snapshot of fee structure at the time of assignment
    feeStructureSnapshot: {
      feeStructureId: mongoose.Schema.Types.ObjectId,
      name: String,
      totalAmount: Number,
      admissionFee: Number,
      installments: [
        {
          label: String,
          amount: Number,
          dueAfterDays: Number,
          dueDate: Date,
        },
      ],
      lateFee: {
        type: String,
        amount: Number,
        maxAmount: Number,
        gracePeriodDays: Number,
      },
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },
    discountReason: {
      type: String,
      trim: true,
    },
    fineAmount: {
      type: Number,
      default: 0,
    },
    fineReason: {
      type: String,
      trim: true,
    },
    totalPayable: {
      type: Number,
      required: true,
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    totalDue: {
      type: Number,
      default: function () {
        return this.totalPayable - this.totalPaid;
      },
    },
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'overdue'],
      default: 'pending',
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
studentFeeSchema.index({ studentId: 1 });
studentFeeSchema.index({ admissionId: 1 });
studentFeeSchema.index({ status: 1 });
studentFeeSchema.index({ courseId: 1 });

// Update status and due amount
studentFeeSchema.methods.updatePaymentStatus = function () {
  this.totalDue = this.totalPayable - this.totalPaid;
  if (this.totalDue <= 0) {
    this.status = 'paid';
  } else if (this.totalPaid > 0) {
    this.status = 'partial';
  } else {
    this.status = 'pending';
  }
  return this.save();
};

// Add payment
studentFeeSchema.methods.addPayment = function (amount) {
  this.totalPaid += amount;
  return this.updatePaymentStatus();
};

// Find by student
studentFeeSchema.statics.findByStudent = function (studentId) {
  return this.find({ studentId });
};

// Find pending fees
studentFeeSchema.statics.findPending = function () {
  return this.find({ status: { $in: ['pending', 'partial', 'overdue'] } });
};

const StudentFee = mongoose.models.StudentFee || mongoose.model('StudentFee', studentFeeSchema);

export default StudentFee;
