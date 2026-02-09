import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Student from '@/models/Student';
import StudentApplication from '@/models/StudentApplication';
import { getCurrentUser } from '@/lib/auth';

// GET - Get current student's enrollments (including pending requests)
export async function GET() {
  try {
    await dbConnect();

    const user = await getCurrentUser();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const student = await Student.findOne({ userId: user.userId })
      .populate('enrolledCourses.courseId', 'name code description')
      .populate('enrolledCourses.batchId', 'name schedule');

    if (!student) {
      return NextResponse.json({ message: 'Student profile not found' }, { status: 404 });
    }

    // Get pending enrollment applications
    const pendingApplications = await StudentApplication.find({
      userId: user.userId,
      status: 'pending',
      courseId: { $exists: true },
    }).populate('courseId', 'name code');

    // Combine enrolled courses with pending applications
    const enrollments = [
      ...(student.enrolledCourses?.map((ec) => ({
        courseId: ec.courseId?._id || ec.courseId,
        courseName: ec.courseId?.name,
        courseCode: ec.courseId?.code,
        batchId: ec.batchId?._id || ec.batchId,
        batchName: ec.batchId?.name,
        enrolledAt: ec.enrolledAt,
        status: ec.status || 'active',
      })) || []),
      ...pendingApplications.map((app) => ({
        courseId: app.courseId?._id || app.courseId,
        courseName: app.courseId?.name,
        courseCode: app.courseId?.code,
        status: 'pending',
        requestedAt: app.createdAt,
      })),
    ];

    return NextResponse.json({ enrollments });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json({ message: 'Error fetching enrollments' }, { status: 500 });
  }
}
