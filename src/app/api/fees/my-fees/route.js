import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Student from '@/models/Student';
import StudentFee from '@/models/StudentFee';
import Payment from '@/models/Payment';
import FeeInvoice from '@/models/FeeInvoice';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCurrentUser();

    if (!session) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Only students can access their fees
    if (session.role !== 'student') {
      return NextResponse.json(
        { message: 'Only students can access this endpoint' },
        { status: 403 },
      );
    }

    await dbConnect();

    // Get student profile
    const student = await Student.findOne({ userId: session.userId });

    if (!student) {
      return NextResponse.json({ message: 'Student profile not found' }, { status: 404 });
    }

    // Get student fee record
    const studentFee = await StudentFee.findOne({ studentId: student._id });

    // Get payments made by this student
    const payments = await Payment.find({ studentId: student._id })
      .sort({ paymentDate: -1 })
      .limit(10)
      .lean();

    // Get pending invoices
    const pendingInvoices = await FeeInvoice.find({
      studentId: student._id,
      status: { $in: ['pending', 'overdue'] },
    })
      .sort({ dueDate: 1 })
      .lean();

    // Calculate totals
    const totalFee = studentFee?.totalFee || student.totalFees || 0;
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPending = totalFee - totalPaid;

    // Find next due date
    const nextDue = pendingInvoices.find((inv) => inv.status === 'pending');
    const nextDueDate = nextDue?.dueDate || null;

    // Mark overdue invoices
    const today = new Date();
    const processedInvoices = pendingInvoices.map((inv) => ({
      ...inv,
      isOverdue: inv.dueDate ? new Date(inv.dueDate) < today : false,
    }));

    return NextResponse.json({
      summary: {
        totalFee,
        totalPaid,
        totalPending,
        nextDueDate,
      },
      payments: payments.map((p) => ({
        _id: p._id,
        amount: p.amount,
        paymentDate: p.paymentDate,
        paymentMethod: p.paymentMethod,
        description: p.description || 'Course Fee',
        receiptNumber: p.receiptNumber,
      })),
      pendingInvoices: processedInvoices.map((inv) => ({
        _id: inv._id,
        amount: inv.amount,
        dueDate: inv.dueDate,
        description: inv.description || 'Fee Installment',
        status: inv.status,
        isOverdue: inv.isOverdue,
      })),
    });
  } catch (error) {
    console.error('Get my fees error:', error);
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 });
  }
}
