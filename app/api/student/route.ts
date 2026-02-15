import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { IStudent, Student } from '@/models/Student';
export async function POST(request: NextRequest) {
  try {
    const data: IStudent = await request.json();
    if (!data.studentName || !data.studentEmail || !data.studentAge || !data.emergencyContact) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.studentEmail)) {
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
    }
    const studentCode = `STU${Date.now()}`;
    await connectToDatabase();
    const student = await Student.create({
      studentName: data.studentName,
      studentEmail: data.studentEmail,
      studentAge: data.studentAge,
      emergencyContact: data.emergencyContact,
      githubUsername: data?.githubUsername,
      studentCode,
    });
    if (!student) {
      return NextResponse.json({ message: 'Failed to create student' }, { status: 500 });
    }
    return NextResponse.json(
      { message: 'Student created successfully', data: student },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'));
    const skip = (page - 1) * limit;

    await connectToDatabase();

    const [students, totalStudents] = await Promise.all([
      Student.find().skip(skip).limit(limit).lean(),
      Student.countDocuments(),
    ]);

    if (!students || students.length === 0) {
      return NextResponse.json({ message: 'No students found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        data: students,
        meta: {
          total: totalStudents,
          page,
          limit,
          totalPages: Math.ceil(totalStudents / limit),
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 },
    );
  }
}
