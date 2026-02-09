import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import AttendanceStudent from '@/models/AttendanceStudent';
import Student from '@/models/Student';
import Batch from '@/models/Batch';
import { getCurrentUser } from '@/lib/auth';

// GET - Get attendance for a date/batch
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      // Return list of batches for selection
      const batches = await Batch.find({ isActive: true, status: { $in: ['ongoing', 'upcoming'] } })
        .populate('courseId', 'name')
        .sort({ name: 1 });

      return NextResponse.json({ batches });
    }

    // Get students in the batch
    const students = await Student.find({
      currentBatchId: batchId,
      status: 'active',
      deletedAt: null,
    })
      .select('name studentId phone')
      .sort({ name: 1 });

    // Get existing attendance for the date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAttendance = await AttendanceStudent.find({
      batchId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    const attendanceMap = {};
    existingAttendance.forEach((att) => {
      attendanceMap[att.studentId.toString()] = att.status;
    });

    const attendanceList = students.map((student) => ({
      studentId: student._id,
      name: student.name,
      studentCode: student.studentId,
      phone: student.phone,
      status: attendanceMap[student._id.toString()] || null,
    }));

    // Calculate stats
    const presentCount = existingAttendance.filter((a) => a.status === 'present').length;
    const absentCount = existingAttendance.filter((a) => a.status === 'absent').length;
    const lateCount = existingAttendance.filter((a) => a.status === 'late').length;
    const unmarkedCount = students.length - existingAttendance.length;

    return NextResponse.json({
      date,
      batchId,
      students: attendanceList,
      stats: {
        total: students.length,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        unmarked: unmarkedCount,
      },
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ message: 'Error fetching attendance' }, { status: 500 });
  }
}

// POST - Mark attendance
export async function POST(request) {
  try {
    await dbConnect();

    const session = await getCurrentUser();
    if (!session || !['admin', 'teacher'].includes(session.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { date, batchId, attendance } = data;

    const attendanceDate = new Date(date);
    attendanceDate.setHours(12, 0, 0, 0);

    // Get batch info
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return NextResponse.json({ message: 'Batch not found' }, { status: 404 });
    }

    // Process each attendance record
    const results = [];
    for (const record of attendance) {
      const { studentId, status } = record;

      // Update or create attendance record
      const existing = await AttendanceStudent.findOne({
        studentId,
        batchId,
        date: {
          $gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
          $lte: new Date(attendanceDate.setHours(23, 59, 59, 999)),
        },
      });

      if (existing) {
        existing.status = status;
        existing.markedBy = session.id;
        await existing.save();
        results.push(existing);
      } else {
        const newAttendance = await AttendanceStudent.create({
          studentId,
          batchId,
          courseId: batch.courseId,
          date: attendanceDate,
          status,
          markedBy: session.id,
        });
        results.push(newAttendance);
      }
    }

    return NextResponse.json({
      message: 'Attendance marked successfully',
      count: results.length,
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    return NextResponse.json({ message: 'Error marking attendance' }, { status: 500 });
  }
}
