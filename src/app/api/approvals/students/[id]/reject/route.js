import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import StudentApplication from '@/models/StudentApplication';
import Student from '@/models/Student';
import User from '@/models/User';
import Admin from '@/models/Admin';
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
    const { reason } = await request.json();

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
    application.status = 'rejected';
    application.reviewedBy = adminProfile?._id || session.userId;
    application.reviewedAt = new Date();
    application.remarks = reason || 'Application rejected by admin';
    await application.save();

    // Keep user account inactive
    await User.findByIdAndUpdate(application.userId, {
      isActive: false,
    });

    // Update student profile status to rejected
    await Student.findOneAndUpdate({ userId: application.userId }, { status: 'rejected' });

    return NextResponse.json({
      message: 'Application rejected',
    });
  } catch (error) {
    console.error('Reject student error:', error);
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 });
  }
}
