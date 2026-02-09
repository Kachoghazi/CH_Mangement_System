import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import StudentApplication from '@/models/StudentApplication';
import Student from '@/models/Student';
import User from '@/models/User';
import Admin from '@/models/Admin';
import Admission from '@/models/Admission';
import Batch from '@/models/Batch';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const session = await getCurrentUser();

    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized - Admin access required' },
        { status: 403 },
      );
    }

    await dbConnect();

    const { id } = await params;

    // Find the application
    const application = await StudentApplication.findById(id);

    if (!application) {
      return NextResponse.json({ message: 'Application not found' }, { status: 404 });
    }

    if (application.status !== 'pending') {
      return NextResponse.json(
        { message: 'Application has already been processed' },
        { status: 400 },
      );
    }

    // Get admin profile for reviewedBy
    const adminProfile = await Admin.findOne({ userId: session.userId });

    // Update application status
    application.status = 'approved';
    application.reviewedBy = adminProfile?._id || session.userId;
    application.reviewedAt = new Date();
    await application.save();

    // Activate the user account
    await User.findByIdAndUpdate(application.userId, {
      isActive: true,
    });

    // Activate the student profile
    const student = await Student.findOne({ userId: application.userId });
    if (student) {
      student.status = 'active';
      // Generate student ID if not exists
      if (!student.studentId) {
        const year = new Date().getFullYear().toString().slice(-2);
        const count = (await Student.countDocuments()) + 1;
        student.studentId = `STU${year}${count.toString().padStart(4, '0')}`;
      }

      // Handle course enrollment
      if (application.courseId) {
        // Set current course
        student.currentCourseId = application.courseId;

        // Find an available batch for this course or use preferred batch
        let batchId = application.preferredBatchId;
        if (!batchId) {
          const availableBatch = await Batch.findOne({
            courseId: application.courseId,
            isActive: true,
            status: { $in: ['upcoming', 'ongoing'] },
          }).sort({ startDate: 1 });
          batchId = availableBatch?._id;
        }

        if (batchId) {
          student.currentBatchId = batchId;
          // Increment batch strength
          await Batch.findByIdAndUpdate(batchId, { $inc: { currentStrength: 1 } });
        }

        // Add to enrolledCourses array
        const alreadyEnrolled = student.enrolledCourses?.some(
          (ec) => ec.courseId?.toString() === application.courseId.toString(),
        );
        if (!alreadyEnrolled) {
          student.enrolledCourses = student.enrolledCourses || [];
          student.enrolledCourses.push({
            courseId: application.courseId,
            batchId: batchId || undefined,
            enrolledAt: new Date(),
            status: 'active',
          });
        }

        // Create admission record
        const admission = new Admission({
          studentId: student._id,
          courseId: application.courseId,
          batchId: batchId || undefined,
          academicYear: Admission.getCurrentAcademicYear(),
          applicationId: application._id,
          status: 'active',
        });
        await admission.save();
        student.admissionId = admission._id;
      }

      await student.save();
    }

    return NextResponse.json({
      message: 'Student approved successfully',
      studentId: student?.studentId,
      batchAssigned: student?.currentBatchId ? true : false,
    });
  } catch (error) {
    console.error('Approve student error:', error);
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 });
  }
}
