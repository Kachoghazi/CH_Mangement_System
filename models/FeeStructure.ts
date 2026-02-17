import mongoose, { Document, Model, models } from 'mongoose';

export interface IInstallmentPlan {
  installmentNo: number;
  dueDate: Date;
  amount: number;
  description?: string;
}

export interface IFeeStructure extends Document {
  _id: mongoose.Types.ObjectId;
  batch: mongoose.Types.ObjectId;
  course?: mongoose.Types.ObjectId;
  name: string;
  totalAmount: number;
  registrationFee?: number;
  installments: IInstallmentPlan[];
  lateFinePerDay?: number;
  maxLateFine?: number;
  gracePeriodDays?: number;
  discountAvailable?: boolean;
  maxDiscountPercent?: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeeStructureMethods {
  calculateLateFine(daysLate: number): number;
}

export type FeeStructureModel = Model<IFeeStructure, object, IFeeStructureMethods>;

const installmentPlanSchema = new mongoose.Schema(
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
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
  },
  { _id: false },
);

const feeStructureSchema = new mongoose.Schema<
  IFeeStructure,
  FeeStructureModel,
  IFeeStructureMethods
>(
  {
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: [true, 'Batch reference is required'],
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Fee structure name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    registrationFee: {
      type: Number,
      default: 0,
      min: [0, 'Registration fee cannot be negative'],
    },
    installments: {
      type: [installmentPlanSchema],
      default: [],
      validate: {
        validator: function (v: IInstallmentPlan[]) {
          const total = v.reduce((sum, inst) => sum + inst.amount, 0);
          const feeStructure = this as IFeeStructure;
          return Math.abs(total - feeStructure.totalAmount) < 1;
        },
        message: 'Sum of installments must equal total amount',
      },
    },
    maxLateFine: {
      type: Number,
      min: [0, 'Max late fine cannot be negative'],
    },
    gracePeriodDays: {
      type: Number,
      default: 0,
      min: [0, 'Grace period cannot be negative'],
    },
    discountAvailable: {
      type: Boolean,
      default: false,
    },
    maxDiscountPercent: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
    },
    effectiveFrom: {
      type: Date,
      required: [true, 'Effective from date is required'],
    },
    effectiveTo: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

feeStructureSchema.index({ batch: 1, isActive: 1 });
feeStructureSchema.index({ course: 1, isActive: 1 });
feeStructureSchema.index({ effectiveFrom: 1, effectiveTo: 1 });

feeStructureSchema.virtual('installmentCount').get(function () {
  return this.installments.length;
});

feeStructureSchema.virtual('perInstallmentAmount').get(function () {
  if (this.installments.length === 0) return this.totalAmount;
  return this.totalAmount / this.installments.length;
});

feeStructureSchema.methods.calculateLateFine = function (daysLate: number): number {
  if (daysLate <= (this.gracePeriodDays || 0)) return 0;

  const effectiveDaysLate = daysLate - (this.gracePeriodDays || 0);
  let fine = effectiveDaysLate * (this.lateFinePerDay || 0);

  if (this.maxLateFine && fine > this.maxLateFine) {
    fine = this.maxLateFine;
  }

  return fine;
};

export const FeeStructure =
  models?.FeeStructure ||
  mongoose.model<IFeeStructure, FeeStructureModel>('FeeStructure', feeStructureSchema);
