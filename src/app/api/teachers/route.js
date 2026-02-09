import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Teacher from '@/models/Teacher';
import { hashPassword, getCurrentUser } from '@/lib/auth';

// GET - List all teachers
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = { deletedAt: null };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { teacherId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Teacher.countDocuments(query);
    const teachers = await Teacher.find(query)
      .populate('subjects', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      teachers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json({ message: 'Error fetching teachers' }, { status: 500 });
  }
}

// POST - Create new teacher
export async function POST(request) {
  try {
    await dbConnect();

    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, email, phone, subject, qualification, experience, address, joinDate, salary } =
      data;

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 400 });
    }

    // Create user account with default password
    const defaultPassword = 'teacher123';
    const passwordHash = await hashPassword(defaultPassword);

    const user = await User.create({
      role: 'teacher',
      email: email.toLowerCase(),
      passwordHash,
      isActive: true,
      accountSource: 'admin_created',
    });

    // Generate teacher ID
    const teacherCount = await Teacher.countDocuments();
    const teacherId = `TCH${String(teacherCount + 1).padStart(5, '0')}`;

    // Create teacher profile
    const teacher = await Teacher.create({
      userId: user._id,
      teacherId,
      name,
      email: email.toLowerCase(),
      phone,
      specializations: subject ? [subject] : [],
      qualifications: qualification ? [{ degree: qualification }] : [],
      experience: parseInt(experience) || 0,
      address: address ? { street: address } : {},
      joiningDate: joinDate || new Date(),
      salary: {
        amount: parseInt(salary) || 0,
        type: 'monthly',
      },
      status: 'active',
    });

    return NextResponse.json(
      {
        message: 'Teacher created successfully',
        teacher,
        defaultPassword,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating teacher:', error);
    return NextResponse.json({ message: 'Error creating teacher' }, { status: 500 });
  }
}
