import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import AttendanceStudent from '@/models/AttendanceStudent';
import AttendanceTeacher from '@/models/AttendanceTeacher';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import { getCurrentUser } from '@/lib/auth';

// GET - Get self attendance
export async function GET(request) {
  try {
    await dbConnect();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const month = searchParams.get('month');

    if (user.role === 'student') {
      const student = await Student.findOne({ userId: user.userId });
      if (!student) {
        return NextResponse.json({ message: 'Student profile not found' }, { status: 404 });
      }

      // Helper to extract student's attendance from batch records
      const extractStudentAttendance = (batchAttendances) => {
        return batchAttendances
          .map((ba) => {
            const record = ba.records?.find(
              (r) => r.studentId?.toString() === student._id.toString(),
            );
            return {
              _id: ba._id,
              date: ba.date,
              batchId: ba.batchId,
              status: record?.status || null,
              remarks: record?.remarks || null,
              markedAt: ba.updatedAt,
            };
          })
          .filter((a) => a.status !== null);
      };

      // If specific date is requested
      if (dateParam) {
        const date = new Date(dateParam);
        date.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const batchAttendance = await AttendanceStudent.findOne({
          batchId: student.currentBatchId,
          date: { $gte: date, $lte: endOfDay },
        });

        if (!batchAttendance) {
          return NextResponse.json({ attendance: null });
        }

        const record = batchAttendance.records?.find(
          (r) => r.studentId?.toString() === student._id.toString(),
        );

        return NextResponse.json({
          attendance: record
            ? {
                date: batchAttendance.date,
                status: record.status,
                remarks: record.remarks,
              }
            : null,
        });
      }

      // If month is requested
      if (month) {
        const [year, mon] = month.split('-');
        const startDate = new Date(year, mon - 1, 1);
        const endDate = new Date(year, mon, 0);

        const batchAttendances = await AttendanceStudent.find({
          batchId: student.currentBatchId,
          date: { $gte: startDate, $lte: endDate },
        }).sort({ date: 1 });

        return NextResponse.json({
          attendances: extractStudentAttendance(batchAttendances),
        });
      }

      // Default: return last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const batchAttendances = await AttendanceStudent.find({
        batchId: student.currentBatchId,
        date: { $gte: thirtyDaysAgo },
      }).sort({ date: -1 });

      return NextResponse.json({
        attendances: extractStudentAttendance(batchAttendances),
      });
    } else if (user.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId: user.userId });
      if (!teacher) {
        return NextResponse.json({ message: 'Teacher profile not found' }, { status: 404 });
      }

      // If specific date is requested
      if (dateParam) {
        const date = new Date(dateParam);
        date.setHours(0, 0, 0, 0);

        const attendance = await AttendanceTeacher.findOne({
          teacherId: teacher._id,
          date,
        });

        return NextResponse.json({ attendance });
      }

      // If month is requested
      if (month) {
        const [year, mon] = month.split('-');
        const startDate = new Date(year, mon - 1, 1);
        const endDate = new Date(year, mon, 0);

        const attendances = await AttendanceTeacher.find({
          teacherId: teacher._id,
          date: { $gte: startDate, $lte: endDate },
        }).sort({ date: 1 });

        return NextResponse.json({ attendances });
      }

      // Default: return last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const attendances = await AttendanceTeacher.find({
        teacherId: teacher._id,
        date: { $gte: thirtyDaysAgo },
      }).sort({ date: -1 });

      return NextResponse.json({ attendances });
    } else {
      return NextResponse.json(
        { message: 'This endpoint is for students and teachers only' },
        { status: 403 },
      );
    }
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ message: 'Error fetching attendance' }, { status: 500 });
  }
}
