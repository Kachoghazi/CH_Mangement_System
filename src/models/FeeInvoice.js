import mongoose from 'mongoose';

const feeInvoiceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    studentFeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentFee',
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    installmentLabel: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    items: [
      {
        description: String,
        amount: Number,
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
    subTotal: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    fine: {
      type: Number,
      default: 0,
    },
    amount: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'overdue', 'cancelled'],
      default: 'pending',
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    paidAt: {
      type: Date,
    },
    paymentMeta: {
      method: {
        type: String,
        enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque', 'online', 'other'],
      },
      reference: String,
      transactionId: String,
      receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
      },
    },
    pdfId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GeneratedDocument',
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
feeInvoiceSchema.index({ studentId: 1 });
feeInvoiceSchema.index({ studentFeeId: 1 });
feeInvoiceSchema.index({ invoiceNumber: 1 });
feeInvoiceSchema.index({ status: 1 });
feeInvoiceSchema.index({ dueDate: 1 });
feeInvoiceSchema.index({ invoiceDate: -1 });

// Generate invoice number
feeInvoiceSchema.pre('save', async function () {
  if (!this.invoiceNumber) {
    const year = new Date().getFullYear().toString();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const count = (await mongoose.models.FeeInvoice.countDocuments()) + 1;
    this.invoiceNumber = `INV${year}${month}${count.toString().padStart(6, '0')}`;
  }
});

// Mark as paid
feeInvoiceSchema.methods.markAsPaid = function (amount, paymentMeta) {
  this.paidAmount = amount || this.amount;
  this.paidAt = new Date();
  this.status = this.paidAmount >= this.amount ? 'paid' : 'partial';
  if (paymentMeta) {
    this.paymentMeta = paymentMeta;
  }
  return this.save();
};

// Check if overdue
feeInvoiceSchema.methods.checkOverdue = function () {
  if (this.status === 'pending' && this.dueDate && new Date() > this.dueDate) {
    this.status = 'overdue';
    return this.save();
  }
  return this;
};

// Find pending invoices
feeInvoiceSchema.statics.findPending = function () {
  return this.find({ status: { $in: ['pending', 'partial'] } });
};

// Find overdue invoices
feeInvoiceSchema.statics.findOverdue = function () {
  return this.find({
    status: { $in: ['pending', 'partial'] },
    dueDate: { $lt: new Date() },
  });
};

// Find by student
feeInvoiceSchema.statics.findByStudent = function (studentId) {
  return this.find({ studentId }).sort({ invoiceDate: -1 });
};

const FeeInvoice = mongoose.models.FeeInvoice || mongoose.model('FeeInvoice', feeInvoiceSchema);

export default FeeInvoice;
