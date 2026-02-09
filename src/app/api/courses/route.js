import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Course from '@/models/Course';

// Generate course code with CH- prefix
async function generateCourseCode(name) {
  // Create abbreviation from course name
  const words = name.trim().split(/\s+/);
  let abbr = '';

  if (words.length === 1) {
    // Single word: take first 3 characters
    abbr = words[0].substring(0, 3).toUpperCase();
  } else {
    // Multiple words: take first letter of each word (up to 3)
    abbr = words
      .slice(0, 3)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  // Get count of existing courses with similar code pattern
  const existingCount = await Course.countDocuments({
    code: { $regex: `^CH-${abbr}`, $options: 'i' },
  });

  // Generate unique code: CH-ABC001
  const numPart = String(existingCount + 1).padStart(3, '0');
  return `CH-${abbr}${numPart}`;
}

// GET - List all courses
export async function GET() {
  try {
    await dbConnect();

    const courses = await Course.find({ isActive: true })
      .populate('feeStructureId')
      .sort({ name: 1 });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ message: 'Error fetching courses' }, { status: 500 });
  }
}

// POST - Create new course
export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      name,
      description,
      category,
      durationUnit,
      duration,
      fee,
      admissionFee,
      eligibility,
      maxStudents,
    } = body;

    if (!name || !duration) {
      return NextResponse.json({ message: 'Name and duration are required' }, { status: 400 });
    }
    // Auto-generate course code with CH- prefix
    const code = await generateCourseCode(name);

    const course = new Course({
      name,
      code,
      description,
      category,
      durationMonths: duration,
      durationUnit: durationUnit || 'months',
      totalFee: fee || 0,
      admissionFee: admissionFee || 0,
      eligibility,
      maxStudents: maxStudents || 0,
      isActive: true,
    });

    await course.save();

    return NextResponse.json(
      {
        message: 'Course created successfully',
        course,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ message: 'Error creating course' }, { status: 500 });
  }
}
