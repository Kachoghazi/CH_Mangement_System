import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Admin from '@/models/Admin';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';
import StudentApplication from '@/models/StudentApplication';
import { hashPassword } from '@/lib/auth';

export async function POST(request) {
  try {
    await dbConnect();

    const { name, email, phone, password, role } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Name, email, and password are required' },
        { status: 400 },
      );
    }

    // Validate role
    const allowedRoles = ['student', 'teacher'];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { message: 'Invalid role. Only students and teachers can sign up.' },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { message: 'An account with this email already exists' },
        { status: 409 },
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
      role,
      isActive: false, // Both students and teachers need admin approval
      accountSource: 'self_signup',
    });
    await user.save();

    // Create profile based on role
    if (role === 'student') {
      // For students, create an application that needs approval
      const application = new StudentApplication({
        userId: user._id,
        name,
        phone,
        email: email.toLowerCase(),
        status: 'pending',
      });
      await application.save();

      // Also create a student profile (pending until approved)
      const student = new Student({
        userId: user._id,
        name,
        phone,
        email: email.toLowerCase(),
        status: 'pending', // Will be activated after approval
        admissionSource: 'self_signup',
      });
      await student.save();

      return NextResponse.json(
        {
          message: 'Account created successfully. Your application is pending approval.',
          status: 'pending_approval',
        },
        { status: 201 },
      );
    } else if (role === 'teacher') {
      // Create teacher profile (inactive until admin approval)
      const teacher = new Teacher({
        userId: user._id,
        name,
        phone,
        email: email.toLowerCase(),
        employmentStatus: 'inactive', // Will be activated after approval
      });
      await teacher.save();

      return NextResponse.json(
        {
          message: 'Account created successfully. Please wait for admin approval.',
          status: 'pending_approval',
        },
        { status: 201 },
      );
    }
  } catch (error) {
    console.error('Signup error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { message: 'An account with this email already exists' },
        { status: 409 },
      );
    }

    return NextResponse.json({ message: 'An error occurred during signup' }, { status: 500 });
  }
}
