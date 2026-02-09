import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import StudentFee from '@/models/StudentFee';
import Student from '@/models/Student';
import { getCurrentUser } from '@/lib/auth';

// GET - Get payments list
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const method = searchParams.get('method');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = {};

    if (method && method !== 'all') {
      query.paymentMethod = method;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate({
        path: 'studentId',
        select: 'name phone studentId',
        populate: {
          path: 'currentCourseId',
          select: 'name',
        },
      })
      .populate('receivedBy', 'name')
      .sort({ paymentDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Calculate totals
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayPayments = await Payment.aggregate([
      { $match: { paymentDate: { $gte: todayStart }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthPayments = await Payment.aggregate([
      { $match: { paymentDate: { $gte: monthStart }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    return NextResponse.json({
      payments,
      stats: {
        today: todayPayments[0] || { total: 0, count: 0 },
        month: monthPayments[0] || { total: 0, count: 0 },
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ message: 'Error fetching payments' }, { status: 500 });
  }
}

// POST - Collect payment
export async function POST(request) {
  try {
    await dbConnect();

    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { studentId, amount, paymentMethod, transactionId, remarks } = data;

    // Generate payment number
    const paymentCount = await Payment.countDocuments();
    const paymentNumber = `PAY${new Date().getFullYear()}${String(paymentCount + 1).padStart(6, '0')}`;

    // Create payment
    const payment = await Payment.create({
      paymentNumber,
      studentId,
      amount: parseFloat(amount),
      paymentMethod,
      transactionId,
      remarks,
      status: 'completed',
      paymentDate: new Date(),
    });

    // Update student fee record
    const studentFee = await StudentFee.findOne({ studentId, status: { $ne: 'paid' } });
    if (studentFee) {
      studentFee.paidAmount += parseFloat(amount);
      if (studentFee.paidAmount >= studentFee.totalAmount) {
        studentFee.status = 'paid';
      } else {
        studentFee.status = 'partial';
      }
      await studentFee.save();
    }

    const populatedPayment = await Payment.findById(payment._id).populate(
      'studentId',
      'name phone studentId',
    );

    return NextResponse.json(
      {
        message: 'Payment collected successfully',
        payment: populatedPayment,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error collecting payment:', error);
    return NextResponse.json({ message: 'Error collecting payment' }, { status: 500 });
  }
}
