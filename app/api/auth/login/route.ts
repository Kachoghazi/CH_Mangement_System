import User from '@/models/User';
import { connectToDatabase } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }
    connectToDatabase();
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }
    await user.updateLastLogin();
    return NextResponse.json({ message: 'Login successful', userId: user._id }, { status: 200 });
  } catch (error) {
    console.log('Error while logging in user', error);
    return NextResponse.json(
      {
        message: 'Internal System Error',
      },
      { status: 500 },
    );
  }
}
