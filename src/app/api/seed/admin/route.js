import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Admin from '@/models/Admin';
import { hashPassword } from '@/lib/auth';

// Default admin credentials
const DEFAULT_ADMIN = {
  name: 'Administrator',
  email: 'admin@chmanagement.com',
  password: 'Admin@123',
  phone: '+92 300 1234567',
};

export async function POST() {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { message: 'Seed endpoint is disabled in production' },
      { status: 403 },
    );
  }

  try {
    await dbConnect();

    // Check if admin already exists
    const existingUser = await User.findOne({ email: DEFAULT_ADMIN.email.toLowerCase() });

    if (existingUser) {
      return NextResponse.json({
        message: 'Admin user already exists',
        credentials: {
          email: DEFAULT_ADMIN.email,
          password: DEFAULT_ADMIN.password,
        },
      });
    }

    // Hash password
    const passwordHash = await hashPassword(DEFAULT_ADMIN.password);

    // Create user
    const user = new User({
      email: DEFAULT_ADMIN.email.toLowerCase(),
      passwordHash,
      role: 'admin',
      isActive: true,
      accountSource: 'admin_created',
    });
    await user.save();

    // Create admin profile
    const admin = new Admin({
      userId: user._id,
      name: DEFAULT_ADMIN.name,
      phone: DEFAULT_ADMIN.phone,
      permissions: ['all'],
    });
    await admin.save();

    return NextResponse.json(
      {
        message: 'Default admin created successfully',
        credentials: {
          email: DEFAULT_ADMIN.email,
          password: DEFAULT_ADMIN.password,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Seed admin error:', error);
    return NextResponse.json({ message: 'Error seeding admin: ' + error.message }, { status: 500 });
  }
}
