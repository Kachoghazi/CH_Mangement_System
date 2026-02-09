import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      unique: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeInvoice',
    },
    studentFeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentFee',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque', 'online', 'other'],
      required: true,
    },
    paymentType: {
      type: String,
      enum: ['admission', 'tuition', 'installment', 'fine', 'other'],
      default: 'tuition',
    },
    transactionId: {
      type: String,
      trim: true,
    },
    reference: {
      type: String,
      trim: true,
    },
    bankName: {
      type: String,
      trim: true,
    },
    chequeNumber: {
      type: String,
      trim: true,
    },
    chequeDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'completed',
    },
    receiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GeneratedDocument',
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
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
paymentSchema.index({ studentId: 1 });
paymentSchema.index({ invoiceId: 1 });
paymentSchema.index({ paymentNumber: 1 });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentMethod: 1 });

// Generate payment number
paymentSchema.pre('save', async function () {
  if (!this.paymentNumber) {
    const today = new Date();
    const year = today.getFullYear().toString();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    const count =
      (await mongoose.models.Payment.countDocuments({
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      })) + 1;
    this.paymentNumber = `PAY${year}${month}${day}${count.toString().padStart(4, '0')}`;
  }
});

// Find by student
paymentSchema.statics.findByStudent = function (studentId) {
  return this.find({ studentId, status: 'completed' }).sort({ paymentDate: -1 });
};

// Get payment summary for date range
paymentSchema.statics.getSummary = async function (startDate, endDate) {
  const payments = await this.find({
    paymentDate: { $gte: startDate, $lte: endDate },
    status: 'completed',
  });

  const summary = {
    total: 0,
    byMethod: {},
    byType: {},
    count: payments.length,
  };

  payments.forEach((payment) => {
    summary.total += payment.amount;

    if (!summary.byMethod[payment.paymentMethod]) {
      summary.byMethod[payment.paymentMethod] = 0;
    }
    summary.byMethod[payment.paymentMethod] += payment.amount;

    if (!summary.byType[payment.paymentType]) {
      summary.byType[payment.paymentType] = 0;
    }
    summary.byType[payment.paymentType] += payment.amount;
  });

  return summary;
};

// Get today's collection
paymentSchema.statics.getTodayCollection = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.aggregate([
    {
      $match: {
        paymentDate: { $gte: today, $lt: tomorrow },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);
};

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export default Payment;
