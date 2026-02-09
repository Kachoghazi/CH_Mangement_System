import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Admin from '@/models/Admin';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request) {
  try {
    const session = await getCurrentUser();

    if (!session) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await dbConnect();

    const { name, phone, address } = await request.json();

    // Validate input
    if (!name) {
      return NextResponse.json({ message: 'Name is required' }, { status: 400 });
    }

    // Get user
    const user = await User.findById(session.userId);

    if (!user || !user.isActive) {
      return NextResponse.json({ message: 'User not found or inactive' }, { status: 404 });
    }

    // Update profile based on role
    let profile = null;
    const updateData = { name, phone, address };

    switch (user.role) {
      case 'admin':
        profile = await Admin.findOneAndUpdate(
          { userId: user._id },
          { $set: updateData },
          { new: true },
        );
        break;
      case 'teacher':
        profile = await Teacher.findOneAndUpdate(
          { userId: user._id },
          { $set: updateData },
          { new: true },
        );
        break;
      case 'student':
        profile = await Student.findOneAndUpdate(
          { userId: user._id },
          { $set: updateData },
          { new: true },
        );
        break;
    }

    if (!profile) {
      return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: {
        id: profile._id,
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 });
  }
}
