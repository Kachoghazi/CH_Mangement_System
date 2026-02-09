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

    // Find the teacher
    const teacher = await Teacher.findById(id);

    if (!teacher) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    if (teacher.employmentStatus === 'active') {
      return NextResponse.json({ message: 'Teacher is already approved' }, { status: 400 });
    }

    // Activate the teacher
    teacher.employmentStatus = 'active';
    teacher.joiningDate = new Date();
    await teacher.save();

    // Activate the user account
    await User.findByIdAndUpdate(teacher.userId, {
      isActive: true,
    });

    return NextResponse.json({
      message: 'Teacher approved successfully',
      teacherId: teacher.teacherId,
    });
  } catch (error) {
    console.error('Approve teacher error:', error);
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 });
  }
}
