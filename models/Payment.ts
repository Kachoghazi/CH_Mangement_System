import mongoose from 'mongoose';

export interface IPayment {
  _id?: mongoose.Types.ObjectId;
  enrollmentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // student who paid
  amount: number;
  paymentDate: Date;
  method: 'cash' | 'easypaisa';
  transactionRef: string; // bank slip / mobile account number
  installmentNo: number; // which month this payment covers
  receivedBy: mongoose.Types.ObjectId; // admin who received
  notes: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const paymentSchema = new mongoose.Schema(
  {
    enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now },
    method: { type: String, enum: ['cash', 'easypaisa'], required: true },
    transactionRef: { type: String, required: true },
    installmentNo: { type: Number, required: true },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String },
  },
  { timestamps: true },
);

const Payment = mongoose.models?.Payment || mongoose.model<IPayment>('Payment', paymentSchema);

export default Payment;
