import { NextResponse, NextRequest } from 'next/server';
import { User } from '@/models/User';
import { connectToDatabase } from '@/lib/db';
export async function POST(request: NextRequest) {
  try {
    const { fullName, email, password, role } = await request.json();

    if (!fullName || !email || !password || !role) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }
    if (role === 'Admin') {
      return NextResponse.json({ message: 'Admin registration is not allowed' }, { status: 403 });
    }
    await connectToDatabase();
    const existingUser = await User.findOne({
      email,
    });
    if (existingUser) {
      return NextResponse.json({ message: 'User already in use' }, { status: 400 });
    }
    const newUser = await User.create({
      fullName,
      email,
      password,
      role,
    });
    return NextResponse.json(
      {
        message: 'User registered successfully',
        data: {
          id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role,
        },
      },

      { status: 201 },
    );
  } catch (error) {
    console.error('Error during registration:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
