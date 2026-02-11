import mongoose from 'mongoose';

export interface IEnrollment {
  _id?: mongoose.Types.ObjectId;

  userId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  enrolledAt: Date;

  fee: {
    totalFee: number; // copied from course.totalFee
    discount: number; // default: 0
    netFee: number; // totalFee - discount
    installmentsCount: number; // e.g. 6
    monthlyAmount: number; // netFee / installmentsCount
    installments: {
      installmentNo: number; // 1,2,3...
      dueDate: Date;
      amount: number;
      status: 'pending' | 'paid' | 'overdue';
      paidOn?: Date;
      paymentId?: mongoose.Types.ObjectId; // ref: payments
    }[];
  };

  paidTotal: number; // sum of paid installments
  remainingDues: number; // netFee - paidTotal
  status: 'pending_payment' | 'confirmed' | 'attending' | 'dropped' | 'completed';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const enrollmentSchema = new mongoose.Schema<IEnrollment>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    enrolledAt: { type: Date, default: Date.now },
    fee: {
      totalFee: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      netFee: { type: Number, required: true },
      installmentsCount: { type: Number, required: true },
      monthlyAmount: { type: Number, required: true },
      installments: [
        {
          installmentNo: { type: Number, required: true },
          dueDate: { type: Date, required: true },
          amount: { type: Number, required: true },
          status: {
            type: String,
            enum: ['pending', 'paid', 'overdue'],
            default: 'pending',
          },
          paidOn: { type: Date },
          paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
        },
      ],
    },
    paidTotal: { type: Number, default: 0 },
    remainingDues: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending_payment', 'confirmed', 'attending', 'dropped', 'completed'],
      default: 'pending_payment',
    },
    notes: { type: String },
  },
  { timestamps: true },
);

export const Enrollment =
  mongoose.models?.Enrollment || mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
