import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Admin from '@/models/Admin';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCurrentUser();

    if (!session) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await dbConnect();

    // Get user data
    const user = await User.findById(session.userId).select('-passwordHash');

    if (!user || !user.isActive) {
      return NextResponse.json({ message: 'User not found or inactive' }, { status: 404 });
    }

    // Get profile based on role
    let profile = null;
    switch (user.role) {
      case 'admin':
        profile = await Admin.findOne({ userId: user._id });
        break;
      case 'teacher':
        profile = await Teacher.findOne({ userId: user._id });
        break;
      case 'student':
        profile = await Student.findOne({ userId: user._id });
        break;
    }

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
      },
      profile: profile
        ? {
            id: profile._id,
            name: profile.name,
            phone: profile.phone,
            ...(user.role === 'admin' && { permissions: profile.permissions }),
            ...(user.role === 'student' && {
              studentId: profile.studentId,
              status: profile.status,
            }),
            ...(user.role === 'teacher' && {
              teacherId: profile.teacherId,
              employmentStatus: profile.employmentStatus,
            }),
          }
        : null,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 });
  }
}
