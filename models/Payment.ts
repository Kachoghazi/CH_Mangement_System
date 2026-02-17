import mongoose, { Document, Model, models } from 'mongoose';

export type PaymentMethod =
  | 'Cash'
  | 'UPI'
  | 'Card'
  | 'Bank'
  | 'Cheque'
  | 'Online'
  | 'EasyPaisa'
  | 'JazzCash';
export type PaymentStatus =
  | 'Pending'
  | 'Paid'
  | 'Failed'
  | 'Refunded'
  | 'Cancelled'
  | 'PartiallyPaid';
export type PaymentType =
  | 'Registration'
  | 'TuitionFee'
  | 'Installment'
  | 'LateFine'
  | 'ExamFee'
  | 'Other';

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  batch?: mongoose.Types.ObjectId;
  enrollment?: mongoose.Types.ObjectId;
  amount: number;
  paymentDate: Date;
  method: PaymentMethod;
  transactionId?: string;
  status: PaymentStatus;
  paymentType: PaymentType;
  installmentNo?: number;
  description?: string;
  receiptNumber?: string;
  receivedBy?: mongoose.Types.ObjectId;
  receiverType?: 'Admin' | 'Teacher';
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    chequeNumber?: string;
    chequeDate?: Date;
  };
  refundDetails?: {
    refundedAmount?: number;
    refundedOn?: Date;
    refundReason?: string;
    refundedBy?: mongoose.Types.ObjectId;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentMethods {
  generateReceiptNumber(): string;
}

export type PaymentModel = Model<IPayment, object, IPaymentMethods>;

const paymentSchema = new mongoose.Schema<IPayment, PaymentModel, IPaymentMethods>(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
      index: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      index: true,
    },
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    method: {
      type: String,
      enum: {
        values: ['Cash', 'UPI', 'Card', 'Bank', 'Cheque', 'Online', 'EasyPaisa', 'JazzCash'],
        message: '{VALUE} is not a valid payment method',
      },
      required: [true, 'Payment method is required'],
    },
    transactionId: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Paid', 'Failed', 'Refunded', 'Cancelled', 'PartiallyPaid'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'Pending',
      index: true,
    },
    paymentType: {
      type: String,
      enum: {
        values: ['Registration', 'TuitionFee', 'Installment', 'LateFine', 'ExamFee', 'Other'],
        message: '{VALUE} is not a valid payment type',
      },
      default: 'TuitionFee',
    },
    installmentNo: {
      type: Number,
      min: [1, 'Installment number must be at least 1'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    receiptNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'receiverType',
    },
    receiverType: {
      type: String,
      enum: {
        values: ['Admin', 'Teacher'],
        message: '{VALUE} is not a valid receiver type',
      },
    },
    bankDetails: {
      bankName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      chequeNumber: { type: String, trim: true },
      chequeDate: { type: Date },
    },
    refundDetails: {
      refundedAmount: {
        type: Number,
        min: [0, 'Refunded amount cannot be negative'],
      },
      refundedOn: { type: Date },
      refundReason: {
        type: String,
        trim: true,
        maxlength: [500, 'Refund reason cannot exceed 500 characters'],
      },
      refundedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

paymentSchema.index({ student: 1, paymentDate: -1 });
paymentSchema.index({ batch: 1, paymentDate: -1 });
paymentSchema.index({ status: 1, paymentDate: -1 });
paymentSchema.index({ method: 1, status: 1 });
paymentSchema.index({ receiptNumber: 1 }, { sparse: true });

paymentSchema.virtual('isRefundable').get(function () {
  return this.status === 'Paid' && !this.refundDetails?.refundedOn;
});

paymentSchema.methods.generateReceiptNumber = function (): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `RCP-${year}${month}-${random}`;
};

paymentSchema.pre('save', function (next) {
  if (this.isNew && !this.receiptNumber && this.status === 'Paid') {
    this.receiptNumber = this.generateReceiptNumber();
  }
});

export const Payment =
  models?.Payment || mongoose.model<IPayment, PaymentModel>('Payment', paymentSchema);
