import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import StudentApplication from '@/models/StudentApplication';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCurrentUser();

    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized - Admin access required' },
        { status: 403 },
      );
    }

    await dbConnect();

    // Get all student applications, prioritize pending
    const applications = await StudentApplication.find()
      .populate('courseId', 'name code')
      .sort({ status: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      applications: applications.map((app) => ({
        _id: app._id,
        userId: app.userId,
        name: app.name,
        email: app.email,
        phone: app.phone,
        courseName: app.courseId?.name || null,
        courseCode: app.courseId?.code || null,
        status: app.status,
        createdAt: app.createdAt,
        reviewedAt: app.reviewedAt,
        remarks: app.remarks,
      })),
      counts: {
        pending: applications.filter((a) => a.status === 'pending').length,
        approved: applications.filter((a) => a.status === 'approved').length,
        rejected: applications.filter((a) => a.status === 'rejected').length,
      },
    });
  } catch (error) {
    console.error('Get student applications error:', error);
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 });
  }
}
