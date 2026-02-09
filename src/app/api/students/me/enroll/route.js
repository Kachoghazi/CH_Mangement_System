import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Student from '@/models/Student';
import Course from '@/models/Course';
import StudentApplication from '@/models/StudentApplication';
import { getCurrentUser } from '@/lib/auth';

// POST - Request enrollment in a course (creates enrollment request)
export async function POST(request) {
  try {
    await dbConnect();

    const user = await getCurrentUser();
    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { message: 'Unauthorized - Only students can enroll' },
        { status: 401 },
      );
    }

    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json({ message: 'Course ID is required' }, { status: 400 });
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      return NextResponse.json({ message: 'Course not found or inactive' }, { status: 404 });
    }

    // Get student
    const student = await Student.findOne({ userId: user.userId });
    if (!student) {
      return NextResponse.json({ message: 'Student profile not found' }, { status: 404 });
    }

    // Check if already enrolled
    const alreadyEnrolled = student.enrolledCourses?.some(
      (ec) => ec.courseId?.toString() === courseId,
    );
    if (alreadyEnrolled) {
      return NextResponse.json({ message: 'Already enrolled in this course' }, { status: 400 });
    }

    // Check for existing pending enrollment request
    const existingRequest = await StudentApplication.findOne({
      userId: user.userId,
      courseId,
      status: 'pending',
    });
    if (existingRequest) {
      return NextResponse.json({ message: 'Enrollment request already pending' }, { status: 400 });
    }

    // Create enrollment request for admin approval
    const application = new StudentApplication({
      userId: user.userId,
      name: student.name,
      email: student.email,
      phone: student.phone,
      courseId,
      status: 'pending',
      remarks: 'Course enrollment request by existing student',
    });

    await application.save();

    return NextResponse.json(
      {
        message: 'Enrollment request submitted successfully. Waiting for admin approval.',
        application: {
          id: application._id,
          courseId,
          courseName: course.name,
          status: 'pending',
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return NextResponse.json({ message: 'Error processing enrollment request' }, { status: 500 });
  }
}
