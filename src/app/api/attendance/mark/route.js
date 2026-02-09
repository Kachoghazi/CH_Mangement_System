import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import AttendanceStudent from '@/models/AttendanceStudent';
import AttendanceTeacher from '@/models/AttendanceTeacher';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import { getCurrentUser } from '@/lib/auth';

// POST - Mark self attendance (student or teacher)
export async function POST(request) {
  try {
    await dbConnect();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { date, status, markedAt } = await request.json();

    if (!date || !status) {
      return NextResponse.json({ message: 'Date and status are required' }, { status: 400 });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if it's today's date (can only mark today's attendance)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (attendanceDate.getTime() !== today.getTime()) {
      return NextResponse.json({ message: 'Can only mark attendance for today' }, { status: 400 });
    }

    if (user.role === 'student') {
      // Find student
      const student = await Student.findOne({ userId: user.userId });
      if (!student) {
        return NextResponse.json({ message: 'Student profile not found' }, { status: 404 });
      }

      // Check if student is assigned to a batch
      if (!student.currentBatchId) {
        return NextResponse.json(
          { message: 'You are not assigned to any batch. Please contact admin.' },
          { status: 400 },
        );
      }

      // Find existing attendance record for this batch and date
      let attendance = await AttendanceStudent.findOne({
        batchId: student.currentBatchId,
        date: attendanceDate,
      });

      // Check if student already marked attendance
      if (attendance) {
        const existingRecord = attendance.records?.find(
          (r) => r.studentId.toString() === student._id.toString(),
        );
        if (existingRecord) {
          return NextResponse.json(
            { message: 'Attendance already marked for today' },
            { status: 400 },
          );
        }
        // Add student to existing attendance record
        attendance.records.push({
          studentId: student._id,
          status,
          remarks: 'Self-marked',
        });
      } else {
        // Create new attendance record for the batch
        attendance = new AttendanceStudent({
          batchId: student.currentBatchId,
          date: attendanceDate,
          records: [
            {
              studentId: student._id,
              status,
              remarks: 'Self-marked',
            },
          ],
          createdBy: null, // Self-marked
          notes: 'Created from student self-attendance',
        });
      }

      await attendance.save();

      return NextResponse.json({
        message: 'Attendance marked successfully',
        attendance: {
          status: attendance.status,
          markedAt: attendance.markedAt,
        },
      });
    } else if (user.role === 'teacher') {
      // Find teacher
      const teacher = await Teacher.findOne({ userId: user.userId });
      if (!teacher) {
        return NextResponse.json({ message: 'Teacher profile not found' }, { status: 404 });
      }

      // Check if already marked
      let attendance = await AttendanceTeacher.findOne({
        teacherId: teacher._id,
        date: attendanceDate,
      });

      if (attendance) {
        return NextResponse.json(
          { message: 'Attendance already marked for today' },
          { status: 400 },
        );
      }

      // Create attendance record
      attendance = new AttendanceTeacher({
        teacherId: teacher._id,
        date: attendanceDate,
        status,
        markedBy: 'self',
        markedAt: markedAt || new Date(),
        checkInTime: status === 'present' ? new Date() : null,
      });

      await attendance.save();

      return NextResponse.json({
        message: 'Attendance marked successfully',
        attendance: {
          status: attendance.status,
          markedAt: attendance.markedAt,
        },
      });
    } else {
      return NextResponse.json(
        { message: 'Only students and teachers can mark their own attendance' },
        { status: 403 },
      );
    }
  } catch (error) {
    console.error('Error marking attendance:', error);
    return NextResponse.json({ message: 'Error marking attendance' }, { status: 500 });
  }
}
