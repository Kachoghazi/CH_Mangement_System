import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Student from '@/models/Student';
import Payment from '@/models/Payment';
import AttendanceStudent from '@/models/AttendanceStudent';
import { getCurrentUser } from '@/lib/auth';

// GET - Generate reports
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const courseId = searchParams.get('courseId');
    const batchId = searchParams.get('batchId');

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    let report = {};

    switch (type) {
      case 'collection':
        // Fee collection report
        const paymentQuery = {};
        if (Object.keys(dateFilter).length) paymentQuery.paymentDate = dateFilter;

        const payments = await Payment.aggregate([
          { $match: { ...paymentQuery, status: 'completed' } },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' },
              },
              total: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: -1 } },
        ]);

        const totalCollection = payments.reduce((sum, p) => sum + p.total, 0);

        report = {
          type: 'collection',
          data: payments,
          summary: {
            totalCollection,
            totalTransactions: payments.reduce((sum, p) => sum + p.count, 0),
            averagePerDay: payments.length > 0 ? totalCollection / payments.length : 0,
          },
        };
        break;

      case 'attendance':
        // Attendance report
        const attendanceQuery = {};
        if (Object.keys(dateFilter).length) attendanceQuery.date = dateFilter;
        if (batchId) attendanceQuery.batchId = batchId;

        const attendanceStats = await AttendanceStudent.aggregate([
          { $match: attendanceQuery },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]);

        const statsMap = {};
        attendanceStats.forEach((s) => {
          statsMap[s._id] = s.count;
        });

        report = {
          type: 'attendance',
          data: attendanceStats,
          summary: {
            present: statsMap.present || 0,
            absent: statsMap.absent || 0,
            late: statsMap.late || 0,
            total: Object.values(statsMap).reduce((a, b) => a + b, 0),
          },
        };
        break;

      case 'students':
        // Student enrollment report
        const studentQuery = { deletedAt: null };
        if (courseId) studentQuery.currentCourseId = courseId;

        const studentStats = await Student.aggregate([
          { $match: studentQuery },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]);

        const studentMap = {};
        studentStats.forEach((s) => {
          studentMap[s._id] = s.count;
        });

        report = {
          type: 'students',
          data: studentStats,
          summary: {
            active: studentMap.active || 0,
            inactive: studentMap.inactive || 0,
            passed: studentMap.passed || 0,
            dropped: studentMap.dropped || 0,
            total: Object.values(studentMap).reduce((a, b) => a + b, 0),
          },
        };
        break;

      case 'due':
        // Due fees report
        const dueAgg = await Payment.aggregate([
          {
            $lookup: {
              from: 'studentfees',
              localField: 'studentFeeId',
              foreignField: '_id',
              as: 'fee',
            },
          },
          { $unwind: { path: '$fee', preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: '$studentId',
              totalPaid: { $sum: '$amount' },
            },
          },
          {
            $lookup: {
              from: 'students',
              localField: '_id',
              foreignField: '_id',
              as: 'student',
            },
          },
          { $unwind: '$student' },
          {
            $lookup: {
              from: 'courses',
              localField: 'student.currentCourseId',
              foreignField: '_id',
              as: 'course',
            },
          },
          { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
        ]);

        report = {
          type: 'due',
          data: dueAgg.slice(0, 50),
          summary: {
            studentsCount: dueAgg.length,
          },
        };
        break;

      default:
        // Summary report
        const [totalStudents, activeStudents, totalPayments] = await Promise.all([
          Student.countDocuments({ deletedAt: null }),
          Student.countDocuments({ status: 'active', deletedAt: null }),
          Payment.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]),
        ]);

        report = {
          type: 'summary',
          summary: {
            totalStudents,
            activeStudents,
            totalCollection: totalPayments[0]?.total || 0,
          },
        };
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ message: 'Error generating report' }, { status: 500 });
  }
}
