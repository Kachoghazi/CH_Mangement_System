import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Teacher from '@/models/Teacher';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCurrentUser();

    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized - Admin access required' },
        { status: 403 },
      );
    }

    await dbConnect();

    // Get all teachers, including those pending approval (inactive)
    const teachers = await Teacher.find().sort({ employmentStatus: 1, createdAt: -1 }).lean();

    // Get user data for each teacher
    const userIds = teachers.map((t) => t.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('email isActive accountSource')
      .lean();
    const userMap = users.reduce((acc, u) => ({ ...acc, [u._id.toString()]: u }), {});

    return NextResponse.json({
      applications: teachers.map((teacher) => {
        const user = userMap[teacher.userId?.toString()] || {};
        return {
          _id: teacher._id,
          userId: teacher.userId,
          name: teacher.name,
          email: teacher.email || user.email,
          phone: teacher.phone,
          teacherId: teacher.teacherId,
          employmentStatus: teacher.employmentStatus,
          accountSource: user.accountSource,
          createdAt: teacher.createdAt,
        };
      }),
      counts: {
        pending: teachers.filter((t) => t.employmentStatus === 'inactive').length,
        active: teachers.filter((t) => t.employmentStatus === 'active').length,
      },
    });
  } catch (error) {
    console.error('Get teacher applications error:', error);
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 });
  }
}
