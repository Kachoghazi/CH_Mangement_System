import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Teacher from '@/models/Teacher';
import User from '@/models/User';
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

    // Find the teacher
    const teacher = await Teacher.findById(id);

    if (!teacher) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    if (teacher.employmentStatus === 'active') {
      return NextResponse.json(
        { message: 'Cannot reject an already approved teacher' },
        { status: 400 },
      );
    }

    // Mark teacher as terminated/rejected
    teacher.employmentStatus = 'terminated';
    teacher.notes = reason || 'Application rejected by admin';
    await teacher.save();

    // Deactivate the user account
    await User.findByIdAndUpdate(teacher.userId, {
      isActive: false,
    });

    return NextResponse.json({
      message: 'Teacher application rejected',
    });
  } catch (error) {
    console.error('Reject teacher error:', error);
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 });
  }
}
