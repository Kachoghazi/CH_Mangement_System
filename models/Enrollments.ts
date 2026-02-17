import mongoose, { Document, Model, models } from 'mongoose';

export type EnrollmentStatus = 'Active' | 'Dropped' | 'Completed' | 'OnHold' | 'PendingPayment';

export interface IInstallment {
  installmentNo: number;
  dueDate: Date;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  paidAmount?: number;
  paidOn?: Date;
  paymentId?: mongoose.Types.ObjectId;
}

export interface IEnrollment extends Document {
  _id: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  batch: mongoose.Types.ObjectId;
  enrollmentDate: Date;
  status: EnrollmentStatus;
  rollNumberInBatch?: string;
  fee: {
    totalFee: number;
    discount: number;
    netFee: number;
    installmentsCount: number;
    monthlyAmount: number;
    installments: IInstallment[];
  };
  paidTotal: number;
  remainingDues: number;
  completionDate?: Date;
  dropDate?: Date;
  dropReason?: string;
  notes?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEnrollmentMethods {
  softDelete(): Promise<IEnrollment>;
  calculateDues(): number;
}

export type EnrollmentModel = Model<IEnrollment, object, IEnrollmentMethods>;

const installmentSchema = new mongoose.Schema(
  {
    installmentNo: {
      type: Number,
      required: true,
      min: [1, 'Installment number must be at least 1'],
    },
    dueDate: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'overdue', 'partial'],
        message: '{VALUE} is not a valid installment status',
      },
      default: 'pending',
    },
    paidAmount: {
      type: Number,
      min: [0, 'Paid amount cannot be negative'],
    },
    paidOn: {
      type: Date,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
  },
  { _id: false },
);

const enrollmentSchema = new mongoose.Schema<IEnrollment, EnrollmentModel, IEnrollmentMethods>(
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
      required: [true, 'Batch reference is required'],
      index: true,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Dropped', 'Completed', 'OnHold', 'PendingPayment'],
        message: '{VALUE} is not a valid enrollment status',
      },
      default: 'PendingPayment',
      index: true,
    },
    rollNumberInBatch: {
      type: String,
      trim: true,
    },
    fee: {
      totalFee: {
        type: Number,
        required: true,
        min: [0, 'Total fee cannot be negative'],
      },
      discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative'],
      },
      netFee: {
        type: Number,
        required: true,
        min: [0, 'Net fee cannot be negative'],
      },
      installmentsCount: {
        type: Number,
        required: true,
        min: [1, 'Must have at least 1 installment'],
      },
      monthlyAmount: {
        type: Number,
        required: true,
        min: [0, 'Monthly amount cannot be negative'],
      },
      installments: [installmentSchema],
    },
    paidTotal: {
      type: Number,
      default: 0,
      min: [0, 'Paid total cannot be negative'],
    },
    remainingDues: {
      type: Number,
      required: true,
      min: [0, 'Remaining dues cannot be negative'],
    },
    completionDate: {
      type: Date,
    },
    dropDate: {
      type: Date,
    },
    dropReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Drop reason cannot exceed 500 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

enrollmentSchema.index({ student: 1, batch: 1 }, { unique: true });
enrollmentSchema.index({ batch: 1, status: 1 });
enrollmentSchema.index({ enrollmentDate: -1 });
enrollmentSchema.index({ 'fee.installments.dueDate': 1, 'fee.installments.status': 1 });

enrollmentSchema.virtual('paymentProgress').get(function () {
  if (this.fee.netFee === 0) return 100;
  return Math.round((this.paidTotal / this.fee.netFee) * 100);
});

enrollmentSchema.methods.calculateDues = function (): number {
  return this.fee.netFee - this.paidTotal;
};

enrollmentSchema.methods.softDelete = async function (): Promise<IEnrollment> {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

enrollmentSchema.pre('find', function () {
  this.where({ isDeleted: { $ne: true } });
});

enrollmentSchema.pre('findOne', function () {
  this.where({ isDeleted: { $ne: true } });
});

export const Enrollment =
  models?.Enrollment ||
  mongoose.model<IEnrollment, EnrollmentModel>('Enrollment', enrollmentSchema);
