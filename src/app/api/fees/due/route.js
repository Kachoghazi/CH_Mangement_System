import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import StudentFee from '@/models/StudentFee';
import Student from '@/models/Student';

// GET - Get due fees list
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const overdue = searchParams.get('overdue');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Find students with pending fees
    const students = await Student.find({
      deletedAt: null,
      status: 'active',
    })
      .populate('currentCourseId', 'name totalFee')
      .lean();

    // Get fee records for students
    const studentIds = students.map((s) => s._id);
    const feeRecords = await StudentFee.find({
      studentId: { $in: studentIds },
      status: { $in: ['pending', 'partial', 'overdue'] },
    }).lean();

    // Map fee records to students
    const feeMap = {};
    feeRecords.forEach((fee) => {
      feeMap[fee.studentId.toString()] = fee;
    });

    // Calculate pending fees
    let dueList = students
      .map((student) => {
        const feeRecord = feeMap[student._id.toString()];
        const totalFee = feeRecord?.totalAmount || student.currentCourseId?.totalFee || 0;
        const paidAmount = feeRecord?.paidAmount || 0;
        const pendingAmount = totalFee - paidAmount;
        const dueDate = feeRecord?.dueDate || null;
        const today = new Date();
        const overdueDays = dueDate
          ? Math.max(0, Math.floor((today - new Date(dueDate)) / (1000 * 60 * 60 * 24)))
          : 0;

        return {
          _id: student._id,
          name: student.name,
          phone: student.phone,
          studentId: student.studentId,
          course: student.currentCourseId?.name || 'N/A',
          totalFee,
          paidAmount,
          pendingAmount,
          dueDate: dueDate ? new Date(dueDate).toISOString().split('T')[0] : null,
          overdueDays,
          lastPaymentDate: feeRecord?.lastPaymentDate || null,
        };
      })
      .filter((s) => s.pendingAmount > 0);

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      dueList = dueList.filter(
        (s) =>
          s.name.toLowerCase().includes(searchLower) ||
          s.phone?.includes(search) ||
          s.studentId?.toLowerCase().includes(searchLower),
      );
    }

    if (overdue === 'true') {
      dueList = dueList.filter((s) => s.overdueDays > 0);
    }

    // Calculate totals
    const totalPending = dueList.reduce((sum, s) => sum + s.pendingAmount, 0);
    const overdueCount = dueList.filter((s) => s.overdueDays > 0).length;

    // Paginate
    const totalCount = dueList.length;
    const paginatedList = dueList.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      students: paginatedList,
      stats: {
        totalPending,
        overdueCount,
        totalStudents: totalCount,
      },
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching due fees:', error);
    return NextResponse.json({ message: 'Error fetching due fees' }, { status: 500 });
  }
}
