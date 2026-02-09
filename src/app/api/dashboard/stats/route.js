import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import Course from '@/models/Course';
import Payment from '@/models/Payment';
import Batch from '@/models/Batch';
import AttendanceStudent from '@/models/AttendanceStudent';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    await dbConnect();

    // Get current user
    const user = await getCurrentUser();
    const userRole = user?.role || 'admin';

    // Admin Stats
    if (userRole === 'admin') {
      const [studentsCount, teachersCount, coursesCount, todayCollection] = await Promise.all([
        Student.countDocuments({ status: 'active', deletedAt: null }),
        Teacher.countDocuments({ employmentStatus: 'active', deletedAt: null }),
        Course.countDocuments({ isActive: true }),
        Payment.getTodayCollection(),
      ]);

      // Get recent payments
      const recentPayments = await Payment.find({ status: 'completed' })
        .populate('studentId', 'name studentId')
        .sort({ paymentDate: -1 })
        .limit(5);

      return NextResponse.json({
        stats: {
          students: studentsCount,
          teachers: teachersCount,
          courses: coursesCount,
          collection: todayCollection[0]?.total || 0,
        },
        recentPayments: recentPayments.map((p) => ({
          id: p._id,
          student: p.studentId?.name || 'Unknown',
          amount: p.amount,
          date: p.paymentDate,
          status: p.status,
        })),
      });
    }

    // Student Stats
    if (userRole === 'student') {
      const student = await Student.findOne({ userId: user.userId })
        .populate('currentCourseId', 'name')
        .populate('currentBatchId', 'name');

      const enrolledCourses = student?.enrolledCourses?.length || 0;

      // Get attendance stats for this month from batch-level records
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Query batch attendance records and extract this student's status
      const batchAttendances = await AttendanceStudent.find({
        batchId: student?.currentBatchId,
        date: { $gte: startOfMonth },
      });

      // Extract student's attendance from batch records
      let presentDays = 0;
      let absentDays = 0;
      let lateDays = 0;

      batchAttendances.forEach((ba) => {
        const record = ba.records?.find(
          (r) => r.studentId?.toString() === student?._id?.toString(),
        );
        if (record) {
          if (record.status === 'present') presentDays++;
          else if (record.status === 'absent') absentDays++;
          else if (record.status === 'late') lateDays++;
        }
      });

      const totalDays = presentDays + absentDays + lateDays;
      const attendancePercent =
        totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;

      // Get enrolled courses list
      const enrolledCoursesList = [];
      if (student?.enrolledCourses) {
        for (const ec of student.enrolledCourses) {
          const course = await Course.findById(ec.courseId);
          const batch = await Batch.findById(ec.batchId);
          if (course) {
            enrolledCoursesList.push({
              name: course.name,
              batchName: batch?.name || 'N/A',
              status: 'Active',
            });
          }
        }
      }

      return NextResponse.json({
        stats: {
          enrolledCourses,
          attendancePercent,
          pendingFees: 0, // TODO: Calculate from StudentFee
          upcomingClasses: 0,
          presentDays,
          absentDays,
          enrolledCoursesList,
        },
      });
    }

    // Teacher Stats
    if (userRole === 'teacher') {
      const teacher = await Teacher.findOne({ userId: user.userId });

      // Get batches where this teacher is assigned
      const myBatches = await Batch.find({
        $or: [{ teacherId: teacher?._id }, { 'schedule.teacherId': teacher?._id }],
        isActive: true,
      }).populate('courseId', 'name');

      // Count total students in batches
      let totalStudents = 0;
      const myBatchesList = [];
      for (const batch of myBatches) {
        const studentCount = await Student.countDocuments({ currentBatchId: batch._id });
        totalStudents += studentCount;
        myBatchesList.push({
          name: batch.name,
          courseName: batch.courseId?.name,
          studentCount,
          schedule: batch.schedule?.days?.join(', ') || 'N/A',
        });
      }

      // Get today's classes
      const todayClasses = myBatchesList.map((b) => ({
        batchName: b.name,
        time: b.schedule || 'N/A',
        completed: false,
      }));

      // Get attendance rate (average for all batches)
      const attendanceRate = 0; // TODO: Calculate from attendance records

      return NextResponse.json({
        stats: {
          myBatches: myBatches.length,
          totalStudents,
          classesToday: myBatches.length,
          attendanceRate,
          myBatchesList,
          todayClasses,
        },
      });
    }

    // Fallback
    return NextResponse.json({ stats: {} });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ message: 'Error fetching dashboard stats' }, { status: 500 });
  }
}
