import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Admin from '@/models/Admin';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';
import { verifyPassword, generateToken, setAuthCookie, createSessionPayload } from '@/lib/auth';

export async function POST(request) {
  try {
    await dbConnect();

    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { message: 'Your account has been deactivated. Please contact admin.' },
        { status: 403 },
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
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

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate token
    const sessionPayload = createSessionPayload(user, profile);
    const token = generateToken(sessionPayload);

    // Set cookie
    await setAuthCookie(token);

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: profile?.name || user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'An error occurred during login' }, { status: 500 });
  }
}
